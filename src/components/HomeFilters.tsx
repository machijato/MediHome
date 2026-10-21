import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ZUPANIJE } from '../constants';
import {
  FILTER_PARAM_NAMES,
  ListingFilters,
  OPTION_FILTER_CATEGORY,
  OPTION_GROUPS,
  hasAdvancedFilters,
} from '../lib/homeFilters';

type Option = { id: string; label: string };
type Group = { key: string; param: string; label: string; options: Option[] };

type HomeFiltersProps = {
  params: URLSearchParams;
  update: (change: (next: URLSearchParams) => void) => void;
  activeCategory: string;
  categoryName: string | null;
  filters: ListingFilters;
};

const MAX_COUNTY_CHIPS = 6;

export function HomeFilters({ params, update, activeCategory, categoryName, filters }: HomeFiltersProps) {
  const selectedCounty = params.get('county') ?? 'all';
  const searchQuery = params.get('q') ?? '';
  const optionFiltersAvailable = activeCategory === OPTION_FILTER_CATEGORY;

  const [countyCounts, setCountyCounts] = useState<Record<string, number>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);
  const [minInput, setMinInput] = useState(params.get('min') ?? '');
  const [maxInput, setMaxInput] = useState(params.get('max') ?? '');

  // Broj odobrenih oglasa po lokaciji (za prečace "Sve lokacije / Grad Zagreb 5 ...").
  useEffect(() => {
    let active = true;
    supabase
      .from('provider_listings')
      .select('city')
      .eq('status', 'approved')
      .limit(1000)
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        const counts: Record<string, number> = {};
        for (const row of data as Array<{ city: string | null }>) {
          if (row.city) counts[row.city] = (counts[row.city] ?? 0) + 1;
        }
        setCountyCounts(counts);
      });
    return () => {
      active = false;
    };
  }, []);

  // Opcije (tip rada, specijalizacija, metode) iz baze; potrebne samo kad je odabrana kategorija fizioterapeuta.
  useEffect(() => {
    if (!optionFiltersAvailable) return;
    let active = true;
    supabase
      .from('service_option_groups')
      .select('key, display_order, service_categories!inner(slug), service_options(id, label, display_order, is_active)')
      .eq('service_categories.slug', OPTION_FILTER_CATEGORY)
      .in('key', OPTION_GROUPS.map((g) => g.key))
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          console.error('[filters] opcije nisu učitane:', error?.message);
          setGroups([]);
          return;
        }
        const built: Group[] = [];
        for (const def of OPTION_GROUPS) {
          const row: any = (data as any[]).find((g: any) => g.key === def.key);
          if (!row) continue;
          const options = ((row.service_options ?? []) as any[])
            .filter((o) => o.is_active !== false && String(o.label).trim().toLowerCase() !== 'ostalo')
            .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((o) => ({ id: String(o.id), label: String(o.label).trim() }));
          if (options.length > 0) built.push({ key: def.key, param: def.param, label: def.label, options });
        }
        setGroups(built);
      });
    return () => {
      active = false;
    };
  }, [optionFiltersAvailable]);

  // Polja za cijenu prate URL (npr. nakon "Ukloni sve" ili nazad u pregledniku).
  useEffect(() => setMinInput(params.get('min') ?? ''), [params.get('min')]);
  useEffect(() => setMaxInput(params.get('max') ?? ''), [params.get('max')]);

  // Napredni filteri vide se otvoreni ako je neki već aktivan.
  const advancedActive = hasAdvancedFilters(filters);
  useEffect(() => {
    if (advancedActive) setOpen(true);
  }, [advancedActive]);

  const topCounties = useMemo(
    () =>
      (Object.entries(countyCounts) as Array<[string, number]>)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'hr'))
        .slice(0, MAX_COUNTY_CHIPS),
    [countyCounts],
  );

  const setCounty = (value: string) =>
    update((next) => {
      if (!value || value === 'all') next.delete('county');
      else next.set('county', value);
    });

  const applyPrice = () =>
    update((next) => {
      const min = minInput.trim();
      const max = maxInput.trim();
      if (min) next.set('min', min); else next.delete('min');
      if (max) next.set('max', max); else next.delete('max');
    });

  const toggleOption = (param: string, id: string) =>
    update((next) => {
      const current = filters.options[param] ?? [];
      const selected = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
      if (selected.length === 0) next.delete(param);
      else next.set(param, selected.join(','));
    });

  const clearAll = () =>
    update((next) => {
      for (const name of FILTER_PARAM_NAMES) next.delete(name);
    });

  const optionLabel = (param: string, id: string) =>
    groups.find((g) => g.param === param)?.options.find((o) => o.id === id)?.label ?? 'Odabrana opcija';

  type Chip = { key: string; label: string; remove: (next: URLSearchParams) => void };
  const chips: Chip[] = [];
  if (searchQuery.trim()) chips.push({ key: 'q', label: `Pojam: ${searchQuery.trim()}`, remove: (n) => n.delete('q') });
  if (activeCategory !== 'all') chips.push({ key: 'cat', label: categoryName ?? activeCategory, remove: (n) => { n.delete('cat'); for (const g of OPTION_GROUPS) n.delete(g.param); } });
  if (selectedCounty !== 'all') chips.push({ key: 'county', label: selectedCounty, remove: (n) => n.delete('county') });
  if (filters.min != null || filters.max != null) {
    const label = filters.min != null && filters.max != null
      ? `Cijena: ${filters.min} – ${filters.max} €`
      : filters.min != null ? `Cijena: od ${filters.min} €` : `Cijena: do ${filters.max} €`;
    chips.push({ key: 'price', label, remove: (n) => { n.delete('min'); n.delete('max'); } });
  }
  for (const g of OPTION_GROUPS) {
    for (const id of filters.options[g.param] ?? []) {
      chips.push({
        key: `${g.param}-${id}`,
        label: optionLabel(g.param, id),
        remove: (n) => {
          const left = (filters.options[g.param] ?? []).filter((v) => v !== id);
          if (left.length === 0) n.delete(g.param); else n.set(g.param, left.join(','));
        },
      });
    }
  }

  const chipBase = 'px-4 py-2 rounded-full text-sm font-medium transition-all';
  const chipOn = 'bg-primary text-white shadow-md';
  const chipOff = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

  return (
    <div data-testid="home-filters" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-3 text-slate-900 font-bold shrink-0">
          <MapPin className="w-5 h-5 text-primary" />
          <span>Lokacija:</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            data-testid="filter-county-all"
            onClick={() => setCounty('all')}
            className={`${chipBase} ${selectedCounty === 'all' ? chipOn : chipOff}`}
          >
            Sve lokacije
          </button>
          {topCounties.map(([name, count]) => (
            <button
              key={name}
              type="button"
              data-testid={`filter-county-${name}`}
              onClick={() => setCounty(name)}
              className={`${chipBase} ${selectedCounty === name ? chipOn : chipOff}`}
            >
              {name} <span className="opacity-70">{count}</span>
            </button>
          ))}
          <div className="relative">
            <select
              data-testid="filter-county-select"
              aria-label="Odaberite županiju"
              value={selectedCounty === 'all' ? '' : selectedCounty}
              onChange={(e) => setCounty(e.target.value || 'all')}
              className="appearance-none pl-4 pr-10 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none"
            >
              <option value="">Sve županije</option>
              {ZUPANIJE.map((county) => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <button
          type="button"
          data-testid="filters-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="lg:ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filteri
          {advancedActive && <span className="w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>

      {open && (
        <div data-testid="filters-panel" className="border-t border-slate-100 pt-5 space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">Cijena (€)</p>
              <div className="flex items-center gap-2">
                <input
                  data-testid="filter-price-min"
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder="od"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
                  className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <span className="text-slate-400">–</span>
                <input
                  data-testid="filter-price-max"
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder="do"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
                  className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <button
                  type="button"
                  data-testid="filter-price-apply"
                  onClick={applyPrice}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90"
                >
                  Primijeni
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Filtrira se po početnoj cijeni oglasa.</p>
            </div>
          </div>

          {optionFiltersAvailable ? (
            groups.map((group) => (
              <div key={group.key} data-testid={`filter-group-${group.param}`}>
                <p className="text-sm font-semibold text-slate-900 mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const on = (filters.options[group.param] ?? []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={on}
                        data-testid={`filter-option-${group.param}-${option.id}`}
                        onClick={() => toggleOption(group.param, option.id)}
                        className={`${chipBase} ${on ? chipOn : chipOff}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p data-testid="filters-category-hint" className="text-sm text-slate-500">
              Za filtere po tipu rada, specijalizaciji i metodama terapije odaberite kategoriju „Fizioterapeuti“.
            </p>
          )}
        </div>
      )}

      {chips.length > 0 && (
        <div data-testid="active-filters" className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-500">Aktivni filteri:</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              data-testid="active-filter-chip"
              onClick={() => update(chip.remove)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20"
              aria-label={`Ukloni filter: ${chip.label}`}
            >
              {chip.label}
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
          <button
            type="button"
            data-testid="filters-clear-all"
            onClick={clearAll}
            className="text-sm font-semibold text-slate-600 underline hover:text-slate-900"
          >
            Ukloni sve
          </button>
        </div>
      )}
    </div>
  );
}
