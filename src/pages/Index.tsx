import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

/* ─────────── TYPES ─────────── */
type Screen = "onboarding" | "app";
type AppTab = "workouts" | "progress" | "tips";
type OnboardingStep = 1 | 2 | 3;
type Goal = "lose" | "mass" | "maintain" | "endurance";
type Level = "beginner" | "intermediate" | "advanced";
type Gender = "male" | "female";
type Equipment = "home" | "outdoor" | "gym";

interface Profile {
  goal: Goal;
  age: string;
  gender: Gender;
  level: Level;
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: Equipment;
  squats30s: string;
  plankSeconds: string;
  pushups: string;
  photoFront: string | null;
  photoSide: string | null;
  createdAt: string;
}

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  muscleGroup: string;
  description: string;
  done?: boolean;
}

interface WorkoutSession {
  id: string;
  dayLabel: string;
  type: string;
  exercises: WorkoutExercise[];
  completed: boolean;
  completedAt?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

interface ProgressEntry {
  date: string;
  squats30s: number;
  plankSeconds: number;
  pushups: number;
  photoFront?: string;
  photoSide?: string;
}

interface AppState {
  profile: Profile;
  workouts: WorkoutSession[];
  completedDates: string[];
  achievements: Achievement[];
  progressHistory: ProgressEntry[];
  weekStartDate: string;
}

/* ─────────── CONSTANTS ─────────── */
const STORAGE_KEY = "fitprofile_data";

const DEFAULT_PROFILE: Profile = {
  goal: "lose", age: "", gender: "male", level: "beginner",
  daysPerWeek: 3, minutesPerSession: 30, equipment: "home",
  squats30s: "", plankSeconds: "", pushups: "",
  photoFront: null, photoSide: null, createdAt: "",
};

const GOALS: { value: Goal; label: string; icon: string; desc: string }[] = [
  { value: "lose", label: "Похудение", icon: "Flame", desc: "Сжигание жира, рельеф" },
  { value: "mass", label: "Набор массы", icon: "Dumbbell", desc: "Рост мышц и силы" },
  { value: "maintain", label: "Поддержание", icon: "Shield", desc: "Здоровье и тонус" },
  { value: "endurance", label: "Выносливость", icon: "Heart", desc: "Кардио и стамина" },
];

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_workout", title: "Первый шаг", description: "Завершил первую тренировку", icon: "Footprints" },
  { id: "3_streak", title: "3 подряд!", description: "3 тренировки подряд без пропуска", icon: "Zap" },
  { id: "week_complete", title: "Неделя героя", description: "Выполнил все тренировки за неделю", icon: "Crown" },
  { id: "month_no_skip", title: "Месяц без пропусков", description: "Тренировался весь месяц", icon: "Trophy" },
  { id: "plank_90", title: "Планка 90 сек", description: "Удержал планку 90+ секунд", icon: "Timer" },
  { id: "pushups_30", title: "30 отжиманий", description: "Сделал 30+ отжиманий до отказа", icon: "Swords" },
];

/* ─────────── HELPERS ─────────── */
function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getBodyType(profile: Profile) {
  const age = parseInt(profile.age) || 25;
  const sq = parseInt(profile.squats30s) || 0;
  const pk = parseInt(profile.plankSeconds) || 0;
  const pu = parseInt(profile.pushups) || 0;
  const score = sq * 2 + pk * 0.3 + pu * 1.5;

  if (profile.level === "advanced" || score > 80) {
    return { type: "Атлетическое", color: "#FF6B00", emoji: "⚡", description: "Хорошая мышечная база, выраженный рельеф. Готовы к интенсивным нагрузкам." };
  }
  if (profile.level === "intermediate" || score > 40) {
    return { type: "Среднее", color: "#FFD700", emoji: "💪", description: "Средний уровень физической подготовки. Есть база для роста." };
  }
  return { type: "Начальное", color: "#00C9FF", emoji: "🚀", description: "Начальный уровень. Отличная точка старта — результат придёт быстро!" };
}

function getMuscleAnalysis(profile: Profile) {
  const level = profile.level;
  const base = level === "advanced" ? 72 : level === "intermediate" ? 52 : 30;
  const sq = parseInt(profile.squats30s) || 0;
  const pk = parseInt(profile.plankSeconds) || 0;
  const pu = parseInt(profile.pushups) || 0;

  const groups = [
    { name: "Ноги", level: Math.min(95, base + sq * 1.5), tip: "Приседания, выпады, подъёмы" },
    { name: "Кор/Пресс", level: Math.min(95, base + pk * 0.4 - 5), tip: "Планка, скручивания, велосипед" },
    { name: "Грудь", level: Math.min(95, base + pu * 0.8), tip: "Отжимания, жим лёжа" },
    { name: "Спина", level: Math.min(95, base + (level === "advanced" ? 15 : 0)), tip: "Подтягивания, тяга" },
    { name: "Руки", level: Math.min(95, base + pu * 0.5 - 3), tip: "Сгибания, разгибания, молотки" },
    { name: "Плечи", level: Math.min(95, base + pu * 0.3 - 5), tip: "Жим стоя, махи в стороны" },
    { name: "Кардио", level: Math.min(95, base + (profile.goal === "endurance" ? 20 : 0)), tip: "Бег, прыжки, бёрпи" },
  ];

  return groups.map(g => ({
    ...g,
    level: Math.max(10, Math.round(g.level)),
    status: g.level >= 65 ? "strong" : g.level >= 40 ? "average" : "weak" as "strong" | "average" | "weak"
  }));
}

function generateWorkouts(profile: Profile): WorkoutSession[] {
  const days = profile.daysPerWeek;
  const mins = profile.minutesPerSession;
  const eq = profile.equipment;
  const goal = profile.goal;
  const level = profile.level;

  const setsBase = level === "advanced" ? 4 : level === "intermediate" ? 3 : 3;
  const restBase = goal === "endurance" ? 30 : goal === "lose" ? 45 : 60;
  const exercisesCount = Math.max(3, Math.round(mins / (level === "beginner" ? 10 : 8)));

  const exercisePool: Record<string, WorkoutExercise[]> = {
    legs: [
      { name: "Приседания", sets: setsBase, reps: goal === "mass" ? "8-10" : "15-20", restSeconds: restBase, muscleGroup: "Ноги", description: "Стопы на ширине плеч, спина прямая. Опускайся до параллели бёдер с полом." },
      { name: "Выпады", sets: setsBase, reps: "12 на каждую", restSeconds: restBase, muscleGroup: "Ноги", description: "Шаг вперёд, колено не выходит за носок. Спина прямая." },
      { name: "Подъёмы на носки", sets: 3, reps: "20", restSeconds: 30, muscleGroup: "Икры", description: "Встань на край ступеньки, поднимайся на носки и медленно опускайся." },
      { name: "Ягодичный мостик", sets: setsBase, reps: "15", restSeconds: 45, muscleGroup: "Ягодицы", description: "Лёжа на спине, поднимай таз, сжимая ягодицы в верхней точке." },
      { name: "Приседания с прыжком", sets: 3, reps: "12", restSeconds: 45, muscleGroup: "Ноги", description: "Присед вниз, взрывной прыжок вверх. Мягко приземляйся." },
    ],
    push: [
      { name: "Отжимания", sets: setsBase, reps: level === "beginner" ? "8-10" : "12-15", restSeconds: restBase, muscleGroup: "Грудь", description: "Ладони чуть шире плеч, тело — прямая линия. Опускайся до касания грудью пола." },
      { name: "Отжимания с узкой постановкой", sets: 3, reps: "10", restSeconds: restBase, muscleGroup: "Трицепс", description: "Ладони близко друг к другу. Локти идут вдоль тела." },
      { name: "Пайк-отжимания", sets: 3, reps: "8-10", restSeconds: restBase, muscleGroup: "Плечи", description: "Таз поднят высоко, тело — буква V. Отжимания вниз головой." },
      { name: "Обратные отжимания", sets: setsBase, reps: "12", restSeconds: 45, muscleGroup: "Трицепс", description: "Руки на стуле за спиной, опускай тело вниз сгибая локти." },
    ],
    pull: [
      { name: eq === "outdoor" ? "Подтягивания" : "Тяга в наклоне с гантелями", sets: setsBase, reps: level === "beginner" ? "5-8" : "8-12", restSeconds: restBase + 15, muscleGroup: "Спина", description: eq === "outdoor" ? "Хват чуть шире плеч. Подтягивайся до подбородка выше перекладины." : "Наклон 45°, тяни гантели к поясу. Своди лопатки." },
      { name: "Супермен", sets: 3, reps: "12", restSeconds: 30, muscleGroup: "Спина", description: "Лёжа на животе, поднимай одновременно руки и ноги. Держи 2 секунды." },
      { name: eq === "outdoor" ? "Австралийские подтягивания" : "Тяга одной рукой", sets: 3, reps: "10", restSeconds: restBase, muscleGroup: "Спина", description: "Тяни корпус к перекладине / гантель к поясу." },
    ],
    core: [
      { name: "Планка", sets: 3, reps: level === "beginner" ? "20 сек" : "30-45 сек", restSeconds: 30, muscleGroup: "Кор", description: "Тело — прямая линия от макушки до пяток. Не прогибай поясницу." },
      { name: "Скручивания", sets: 3, reps: "20", restSeconds: 30, muscleGroup: "Пресс", description: "Лёжа на спине, поднимай лопатки от пола. Не тяни шею руками." },
      { name: "Велосипед", sets: 3, reps: "20 на сторону", restSeconds: 30, muscleGroup: "Косые", description: "Касайся локтем противоположного колена, чередуя стороны." },
      { name: "Подъём ног", sets: 3, reps: "12", restSeconds: 30, muscleGroup: "Нижний пресс", description: "Лёжа на спине, поднимай прямые ноги до 90°. Медленно опускай." },
      { name: "Боковая планка", sets: 3, reps: "20 сек на сторону", restSeconds: 30, muscleGroup: "Косые", description: "Лёжа на боку, поднимай таз. Тело — прямая линия." },
    ],
    cardio: [
      { name: "Бег на месте", sets: 1, reps: "3-5 мин", restSeconds: 60, muscleGroup: "Кардио", description: "Высоко поднимай колени, активно работай руками." },
      { name: "Jumping Jacks", sets: 3, reps: "30", restSeconds: 30, muscleGroup: "Кардио", description: "Прыжки с разведением рук и ног в стороны." },
      { name: "Бёрпи", sets: 3, reps: level === "beginner" ? "5-8" : "10-12", restSeconds: 60, muscleGroup: "Всё тело", description: "Присед → упор лёжа → отжимание → прыжок вверх." },
      { name: "Скалолаз", sets: 3, reps: "20 на сторону", restSeconds: 30, muscleGroup: "Кардио+Кор", description: "Упор лёжа, поочерёдно подтягивай колени к груди." },
    ],
  };

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const sessions: WorkoutSession[] = [];

  const splits = days <= 3
    ? [["legs", "core"], ["push", "pull"], ["cardio", "core"]]
    : days <= 5
    ? [["push", "core"], ["legs"], ["cardio", "core"], ["pull"], ["legs", "push"]]
    : [["push"], ["legs"], ["cardio", "core"], ["pull"], ["legs", "push"], ["cardio", "core"], ["push", "pull"]];

  for (let i = 0; i < days; i++) {
    const groups = splits[i % splits.length];
    const exPool: WorkoutExercise[] = [];
    groups.forEach(g => { if (exercisePool[g]) exPool.push(...exercisePool[g]); });

    const picked = exPool.slice(0, exercisesCount).map(e => ({ ...e, done: false }));
    const typeLabel = groups.map(g =>
      g === "legs" ? "Ноги" : g === "push" ? "Верх (жим)" : g === "pull" ? "Верх (тяга)" :
      g === "core" ? "Кор" : "Кардио"
    ).join(" + ");

    sessions.push({
      id: `day_${i}`,
      dayLabel: `${dayNames[i]} — ${typeLabel}`,
      type: typeLabel,
      exercises: picked,
      completed: false,
    });
  }

  return sessions;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─────────── SUB-COMPONENTS ─────────── */
const C = { bg: "#0A0A0A", card: "#141414", border: "#222", orange: "#FF6B00", yellow: "#FFD700", red: "#FF2D55", cyan: "#00C9FF" };
const font = { h: "'Oswald', sans-serif", b: "'Roboto', sans-serif" };

function GradientText({ children }: { children: React.ReactNode }) {
  return <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.yellow})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{children}</span>;
}

function Card({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return <div className={className} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, ...style }}>{children}</div>;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: font.h,
      fontSize: 13, fontWeight: 600, transition: "all 0.2s",
      background: active ? `linear-gradient(135deg, ${C.orange}, ${C.red})` : "rgba(255,255,255,0.06)",
      color: active ? "white" : "rgba(255,255,255,0.45)",
    }}>
      {children}
    </button>
  );
}

function MuscleBar({ name, level, status, tip, delay }: { name: string; level: number; status: string; tip: string; delay: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(level), 150 + delay); return () => clearTimeout(t); }, [level, delay]);
  const color = status === "strong" ? C.orange : status === "average" ? C.yellow : C.red;
  const lbl = status === "strong" ? "Сильная" : status === "average" ? "Средне" : "Слабая";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: font.b, fontSize: 13, color: "white" }}>{name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `${color}22`, color }}>{lbl}</span>
          <span style={{ fontSize: 14, fontFamily: font.h, fontWeight: 700, color, width: 36, textAlign: "right" }}>{level}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${w}%`, background: `linear-gradient(90deg, ${color}, ${color}88)`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
      {status === "weak" && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3, fontFamily: font.b }}>💡 {tip}</p>}
    </div>
  );
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const [anim, setAnim] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnim(true), 200); return () => clearTimeout(t); }, []);
  const r = 50, circ = 2 * Math.PI * r, dash = anim ? (score / 100) * circ : 0;
  const color = score >= 70 ? C.orange : score >= 45 ? C.yellow : C.cyan;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ marginTop: -76, display: "flex", flexDirection: "column", alignItems: "center", height: 56, justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontFamily: font.h, fontWeight: 700, color: "white" }}>{score}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: font.b }}>/ 100</span>
      </div>
      <div style={{ marginTop: 24, padding: "4px 14px", borderRadius: 20, fontSize: 12, fontFamily: font.h, fontWeight: 600, background: `${color}22`, color, border: `1px solid ${color}44` }}>
        {label}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color = C.orange }: { label: string; value: string; sub?: string; icon: string; color?: string }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)", fontFamily: font.b }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}22` }}>
          <Icon name={icon} size={14} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontFamily: font.h, fontWeight: 700, color: "white" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: font.b, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

function Timer({ onComplete }: { onComplete: (seconds: number) => void }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (ref.current) {
      clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 32, fontFamily: font.h, fontWeight: 700, color: "white", width: 80, textAlign: "center" }}>{formatTime(seconds)}</span>
      {!running ? (
        <button onClick={() => setRunning(true)} style={{ padding: "8px 16px", borderRadius: 10, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: "white", border: "none", cursor: "pointer", fontFamily: font.h, fontSize: 14, fontWeight: 600 }}>
          <Icon name="Play" size={14} /> Старт
        </button>
      ) : (
        <button onClick={() => { setRunning(false); onComplete(seconds); }} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(255,45,85,0.15)", color: C.red, border: `1px solid ${C.red}44`, cursor: "pointer", fontFamily: font.h, fontSize: 14, fontWeight: 600 }}>
          <Icon name="Square" size={14} /> Стоп
        </button>
      )}
      {!running && seconds > 0 && (
        <button onClick={() => setSeconds(0)} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12 }}>
          Сброс
        </button>
      )}
    </div>
  );
}

/* ─────────── TIPS DATA ─────────── */
const TIPS_SECTIONS = [
  {
    title: "Техника упражнений", icon: "Target", items: [
      { title: "Главное — форма, не вес", text: "Лучше сделать 10 идеальных повторений, чем 20 кривых. Плохая техника = травмы и ноль результата." },
      { title: "Дыхание", text: "Выдох на усилие, вдох на расслабление. В планке дышите ровно, не задерживайте." },
      { title: "Темп", text: "2 секунды вверх, 3 секунды вниз. Медленное опускание = больше нагрузки на мышцы." },
    ]
  },
  {
    title: "Восстановление", icon: "Moon", items: [
      { title: "Сон 7-9 часов", text: "Мышцы растут во сне. Меньше 7 часов — медленный прогресс и риск перетренированности." },
      { title: "Растяжка после тренировки", text: "5-10 минут растяжки снижает крепатуру на 30-40%. Не пропускайте." },
      { title: "День отдыха", text: "Мышцам нужно 48 часов на восстановление. Не тренируйте одну группу два дня подряд." },
    ]
  },
  {
    title: "Мотивация", icon: "Zap", items: [
      { title: "Привычка > мотивация", text: "Не ждите вдохновения. Наденьте кроссовки и начните — желание придёт на 5-й минуте." },
      { title: "Мини-цели", text: "Не '20 кг за год', а '+5 отжиманий за 2 недели'. Маленькие победы поддерживают мотивацию." },
      { title: "Фото каждый месяц", text: "Зеркало обманывает. Фото покажет реальный прогресс, который вы не замечаете." },
    ]
  },
  {
    title: "Разминка", icon: "RotateCcw", items: [
      { title: "5 минут перед каждой тренировкой", text: "Бег на месте, круговые движения рук, наклоны. Разогрев снижает риск травм на 50%." },
      { title: "Суставная гимнастика", text: "Колени, плечи, запястья — 10 круговых движений в каждую сторону. Занимает 2 минуты." },
    ]
  },
];

const CHALLENGES = [
  { title: "7 дней без пропусков", desc: "Тренируйся каждый день 7 дней подряд", icon: "Calendar", days: 7 },
  { title: "Планка 90 секунд", desc: "Удержи планку 1.5 минуты без перерыва", icon: "Timer", days: 0 },
  { title: "100 отжиманий за день", desc: "Суммарно за день — можно за несколько подходов", icon: "ArrowUp", days: 0 },
];

/* ─────────── MAIN COMPONENT ─────────── */
export default function Index() {
  const saved = loadState();
  const [screen, setScreen] = useState<Screen>(saved ? "app" : "onboarding");
  const [step, setStep] = useState<OnboardingStep>(1);
  const [profile, setProfile] = useState<Profile>(saved?.profile || { ...DEFAULT_PROFILE });
  const [appTab, setAppTab] = useState<AppTab>("workouts");
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(saved?.workouts || []);
  const [completedDates, setCompletedDates] = useState<string[]>(saved?.completedDates || []);
  const [achievements, setAchievements] = useState<Achievement[]>(saved?.achievements || []);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>(saved?.progressHistory || []);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const persist = useCallback(() => {
    saveState({ profile, workouts, completedDates, achievements, progressHistory, weekStartDate: todayStr() });
  }, [profile, workouts, completedDates, achievements, progressHistory]);

  useEffect(() => { if (screen === "app") persist(); }, [persist, screen]);

  const fitnessScore = (() => {
    let s = 30;
    const sq = parseInt(profile.squats30s) || 0;
    const pk = parseInt(profile.plankSeconds) || 0;
    const pu = parseInt(profile.pushups) || 0;
    s += Math.min(sq * 1.5, 25);
    s += Math.min(pk * 0.2, 15);
    s += Math.min(pu * 0.8, 20);
    if (profile.level === "advanced") s += 10;
    else if (profile.level === "intermediate") s += 5;
    return Math.min(Math.round(s), 98);
  })();

  const bodyType = getBodyType(profile);
  const muscles = getMuscleAnalysis(profile);
  const weekDone = completedDates.filter(d => {
    const diff = (new Date().getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  }).length;

  const todayWorkout = workouts.find(w => !w.completed);

  function unlockAchievement(id: string) {
    if (achievements.find(a => a.id === id && a.unlockedAt)) return;
    const template = ALL_ACHIEVEMENTS.find(a => a.id === id);
    if (!template) return;
    setAchievements(prev => {
      const exists = prev.find(a => a.id === id);
      if (exists?.unlockedAt) return prev;
      if (exists) return prev.map(a => a.id === id ? { ...a, unlockedAt: new Date().toISOString() } : a);
      return [...prev, { ...template, unlockedAt: new Date().toISOString() }];
    });
  }

  function completeWorkout(sessionId: string) {
    setWorkouts(prev => prev.map(w => w.id === sessionId ? { ...w, completed: true, completedAt: new Date().toISOString() } : w));
    const today = todayStr();
    setCompletedDates(prev => prev.includes(today) ? prev : [...prev, today]);
    unlockAchievement("first_workout");
    const newCompleted = [...completedDates, today];
    if (newCompleted.length >= 3) unlockAchievement("3_streak");
    if (newCompleted.filter(d => (new Date().getTime() - new Date(d).getTime()) / 86400000 < 7).length >= profile.daysPerWeek) {
      unlockAchievement("week_complete");
    }
  }

  function toggleExercise(sessionId: string, exIndex: number) {
    setWorkouts(prev => prev.map(w => {
      if (w.id !== sessionId) return w;
      const exercises = w.exercises.map((e, i) => i === exIndex ? { ...e, done: !e.done } : e);
      return { ...w, exercises };
    }));
  }

  function finishOnboarding() {
    const p = { ...profile, createdAt: new Date().toISOString() };
    const wk = generateWorkouts(p);
    const initAch = ALL_ACHIEVEMENTS.map(a => ({ ...a }));
    const initProgress: ProgressEntry = {
      date: todayStr(),
      squats30s: parseInt(p.squats30s) || 0,
      plankSeconds: parseInt(p.plankSeconds) || 0,
      pushups: parseInt(p.pushups) || 0,
    };
    setProfile(p);
    setWorkouts(wk);
    setAchievements(initAch);
    setProgressHistory([initProgress]);
    setScreen("app");
  }

  function resetProgram() {
    const wk = generateWorkouts(profile);
    setWorkouts(wk);
  }

  function handlePhotoUpload(type: "front" | "side") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        setProfile(p => ({ ...p, [type === "front" ? "photoFront" : "photoSide"]: data }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  const label = { fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", fontFamily: font.b, marginBottom: 8 };
  const inputStyle = { background: "transparent", color: "white", width: "100%", fontSize: 15, outline: "none", border: "none", borderBottom: `1px solid ${C.orange}44`, paddingBottom: 6, fontFamily: font.b };

  /* ─── ONBOARDING ─── */
  if (screen === "onboarding") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid #1A1A1A` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16 }}>⚡</span>
            </div>
            <span style={{ fontFamily: font.h, fontSize: 20, fontWeight: 700, letterSpacing: "0.12em", color: "white" }}>FITPROFILE</span>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: font.b }}>Шаг {step} из 3</span>
        </header>

        {/* Progress */}
        <div style={{ display: "flex", gap: 4, padding: "0 20px", marginTop: 12 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? `linear-gradient(90deg, ${C.orange}, ${C.red})` : "rgba(255,255,255,0.08)", transition: "all 0.3s" }} />
          ))}
        </div>

        <main style={{ flex: 1, padding: "24px 20px", maxWidth: 600, margin: "0 auto", width: "100%" }}>

          {/* STEP 1: Goal */}
          {step === 1 && (
            <div style={{ animation: "fadeSlideUp 0.4s ease forwards" }}>
              <h1 style={{ fontFamily: font.h, fontSize: 28, fontWeight: 700, color: "white", marginBottom: 6 }}>
                Выбери <GradientText>цель</GradientText>
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontFamily: font.b, marginBottom: 24 }}>
                Что хочешь достичь в первую очередь?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {GOALS.map(g => (
                  <button key={g.value} onClick={() => setProfile(p => ({ ...p, goal: g.value }))}
                    style={{
                      padding: 18, borderRadius: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, textAlign: "left", transition: "all 0.2s",
                      background: profile.goal === g.value ? `linear-gradient(135deg, ${C.orange}22, ${C.red}11)` : C.card,
                      outline: profile.goal === g.value ? `2px solid ${C.orange}` : `1px solid ${C.border}`,
                    }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: profile.goal === g.value ? `${C.orange}22` : "rgba(255,255,255,0.05)" }}>
                      <Icon name={g.icon} size={22} style={{ color: profile.goal === g.value ? C.orange : "rgba(255,255,255,0.3)" }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: font.h, fontSize: 16, fontWeight: 700, color: "white" }}>{g.label}</div>
                      <div style={{ fontFamily: font.b, fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{g.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep(2)} style={{
                marginTop: 28, width: "100%", padding: 16, borderRadius: 14, border: "none", fontFamily: font.h,
                fontSize: 16, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
                background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: "white",
                boxShadow: `0 4px 25px ${C.orange}55`,
              }}>
                ДАЛЕЕ →
              </button>
            </div>
          )}

          {/* STEP 2: Profile */}
          {step === 2 && (
            <div style={{ animation: "fadeSlideUp 0.4s ease forwards" }}>
              <h1 style={{ fontFamily: font.h, fontSize: 28, fontWeight: 700, color: "white", marginBottom: 6 }}>
                О <GradientText>тебе</GradientText>
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontFamily: font.b, marginBottom: 24 }}>
                Базовые данные для программы
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Card style={{ padding: 16 }}>
                  <p style={label}>Возраст</p>
                  <input style={inputStyle} type="number" placeholder="25" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} />
                </Card>
                <Card style={{ padding: 16 }}>
                  <p style={label}>Пол</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Pill active={profile.gender === "male"} onClick={() => setProfile(p => ({ ...p, gender: "male" }))}>М</Pill>
                    <Pill active={profile.gender === "female"} onClick={() => setProfile(p => ({ ...p, gender: "female" }))}>Ж</Pill>
                  </div>
                </Card>
              </div>

              <Card style={{ padding: 16, marginTop: 12 }}>
                <p style={label}>Уровень подготовки</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <Pill active={profile.level === "beginner"} onClick={() => setProfile(p => ({ ...p, level: "beginner" }))}>Новичок</Pill>
                  <Pill active={profile.level === "intermediate"} onClick={() => setProfile(p => ({ ...p, level: "intermediate" }))}>Средний</Pill>
                  <Pill active={profile.level === "advanced"} onClick={() => setProfile(p => ({ ...p, level: "advanced" }))}>Продвинутый</Pill>
                </div>
              </Card>

              <Card style={{ padding: 16, marginTop: 12 }}>
                <p style={label}>Где тренируешься?</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <Pill active={profile.equipment === "home"} onClick={() => setProfile(p => ({ ...p, equipment: "home" }))}>🏠 Дома</Pill>
                  <Pill active={profile.equipment === "outdoor"} onClick={() => setProfile(p => ({ ...p, equipment: "outdoor" }))}>🌳 Улица</Pill>
                  <Pill active={profile.equipment === "gym"} onClick={() => setProfile(p => ({ ...p, equipment: "gym" }))}>🏋️ Зал</Pill>
                </div>
              </Card>

              <Card style={{ padding: 16, marginTop: 12 }}>
                <p style={label}>Дней в неделю: <span style={{ color: C.orange, fontFamily: font.h, fontSize: 16 }}>{profile.daysPerWeek}</span></p>
                <input type="range" min={1} max={7} value={profile.daysPerWeek} onChange={e => setProfile(p => ({ ...p, daysPerWeek: parseInt(e.target.value) }))}
                  style={{ width: "100%", accentColor: C.orange }} />
              </Card>

              <Card style={{ padding: 16, marginTop: 12 }}>
                <p style={label}>Минут на тренировку: <span style={{ color: C.orange, fontFamily: font.h, fontSize: 16 }}>{profile.minutesPerSession}</span></p>
                <input type="range" min={15} max={90} step={5} value={profile.minutesPerSession} onChange={e => setProfile(p => ({ ...p, minutesPerSession: parseInt(e.target.value) }))}
                  style={{ width: "100%", accentColor: C.orange }} />
              </Card>

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: 14, borderRadius: 14, border: `1px solid ${C.border}`, background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: font.h, fontSize: 14 }}>
                  ← НАЗАД
                </button>
                <button onClick={() => setStep(3)} disabled={!profile.age}
                  style={{
                    flex: 2, padding: 14, borderRadius: 14, border: "none", fontFamily: font.h, fontSize: 16, fontWeight: 700, letterSpacing: "0.08em", cursor: profile.age ? "pointer" : "not-allowed",
                    background: profile.age ? `linear-gradient(135deg, ${C.orange}, ${C.red})` : "rgba(255,255,255,0.06)",
                    color: profile.age ? "white" : "rgba(255,255,255,0.2)",
                  }}>
                  ДАЛЕЕ →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Fitness Test + Photo */}
          {step === 3 && (
            <div style={{ animation: "fadeSlideUp 0.4s ease forwards" }}>
              <h1 style={{ fontFamily: font.h, fontSize: 28, fontWeight: 700, color: "white", marginBottom: 6 }}>
                Быстрый <GradientText>тест</GradientText>
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontFamily: font.b, marginBottom: 8 }}>
                Выполни 1-3 упражнения и запиши результат. Это поможет подобрать нагрузку.
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: font.b, marginBottom: 24 }}>
                Можно пропустить — приложение подберёт базовую программу
              </p>

              <Card style={{ padding: 18, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>🦵</span>
                  <div>
                    <p style={{ fontFamily: font.h, fontWeight: 700, color: "white", fontSize: 14 }}>Приседания за 30 секунд</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: font.b }}>Максимум повторений с правильной техникой</p>
                  </div>
                </div>
                <input style={inputStyle} type="number" placeholder="Количество" value={profile.squats30s} onChange={e => setProfile(p => ({ ...p, squats30s: e.target.value }))} />
              </Card>

              <Card style={{ padding: 18, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>⏱️</span>
                  <div>
                    <p style={{ fontFamily: font.h, fontWeight: 700, color: "white", fontSize: 14 }}>Планка (секунд)</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: font.b }}>Удержание до отказа</p>
                  </div>
                </div>
                <input style={inputStyle} type="number" placeholder="Секунд" value={profile.plankSeconds} onChange={e => setProfile(p => ({ ...p, plankSeconds: e.target.value }))} />
              </Card>

              <Card style={{ padding: 18, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>💪</span>
                  <div>
                    <p style={{ fontFamily: font.h, fontWeight: 700, color: "white", fontSize: 14 }}>Отжимания до отказа</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: font.b }}>Максимум с правильной техникой</p>
                  </div>
                </div>
                <input style={inputStyle} type="number" placeholder="Количество" value={profile.pushups} onChange={e => setProfile(p => ({ ...p, pushups: e.target.value }))} />
              </Card>

              {/* Photo Upload */}
              <p style={{ ...label, marginTop: 20, marginBottom: 12, fontSize: 12 }}>Фото для анализа телосложения (опционально)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["front", "side"] as const).map(type => {
                  const photo = type === "front" ? profile.photoFront : profile.photoSide;
                  return (
                    <div key={type} onClick={() => handlePhotoUpload(type)} style={{
                      aspectRatio: "3/4", borderRadius: 14, border: `2px dashed ${photo ? C.orange : "#333"}`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                      cursor: "pointer", overflow: "hidden", position: "relative",
                      background: photo ? "none" : "rgba(255,255,255,0.02)",
                    }}>
                      {photo ? (
                        <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <>
                          <Icon name="Camera" size={24} style={{ color: "rgba(255,255,255,0.2)" }} />
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: font.b }}>
                            {type === "front" ? "Спереди" : "Сбоку"}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: 14, borderRadius: 14, border: `1px solid ${C.border}`, background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: font.h, fontSize: 14 }}>
                  ← НАЗАД
                </button>
                <button onClick={finishOnboarding}
                  style={{
                    flex: 2, padding: 14, borderRadius: 14, border: "none", fontFamily: font.h, fontSize: 16, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
                    background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: "white",
                    boxShadow: `0 4px 25px ${C.orange}55`,
                  }}>
                  ⚡ ГОТОВО
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ─── APP SCREEN ─── */
  const weakMuscles = muscles.filter(m => m.status === "weak");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 80 }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,10,0.92)", borderBottom: "1px solid #1A1A1A", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13 }}>⚡</span>
            </div>
            <span style={{ fontFamily: font.h, fontSize: 18, fontWeight: 700, letterSpacing: "0.1em", color: "white" }}>FITPROFILE</span>
          </div>
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setScreen("onboarding"); setStep(1); setProfile({ ...DEFAULT_PROFILE }); }}
            style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: font.b }}>
            Сброс
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* ─── TAB: WORKOUTS ─── */}
        {appTab === "workouts" && (
          <div style={{ animation: "fadeSlideUp 0.35s ease forwards" }}>
            {/* Dashboard Header */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {/* Week progress */}
              <Card style={{ flex: 1, padding: 16 }}>
                <p style={{ ...label, marginBottom: 6 }}>Эта неделя</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 32, fontFamily: font.h, fontWeight: 700, color: "white" }}>{weekDone}</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontFamily: font.b }}>/ {profile.daysPerWeek}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 8 }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(100, (weekDone / profile.daysPerWeek) * 100)}%`, background: `linear-gradient(90deg, ${C.orange}, ${C.yellow})`, transition: "width 0.6s ease" }} />
                </div>
              </Card>

              {/* Score */}
              <Card style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <p style={{ ...label, marginBottom: 4 }}>Форма</p>
                <span style={{ fontSize: 28, fontFamily: font.h, fontWeight: 700, color: C.orange }}>{fitnessScore}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>/100</span>
              </Card>
            </div>

            {/* Today's Workout Card */}
            {todayWorkout ? (
              <Card style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", background: `linear-gradient(135deg, ${C.orange}15, ${C.red}08)`, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: 11, color: C.orange, fontFamily: font.b, textTransform: "uppercase", letterSpacing: "0.08em" }}>Сегодня</p>
                      <h2 style={{ fontFamily: font.h, fontSize: 18, fontWeight: 700, color: "white", marginTop: 2 }}>{todayWorkout.dayLabel}</h2>
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: font.b }}>{profile.minutesPerSession} мин</span>
                  </div>
                </div>
                <div style={{ padding: 18 }}>
                  {todayWorkout.exercises.map((ex, i) => (
                    <div key={i} onClick={() => toggleExercise(todayWorkout.id, i)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < todayWorkout.exercises.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        background: ex.done ? `linear-gradient(135deg, ${C.orange}, ${C.red})` : "rgba(255,255,255,0.06)",
                        border: ex.done ? "none" : "1px solid rgba(255,255,255,0.12)",
                      }}>
                        {ex.done && <Icon name="Check" size={14} style={{ color: "white" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontFamily: font.b, color: ex.done ? "rgba(255,255,255,0.35)" : "white", textDecoration: ex.done ? "line-through" : "none" }}>{ex.name}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8, fontFamily: font.b }}>{ex.muscleGroup}</span>
                      </div>
                      <span style={{ fontSize: 12, fontFamily: font.h, color: C.orange, fontWeight: 600 }}>{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button onClick={() => setShowTimer(!showTimer)} style={{
                      flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: font.h, fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <Icon name="Timer" size={14} /> Таймер
                    </button>
                    <button onClick={() => completeWorkout(todayWorkout.id)} style={{
                      flex: 2, padding: 12, borderRadius: 10, border: "none", cursor: "pointer", fontFamily: font.h, fontSize: 14, fontWeight: 700,
                      background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: "white",
                    }}>
                      Завершить тренировку ✓
                    </button>
                  </div>

                  {showTimer && (
                    <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                      <Timer onComplete={(s) => {
                        if (s >= 90) unlockAchievement("plank_90");
                      }} />
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card style={{ padding: 24, textAlign: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>🎉</span>
                <h3 style={{ fontFamily: font.h, fontSize: 18, fontWeight: 700, color: "white" }}>Все тренировки выполнены!</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: font.b, margin: "8px 0 16px" }}>Можешь обновить программу для нового цикла</p>
                <button onClick={resetProgram} style={{
                  padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: font.h, fontSize: 14, fontWeight: 600,
                  background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: "white",
                }}>
                  Обновить программу
                </button>
              </Card>
            )}

            {/* Full Schedule */}
            <h3 style={{ fontFamily: font.h, fontSize: 16, fontWeight: 700, color: "white", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="CalendarDays" size={15} style={{ color: C.orange }} />
              Расписание ({profile.daysPerWeek} дней)
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {workouts.map(w => (
                <Card key={w.id} style={{ padding: 0, overflow: "hidden" }}>
                  <button onClick={() => setExpandedWorkout(expandedWorkout === w.id ? null : w.id)}
                    style={{ width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: w.completed ? `linear-gradient(135deg, ${C.orange}, ${C.red})` : "rgba(255,255,255,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {w.completed ? <Icon name="Check" size={13} style={{ color: "white" }} /> : <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: font.h }}>{workouts.indexOf(w) + 1}</span>}
                      </div>
                      <span style={{ fontFamily: font.h, fontSize: 14, fontWeight: 600, color: w.completed ? "rgba(255,255,255,0.4)" : "white" }}>{w.dayLabel}</span>
                    </div>
                    <Icon name={expandedWorkout === w.id ? "ChevronUp" : "ChevronDown"} size={16} style={{ color: "rgba(255,255,255,0.25)" }} />
                  </button>
                  {expandedWorkout === w.id && (
                    <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}` }}>
                      {w.exercises.map((ex, i) => (
                        <div key={i} style={{ padding: "10px 0", borderBottom: i < w.exercises.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, color: "white", fontFamily: font.b }}>{ex.name}</span>
                            <span style={{ fontSize: 12, color: C.orange, fontFamily: font.h, fontWeight: 600 }}>{ex.sets}×{ex.reps}</span>
                          </div>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: font.b, marginTop: 3 }}>{ex.description}</p>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: font.b }}>Отдых: {ex.restSeconds} сек</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Body Analysis Summary */}
            <h3 style={{ fontFamily: font.h, fontSize: 16, fontWeight: 700, color: "white", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="Activity" size={15} style={{ color: C.orange }} />
              Анализ формы
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <Card style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <p style={{ ...label, marginBottom: 8 }}>Телосложение</p>
                <span style={{ fontSize: 28, marginBottom: 4 }}>{bodyType.emoji}</span>
                <span style={{ fontFamily: font.h, fontSize: 16, fontWeight: 700, color: bodyType.color }}>{bodyType.type}</span>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: 4, fontFamily: font.b }}>{bodyType.description}</p>
              </Card>
              <Card style={{ padding: 16 }}>
                <p style={{ ...label, marginBottom: 8 }}>Оценка</p>
                <ScoreRing score={fitnessScore} label={fitnessScore >= 70 ? "Атлет" : fitnessScore >= 45 ? "Любитель" : "Новичок"} />
              </Card>
            </div>

            {/* Muscle Bars */}
            <Card style={{ padding: 18, marginBottom: 16 }}>
              <h3 style={{ fontFamily: font.h, fontSize: 14, fontWeight: 700, color: "white", marginBottom: 14 }}>Развитие мышечных групп</h3>
              {muscles.map((m, i) => <MuscleBar key={m.name} {...m} delay={i * 60} />)}
            </Card>

            {weakMuscles.length > 0 && (
              <div style={{ borderRadius: 14, padding: 16, marginBottom: 16, background: `${C.red}0D`, border: `1px solid ${C.red}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Icon name="AlertTriangle" size={15} style={{ color: C.red }} />
                  <span style={{ fontFamily: font.h, fontWeight: 700, color: "white", fontSize: 13 }}>Слабые места</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {weakMuscles.map(m => (
                    <span key={m.name} style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, background: `${C.red}1A`, color: C.red, fontFamily: font.b }}>{m.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <Card style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontFamily: font.h, fontSize: 14, fontWeight: 700, color: "white" }}>Настройки программы</h3>
                <button onClick={resetProgram} style={{ fontSize: 12, color: C.orange, background: "none", border: "none", cursor: "pointer", fontFamily: font.b }}>
                  Обновить
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <p style={{ ...label, marginBottom: 4 }}>Дней/нед: {profile.daysPerWeek}</p>
                  <input type="range" min={1} max={7} value={profile.daysPerWeek} onChange={e => setProfile(p => ({ ...p, daysPerWeek: parseInt(e.target.value) }))} style={{ width: "100%", accentColor: C.orange }} />
                </div>
                <div>
                  <p style={{ ...label, marginBottom: 4 }}>Минут: {profile.minutesPerSession}</p>
                  <input type="range" min={15} max={90} step={5} value={profile.minutesPerSession} onChange={e => setProfile(p => ({ ...p, minutesPerSession: parseInt(e.target.value) }))} style={{ width: "100%", accentColor: C.orange }} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ─── TAB: PROGRESS ─── */}
        {appTab === "progress" && (
          <div style={{ animation: "fadeSlideUp 0.35s ease forwards" }}>
            <h2 style={{ fontFamily: font.h, fontSize: 24, fontWeight: 700, color: "white", marginBottom: 16 }}>
              <GradientText>Прогресс</GradientText>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
              <StatCard label="Тренировок" value={`${completedDates.length}`} sub="Всего выполнено" icon="Dumbbell" />
              <StatCard label="Форма" value={`${fitnessScore}/100`} sub="Текущий уровень" icon="Activity" color={C.yellow} />
              <StatCard label="Слабых мест" value={`${weakMuscles.length}`} sub="Нужно прокачать" icon="AlertTriangle" color={C.red} />
              <StatCard label="За неделю" value={`${weekDone}/${profile.daysPerWeek}`} sub="Тренировок" icon="Calendar" color="#22C55E" />
            </div>

            {/* Photo Comparison */}
            <Card style={{ padding: 18, marginBottom: 16 }}>
              <h3 style={{ fontFamily: font.h, fontSize: 14, fontWeight: 700, color: "white", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="Camera" size={14} style={{ color: C.orange }} /> Фото-прогресс
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["front", "side"] as const).map(type => {
                  const photo = type === "front" ? profile.photoFront : profile.photoSide;
                  return (
                    <div key={type} onClick={() => handlePhotoUpload(type)} style={{
                      aspectRatio: "3/4", borderRadius: 12, border: `2px dashed ${photo ? C.orange : "#333"}`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                      cursor: "pointer", overflow: "hidden",
                    }}>
                      {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                        <>
                          <Icon name="Plus" size={22} style={{ color: "rgba(255,255,255,0.15)" }} />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: font.b }}>{type === "front" ? "Спереди" : "Сбоку"}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: font.b, marginTop: 10, textAlign: "center" }}>
                Обновляй фото раз в месяц для сравнения
              </p>
            </Card>

            {/* Fitness Tests Progress */}
            <Card style={{ padding: 18, marginBottom: 16 }}>
              <h3 style={{ fontFamily: font.h, fontSize: 14, fontWeight: 700, color: "white", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="TrendingUp" size={14} style={{ color: C.orange }} /> Результаты тестов
              </h3>
              {[
                { label: "Приседания / 30 сек", val: profile.squats30s, icon: "🦵" },
                { label: "Планка (сек)", val: profile.plankSeconds, icon: "⏱️" },
                { label: "Отжимания", val: profile.pushups, icon: "💪" },
              ].map(t => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: font.b }}>{t.label}</span>
                  </div>
                  <span style={{ fontSize: 16, fontFamily: font.h, fontWeight: 700, color: C.orange }}>{t.val || "—"}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: font.b, marginTop: 12 }}>
                Пройди тест повторно через 2-4 недели для отслеживания роста
              </p>
            </Card>

            {/* Achievements */}
            <Card style={{ padding: 18, marginBottom: 16 }}>
              <h3 style={{ fontFamily: font.h, fontSize: 14, fontWeight: 700, color: "white", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="Trophy" size={14} style={{ color: C.yellow }} /> Достижения
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ALL_ACHIEVEMENTS.map(a => {
                  const unlocked = achievements.find(u => u.id === a.id && u.unlockedAt);
                  return (
                    <div key={a.id} style={{
                      padding: 14, borderRadius: 12,
                      background: unlocked ? `${C.orange}12` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${unlocked ? `${C.orange}33` : "rgba(255,255,255,0.06)"}`,
                      opacity: unlocked ? 1 : 0.4,
                    }}>
                      <Icon name={a.icon} size={20} style={{ color: unlocked ? C.orange : "rgba(255,255,255,0.2)", marginBottom: 6 }} />
                      <p style={{ fontFamily: font.h, fontSize: 13, fontWeight: 700, color: "white" }}>{a.title}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: font.b, marginTop: 2 }}>{a.description}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Calendar Mini */}
            <Card style={{ padding: 18, marginBottom: 16 }}>
              <h3 style={{ fontFamily: font.h, fontSize: 14, fontWeight: 700, color: "white", marginBottom: 14 }}>
                Активность за месяц
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {Array.from({ length: 30 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - 29 + i);
                  const ds = d.toISOString().slice(0, 10);
                  const done = completedDates.includes(ds);
                  const isToday = ds === todayStr();
                  return (
                    <div key={i} style={{
                      aspectRatio: "1", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
                      fontFamily: font.b, color: done ? "white" : "rgba(255,255,255,0.2)",
                      background: done ? `linear-gradient(135deg, ${C.orange}, ${C.red})` : isToday ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                      border: isToday ? `1px solid ${C.orange}66` : "none",
                    }}>
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ─── TAB: TIPS ─── */}
        {appTab === "tips" && (
          <div style={{ animation: "fadeSlideUp 0.35s ease forwards" }}>
            <h2 style={{ fontFamily: font.h, fontSize: 24, fontWeight: 700, color: "white", marginBottom: 16 }}>
              <GradientText>Советы</GradientText>
            </h2>

            {/* Challenges */}
            <h3 style={{ fontFamily: font.h, fontSize: 14, fontWeight: 700, color: "white", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="Flag" size={14} style={{ color: C.orange }} /> Мини-челленджи
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {CHALLENGES.map(ch => (
                <Card key={ch.title} style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.orange}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={ch.icon} size={20} style={{ color: C.orange }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: font.h, fontSize: 14, fontWeight: 700, color: "white" }}>{ch.title}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: font.b, marginTop: 2 }}>{ch.desc}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Tips Sections */}
            {TIPS_SECTIONS.map(section => (
              <div key={section.title} style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: font.h, fontSize: 14, fontWeight: 700, color: "white", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name={section.icon} size={14} style={{ color: C.orange }} /> {section.title}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {section.items.map(item => {
                    const key = `${section.title}-${item.title}`;
                    const open = expandedTip === key;
                    return (
                      <Card key={key} style={{ overflow: "hidden" }}>
                        <button onClick={() => setExpandedTip(open ? null : key)}
                          style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer" }}>
                          <span style={{ fontFamily: font.h, fontSize: 13, fontWeight: 600, color: "white", textAlign: "left" }}>{item.title}</span>
                          <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                        </button>
                        {open && (
                          <div style={{ padding: "0 16px 14px" }}>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: font.b, lineHeight: 1.6 }}>{item.text}</p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(10,10,10,0.95)", borderTop: "1px solid #1A1A1A", backdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", justifyContent: "space-around", padding: "8px 0 12px" }}>
          {([
            { id: "workouts", label: "Тренировки", icon: "Dumbbell" },
            { id: "progress", label: "Прогресс", icon: "TrendingUp" },
            { id: "tips", label: "Советы", icon: "Lightbulb" },
          ] as { id: AppTab; label: string; icon: string }[]).map(t => (
            <button key={t.id} onClick={() => setAppTab(t.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 16px",
              }}>
              <Icon name={t.icon} size={20} style={{ color: appTab === t.id ? C.orange : "rgba(255,255,255,0.3)" }} />
              <span style={{
                fontSize: 10, fontFamily: font.h, fontWeight: 600, letterSpacing: "0.04em",
                color: appTab === t.id ? C.orange : "rgba(255,255,255,0.3)",
              }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}