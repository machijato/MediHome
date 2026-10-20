import React from 'react';
import { Star } from 'lucide-react';

type StarsProps = {
  value: number;
  size?: 'sm' | 'md';
};

// Prikaz ocjene zvjezdicama (podržava polovične vrijednosti zaokruživanjem na najbližu punu zvjezdicu).
export function Stars({ value, size = 'md' }: StarsProps) {
  const rounded = Math.round(value);
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Ocjena ${value.toFixed(1)} od 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= rounded ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </span>
  );
}

type StarInputProps = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  testId?: string;
};

// Odabir ocjene 1-5 (radio grupa, dostupna tipkovnicom).
export function StarInput({ value, onChange, label, testId }: StarInputProps) {
  return (
    <div role="radiogroup" aria-label={label} data-testid={testId} className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} od 5`}
          data-testid={testId ? `${testId}-${n}` : undefined}
          onClick={() => onChange(n)}
          className="p-1 min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Star className={`w-6 h-6 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

export function formatRating(value: number | null | undefined): string {
  return value == null ? '' : Number(value).toFixed(1).replace('.', ',');
}

export function UnverifiedNote({ className = '' }: { className?: string }) {
  return (
    <p data-testid="reviews-unverified-note" className={`text-xs text-slate-500 ${className}`}>
      Recenzije su neprovjerene: MediHome ne može potvrditi da je autor doista koristio uslugu.
    </p>
  );
}

const MONTHS_HR = [
  'siječanj', 'veljača', 'ožujak', 'travanj', 'svibanj', 'lipanj',
  'srpanj', 'kolovoz', 'rujan', 'listopad', 'studeni', 'prosinac',
];

// '2026-09-01' -> 'rujan 2026.'
export function formatMonth(isoDate: string): string {
  const [y, m] = isoDate.split('-');
  const idx = Number(m) - 1;
  return `${MONTHS_HR[idx] ?? m} ${y}.`;
}

// Zadnjih 36 mjeseci (od tekućeg unatrag) kao { value: 'YYYY-MM-01', label }.
export function recentMonthOptions(count = 36): Array<{ value: string; label: string }> {
  const now = new Date();
  const out: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    out.push({ value, label: formatMonth(value) });
  }
  return out;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('hr-HR');
}
