'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Droplets } from 'lucide-react';
import { saveProfile, setOnboardingComplete } from '@/lib/storage';
import { calcDailyGoal, ozToMl } from '@/lib/calculations';

type Gender = 'male' | 'female' | 'other';
type Unit = 'oz' | 'ml';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1 state
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<Gender>('male');

  // Step 2 state
  const [bottleSizeOz, setBottleSizeOz] = useState('24');
  const [unit, setUnit] = useState<Unit>('oz');

  const handleNext = () => {
    if (step === 0) {
      if (!age || !height || !weight) return;
      setStep(1);
    } else {
      const weightNum = parseFloat(weight);
      const bottleNum = parseFloat(bottleSizeOz);
      const dailyGoal = calcDailyGoal(weightNum);

      saveProfile({
        age: parseInt(age),
        height: parseFloat(height),
        weight: weightNum,
        gender,
        bottleSize: bottleNum,
        unit,
        dailyGoal,
      });
      setOnboardingComplete();
      router.replace('/hydration');
    }
  };

  const displayBottle =
    unit === 'oz' ? `${bottleSizeOz} oz` : `${ozToMl(parseFloat(bottleSizeOz))} ml`;

  return (
    <div
      className="flex flex-col h-svh max-w-[480px] mx-auto px-6"
      style={{ background: '#0f172a' }}
    >
      {/* Header */}
      <div className="pt-16 pb-10 flex flex-col items-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(59, 130, 246, 0.15)' }}
        >
          <Droplets size={28} strokeWidth={1.75} color="#3b82f6" />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>
          {step === 0 ? 'About You' : 'Your Bottle'}
        </h1>
        <p className="text-sm mt-1 text-center" style={{ color: '#64748b' }}>
          {step === 0
            ? 'We use this to calculate your daily water goal.'
            : 'Configure your go-to water vessel.'}
        </p>

        {/* Step dots */}
        <div className="flex gap-2 mt-5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '24px' : '8px',
                background: i === step ? '#3b82f6' : '#1e293b',
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-4"
          >
            <Field label="Age" type="number" value={age} onChange={setAge} placeholder="25" unit="years" />
            <Field label="Height" type="number" value={height} onChange={setHeight} placeholder="70" unit="inches" />
            <Field label="Weight" type="number" value={weight} onChange={setWeight} placeholder="160" unit="lbs" />

            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: '#94a3b8' }}>
                Gender
              </label>
              <div className="flex gap-2">
                {(['male', 'female', 'other'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-colors"
                    style={{
                      background: gender === g ? '#3b82f6' : '#1e293b',
                      color: gender === g ? 'white' : '#64748b',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6"
          >
            <Field
              label="Bottle Size (oz)"
              type="number"
              value={bottleSizeOz}
              onChange={setBottleSizeOz}
              placeholder="24"
              unit="oz"
            />

            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: '#94a3b8' }}>
                Display Unit
              </label>
              <div className="flex gap-2">
                {(['oz', 'ml'] as Unit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium uppercase transition-colors"
                    style={{
                      background: unit === u ? '#3b82f6' : '#1e293b',
                      color: unit === u ? 'white' : '#64748b',
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="flex items-center justify-between px-4 py-4 rounded-xl"
              style={{ background: '#1e293b' }}
            >
              <span className="text-sm" style={{ color: '#94a3b8' }}>
                Daily goal (based on weight)
              </span>
              <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>
                {unit === 'oz'
                  ? `${calcDailyGoal(parseFloat(weight) || 0)} oz`
                  : `${ozToMl(calcDailyGoal(parseFloat(weight) || 0))} ml`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next / Done button */}
      <div className="mt-auto pb-12">
        <motion.button
          onClick={handleNext}
          whileTap={{ scale: 0.96 }}
          className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: '#3b82f6' }}
        >
          {step === 0 ? 'Next' : 'Get Started'}
          <ChevronRight size={18} strokeWidth={2} />
        </motion.button>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  unit: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium mb-2 block" style={{ color: '#94a3b8' }}>
        {label}
      </label>
      <div
        className="flex items-center rounded-xl px-4 gap-2"
        style={{ background: '#1e293b', border: '1px solid #263347' }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 py-4 bg-transparent text-lg font-semibold outline-none"
          style={{ color: '#f1f5f9' }}
          inputMode="decimal"
        />
        <span className="text-sm" style={{ color: '#475569' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}
