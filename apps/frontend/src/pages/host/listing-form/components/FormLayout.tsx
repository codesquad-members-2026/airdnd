import { Icon } from '../../../../shared/Icon';
import type { STEPS } from '../constants';

export function WizardProgress({
  currentStep,
  totalSteps,
  steps,
}: {
  currentStep: number;
  totalSteps: number;
  steps: typeof STEPS;
}) {
  const current = steps[currentStep];

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '24px 28px',
      marginBottom: 16,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-coral)', marginBottom: 6 }}>
            {currentStep + 1} / {totalSteps}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink-1)', lineHeight: 1.25 }}>
            {current.title}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}>
            {current.description}
          </p>
        </div>
        <div style={{
          minWidth: 96,
          height: 38,
          borderRadius: 999,
          background: 'var(--surface-alt)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--ink-2)',
        }}>
          {Math.round(((currentStep + 1) / totalSteps) * 100)}%
        </div>
      </div>
      <div style={{
        height: 8,
        borderRadius: 999,
        background: 'var(--surface-alt)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${((currentStep + 1) / totalSteps) * 100}%`,
          height: '100%',
          borderRadius: 999,
          background: 'var(--brand-coral)',
          transition: 'width 180ms ease',
        }} />
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '28px 32px',
      marginBottom: 16,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--ink-1)',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid var(--line)',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--ink-1)',
        marginBottom: 8,
      }}>
        {label}
        {required && <span style={{ color: 'var(--brand-coral)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 13, color: 'var(--brand-coral)', marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
}

export function StepperField({
  label,
  sub,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  label: string;
  sub?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderRadius: 12,
      border: '1px solid var(--line-strong)',
      background: '#fff',
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '1px solid var(--ink-4)',
            background: '#fff',
            cursor: value <= min ? 'default' : 'pointer',
            opacity: value <= min ? 0.35 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 120ms ease',
          }}
        >
          <Icon name="minus" size={15} />
        </button>
        <span style={{ minWidth: 36, textAlign: 'center', fontWeight: 700, fontSize: 16 }}>
          {value}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 2 }}>{unit}</span>
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '1px solid var(--ink-4)',
            background: '#fff',
            cursor: value >= max ? 'default' : 'pointer',
            opacity: value >= max ? 0.35 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 120ms ease',
          }}
        >
          <Icon name="plus" size={15} />
        </button>
      </div>
    </div>
  );
}
