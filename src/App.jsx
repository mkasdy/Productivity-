import { useState, useEffect, useRef } from "react";
import {
  Dumbbell, Apple, Pill, Hand, Moon, BookOpen, Mic, Eye, EyeOff,
  Users, Scale, Car, Megaphone, Video, Phone, ListChecks,
  Plus, Check, Wallet, Sparkles, Minus, Pencil, X,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ---------------------------------------------------------------------------
// Palette — "Dawn Market": morning light, market-stall color, still grounded
// in the same curiosity/travel world, just inverted into daylight.
// Applied via inline style (no Tailwind arbitrary-value classes — no JIT here).
// ---------------------------------------------------------------------------
const C = {
  bg: "#F4FAFB",
  surface: "#FFFFFF",
  surfaceAlt: "#EAF6F4",
  ink: "#163A3F",
  inkMuted: "#5C7C80",
  line: "#D9EBEA",
  lineSoft: "#ECF7F6",
  accent: "#FF6F47",   // papaya — primary actions, checked states
  accent2: "#1E9D86",  // jade — secondary highlights
  gold: "#C97A1B",     // amber — icons, eyebrows
  sky: "#39AFD1",      // sky blue — gradient stop / chart accent
  onAccent: "#FFFFFF",
};

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function pad(n) { return String(n).padStart(2, "0"); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function monthKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isoWeekKey(inputDate) {
  const date = new Date(inputDate.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNo = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${pad(weekNo)}`;
}
function formatDispatchDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}
function formatNoteDate(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }).toUpperCase()} · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
}

// ---------------------------------------------------------------------------
// Storage helpers — defensive, never throw into the UI
// ---------------------------------------------------------------------------
const hasStorage = typeof window !== "undefined" && !!window.storage;
async function storageGet(key) {
  if (!hasStorage) return null;
  try {
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : null;
  } catch {
    return null;
  }
}
async function storageSet(key, value) {
  if (!hasStorage) return false;
  try {
    await window.storage.set(key, JSON.stringify(value), false);
    return true;
  } catch {
    return false;
  }
}
async function storageListKeys(prefix) {
  if (!hasStorage) return [];
  try {
    const res = await window.storage.list(prefix, false);
    return res?.keys || [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS = {
  supplements: [],
  weightStart: 82,
  weightTarget: 75,
  usersWeeklyTarget: 10,
  linkedinMonthlyTarget: 5,
  videoWeeklyTarget: 1,
};
const DEFAULT_DAILY = {
  gymTrained: false,
  gymIntensity: 0,
  dietClean: false,
  supplementsChecked: [],
  prayer: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
  meditationDone: false,
  meditationMinutes: 0,
  wisdomNote: "",
  readingType: "pm",
  readingDone: false,
  readingWhat: "",
  deepVoicePracticed: false,
};
const DEFAULT_WEEKLY = {
  social: "",
  videos: 0,
  agentContacts: 0,
  indexingDone: false,
  newUsersOnshore: 0,
  newUsersOffshore: 0,
};
const DEFAULT_MONTHLY = { linkedinPosts: 0 };
const DEFAULT_DRIVING = {
  theoryBooked: false,
  theoryPassed: false,
  hoursLogged: 0,
  practicalBooked: false,
  practicalPassed: false,
};
const DEFAULT_FINANCIAL = { balance: null };
const DEFAULT_STREAK = { count: 0, lastDate: null };

// ---------------------------------------------------------------------------
// Autosave hook — debounced, skips the initial load-triggered write
// ---------------------------------------------------------------------------
function useAutosave(value, key, ready) {
  const prevKey = useRef(key);
  const skip = useRef(true);
  const timer = useRef(null);

  useEffect(() => {
    if (prevKey.current !== key) {
      prevKey.current = key;
      skip.current = true;
    }
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    if (skip.current) { skip.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { storageSet(key, value); }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value, ready, key]);
}

// ---------------------------------------------------------------------------
// Small UI building blocks
// ---------------------------------------------------------------------------
function Eyebrow({ children }) {
  return (
    <div className="text-[10px] uppercase font-mono2" style={{ color: C.gold, letterSpacing: "0.18em" }}>
      {children}
    </div>
  );
}

function ProgressBar({ pct, color = C.accent }) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 5, backgroundColor: C.lineSoft }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${clamped}%`, backgroundColor: color }} />
    </div>
  );
}

// The signature element: a thin "first light" gradient strip across the top
// edge of every card — orange dawn fading through gold into sky blue.
function TicketCard({ children, style }) {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, ...style }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.accent}, ${C.gold}, ${C.sky})` }} />
      <div className="p-4">{children}</div>
    </div>
  );
}

function Stepper({ value, onChange, min = 0 }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, (value || 0) - 1))}
        className="flex items-center justify-center rounded-sm"
        style={{ width: 24, height: 24, border: `1px solid ${C.line}`, color: C.ink }}>
        <Minus size={12} />
      </button>
      <span className="font-mono2 text-sm w-6 text-center" style={{ color: C.ink }}>{value || 0}</span>
      <button type="button" onClick={() => onChange((value || 0) + 1)}
        className="flex items-center justify-center rounded-sm"
        style={{ width: 24, height: 24, border: `1px solid ${C.line}`, color: C.ink }}>
        <Plus size={12} />
      </button>
    </div>
  );
}

function CheckRow({ icon: Icon, label, checked, onToggle, sub, right }) {
  return (
    <div className="flex items-start justify-between py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
      <button onClick={onToggle} className="flex items-start gap-3 flex-1 text-left">
        <span className="flex items-center justify-center rounded-sm shrink-0 mt-0.5"
          style={{ width: 18, height: 18, border: `1px solid ${checked ? C.accent : C.line}`, backgroundColor: checked ? C.accent : "transparent" }}>
          {checked && <Check size={12} color={C.onAccent} strokeWidth={3} />}
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <Icon size={14} style={{ color: C.gold }} />
            <span className="text-sm" style={{ color: checked ? C.ink : C.inkMuted }}>{label}</span>
          </span>
          {sub && <span className="text-xs" style={{ color: C.inkMuted }}>{sub}</span>}
        </span>
      </button>
      {right}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div className="text-xs font-mono2 mb-1.5" style={{ color: C.inkMuted, letterSpacing: "0.05em" }}>
      {children}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full text-sm rounded-sm px-3 py-2 bg-transparent resize-none"
      style={{ border: `1px solid ${C.line}`, color: C.ink }}
    />
  );
}

const TABS = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "notes", label: "Notes" },
  { id: "trends", label: "Trends" },
  { id: "driving", label: "Driving" },
];

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [today] = useState(() => new Date());
  const todayKey = dateKey(today);
  const weekKey = isoWeekKey(today);
  const monthKeyStr = monthKey(today);
  const yesterdayKey = dateKey(addDays(today, -1));

  const [activeTab, setActiveTab] = useState("today");
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [daily, setDaily] = useState(DEFAULT_DAILY);
  const [dailyReady, setDailyReady] = useState(false);
  const [weekly, setWeekly] = useState(DEFAULT_WEEKLY);
  const [weeklyReady, setWeeklyReady] = useState(false);
  const [monthly, setMonthly] = useState(DEFAULT_MONTHLY);
  const [monthlyReady, setMonthlyReady] = useState(false);
  const [driving, setDriving] = useState(DEFAULT_DRIVING);
  const [drivingReady, setDrivingReady] = useState(false);
  const [financial, setFinancial] = useState(DEFAULT_FINANCIAL);
  const [financialReady, setFinancialReady] = useState(false);
  const [streak, setStreak] = useState(DEFAULT_STREAK);
  const [weightHistory, setWeightHistory] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [notes, setNotes] = useState([]);

  const [financialRevealed, setFinancialRevealed] = useState(false);
  const [editingFinancial, setEditingFinancial] = useState(false);
  const [financialInput, setFinancialInput] = useState("");
  const [newSupplement, setNewSupplement] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  // ---- Load everything on mount ----
  useEffect(() => {
    (async () => {
      const [s, d, w, m, dr, f, wh, st, n] = await Promise.all([
        storageGet("settings"),
        storageGet(`daily:${todayKey}`),
        storageGet(`weekly:${weekKey}`),
        storageGet(`monthly:${monthKeyStr}`),
        storageGet("driving"),
        storageGet("financial"),
        storageGet("weight-history"),
        storageGet("diet-streak"),
        storageGet("notes"),
      ]);
      setSettings(s ? { ...DEFAULT_SETTINGS, ...s } : DEFAULT_SETTINGS);
      setDaily(d ? { ...DEFAULT_DAILY, ...d, prayer: { ...DEFAULT_DAILY.prayer, ...(d.prayer || {}) } } : DEFAULT_DAILY);
      setWeekly(w ? { ...DEFAULT_WEEKLY, ...w } : DEFAULT_WEEKLY);
      setMonthly(m ? { ...DEFAULT_MONTHLY, ...m } : DEFAULT_MONTHLY);
      setDriving(dr ? { ...DEFAULT_DRIVING, ...dr } : DEFAULT_DRIVING);
      setFinancial(f ? { ...DEFAULT_FINANCIAL, ...f } : DEFAULT_FINANCIAL);
      setWeightHistory(Array.isArray(wh) ? wh : []);
      setStreak(st ? { ...DEFAULT_STREAK, ...st } : DEFAULT_STREAK);
      setNotes(Array.isArray(n) ? n : []);

      setSettingsReady(true);
      setDailyReady(true);
      setWeeklyReady(true);
      setMonthlyReady(true);
      setDrivingReady(true);
      setFinancialReady(true);
      setLoading(false);

      const keys = await storageListKeys("weekly:");
      const recent = keys.slice().sort().slice(-8);
      const entries = await Promise.all(recent.map(async (k) => ({ key: k, data: await storageGet(k) })));
      setWeeklyTrend(entries.filter((e) => e.data));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Autosave ----
  useAutosave(settings, "settings", settingsReady);
  useAutosave(daily, `daily:${todayKey}`, dailyReady);
  useAutosave(weekly, `weekly:${weekKey}`, weeklyReady);
  useAutosave(monthly, `monthly:${monthKeyStr}`, monthlyReady);
  useAutosave(driving, "driving", drivingReady);
  useAutosave(financial, "financial", financialReady);

  // ---- Derived values ----
  const latestWeight = weightHistory.length ? weightHistory[weightHistory.length - 1].weight : null;
  const weightSpan = settings.weightStart - settings.weightTarget;
  const weightPct = latestWeight != null && weightSpan !== 0
    ? Math.max(0, Math.min(100, ((settings.weightStart - latestWeight) / weightSpan) * 100))
    : 0;
  const weeklyUsersTotal = (weekly.newUsersOnshore || 0) + (weekly.newUsersOffshore || 0);
  const usersPct = Math.max(0, Math.min(100, (weeklyUsersTotal / settings.usersWeeklyTarget) * 100));
  const linkedinPct = Math.max(0, Math.min(100, (monthly.linkedinPosts / settings.linkedinMonthlyTarget) * 100));
  const videosPct = Math.max(0, Math.min(100, (weekly.videos / settings.videoWeeklyTarget) * 100));
  const drivingBools = [driving.theoryBooked, driving.theoryPassed, driving.practicalBooked, driving.practicalPassed];
  const drivingPct = (drivingBools.filter(Boolean).length / drivingBools.length) * 100;

  // ---- Handlers ----
  function toggleDiet() {
    const newVal = !daily.dietClean;
    setDaily((prev) => ({ ...prev, dietClean: newVal }));
    if (newVal && streak.lastDate !== todayKey) {
      const next = streak.lastDate === yesterdayKey
        ? { count: streak.count + 1, lastDate: todayKey }
        : { count: 1, lastDate: todayKey };
      setStreak(next);
      storageSet("diet-streak", next);
    } else if (!newVal && streak.lastDate === todayKey) {
      const next = { count: Math.max(0, streak.count - 1), lastDate: null };
      setStreak(next);
      storageSet("diet-streak", next);
    }
  }

  function toggleSupplement(name) {
    setDaily((prev) => {
      const has = prev.supplementsChecked.includes(name);
      return {
        ...prev,
        supplementsChecked: has
          ? prev.supplementsChecked.filter((n) => n !== name)
          : [...prev.supplementsChecked, name],
      };
    });
  }

  function addSupplement() {
    const name = newSupplement.trim();
    if (!name || settings.supplements.includes(name)) { setNewSupplement(""); return; }
    setSettings((prev) => ({ ...prev, supplements: [...prev.supplements, name] }));
    setNewSupplement("");
  }

  function removeSupplement(name) {
    setSettings((prev) => ({ ...prev, supplements: prev.supplements.filter((n) => n !== name) }));
    setDaily((prev) => ({ ...prev, supplementsChecked: prev.supplementsChecked.filter((n) => n !== name) }));
  }

  function togglePrayer(name) {
    setDaily((prev) => ({ ...prev, prayer: { ...prev.prayer, [name]: !prev.prayer[name] } }));
  }

  function submitWeight() {
    const val = parseFloat(weightInput);
    if (Number.isNaN(val) || val <= 0) { setShowWeightInput(false); setWeightInput(""); return; }
    setWeightHistory((prev) => {
      const without = prev.filter((e) => e.date !== todayKey);
      const next = [...without, { date: todayKey, weight: val }].sort((a, b) => a.date.localeCompare(b.date));
      storageSet("weight-history", next);
      return next;
    });
    setWeightInput("");
    setShowWeightInput(false);
  }

  function submitFinancial() {
    const val = parseFloat(financialInput);
    setFinancial({ balance: Number.isNaN(val) ? financial.balance : val });
    setFinancialInput("");
    setEditingFinancial(false);
  }

  function addNote() {
    const text = noteDraft.trim();
    if (!text) return;
    const entry = { id: Date.now().toString(), date: new Date().toISOString(), text };
    setNotes((prev) => {
      const next = [entry, ...prev];
      storageSet("notes", next);
      return next;
    });
    setNoteDraft("");
  }

  function deleteNote(id) {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      storageSet("notes", next);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg, color: C.inkMuted }}>
        <span className="text-xs font-mono2 uppercase" style={{ letterSpacing: "0.2em" }}>Loading dispatch…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: C.bg, color: C.ink, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-display { font-family: 'Sora', system-ui, sans-serif; }
        .font-mono2 { font-family: 'IBM Plex Mono', monospace; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Eyebrow>Dispatch — {formatDispatchDate(today)} — Sydney</Eyebrow>
        <h1 className="font-display text-3xl mt-1" style={{ color: C.ink, letterSpacing: "0.01em" }}>
          DAILY LOG
        </h1>
      </div>

      {/* Top metrics row */}
      <div className="px-4 mt-4 grid grid-cols-1 gap-3">
        {/* Financial */}
        <TicketCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={14} style={{ color: C.gold }} />
              <Eyebrow>Financial</Eyebrow>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditingFinancial((v) => !v)} aria-label="Edit balance">
                <Pencil size={13} style={{ color: C.inkMuted }} />
              </button>
              <button onClick={() => setFinancialRevealed((v) => !v)} aria-label="Toggle visibility">
                {financialRevealed ? <EyeOff size={15} style={{ color: C.inkMuted }} /> : <Eye size={15} style={{ color: C.inkMuted }} />}
              </button>
            </div>
          </div>
          {editingFinancial ? (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="number"
                autoFocus
                placeholder={financial.balance != null ? String(financial.balance) : "Enter balance"}
                value={financialInput}
                onChange={(e) => setFinancialInput(e.target.value)}
                className="flex-1 text-lg font-mono2 rounded-sm px-2 py-1 bg-transparent"
                style={{ border: `1px solid ${C.line}`, color: C.ink }}
              />
              <button onClick={submitFinancial} className="text-xs font-mono2 px-3 py-2 rounded-sm uppercase"
                style={{ backgroundColor: C.accent, color: C.onAccent }}>
                Save
              </button>
            </div>
          ) : (
            <div className="font-display text-3xl mt-3" style={{ color: C.ink }}>
              {financial.balance == null
                ? "— —"
                : financialRevealed
                  ? `$${financial.balance.toLocaleString()} AUD`
                  : "• • • • • •"}
            </div>
          )}
          <div className="text-xs font-mono2 mt-1" style={{ color: C.inkMuted }}>
            {financial.balance != null ? "balance · masked by default" : "no balance set yet"}
          </div>
        </TicketCard>

        {/* Relocify users + Weight side by side */}
        <div className="grid grid-cols-2 gap-3">
          <TicketCard>
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color: C.gold }} />
              <Eyebrow>Users · wk</Eyebrow>
            </div>
            <div className="font-display text-2xl mt-2">{weeklyUsersTotal}<span className="text-sm font-mono2" style={{ color: C.inkMuted }}> / {settings.usersWeeklyTarget}</span></div>
            <div className="mt-2"><ProgressBar pct={usersPct} color={C.accent2} /></div>
            <div className="text-xs font-mono2 mt-1" style={{ color: C.inkMuted }}>{Math.round(usersPct)}% of target</div>
          </TicketCard>

          <TicketCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale size={14} style={{ color: C.gold }} />
                <Eyebrow>Weight</Eyebrow>
              </div>
              <button onClick={() => setShowWeightInput((v) => !v)} aria-label="Log weight">
                <Plus size={14} style={{ color: C.inkMuted }} />
              </button>
            </div>
            {showWeightInput ? (
              <div className="flex items-center gap-1.5 mt-2">
                <input
                  type="number"
                  autoFocus
                  placeholder="kg"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-16 text-sm font-mono2 rounded-sm px-2 py-1 bg-transparent"
                  style={{ border: `1px solid ${C.line}`, color: C.ink }}
                />
                <button onClick={submitWeight} className="text-xs font-mono2 px-2 py-1 rounded-sm uppercase"
                  style={{ backgroundColor: C.accent, color: C.onAccent }}>Log</button>
              </div>
            ) : (
              <>
                <div className="font-display text-2xl mt-2">{latestWeight ?? "—"}<span className="text-sm font-mono2" style={{ color: C.inkMuted }}> / {settings.weightTarget}kg</span></div>
                <div className="mt-2"><ProgressBar pct={weightPct} color={C.accent} /></div>
                <div className="text-xs font-mono2 mt-1" style={{ color: C.inkMuted }}>{Math.round(weightPct)}% to target</div>
              </>
            )}
          </TicketCard>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6 flex gap-4 overflow-x-auto" style={{ borderBottom: `1px solid ${C.line}` }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="pb-2 text-xs font-mono2 uppercase whitespace-nowrap"
            style={{
              letterSpacing: "0.1em",
              color: activeTab === t.id ? C.ink : C.inkMuted,
              borderBottom: activeTab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TODAY */}
      {activeTab === "today" && (
        <div className="px-4 mt-4">
          <TicketCard>
            <Eyebrow>Body</Eyebrow>
            <div className="mt-1">
              <CheckRow
                icon={Dumbbell} label="Trained today" checked={daily.gymTrained}
                onToggle={() => setDaily((p) => ({ ...p, gymTrained: !p.gymTrained }))}
                right={daily.gymTrained && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setDaily((p) => ({ ...p, gymIntensity: n }))}
                        style={{
                          width: 18, height: 18, borderRadius: 3,
                          border: `1px solid ${C.line}`,
                          backgroundColor: daily.gymIntensity >= n ? C.gold : "transparent",
                        }}
                      />
                    ))}
                  </div>
                )}
              />
              <CheckRow
                icon={Apple} label="Clean eating day" checked={daily.dietClean}
                onToggle={toggleDiet}
                sub={streak.count > 0 ? `${streak.count} day streak` : undefined}
              />
            </div>

            <div className="mt-4">
              <Eyebrow>Supplements</Eyebrow>
              <div className="mt-1">
                {settings.supplements.length === 0 && (
                  <div className="text-xs py-2" style={{ color: C.inkMuted }}>No supplements added yet.</div>
                )}
                {settings.supplements.map((name) => (
                  <CheckRow
                    key={name} icon={Pill} label={name}
                    checked={daily.supplementsChecked.includes(name)}
                    onToggle={() => toggleSupplement(name)}
                    right={<button onClick={() => removeSupplement(name)}><X size={13} style={{ color: C.inkMuted }} /></button>}
                  />
                ))}
                <div className="flex items-center gap-2 pt-3">
                  <input
                    value={newSupplement}
                    onChange={(e) => setNewSupplement(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSupplement()}
                    placeholder="Add supplement"
                    className="flex-1 text-sm rounded-sm px-2 py-1.5 bg-transparent"
                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
                  />
                  <button onClick={addSupplement} className="flex items-center justify-center rounded-sm" style={{ width: 30, height: 30, border: `1px solid ${C.line}` }}>
                    <Plus size={14} style={{ color: C.ink }} />
                  </button>
                </div>
              </div>
            </div>
          </TicketCard>

          <TicketCard style={{ marginTop: 12 }}>
            <Eyebrow>Soul</Eyebrow>
            <div className="mt-1">
              <div className="flex items-center gap-2 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <Hand size={14} style={{ color: C.gold }} />
                <span className="text-sm mr-2" style={{ color: C.ink }}>Prayer</span>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.keys(daily.prayer).map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePrayer(p)}
                      className="text-[10px] font-mono2 uppercase rounded-sm px-2 py-1"
                      style={{
                        border: `1px solid ${daily.prayer[p] ? C.accent : C.line}`,
                        backgroundColor: daily.prayer[p] ? C.accent : "transparent",
                        color: daily.prayer[p] ? C.onAccent : C.inkMuted,
                      }}
                    >
                      {p.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <CheckRow
                icon={Moon} label="Meditation" checked={daily.meditationDone}
                onToggle={() => setDaily((p) => ({ ...p, meditationDone: !p.meditationDone }))}
                right={daily.meditationDone && (
                  <Stepper value={daily.meditationMinutes} onChange={(v) => setDaily((p) => ({ ...p, meditationMinutes: v }))} />
                )}
              />

              <div className="pt-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={14} style={{ color: C.gold }} />
                  <span className="text-sm" style={{ color: C.ink }}>Field note — one raw, honest line</span>
                </div>
                <TextArea
                  value={daily.wisdomNote}
                  onChange={(v) => setDaily((p) => ({ ...p, wisdomNote: v }))}
                  placeholder="What's true today, unfiltered..."
                />
              </div>
            </div>
          </TicketCard>

          <TicketCard style={{ marginTop: 12 }}>
            <Eyebrow>Craft</Eyebrow>
            <div className="mt-1">
              <div className="flex items-center gap-2 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <BookOpen size={14} style={{ color: C.gold }} />
                <span className="text-sm mr-auto" style={{ color: C.ink }}>Reading</span>
                <div className="flex gap-1">
                  {["pm", "general"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setDaily((p) => ({ ...p, readingType: t }))}
                      className="text-[10px] font-mono2 uppercase rounded-sm px-2 py-1"
                      style={{
                        border: `1px solid ${daily.readingType === t ? C.accent2 : C.line}`,
                        color: daily.readingType === t ? C.accent2 : C.inkMuted,
                      }}
                    >
                      {t === "pm" ? "Product" : "General"}
                    </button>
                  ))}
                </div>
              </div>
              <CheckRow
                icon={BookOpen} label="Read today" checked={daily.readingDone}
                onToggle={() => setDaily((p) => ({ ...p, readingDone: !p.readingDone }))}
              />
              {daily.readingDone && (
                <input
                  value={daily.readingWhat}
                  onChange={(e) => setDaily((p) => ({ ...p, readingWhat: e.target.value }))}
                  placeholder="What did you read?"
                  className="w-full text-sm rounded-sm px-3 py-2 bg-transparent mt-2"
                  style={{ border: `1px solid ${C.line}`, color: C.ink }}
                />
              )}
              <CheckRow
                icon={Mic} label="Deep voice practice" checked={daily.deepVoicePracticed}
                onToggle={() => setDaily((p) => ({ ...p, deepVoicePracticed: !p.deepVoicePracticed }))}
              />
            </div>
          </TicketCard>
        </div>
      )}

      {/* WEEK */}
      {activeTab === "week" && (
        <div className="px-4 mt-4">
          <TicketCard>
            <Eyebrow>Social</Eyebrow>
            <div className="mt-2">
              <FieldLabel>Who/what this week</FieldLabel>
              <TextArea value={weekly.social} onChange={(v) => setWeekly((p) => ({ ...p, social: v }))} placeholder="Connections, calls, time with people..." rows={3} />
            </div>
          </TicketCard>

          <TicketCard style={{ marginTop: 12 }}>
            <Eyebrow>Relocify</Eyebrow>
            <div className="mt-3 space-y-4">
              <div>
                <FieldLabel>New users — onshore</FieldLabel>
                <Stepper value={weekly.newUsersOnshore} onChange={(v) => setWeekly((p) => ({ ...p, newUsersOnshore: v }))} />
              </div>
              <div>
                <FieldLabel>New users — offshore</FieldLabel>
                <Stepper value={weekly.newUsersOffshore} onChange={(v) => setWeekly((p) => ({ ...p, newUsersOffshore: v }))} />
              </div>
              <div className="text-xs font-mono2" style={{ color: C.inkMuted }}>
                Total: {weeklyUsersTotal} / {settings.usersWeeklyTarget} ({Math.round(usersPct)}%)
              </div>
              <ProgressBar pct={usersPct} color={C.accent2} />

              <div className="pt-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <div className="flex items-center gap-2 mt-3 mb-1">
                  <Video size={14} style={{ color: C.gold }} />
                  <FieldLabel>Videos this week</FieldLabel>
                </div>
                <Stepper value={weekly.videos} onChange={(v) => setWeekly((p) => ({ ...p, videos: v }))} />
                <div className="text-xs font-mono2 mt-1" style={{ color: C.inkMuted }}>{weekly.videos} / {settings.videoWeeklyTarget} ({Math.round(videosPct)}%)</div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={14} style={{ color: C.gold }} />
                  <FieldLabel>Agent contacts made</FieldLabel>
                </div>
                <Stepper value={weekly.agentContacts} onChange={(v) => setWeekly((p) => ({ ...p, agentContacts: v }))} />
              </div>

              <CheckRow
                icon={ListChecks} label="Indexing work done" checked={weekly.indexingDone}
                onToggle={() => setWeekly((p) => ({ ...p, indexingDone: !p.indexingDone }))}
              />

              <div className="pt-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <div className="flex items-center gap-2 mt-3 mb-1">
                  <Megaphone size={14} style={{ color: C.gold }} />
                  <FieldLabel>LinkedIn posts this month</FieldLabel>
                </div>
                <Stepper value={monthly.linkedinPosts} onChange={(v) => setMonthly((p) => ({ ...p, linkedinPosts: v }))} />
                <div className="text-xs font-mono2 mt-1" style={{ color: C.inkMuted }}>{monthly.linkedinPosts} / {settings.linkedinMonthlyTarget} ({Math.round(linkedinPct)}%)</div>
              </div>
            </div>
          </TicketCard>

          <TicketCard style={{ marginTop: 12 }}>
            <div className="flex items-center gap-2">
              <Scale size={14} style={{ color: C.gold }} />
              <Eyebrow>Weight check-in</Eyebrow>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number" placeholder="kg" value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-20 text-sm font-mono2 rounded-sm px-2 py-1.5 bg-transparent"
                style={{ border: `1px solid ${C.line}`, color: C.ink }}
              />
              <button onClick={submitWeight} className="text-xs font-mono2 px-3 py-1.5 rounded-sm uppercase"
                style={{ backgroundColor: C.accent, color: C.onAccent }}>Log weight</button>
              {latestWeight != null && <span className="text-xs font-mono2 ml-auto" style={{ color: C.inkMuted }}>last: {latestWeight}kg</span>}
            </div>
          </TicketCard>
        </div>
      )}

      {/* NOTES & WRITING */}
      {activeTab === "notes" && (
        <div className="px-4 mt-4">
          <TicketCard>
            <Eyebrow>Write</Eyebrow>
            <div className="mt-2">
              <TextArea
                value={noteDraft}
                onChange={setNoteDraft}
                placeholder="Pay attention without an agenda. Write what's actually true..."
                rows={4}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={addNote}
                  disabled={!noteDraft.trim()}
                  className="text-xs font-mono2 px-4 py-2 rounded-sm uppercase"
                  style={{ backgroundColor: C.accent, color: C.onAccent, opacity: noteDraft.trim() ? 1 : 0.4 }}
                >
                  Save entry
                </button>
              </div>
            </div>
          </TicketCard>

          <div className="mt-4 space-y-3">
            {notes.length === 0 && (
              <div className="text-xs text-center py-6" style={{ color: C.inkMuted }}>No entries yet. Start with one true sentence.</div>
            )}
            {notes.map((n) => (
              <TicketCard key={n.id}>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-mono2" style={{ color: C.inkMuted }}>{formatNoteDate(n.date)}</span>
                  <button onClick={() => deleteNote(n.id)} aria-label="Delete entry">
                    <X size={13} style={{ color: C.inkMuted }} />
                  </button>
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: C.ink, lineHeight: 1.6 }}>{n.text}</p>
              </TicketCard>
            ))}
          </div>
        </div>
      )}

      {/* TRENDS */}
      {activeTab === "trends" && (
        <div className="px-4 mt-4">
          <TicketCard>
            <Eyebrow>Weight over time</Eyebrow>
            <div style={{ height: 160, marginTop: 8 }}>
              {weightHistory.length < 2 ? (
                <div className="h-full flex items-center justify-center text-xs" style={{ color: C.inkMuted }}>Log weight a couple more times to see a trend.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightHistory.map((w) => ({ label: w.date.slice(5), weight: w.weight }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="label" stroke={C.inkMuted} fontSize={10} />
                    <YAxis stroke={C.inkMuted} fontSize={10} domain={["dataMin - 1", "dataMax + 1"]} />
                    <Tooltip contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, fontSize: 12 }} />
                    <ReferenceLine y={settings.weightTarget} stroke={C.gold} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="weight" stroke={C.accent} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </TicketCard>

          <TicketCard style={{ marginTop: 12 }}>
            <Eyebrow>New users per week</Eyebrow>
            <div style={{ height: 160, marginTop: 8 }}>
              {weeklyTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs" style={{ color: C.inkMuted }}>No weekly history yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend.map((e) => ({
                    label: e.key.replace("weekly:", ""),
                    total: (e.data.newUsersOnshore || 0) + (e.data.newUsersOffshore || 0),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="label" stroke={C.inkMuted} fontSize={9} />
                    <YAxis stroke={C.inkMuted} fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, fontSize: 12 }} />
                    <ReferenceLine y={settings.usersWeeklyTarget} stroke={C.gold} strokeDasharray="4 4" />
                    <Bar dataKey="total" fill={C.accent2} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TicketCard>
        </div>
      )}

      {/* DRIVING */}
      {activeTab === "driving" && (
        <div className="px-4 mt-4">
          <TicketCard>
            <div className="flex items-center gap-2">
              <Car size={14} style={{ color: C.gold }} />
              <Eyebrow>Driving license</Eyebrow>
            </div>
            <div className="mt-3">
              <ProgressBar pct={drivingPct} color={C.accent} />
            </div>
            <div className="text-xs font-mono2 mt-1 mb-3" style={{ color: C.inkMuted }}>{Math.round(drivingPct)}% complete</div>

            {[
              { n: "01", key: "theoryBooked", label: "Book theory test" },
              { n: "02", key: "theoryPassed", label: "Pass theory test" },
            ].map((step) => (
              <div key={step.key} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <span className="font-mono2 text-xs" style={{ color: C.gold }}>{step.n}</span>
                <button onClick={() => setDriving((p) => ({ ...p, [step.key]: !p[step.key] }))} className="flex items-center gap-2 flex-1 text-left">
                  <span className="flex items-center justify-center rounded-sm shrink-0"
                    style={{ width: 18, height: 18, border: `1px solid ${driving[step.key] ? C.accent : C.line}`, backgroundColor: driving[step.key] ? C.accent : "transparent" }}>
                    {driving[step.key] && <Check size={12} color={C.onAccent} strokeWidth={3} />}
                  </span>
                  <span className="text-sm" style={{ color: driving[step.key] ? C.ink : C.inkMuted }}>{step.label}</span>
                </button>
              </div>
            ))}

            <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <span className="font-mono2 text-xs" style={{ color: C.gold }}>03</span>
              <span className="text-sm flex-1" style={{ color: C.ink }}>Practice hours logged</span>
              <Stepper value={driving.hoursLogged} onChange={(v) => setDriving((p) => ({ ...p, hoursLogged: v }))} />
            </div>

            {[
              { n: "04", key: "practicalBooked", label: "Book practical test" },
              { n: "05", key: "practicalPassed", label: "Pass practical test" },
            ].map((step) => (
              <div key={step.key} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <span className="font-mono2 text-xs" style={{ color: C.gold }}>{step.n}</span>
                <button onClick={() => setDriving((p) => ({ ...p, [step.key]: !p[step.key] }))} className="flex items-center gap-2 flex-1 text-left">
                  <span className="flex items-center justify-center rounded-sm shrink-0"
                    style={{ width: 18, height: 18, border: `1px solid ${driving[step.key] ? C.accent : C.line}`, backgroundColor: driving[step.key] ? C.accent : "transparent" }}>
                    {driving[step.key] && <Check size={12} color={C.onAccent} strokeWidth={3} />}
                  </span>
                  <span className="text-sm" style={{ color: driving[step.key] ? C.ink : C.inkMuted }}>{step.label}</span>
                </button>
              </div>
            ))}
          </TicketCard>
        </div>
      )}

      <div className="px-4 mt-8 text-center">
        <span className="text-[10px] font-mono2 uppercase" style={{ color: C.inkMuted, letterSpacing: "0.15em" }}>
          Saved automatically · private to this device
        </span>
      </div>
    </div>
  );
}
