import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Tab = "profile" | "analysis" | "muscles" | "workout" | "supplements" | "progress";

interface UserProfile {
  name: string;
  age: string;
  weight: string;
  height: string;
  gender: string;
  activity: string;
  goal: string;
  experience: string;
}

interface MuscleGroup {
  name: string;
  level: number;
  status: "strong" | "average" | "weak";
  tip: string;
}

interface WorkoutDay {
  day: string;
  type: string;
  exercises: { name: string; sets: string; reps: string }[];
}

function getBodyType(profile: UserProfile) {
  const bmi = parseFloat(profile.weight) / ((parseFloat(profile.height) / 100) ** 2);
  if (bmi < 18.5) return { type: "Эктоморф", description: "Худощавое телосложение, быстрый метаболизм. Мышцы набираются медленно, жир почти не откладывается.", emoji: "🔥", color: "#00C9FF" };
  if (bmi < 25) return { type: "Мезоморф", description: "Атлетическое телосложение, средний метаболизм. Легко набирает мышцы и сжигает жир. Идеальная основа для спорта.", emoji: "⚡", color: "#FF6B00" };
  if (bmi < 30) return { type: "Эндоморф", description: "Плотное телосложение, медленный метаболизм. Легко набирает вес, требует контроля питания и активных тренировок.", emoji: "💪", color: "#FFD700" };
  return { type: "Эндоморф+", description: "Склонность к набору веса. Акцент на кардио и правильное питание для трансформации тела.", emoji: "🎯", color: "#FF2D55" };
}

function getFitnessScore(profile: UserProfile): number {
  let score = 50;
  const age = parseInt(profile.age);
  if (age < 25) score += 15;
  else if (age < 35) score += 10;
  else if (age < 45) score += 5;
  if (profile.activity === "high") score += 20;
  else if (profile.activity === "medium") score += 10;
  if (profile.experience === "advanced") score += 15;
  else if (profile.experience === "intermediate") score += 8;
  return Math.min(score, 98);
}

function getMuscleGroups(profile: UserProfile): MuscleGroup[] {
  const exp = profile.experience;
  const isActive = profile.activity === "high";
  const base = exp === "advanced" ? 75 : exp === "intermediate" ? 55 : 35;
  const seed = (profile.name.charCodeAt(0) || 65);
  const v = (s: number) => ((seed * s) % 20) - 10;

  const raw = [
    { name: "Грудь",       level: base + v(3) + (isActive ? 10 : 0), tip: "Жим лёжа, разводки, отжимания" },
    { name: "Спина",       level: base + v(7) + 5,                    tip: "Подтягивания, тяга штанги" },
    { name: "Плечи",       level: base + v(11) - 5,                   tip: "Жим стоя, махи в стороны" },
    { name: "Бицепс",      level: base + v(13),                       tip: "Подъём штанги, молотки" },
    { name: "Трицепс",     level: base + v(17) - 8,                   tip: "Жим узким хватом, французский жим" },
    { name: "Пресс",       level: base + v(19) - 15,                  tip: "Планка, скручивания, подъём ног" },
    { name: "Ноги",        level: base + v(23) + (isActive ? 15 : 0), tip: "Приседания, выпады, жим ногами" },
    { name: "Ягодицы",     level: base + v(29),                       tip: "Мертвая тяга, ягодичный мостик" },
    { name: "Икры",        level: base + v(31) - 10,                  tip: "Подъёмы на носки, прыжки" },
    { name: "Предплечья",  level: base + v(37) - 12,                  tip: "Хват, сгибания запястий" },
  ];

  return raw.map(m => {
    const level = Math.max(10, Math.min(95, m.level));
    const status: "strong" | "average" | "weak" = level >= 70 ? "strong" : level >= 45 ? "average" : "weak";
    return { ...m, level, status };
  });
}

function getWorkoutProgram(profile: UserProfile): WorkoutDay[] {
  const isBeginnerOrLazy = profile.experience === "beginner" || profile.activity === "low";

  if (isBeginnerOrLazy) {
    return [
      { day: "Пн — Всё тело", type: "Фулл-боди", exercises: [
        { name: "Приседания", sets: "3", reps: "15" },
        { name: "Жим лёжа", sets: "3", reps: "12" },
        { name: "Тяга гантелей", sets: "3", reps: "12" },
        { name: "Планка", sets: "3", reps: "30 сек" },
      ]},
      { day: "Ср — Кардио + Пресс", type: "Кардио", exercises: [
        { name: "Бег / ходьба", sets: "1", reps: "30 мин" },
        { name: "Скручивания", sets: "3", reps: "20" },
        { name: "Велосипед", sets: "3", reps: "20" },
      ]},
      { day: "Пт — Всё тело", type: "Фулл-боди", exercises: [
        { name: "Становая тяга", sets: "3", reps: "10" },
        { name: "Отжимания", sets: "3", reps: "12" },
        { name: "Выпады", sets: "3", reps: "12" },
        { name: "Жим гантелей стоя", sets: "3", reps: "12" },
      ]},
    ];
  }

  return [
    { day: "Пн — Грудь + Трицепс", type: "Толчок", exercises: [
      { name: "Жим штанги лёжа", sets: "4", reps: "8-10" },
      { name: "Наклонный жим", sets: "3", reps: "10-12" },
      { name: "Разводки", sets: "3", reps: "12-15" },
      { name: "Французский жим", sets: "3", reps: "10-12" },
    ]},
    { day: "Вт — Спина + Бицепс", type: "Тяга", exercises: [
      { name: "Подтягивания", sets: "4", reps: "8-10" },
      { name: "Тяга штанги в наклоне", sets: "4", reps: "8-10" },
      { name: "Тяга на блоке", sets: "3", reps: "12" },
      { name: "Подъём штанги на бицепс", sets: "3", reps: "10-12" },
    ]},
    { day: "Чт — Ноги + Ягодицы", type: "Ноги", exercises: [
      { name: "Приседания со штангой", sets: "4", reps: "8-10" },
      { name: "Жим ногами", sets: "3", reps: "12-15" },
      { name: "Становая тяга на прямых", sets: "3", reps: "10-12" },
      { name: "Выпады с гантелями", sets: "3", reps: "12" },
    ]},
    { day: "Пт — Плечи + Пресс", type: "Плечи", exercises: [
      { name: "Жим штанги стоя", sets: "4", reps: "8-10" },
      { name: "Махи в стороны", sets: "3", reps: "12-15" },
      { name: "Тяга к подбородку", sets: "3", reps: "12" },
      { name: "Планка", sets: "3", reps: "45 сек" },
    ]},
    { day: "Сб — Кардио + Пресс", type: "Кардио", exercises: [
      { name: "HIIT / Бег", sets: "1", reps: "25 мин" },
      { name: "Скручивания", sets: "4", reps: "20" },
      { name: "Подъём ног", sets: "3", reps: "15" },
    ]},
  ];
}

function getSupplements(age: number, goal: string) {
  const base = [
    { name: "Протеин (Whey)", dose: "25-30г после тренировки", why: "Восстановление и рост мышц", priority: "high" },
    { name: "Витамин D3", dose: "2000-4000 МЕ в день", why: "Иммунитет, кости, тестостерон", priority: "high" },
    { name: "Омега-3", dose: "2-3г EPA+DHA в день", why: "Суставы, сердце, снижение воспаления", priority: "high" },
    { name: "Магний", dose: "300-400мг вечером", why: "Сон, восстановление, нервная система", priority: "medium" },
  ];
  if (goal === "mass") {
    base.push({ name: "Креатин", dose: "5г ежедневно", why: "Сила, объём мышц, взрывная мощь", priority: "high" });
    base.push({ name: "BCAA", dose: "5-10г во время тренировки", why: "Защита мышц от распада", priority: "medium" });
  }
  if (goal === "cut") {
    base.push({ name: "L-Карнитин", dose: "1-2г до кардио", why: "Транспорт жира в митохондрии", priority: "medium" });
    base.push({ name: "Кофеин", dose: "100-200мг до тренировки", why: "Жиросжигание и фокус", priority: "medium" });
  }
  if (age >= 35) {
    base.push({ name: "Коллаген", dose: "10-15г утром", why: "Суставы и связки после 35", priority: "high" });
    base.push({ name: "ZMA (Цинк+Магний)", dose: "Перед сном", why: "Поддержка тестостерона 35+", priority: "medium" });
  }
  if (age >= 45) {
    base.push({ name: "Коэнзим Q10", dose: "100-200мг в день", why: "Энергия клеток, здоровье сердца 45+", priority: "high" });
    base.push({ name: "Витамин B12", dose: "1000 мкг в день", why: "Нервная система, усвоение снижается с возрастом", priority: "medium" });
  }
  return base;
}

function MuscleBar({ muscle, delay = 0 }: { muscle: MuscleGroup; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(muscle.level), 120 + delay);
    return () => clearTimeout(t);
  }, [muscle.level, delay]);

  const color = muscle.status === "strong" ? "#FF6B00" : muscle.status === "average" ? "#FFD700" : "#FF2D55";
  const label = muscle.status === "strong" ? "Сильная" : muscle.status === "average" ? "Средне" : "Слабая";

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-white" style={{ fontFamily: "'Roboto', sans-serif" }}>{muscle.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>{label}</span>
          <span className="text-sm font-bold w-10 text-right" style={{ color, fontFamily: "'Oswald', sans-serif" }}>{muscle.level}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, ${color}88)`, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </div>
      {muscle.status === "weak" && (
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Roboto', sans-serif" }}>💡 {muscle.tip}</p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color = "#FF6B00" }: { label: string; value: string; sub?: string; icon: string; color?: string }) {
  return (
    <div className="rounded-xl p-4 hover-lift" style={{ background: "#141414", border: "1px solid #222" }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Roboto', sans-serif" }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
          <Icon name={icon} size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Roboto', sans-serif" }}>{sub}</div>}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = animated ? (score / 100) * circ : 0;
  const color = score >= 75 ? "#FF6B00" : score >= 50 ? "#FFD700" : "#FF2D55";
  const label = score >= 85 ? "Элита" : score >= 70 ? "Атлет" : score >= 55 ? "Любитель" : score >= 40 ? "Начинающий" : "Новичок";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>{score}</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Roboto', sans-serif" }}>/ 100</span>
        </div>
      </div>
      <div className="mt-2 px-4 py-1 rounded-full text-sm font-semibold" style={{ background: `${color}22`, color, border: `1px solid ${color}44`, fontFamily: "'Oswald', sans-serif" }}>
        {label}
      </div>
    </div>
  );
}

const inputStyle = {
  background: "transparent",
  color: "white",
  width: "100%",
  fontSize: "14px",
  outline: "none",
  borderBottom: "1px solid rgba(255,107,0,0.3)",
  paddingBottom: "4px",
  fontFamily: "'Roboto', sans-serif",
};

function ChoiceBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="py-2 rounded-lg text-xs font-medium transition-all flex-1"
      style={active
        ? { background: "linear-gradient(135deg,#FF6B00,#FF2D55)", color: "white", fontFamily: "'Oswald', sans-serif" }
        : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", fontFamily: "'Oswald', sans-serif" }
      }
    >
      {label}
    </button>
  );
}

export default function Index() {
  const [tab, setTab] = useState<Tab>("profile");
  const [analyzed, setAnalyzed] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "", age: "", weight: "", height: "",
    gender: "male", activity: "medium", goal: "mass", experience: "beginner"
  });

  const muscles = analyzed ? getMuscleGroups(profile) : [];
  const workout = analyzed ? getWorkoutProgram(profile) : [];
  const score = analyzed ? getFitnessScore(profile) : 0;
  const bodyType = analyzed ? getBodyType(profile) : null;
  const bmiVal = analyzed ? (parseFloat(profile.weight) / ((parseFloat(profile.height) / 100) ** 2)).toFixed(1) : "—";
  const supps = analyzed ? getSupplements(parseInt(profile.age), profile.goal) : [];
  const weakMuscles = muscles.filter(m => m.status === "weak");
  const strongMuscles = muscles.filter(m => m.status === "strong");
  const canAnalyze = profile.name && profile.age && profile.weight && profile.height;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "profile", label: "Профиль", icon: "User" },
    { id: "analysis", label: "Анализ", icon: "Activity" },
    { id: "muscles", label: "Мышцы", icon: "Dumbbell" },
    { id: "workout", label: "Тренировки", icon: "Zap" },
    { id: "supplements", label: "Добавки", icon: "Pill" },
    { id: "progress", label: "Прогресс", icon: "TrendingUp" },
  ];

  const cardStyle = { background: "#141414", border: "1px solid #222" };
  const sectionHeader = { fontFamily: "'Oswald', sans-serif", color: "white" };
  const labelStyle = { color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "'Roboto', sans-serif" };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,10,0.92)", borderBottom: "1px solid #1A1A1A", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#FF6B00,#FF2D55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16 }}>⚡</span>
            </div>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.15em", color: "white" }}>ФОРМА</span>
          </div>
          {analyzed && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6B00", display: "inline-block", animation: "pulseDot 2s infinite" }} />
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontFamily: "'Roboto', sans-serif" }}>{profile.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 56, zIndex: 40, background: "rgba(10,10,10,0.95)", borderBottom: "1px solid #1A1A1A", backdropFilter: "blur(20px)", overflowX: "auto" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "8px 16px", display: "flex", gap: 4 }}>
          {tabs.map(t => {
            const isActive = tab === t.id;
            const isDisabled = !analyzed && t.id !== "profile";
            return (
              <button
                key={t.id}
                onClick={() => !isDisabled && setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  borderRadius: 8, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em",
                  fontFamily: "'Oswald', sans-serif", whiteSpace: "nowrap", transition: "all 0.2s",
                  border: "none", cursor: isDisabled ? "not-allowed" : "pointer",
                  background: isActive ? "linear-gradient(135deg,#FF6B00,#FF2D55)" : "transparent",
                  color: isActive ? "white" : isDisabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
                }}
              >
                <Icon name={t.icon} size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {/* PROFILE */}
        {tab === "profile" && (
          <div style={{ animation: "fadeSlideUp 0.4s ease forwards" }}>
            {!analyzed ? (
              <>
                <div style={{ marginBottom: 32 }}>
                  <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 32, fontWeight: 700, color: "white", marginBottom: 8 }}>
                    ТВОЯ{" "}
                    <span style={{ background: "linear-gradient(135deg,#FF6B00,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      ФИЗИЧЕСКАЯ ФОРМА
                    </span>
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, fontFamily: "'Roboto', sans-serif" }}>
                    Заполни профиль — получи персональный анализ, программу тренировок и рекомендации
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                  {/* Name */}
                  <div style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
                    <p style={labelStyle}>Имя</p>
                    <input style={{ ...inputStyle, marginTop: 8 }} type="text" placeholder="Введи своё имя" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </div>

                  {/* Age */}
                  <div style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
                    <p style={labelStyle}>Возраст</p>
                    <input style={{ ...inputStyle, marginTop: 8 }} type="number" placeholder="25" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} />
                  </div>

                  {/* Weight */}
                  <div style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
                    <p style={labelStyle}>Вес (кг)</p>
                    <input style={{ ...inputStyle, marginTop: 8 }} type="number" placeholder="70" value={profile.weight} onChange={e => setProfile(p => ({ ...p, weight: e.target.value }))} />
                  </div>

                  {/* Height */}
                  <div style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
                    <p style={labelStyle}>Рост (см)</p>
                    <input style={{ ...inputStyle, marginTop: 8 }} type="number" placeholder="175" value={profile.height} onChange={e => setProfile(p => ({ ...p, height: e.target.value }))} />
                  </div>

                  {/* Gender */}
                  <div style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
                    <p style={{ ...labelStyle, marginBottom: 12 }}>Пол</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <ChoiceBtn active={profile.gender === "male"} onClick={() => setProfile(p => ({ ...p, gender: "male" }))} label="Мужской" />
                      <ChoiceBtn active={profile.gender === "female"} onClick={() => setProfile(p => ({ ...p, gender: "female" }))} label="Женский" />
                    </div>
                  </div>

                  {/* Activity */}
                  <div style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
                    <p style={{ ...labelStyle, marginBottom: 12 }}>Активность</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ChoiceBtn active={profile.activity === "low"} onClick={() => setProfile(p => ({ ...p, activity: "low" }))} label="Низкая" />
                      <ChoiceBtn active={profile.activity === "medium"} onClick={() => setProfile(p => ({ ...p, activity: "medium" }))} label="Средняя" />
                      <ChoiceBtn active={profile.activity === "high"} onClick={() => setProfile(p => ({ ...p, activity: "high" }))} label="Высокая" />
                    </div>
                  </div>

                  {/* Goal */}
                  <div style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
                    <p style={{ ...labelStyle, marginBottom: 12 }}>Цель</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[{ v: "mass", l: "Масса" }, { v: "cut", l: "Сушка" }, { v: "strength", l: "Сила" }, { v: "endurance", l: "Выносливость" }].map(opt => (
                        <button key={opt.v} onClick={() => setProfile(p => ({ ...p, goal: opt.v }))}
                          style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", transition: "all 0.2s",
                            background: profile.goal === opt.v ? "linear-gradient(135deg,#FF6B00,#FF2D55)" : "rgba(255,255,255,0.06)",
                            color: profile.goal === opt.v ? "white" : "rgba(255,255,255,0.45)"
                          }}
                        >{opt.l}</button>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
                    <p style={{ ...labelStyle, marginBottom: 12 }}>Опыт тренировок</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ChoiceBtn active={profile.experience === "beginner"} onClick={() => setProfile(p => ({ ...p, experience: "beginner" }))} label="Новичок" />
                      <ChoiceBtn active={profile.experience === "intermediate"} onClick={() => setProfile(p => ({ ...p, experience: "intermediate" }))} label="Средний" />
                      <ChoiceBtn active={profile.experience === "advanced"} onClick={() => setProfile(p => ({ ...p, experience: "advanced" }))} label="Продвинутый" />
                    </div>
                  </div>
                </div>

                {/* Photo Upload */}
                <div style={{ ...cardStyle, borderRadius: 16, padding: 20, marginTop: 12, border: `1px dashed ${photoUploaded ? "#FF6B00" : "#333"}` }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={() => setPhotoUploaded(true)} />
                    <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: photoUploaded ? "rgba(255,107,0,0.15)" : "rgba(255,255,255,0.05)" }}>
                      <Icon name={photoUploaded ? "CheckCircle" : "Camera"} size={22} style={{ color: photoUploaded ? "#FF6B00" : "rgba(255,255,255,0.25)" }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 14, color: photoUploaded ? "#FF6B00" : "rgba(255,255,255,0.45)" }}>
                        {photoUploaded ? "Фото загружено!" : "Загрузить фото (опционально)"}
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "'Roboto', sans-serif", marginTop: 2 }}>
                        Для визуального анализа телосложения
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={() => { if (canAnalyze) { setAnalyzed(true); setTab("analysis"); } }}
                  disabled={!canAnalyze}
                  style={{
                    marginTop: 20, width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
                    fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.1em",
                    cursor: canAnalyze ? "pointer" : "not-allowed", transition: "all 0.3s",
                    background: canAnalyze ? "linear-gradient(135deg,#FF6B00,#FF2D55)" : "rgba(255,255,255,0.05)",
                    color: canAnalyze ? "white" : "rgba(255,255,255,0.2)",
                    boxShadow: canAnalyze ? "0 4px 30px rgba(255,107,0,0.35)" : "none",
                  }}
                >
                  ⚡ АНАЛИЗИРОВАТЬ ФОРМУ
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <h2 style={{ ...sectionHeader, fontSize: 26 }}>
                      Привет,{" "}
                      <span style={{ background: "linear-gradient(135deg,#FF6B00,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{profile.name}!</span>
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "'Roboto', sans-serif" }}>Твой профиль заполнен</p>
                  </div>
                  <button onClick={() => { setAnalyzed(false); setTab("profile"); }}
                    style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontFamily: "'Oswald', sans-serif", background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)", cursor: "pointer" }}>
                    Изменить
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  <StatCard label="Возраст" value={`${profile.age} лет`} icon="Calendar" />
                  <StatCard label="Вес" value={`${profile.weight} кг`} icon="Scale" />
                  <StatCard label="Рост" value={`${profile.height} см`} icon="Ruler" />
                  <StatCard label="ИМТ" value={bmiVal} sub="Индекс массы тела" icon="BarChart2" color="#FFD700" />
                </div>
              </>
            )}
          </div>
        )}

        {/* ANALYSIS */}
        {tab === "analysis" && analyzed && (
          <div>
            <h2 style={{ ...sectionHeader, fontSize: 26, marginBottom: 24 }}>
              АНАЛИЗ{" "}
              <span style={{ background: "linear-gradient(135deg,#FF6B00,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ФОРМЫ</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
              {/* Score */}
              <div style={{ ...cardStyle, borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <p style={{ ...labelStyle, marginBottom: 16 }}>Общая оценка</p>
                <ScoreRing score={score} />
                <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'Roboto', sans-serif" }}>
                  Топ {100 - score}% пользователей
                </p>
              </div>

              {/* Body Type */}
              {bodyType && (
                <div style={{ ...cardStyle, borderRadius: 20, padding: 28 }}>
                  <p style={{ ...labelStyle, marginBottom: 16 }}>Тип телосложения</p>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{bodyType.emoji}</div>
                  <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 26, fontWeight: 700, color: bodyType.color, marginBottom: 10 }}>{bodyType.type}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontFamily: "'Roboto', sans-serif" }}>{bodyType.description}</p>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <StatCard label="ИМТ" value={bmiVal} sub={parseFloat(bmiVal) < 18.5 ? "Недостаток" : parseFloat(bmiVal) < 25 ? "Норма ✓" : "Избыток"} icon="BarChart2" color="#FFD700" />
                <StatCard label="Активность" value={profile.activity === "high" ? "Высокая" : profile.activity === "medium" ? "Средняя" : "Низкая"} icon="Flame" color="#FF6B00" />
                <StatCard label="Опыт" value={profile.experience === "advanced" ? "Продвинутый" : profile.experience === "intermediate" ? "Средний" : "Новичок"} icon="Star" color="#FF2D55" />
              </div>
            </div>

            {weakMuscles.length > 0 && (
              <div style={{ borderRadius: 16, padding: 20, marginBottom: 12, background: "rgba(255,45,85,0.07)", border: "1px solid rgba(255,45,85,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Icon name="AlertTriangle" size={18} style={{ color: "#FF2D55" }} />
                  <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: "white", fontSize: 15 }}>Слабые места — нужно прокачать</h3>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {weakMuscles.map(m => (
                    <span key={m.name} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, background: "rgba(255,45,85,0.12)", color: "#FF2D55", border: "1px solid rgba(255,45,85,0.3)", fontFamily: "'Roboto', sans-serif" }}>
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {strongMuscles.length > 0 && (
              <div style={{ borderRadius: 16, padding: 20, background: "rgba(255,107,0,0.07)", border: "1px solid rgba(255,107,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Icon name="Trophy" size={18} style={{ color: "#FF6B00" }} />
                  <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: "white", fontSize: 15 }}>Твои сильные стороны</h3>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {strongMuscles.map(m => (
                    <span key={m.name} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, background: "rgba(255,107,0,0.12)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)", fontFamily: "'Roboto', sans-serif" }}>
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MUSCLES */}
        {tab === "muscles" && analyzed && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ ...sectionHeader, fontSize: 26 }}>
                  ГРУППЫ{" "}
                  <span style={{ background: "linear-gradient(135deg,#FF6B00,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>МЫШЦ</span>
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "'Roboto', sans-serif" }}>Оценка развития каждой группы</p>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, fontFamily: "'Roboto', sans-serif" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6B00", display: "inline-block" }} />Сильно</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFD700", display: "inline-block" }} />Средне</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF2D55", display: "inline-block" }} />Слабо</span>
              </div>
            </div>

            <div style={{ ...cardStyle, borderRadius: 20, padding: 24, marginBottom: 16 }}>
              {muscles.map((m, i) => <MuscleBar key={m.name} muscle={m} delay={i * 80} />)}
            </div>

            <div style={{ ...cardStyle, borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: "white", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="Target" size={16} style={{ color: "#FF6B00" }} />
                Приоритет прокачки
              </h3>
              {muscles.filter(m => m.status !== "strong").sort((a, b) => a.level - b.level).slice(0, 4).map(m => (
                <div key={m.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <span style={{ fontSize: 14, fontFamily: "'Roboto', sans-serif", fontWeight: 500, color: "white" }}>{m.name}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 8, fontFamily: "'Roboto', sans-serif" }}>{m.tip}</span>
                  </div>
                  <span style={{ fontSize: 14, fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: m.status === "weak" ? "#FF2D55" : "#FFD700" }}>{m.level}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORKOUT */}
        {tab === "workout" && analyzed && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ ...sectionHeader, fontSize: 26 }}>
                ПРОГРАММА{" "}
                <span style={{ background: "linear-gradient(135deg,#FF6B00,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ТРЕНИРОВОК</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "'Roboto', sans-serif" }}>
                Составлено под твои параметры — {profile.experience === "beginner" ? "3 дня" : "5 дней"} в неделю
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {workout.map((day, i) => (
                <div key={day.day} style={{ ...cardStyle, borderRadius: 20, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,107,0,0.04)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#FF6B00,#FF2D55)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 14 }}>
                      {i + 1}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: "white", fontSize: 15 }}>{day.day}</h3>
                      <span style={{ fontSize: 12, color: "rgba(255,107,0,0.8)", fontFamily: "'Roboto', sans-serif" }}>{day.type}</span>
                    </div>
                  </div>
                  <div style={{ padding: "16px 24px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", paddingBottom: 10, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", fontFamily: "'Roboto', sans-serif", fontWeight: 400 }}>Упражнение</th>
                          <th style={{ textAlign: "center", paddingBottom: 10, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", fontFamily: "'Roboto', sans-serif", fontWeight: 400 }}>Подходы</th>
                          <th style={{ textAlign: "right", paddingBottom: 10, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", fontFamily: "'Roboto', sans-serif", fontWeight: 400 }}>Повторения</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.exercises.map((ex, j) => (
                          <tr key={j} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "10px 0", fontSize: 14, color: "white", fontFamily: "'Roboto', sans-serif" }}>{ex.name}</td>
                            <td style={{ padding: "10px 0", fontSize: 15, textAlign: "center", fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: "#FF6B00" }}>{ex.sets}</td>
                            <td style={{ padding: "10px 0", fontSize: 14, textAlign: "right", fontFamily: "'Oswald', sans-serif", color: "rgba(255,255,255,0.55)" }}>{ex.reps}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUPPLEMENTS */}
        {tab === "supplements" && analyzed && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ ...sectionHeader, fontSize: 26 }}>
                СПОРТИВНЫЕ{" "}
                <span style={{ background: "linear-gradient(135deg,#FF6B00,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ДОБАВКИ</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "'Roboto', sans-serif" }}>
                Рекомендации для {profile.age} лет · {profile.goal === "mass" ? "набор массы" : profile.goal === "cut" ? "сушка" : profile.goal === "strength" ? "сила" : "выносливость"}
              </p>
            </div>

            {parseInt(profile.age) >= 35 && (
              <div style={{ borderRadius: 12, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)" }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <p style={{ fontSize: 12, color: "rgba(255,215,0,0.85)", fontFamily: "'Roboto', sans-serif" }}>
                  После 35 лет добавлены добавки для поддержки суставов и гормонального баланса
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {supps.map((s, i) => (
                <div key={s.name} style={{ ...cardStyle, borderRadius: 16, padding: 18, display: "flex", alignItems: "flex-start", gap: 16, transition: "transform 0.2s ease" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: s.priority === "high" ? "rgba(255,107,0,0.15)" : "rgba(255,255,255,0.05)" }}>
                    <Icon name="Pill" size={20} style={{ color: s.priority === "high" ? "#FF6B00" : "rgba(255,255,255,0.35)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: "white", fontSize: 15 }}>{s.name}</h3>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: "'Roboto', sans-serif",
                        background: s.priority === "high" ? "rgba(255,107,0,0.12)" : "rgba(255,255,255,0.05)",
                        color: s.priority === "high" ? "#FF6B00" : "rgba(255,255,255,0.35)" }}>
                        {s.priority === "high" ? "Важно" : "Опционально"}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'Roboto', sans-serif", marginBottom: 4 }}>{s.dose}</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "'Roboto', sans-serif" }}>{s.why}</p>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'Roboto', sans-serif", marginTop: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              * Рекомендации носят информационный характер. Перед приёмом добавок проконсультируйся со специалистом.
            </p>
          </div>
        )}

        {/* PROGRESS */}
        {tab === "progress" && analyzed && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ ...sectionHeader, fontSize: 26 }}>
                ПРОГРЕСС{" "}
                <span style={{ background: "linear-gradient(135deg,#FF6B00,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>И СТАТИСТИКА</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "'Roboto', sans-serif" }}>Отслеживание изменений тела</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
              <StatCard label="Оценка формы" value={`${score}/100`} sub="Текущий уровень" icon="Activity" />
              <StatCard label="ИМТ" value={bmiVal} sub="Индекс массы тела" icon="BarChart2" color="#FFD700" />
              <StatCard label="Слабых мышц" value={`${weakMuscles.length}`} sub="Надо прокачать" icon="AlertTriangle" color="#FF2D55" />
              <StatCard label="Сильных мышц" value={`${strongMuscles.length}`} sub="Уже развиты" icon="Trophy" color="#22C55E" />
            </div>

            {/* Фото прогресс */}
            <div style={{ ...cardStyle, borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: "white", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="Camera" size={16} style={{ color: "#FF6B00" }} />
                Фото-прогресс
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {["До", "После"].map(label => (
                  <label key={label} style={{ cursor: "pointer" }}>
                    <input type="file" accept="image/*" style={{ display: "none" }} />
                    <div style={{ aspectRatio: "1", borderRadius: 14, border: "2px dashed #333", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "border-color 0.2s" }}>
                      <Icon name="Plus" size={28} style={{ color: "rgba(255,255,255,0.18)" }} />
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "'Roboto', sans-serif" }}>Фото «{label}»</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Прогресс по мышцам */}
            <div style={{ ...cardStyle, borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: "white", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="TrendingUp" size={16} style={{ color: "#FF6B00" }} />
                Топ-5 мышц для роста
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[...muscles].sort((a, b) => a.level - b.level).slice(0, 5).map((m, i) => (
                  <MuscleBar key={m.name} muscle={m} delay={i * 100} />
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
