'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, HelpCircle, X, Check, ChevronDown } from 'lucide-react';
import { saveProfile, setOnboardingComplete } from '@/lib/storage';
import { calcDailyGoal } from '@/lib/calculations';
import DrumRoller from '@/components/ui/DrumRoller';

type Gender = 'male' | 'female';
type Unit = 'oz' | 'ml';

const AGES = Array.from({ length: 88 }, (_, i) => i + 13); // 13–100
const FEET = [3, 4, 5, 6, 7];
const INCHES = Array.from({ length: 12 }, (_, i) => i); // 0–11
const WEIGHTS = Array.from({ length: 321 }, (_, i) => i + 80); // 80–400 lbs

const ACTIVITY_LEVELS = [
  { score: 1, label: 'Sedentary', desc: 'Little or no exercise' },
  { score: 2, label: 'Light', desc: 'Exercise 1–3 times/week' },
  { score: 3, label: 'Moderate', desc: 'Exercise 4–5 times/week' },
  { score: 4, label: 'Active', desc: 'Daily exercise or intense 3–4×/week' },
  { score: 5, label: 'Very Active', desc: 'Intense exercise 6–7 times/week' },
  { score: 6, label: 'Extra Active', desc: 'Very intense daily or physical job' },
];

// Colors bottom→top (index 0 = level 1 = green at bottom)
const THERMO_COLORS = ['#22C55E', '#84CC16', '#FBBF24', '#F97316', '#EF4444', '#DC2626'];

const SUPPLEMENTS = [
  { id: 'creatine', label: 'Creatine' },
  { id: 'fish_oil', label: 'Fish Oil' },
  { id: 'multivitamin', label: 'Multivitamin' },
];

const BOTTLE_PRESETS = [24, 32, 40];

const STEP_TITLES = ['About You', 'Your Stats', 'Activity', 'Supplements', 'Your Bottle'];
const STEP_SUBTITLES = [
  "Let's personalize your experience.",
  'Used to calculate your water goal.',
  'How active are you?',
  'Track what you take daily.',
  'Configure your go-to vessel.',
];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showActivityInfo, setShowActivityInfo] = useState(false);

  // Step 0 – Gender
  const [gender, setGender] = useState<Gender>('male');

  // Step 1 – Stats
  const [age, setAge] = useState<number>(21);
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(9);
  const [weight, setWeight] = useState<number>(165);

  // Step 2 – Activity
  const [activityLevel, setActivityLevel] = useState<number>(2);

  // Step 3 – Supplements
  const [supplements, setSupplements] = useState<string[]>([]);

  // Step 4 – Bottle
  const [bottlePreset, setBottlePreset] = useState<number>(32);
  const [customBottle, setCustomBottle] = useState<string>('');
  const [unit, setUnit] = useState<Unit>('oz');

  // When gender changes, update height/weight defaults
  useEffect(() => {
    if (gender === 'female') {
      setHeightFt(5);
      setHeightIn(3);
      setWeight(125);
    } else {
      setHeightFt(5);
      setHeightIn(9);
      setWeight(165);
    }
  }, [gender]);

  const bottleSizeOz = customBottle ? parseFloat(customBottle) : bottlePreset;

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      saveProfile({
        age,
        heightFt,
        heightIn,
        weight,
        gender,
        activityLevel,
        supplements,
        bottleSize: bottleSizeOz || 32,
        unit,
        dailyGoal: calcDailyGoal(weight, activityLevel, supplements, age),
      });
      setOnboardingComplete();
      router.replace('/hydration');
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const canProceed = () => true;

  return (
    <div
      className="flex flex-col h-svh max-w-[480px] mx-auto px-6"
      style={{ background: '#0f172a' }}
    >
      {/* Header */}
      <div className="pt-14 pb-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>
          {STEP_TITLES[step]}
        </h1>
        <p className="text-sm mt-1 text-center" style={{ color: '#64748b' }}>
          {STEP_SUBTITLES[step]}
        </p>

        {/* Step dots */}
        <div className="flex gap-2 mt-5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '24px' : '8px',
                background: i < step ? '#0096FF' : i === step ? '#0096FF' : '#1e293b',
                opacity: i < step ? 0.4 : 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {step === 0 && <StepGender gender={gender} onChange={setGender} />}
            {step === 1 && (
              <StepStats
                age={age}
                heightFt={heightFt}
                heightIn={heightIn}
                weight={weight}
                onAgeChange={setAge}
                onHeightFtChange={setHeightFt}
                onHeightInChange={setHeightIn}
                onWeightChange={(v) => setWeight(v)}
              />
            )}
            {step === 2 && (
              <StepActivity
                level={activityLevel}
                onChange={setActivityLevel}
                onInfoOpen={() => setShowActivityInfo(true)}
              />
            )}
            {step === 3 && (
              <StepSupplements supplements={supplements} onChange={setSupplements} />
            )}
            {step === 4 && (
              <StepBottle
                preset={bottlePreset}
                onPresetChange={(p) => { setBottlePreset(p); setCustomBottle(''); }}
                custom={customBottle}
                onCustomChange={setCustomBottle}
                unit={unit}
                onUnitChange={setUnit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="pb-12 pt-4 flex gap-3">
        {step > 0 && (
          <motion.button
            onClick={handleBack}
            whileTap={{ scale: 0.96 }}
            className="px-6 py-4 rounded-2xl font-semibold"
            style={{ background: '#1e293b', color: '#94a3b8' }}
          >
            Back
          </motion.button>
        )}
        <motion.button
          onClick={handleNext}
          whileTap={{ scale: 0.96 }}
          disabled={!canProceed()}
          className="flex-1 py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
          style={{
            background: canProceed() ? '#0096FF' : '#1e293b',
            color: canProceed() ? 'white' : '#475569',
          }}
        >
          {step === TOTAL_STEPS - 1 ? 'Get Started' : 'Next'}
          <ChevronRight size={18} strokeWidth={2} />
        </motion.button>
      </div>

      {/* Activity info modal */}
      <AnimatePresence>
        {showActivityInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowActivityInfo(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-[480px] rounded-t-3xl px-6 pt-6 pb-10"
              style={{ background: '#1e293b' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>
                  Activity Levels
                </h2>
                <button
                  onClick={() => setShowActivityInfo(false)}
                  className="p-1 rounded-full"
                  style={{ color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {ACTIVITY_LEVELS.map((lvl) => (
                  <div key={lvl.score} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                      style={{
                        background: THERMO_COLORS[lvl.score - 1],
                        color: '#0f172a',
                      }}
                    >
                      {lvl.score}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                        {lvl.label}
                      </p>
                      <p className="text-xs" style={{ color: '#64748b' }}>
                        {lvl.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 0: Gender ───────────────────────────────────────────────────────────
function StepGender({ gender, onChange }: { gender: Gender; onChange: (g: Gender) => void }) {
  const options: { value: Gender; emoji: string; label: string }[] = [
    { value: 'male', emoji: '♂', label: 'Male' },
    { value: 'female', emoji: '♀', label: 'Female' },
  ];
  return (
    <div className="flex flex-col gap-3 pb-4">
      {options.map((opt) => (
        <motion.button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 rounded-2xl flex items-center gap-4 px-6"
          style={{
            background: gender === opt.value ? 'rgba(0,150,255,0.12)' : '#1e293b',
            border: `2px solid ${gender === opt.value ? '#0096FF' : 'transparent'}`,
          }}
        >
          <span className="text-2xl">{opt.emoji}</span>
          <span
            className="text-lg font-semibold"
            style={{ color: gender === opt.value ? '#0096FF' : '#f1f5f9' }}
          >
            {opt.label}
          </span>
          {gender === opt.value && (
            <div
              className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#0096FF' }}
            >
              <Check size={12} color="white" strokeWidth={3} />
            </div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

// ─── Step 1: Physical Stats with collapsible pickers ─────────────────────────
function StepStats({
  age, heightFt, heightIn, weight,
  onAgeChange, onHeightFtChange, onHeightInChange, onWeightChange,
}: {
  age: number; heightFt: number; heightIn: number; weight: number;
  onAgeChange: (v: number) => void;
  onHeightFtChange: (v: number) => void;
  onHeightInChange: (v: number) => void;
  onWeightChange: (v: number) => void;
}) {
  const [activeField, setActiveField] = useState<'age' | 'height' | 'weight' | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside → collapse
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (field: 'age' | 'height' | 'weight') => {
    setActiveField((prev) => (prev === field ? null : field));
  };

  return (
    <div ref={wrapperRef} className="flex flex-col gap-3 pb-4">
      {/* Age row */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#1e293b' }}
      >
        {/* Header tap target */}
        <button
          onClick={() => toggle('age')}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
            Age
          </span>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold" style={{ color: '#f1f5f9' }}>
              {age} yrs
            </span>
            <motion.div
              animate={{ rotate: activeField === 'age' ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} color="#475569" />
            </motion.div>
          </div>
        </button>

        {/* Expanded picker */}
        <AnimatePresence>
          {activeField === 'age' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 pb-3">
                <DrumRoller items={AGES} value={age} onChange={(v) => onAgeChange(v as number)} />
              </div>
              <div className="flex justify-end px-4 pb-3">
                <button
                  onClick={() => setActiveField(null)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: '#0096FF', color: 'white' }}
                >
                  <Check size={14} strokeWidth={3} /> Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Height row */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#1e293b' }}
      >
        <button
          onClick={() => toggle('height')}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
            Height
          </span>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold" style={{ color: '#f1f5f9' }}>
              {heightFt} ft {heightIn} in
            </span>
            <motion.div
              animate={{ rotate: activeField === 'height' ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} color="#475569" />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {activeField === 'height' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="flex gap-3 px-4 pb-3">
                <div className="flex-1 rounded-xl overflow-hidden" style={{ background: '#263347' }}>
                  <DrumRoller
                    items={FEET}
                    value={heightFt}
                    onChange={(v) => onHeightFtChange(v as number)}
                    label="ft"
                  />
                </div>
                <div className="flex-1 rounded-xl overflow-hidden" style={{ background: '#263347' }}>
                  <DrumRoller
                    items={INCHES}
                    value={heightIn}
                    onChange={(v) => onHeightInChange(v as number)}
                    label="in"
                  />
                </div>
              </div>
              <div className="flex justify-end px-4 pb-3">
                <button
                  onClick={() => setActiveField(null)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: '#0096FF', color: 'white' }}
                >
                  <Check size={14} strokeWidth={3} /> Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Weight row */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
        <button
          onClick={() => toggle('weight')}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
            Weight
          </span>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold" style={{ color: '#f1f5f9' }}>
              {weight} lbs
            </span>
            <motion.div
              animate={{ rotate: activeField === 'weight' ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} color="#475569" />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {activeField === 'weight' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 pb-3">
                <DrumRoller items={WEIGHTS} value={weight} onChange={(v) => onWeightChange(v as number)} />
              </div>
              <div className="flex justify-end px-4 pb-3">
                <button
                  onClick={() => setActiveField(null)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: '#0096FF', color: 'white' }}
                >
                  <Check size={14} strokeWidth={3} /> Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step 2: Activity Level with pill thermometer ─────────────────────────────
const THERMO_HEIGHT = 240;
const SEGMENT_HEIGHT = THERMO_HEIGHT / 6;

function StepActivity({
  level, onChange, onInfoOpen,
}: {
  level: number; onChange: (v: number) => void; onInfoOpen: () => void;
}) {
  // Arrow Y position: level 1 = bottom segment center, level 6 = top segment center
  // Segment 1 (green) is at the bottom, segment 6 (red) at top
  // Bottom of thermometer = THERMO_HEIGHT, top = 0
  // Center of segment for level L (1-based): bottom edge - (L - 0.5) * SEGMENT_HEIGHT
  const arrowY = THERMO_HEIGHT - (level - 0.5) * SEGMENT_HEIGHT;

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Info card */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{ background: '#1e293b' }}
      >
        <div>
          <p className="text-lg font-bold" style={{ color: '#f1f5f9' }}>
            {ACTIVITY_LEVELS[level - 1].label}
          </p>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            {ACTIVITY_LEVELS[level - 1].desc}
          </p>
        </div>
        <button
          onClick={onInfoOpen}
          className="p-2 rounded-full ml-3 flex-shrink-0"
          style={{ color: '#475569' }}
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* Thermometer + buttons */}
      <div className="flex gap-4 items-start">
        {/* Thermometer pill */}
        <div style={{ position: 'relative', width: 48, flexShrink: 0 }}>
          {/* Pill container */}
          <div
            style={{
              width: 28,
              height: THERMO_HEIGHT,
              borderRadius: 999,
              overflow: 'hidden',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              border: '2px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Segments from top (red) to bottom (green) */}
            {[...THERMO_COLORS].reverse().map((color, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: color,
                  opacity: level >= 6 - i ? 1 : 0.25,
                  transition: 'opacity 0.3s',
                }}
              />
            ))}
          </div>

          {/* Arrow pointer */}
          <motion.div
            animate={{ y: arrowY - 8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            style={{
              position: 'absolute',
              left: '100%',
              top: 0,
              marginLeft: 2,
            }}
          >
            {/* Triangle pointing left */}
            <svg width={14} height={16} viewBox="0 0 14 16">
              <polygon
                points="14,0 14,16 0,8"
                fill={THERMO_COLORS[level - 1]}
              />
            </svg>
          </motion.div>
        </div>

        {/* Level buttons */}
        <div className="flex-1 flex flex-col gap-2">
          {[...ACTIVITY_LEVELS].reverse().map((lvl) => (
            <motion.button
              key={lvl.score}
              onClick={() => onChange(lvl.score)}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 px-4 rounded-xl text-left"
              style={{
                background:
                  level === lvl.score
                    ? `rgba(${hexToRgb(THERMO_COLORS[lvl.score - 1])}, 0.15)`
                    : '#1e293b',
                border: `1.5px solid ${level === lvl.score ? THERMO_COLORS[lvl.score - 1] : 'transparent'}`,
              }}
            >
              <span
                className="text-sm font-semibold"
                style={{
                  color: level === lvl.score ? THERMO_COLORS[lvl.score - 1] : '#94a3b8',
                }}
              >
                {lvl.score}. {lvl.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// ─── Step 3: Supplements ──────────────────────────────────────────────────────
function StepSupplements({
  supplements, onChange,
}: {
  supplements: string[]; onChange: (v: string[]) => void;
}) {
  const allSelected = SUPPLEMENTS.every((s) => supplements.includes(s.id));

  const toggle = (id: string) => {
    if (supplements.includes(id)) {
      onChange(supplements.filter((s) => s !== id));
    } else {
      onChange([...supplements, id]);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-4">
      <motion.button
        onClick={() => onChange(allSelected ? [] : SUPPLEMENTS.map((s) => s.id))}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{
          background: allSelected ? 'rgba(0,150,255,0.12)' : '#1e293b',
          color: allSelected ? '#0096FF' : '#94a3b8',
          border: `1.5px solid ${allSelected ? '#0096FF' : 'transparent'}`,
        }}
      >
        {allSelected ? 'Deselect All' : 'Select All'}
      </motion.button>

      {SUPPLEMENTS.map((supp) => {
        const selected = supplements.includes(supp.id);
        return (
          <motion.button
            key={supp.id}
            onClick={() => toggle(supp.id)}
            whileTap={{ scale: 0.97 }}
            className="w-full py-5 px-5 rounded-2xl flex items-center gap-4"
            style={{
              background: selected ? 'rgba(0,150,255,0.1)' : '#1e293b',
              border: `2px solid ${selected ? '#0096FF' : 'transparent'}`,
            }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{
                background: selected ? '#0096FF' : '#263347',
                border: `1.5px solid ${selected ? '#0096FF' : '#334155'}`,
              }}
            >
              {selected && <Check size={14} color="white" strokeWidth={3} />}
            </div>
            <div className="text-left">
              <span
                className="text-base font-semibold block"
                style={{ color: selected ? '#f1f5f9' : '#94a3b8' }}
              >
                {supp.label}
              </span>
              {supp.id === 'creatine' && (
                <span className="text-xs" style={{ color: selected ? '#0096FF' : '#475569' }}>
                  +16 oz added to daily goal
                </span>
              )}
            </div>
          </motion.button>
        );
      })}

      <p className="text-xs text-center mt-2" style={{ color: '#334155' }}>
        You can update this anytime in settings.
      </p>
    </div>
  );
}

// ─── Step 4: Bottle ───────────────────────────────────────────────────────────
const CUP_SIZES: Record<number, { h: number; w: number }> = {
  24: { h: 36, w: 28 },
  32: { h: 46, w: 34 },
  40: { h: 58, w: 40 },
};

function CupIcon({ size, active }: { size: number; active: boolean }) {
  const { h, w } = CUP_SIZES[size];
  const color = active ? '#0096FF' : '#475569';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path
        d={`M4 4 L${w - 4} 4 L${w - 8} ${h - 6} Q${w / 2} ${h} ${8} ${h - 6} Z`}
        stroke={color}
        strokeWidth={2}
        fill={active ? 'rgba(0,150,255,0.15)' : 'transparent'}
        strokeLinejoin="round"
      />
      <line x1={2} y1={4} x2={w - 2} y2={4} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <line
        x1={8}
        y1={Math.round(h * 0.55)}
        x2={w - 8}
        y2={Math.round(h * 0.55)}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity={0.5}
      />
    </svg>
  );
}

function StepBottle({
  preset, onPresetChange, custom, onCustomChange, unit, onUnitChange,
}: {
  preset: number; onPresetChange: (v: number) => void;
  custom: string; onCustomChange: (v: string) => void;
  unit: Unit; onUnitChange: (v: Unit) => void;
}) {
  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <label
          className="text-xs font-semibold mb-3 block uppercase tracking-widest"
          style={{ color: '#475569' }}
        >
          Quick Select
        </label>
        <div className="flex gap-3">
          {BOTTLE_PRESETS.map((oz) => {
            const active = !custom && preset === oz;
            return (
              <motion.button
                key={oz}
                onClick={() => onPresetChange(oz)}
                whileTap={{ scale: 0.94 }}
                className="flex-1 py-5 rounded-2xl flex flex-col items-center gap-2"
                style={{
                  background: active ? 'rgba(0,150,255,0.12)' : '#1e293b',
                  border: `2px solid ${active ? '#0096FF' : 'transparent'}`,
                  boxShadow: active ? '0 0 16px rgba(0,150,255,0.2)' : 'none',
                }}
              >
                <CupIcon size={oz} active={active} />
                <span className="text-base font-bold" style={{ color: active ? '#0096FF' : '#f1f5f9' }}>
                  {oz}
                </span>
                <span className="text-xs" style={{ color: active ? 'rgba(0,150,255,0.7)' : '#475569' }}>
                  oz
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          className="text-xs font-semibold mb-2 block uppercase tracking-widest"
          style={{ color: '#475569' }}
        >
          Custom Size
        </label>
        <div
          className="flex items-center rounded-xl px-4 gap-2"
          style={{
            background: '#1e293b',
            border: `1px solid ${custom ? '#0096FF' : '#263347'}`,
          }}
        >
          <input
            type="number"
            value={custom}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="e.g. 20"
            className="flex-1 py-4 bg-transparent text-lg font-semibold outline-none"
            style={{ color: '#f1f5f9' }}
            inputMode="decimal"
          />
          <span className="text-sm" style={{ color: '#475569' }}>oz</span>
        </div>
      </div>

      <div>
        <label
          className="text-xs font-semibold mb-2 block uppercase tracking-widest"
          style={{ color: '#475569' }}
        >
          Display Unit
        </label>
        <div className="flex gap-2">
          {(['oz', 'ml'] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => onUnitChange(u)}
              className="flex-1 py-3 rounded-xl text-sm font-medium uppercase transition-colors"
              style={{
                background: unit === u ? '#0096FF' : '#1e293b',
                color: unit === u ? 'white' : '#64748b',
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
