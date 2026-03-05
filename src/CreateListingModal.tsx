import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Activity, Home, Package, Check } from 'lucide-react';
import { ZUPANIJE } from './constants';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

type FieldType = 'Tekst' | 'Broj' | 'Checkbox' | 'Izbornik - checkbox';

interface FieldDef {
  label: string;
  type: FieldType;
  required: boolean;
  public: boolean;
}

interface SectionDef {
  title: string;
  fields: FieldDef[];
}

const GENERAL_SECTION_TITLES = ['Osnovni podaci', 'Kontakt', 'Lokacija', 'Opis usluge', 'Administracija'];

const FORM_CONFIG: Record<string, SectionDef[]> = {
  Fizioterapeut: [
    { title: 'Osnovni podaci', fields: [
      { label: 'Ime', type: 'Tekst', required: true, public: true },
      { label: 'Prezime', type: 'Tekst', required: true, public: true },
      { label: 'OIB', type: 'Broj', required: true, public: false },
      { label: 'Ime tvrtke', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'Kontakt', fields: [
      { label: 'Kontakt telefon', type: 'Broj', required: true, public: true },
      { label: 'Email', type: 'Tekst', required: false, public: true },
      { label: 'Web stranica', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'Lokacija', fields: [{ label: 'Lokacija', type: 'Izbornik - checkbox', required: true, public: true }] },
    { title: 'Opis usluge', fields: [{ label: 'Opis usluge', type: 'Tekst', required: true, public: true }] },
    { title: 'Administracija', fields: [{ label: 'Prihvaćanje uvjeta korištenja', type: 'Checkbox', required: true, public: false }] },
    { title: 'SPECJALIZACIJA', fields: [
      { label: 'Mišićno-koštana (Muskuloskeletna) fizioterapija', type: 'Checkbox', required: false, public: true },
      { label: 'Neurološka fizioterapija', type: 'Checkbox', required: false, public: true },
      { label: 'Pedijatrijska fizioterapija', type: 'Checkbox', required: false, public: true },
      { label: 'Kardiorespiratorna fizioterapija', type: 'Checkbox', required: false, public: true },
      { label: 'Sportska fizioterapija', type: 'Checkbox', required: false, public: true },
      { label: 'Gerijatrijska fizioterapija', type: 'Checkbox', required: false, public: true },
      { label: 'Fizioterapija u ginekologiji i opstetriciji', type: 'Checkbox', required: false, public: true },
      { label: 'Onkološka fizioterapija', type: 'Checkbox', required: false, public: true },
      { label: 'Ostalo', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'METODE TERAPIJE', fields: [
      { label: 'Manualna terapija', type: 'Checkbox', required: false, public: true },
      { label: 'Kineziterapija (Medicinska gimnastika)', type: 'Checkbox', required: false, public: true },
      { label: 'Medicinska i Sportska masaža', type: 'Checkbox', required: false, public: true },
      { label: 'Elektroterapija (TENS, IFS, Galvanska struja)', type: 'Checkbox', required: false, public: true },
      { label: 'Magnetoterapija', type: 'Checkbox', required: false, public: true },
      { label: 'Ultrazvučna terapija', type: 'Checkbox', required: false, public: true },
      { label: 'Laseroterapija', type: 'Checkbox', required: false, public: true },
      { label: 'Terapija udarnim valom', type: 'Checkbox', required: false, public: true },
      { label: 'Proprioceptivna neuromuskularna facilitacija', type: 'Checkbox', required: false, public: true },
      { label: 'Kinezio taping', type: 'Checkbox', required: false, public: true },
      { label: 'Ostalo', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'TIP RADA', fields: [
      { label: 'Teren (dolazak kod pacijenta)', type: 'Checkbox', required: true, public: true },
      { label: 'Ustanova (fizioterapeutska praksa)', type: 'Checkbox', required: true, public: true }
    ] },
    { title: 'CIJENE', fields: [{ label: 'Cijena usluge po satu (od)', type: 'Broj', required: true, public: true }] }
  ],
  'Njega u kući': [
    { title: 'Osnovni podaci', fields: [
      { label: 'Ime', type: 'Tekst', required: true, public: true },
      { label: 'Prezime', type: 'Tekst', required: true, public: true },
      { label: 'OIB', type: 'Broj', required: true, public: false },
      { label: 'Ime tvrtke', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'Kontakt', fields: [
      { label: 'Kontakt telefon', type: 'Broj', required: true, public: true },
      { label: 'Email', type: 'Tekst', required: false, public: true },
      { label: 'Web stranica', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'Lokacija', fields: [{ label: 'Lokacija', type: 'Izbornik - checkbox', required: true, public: true }] },
    { title: 'Opis usluge', fields: [{ label: 'Opis usluge', type: 'Tekst', required: true, public: true }] },
    { title: 'Administracija', fields: [{ label: 'Prihvaćanje uvjeta korištenja', type: 'Checkbox', required: true, public: false }] },
    { title: 'USLUGE', fields: [
      { label: 'Zdravstvena njega u kući', type: 'Checkbox', required: false, public: true },
      { label: 'Praćenje stanja', type: 'Checkbox', required: false, public: true },
      { label: 'Palijativna skrb', type: 'Checkbox', required: false, public: true },
      { label: 'Pomoć u kući', type: 'Checkbox', required: false, public: true },
      { label: 'Ostalo', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'CIJENE', fields: [{ label: 'Cijena sata njege (od)', type: 'Broj', required: true, public: true }] }
  ],
  'Najam i prodaja opreme': [
    { title: 'Osnovni podaci', fields: [
      { label: 'Ime tvrtke', type: 'Tekst', required: true, public: true },
      { label: 'OIB', type: 'Broj', required: true, public: true },
      { label: 'Ime i prezime', type: 'Tekst', required: true, public: false }
    ] },
    { title: 'Kontakt', fields: [
      { label: 'Kontakt telefon', type: 'Broj', required: true, public: true },
      { label: 'Email', type: 'Tekst', required: false, public: true },
      { label: 'Web stranica', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'Lokacija', fields: [{ label: 'Lokacija', type: 'Izbornik - checkbox', required: true, public: true }] },
    { title: 'Opis usluge', fields: [{ label: 'Opis usluge', type: 'Tekst', required: true, public: true }] },
    { title: 'Administracija', fields: [{ label: 'Prihvaćanje uvjeta korištenja', type: 'Checkbox', required: true, public: false }] },
    { title: 'VRSTA OPREMA', fields: [
      { label: 'Kretanje i mobilnost', type: 'Checkbox', required: false, public: true },
      { label: 'Oprema za kućnu njegu i spavanje', type: 'Checkbox', required: false, public: true },
      { label: 'Higijenski i kupaonski program', type: 'Checkbox', required: false, public: true },
      { label: 'Respiratorska i specifična pomagala', type: 'Checkbox', required: false, public: true },
      { label: 'Ostalo', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'CIJENE', fields: [{ label: 'Cijena najma (od)', type: 'Broj', required: true, public: true }] }
  ],
  'Sanitetski prijevoz': [
    { title: 'Osnovni podaci', fields: [
      { label: 'Ime tvrtke', type: 'Tekst', required: true, public: true },
      { label: 'OIB', type: 'Broj', required: true, public: true },
      { label: 'Ime i prezime', type: 'Tekst', required: true, public: false }
    ] },
    { title: 'Kontakt', fields: [
      { label: 'Kontakt telefon', type: 'Broj', required: true, public: true },
      { label: 'Email', type: 'Tekst', required: false, public: true },
      { label: 'Web stranica', type: 'Tekst', required: false, public: true }
    ] },
    { title: 'Lokacija', fields: [{ label: 'Lokacija', type: 'Izbornik - checkbox', required: true, public: true }] },
    { title: 'Opis usluge', fields: [{ label: 'Opis usluge', type: 'Tekst', required: true, public: true }] },
    { title: 'Administracija', fields: [{ label: 'Prihvaćanje uvjeta korištenja', type: 'Checkbox', required: true, public: false }] },
    { title: 'USLUGE', fields: [
      { label: 'Ležeći prijevoz pacijenata (na nosilima)', type: 'Checkbox', required: false, public: true },
      { label: 'Sjedeći prijevoz (u kolicima)', type: 'Checkbox', required: false, public: true },
      { label: 'Transport stubama (pomoću kardio-stolice)', type: 'Checkbox', required: false, public: true },
      { label: 'Prijevoz s medicinskom pratnjom', type: 'Checkbox', required: false, public: true },
      { label: 'Međugradski i međunarodni prijevoz', type: 'Checkbox', required: false, public: true }
    ] },
    { title: 'CIJENE', fields: [{ label: 'Cijena prijevoza po km (od)', type: 'Broj', required: true, public: true }] }
  ]
};

const CATEGORY_OPTIONS = [
  { id: 'physio', name: 'Fizioterapeut', desc: 'Fizikalna terapija, masaža, vježbe', icon: Activity },
  { id: 'nurse', name: 'Njega u kući', desc: 'Medicinske sestre, njega osoba', icon: Home },
  { id: 'equipment', name: 'Najam i prodaja opreme', desc: 'Najam i prodaja opreme', icon: Package },
  { id: 'transport', name: 'Sanitetski prijevoz', desc: 'Prijevoz bolesnika i nepokretnih osoba', icon: Activity }
] as const;

const normalizeKey = (label: string) => label
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const getDefaultValue = (type: FieldType) => {
  if (type === 'Checkbox') return false;
  if (type === 'Izbornik - checkbox') return [];
  return '';
};

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<typeof CATEGORY_OPTIONS[number]['id']>('physio');
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState('');

  const selectedCategory = useMemo(
    () => CATEGORY_OPTIONS.find((category) => category.id === selectedCategoryId) || CATEGORY_OPTIONS[0],
    [selectedCategoryId]
  );

  const sections = FORM_CONFIG[selectedCategory.name] || [];
  const step2Sections = sections.filter((section) => !GENERAL_SECTION_TITLES.includes(section.title));
  const step3Sections = sections.filter((section) => GENERAL_SECTION_TITLES.includes(section.title));

  const updateValue = (key: string, value: any) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setStepError('');
  };

  const validateSections = (sectionsToValidate: SectionDef[]) => {
    const nextErrors: Record<string, string> = {};

    sectionsToValidate.forEach((section) => {
      const checkboxFields = section.fields.filter((field) => field.type === 'Checkbox');
      const hasRequiredCheckboxGroup = checkboxFields.length > 1 && checkboxFields.some((field) => field.required);

      if (hasRequiredCheckboxGroup) {
        const hasAnyChecked = checkboxFields.some((field) => formState[normalizeKey(field.label)] === true);
        if (!hasAnyChecked) {
          checkboxFields.forEach((field) => {
            nextErrors[normalizeKey(field.label)] = 'Odaberite barem jednu opciju.';
          });
        }
      }

      section.fields.forEach((field) => {
        const key = normalizeKey(field.label);
        const value = formState[key] ?? getDefaultValue(field.type);

        if (!field.required || hasRequiredCheckboxGroup && field.type === 'Checkbox') {
          return;
        }

        if (field.type === 'Checkbox' && value !== true) {
          nextErrors[key] = 'Ovo polje je obavezno.';
        }

        if (field.type === 'Izbornik - checkbox' && (!Array.isArray(value) || value.length === 0)) {
          nextErrors[key] = 'Odaberite barem jednu opciju.';
        }

        if ((field.type === 'Tekst' || field.type === 'Broj') && String(value).trim() === '') {
          nextErrors[key] = 'Ovo polje je obavezno.';
        }
      });
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStepError('Molimo ispunite sva obavezna polja prije nastavka.');
      return false;
    }

    setStepError('');
    return true;
  };

  const renderField = (fieldDef: FieldDef, sectionTitle: string) => {
    const key = normalizeKey(fieldDef.label);
    const value = formState[key] ?? getDefaultValue(fieldDef.type);
    const error = errors[key];

    if (fieldDef.type === 'Tekst') {
      const isDescription = key.includes('opis');
      return (
        <div key={key} className="space-y-2">
          <label className="text-sm font-bold text-slate-700">
            {fieldDef.label} {fieldDef.required && <span className="text-red-500">*</span>}
          </label>
          {isDescription ? (
            <textarea
              rows={4}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 resize-none ${error ? 'border-red-400' : 'border-slate-200'}`}
              value={value}
              onChange={(e) => updateValue(key, e.target.value)}
            />
          ) : (
            <input
              type="text"
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-400' : 'border-slate-200'}`}
              value={value}
              onChange={(e) => updateValue(key, e.target.value)}
            />
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      );
    }

    if (fieldDef.type === 'Broj') {
      return (
        <div key={key} className="space-y-2">
          <label className="text-sm font-bold text-slate-700">
            {fieldDef.label} {fieldDef.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            min="0"
            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-400' : 'border-slate-200'}`}
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      );
    }

    if (fieldDef.type === 'Izbornik - checkbox') {
      return (
        <div key={key} className="space-y-2">
          <label className="text-sm font-bold text-slate-700 block">
            {fieldDef.label} {fieldDef.required && <span className="text-red-500">*</span>}
          </label>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 bg-slate-50 border rounded-xl ${error ? 'border-red-400' : 'border-slate-200'}`}>
            {ZUPANIJE.map((county) => (
              <label key={county} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={(value as string[]).includes(county)}
                  onChange={() => {
                    const current = Array.isArray(value) ? value : [];
                    const next = current.includes(county)
                      ? current.filter((item) => item !== county)
                      : [...current, county];
                    updateValue(key, next);
                  }}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700">{county}</span>
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      );
    }

    if (sectionTitle === 'TIP RADA') {
      const isSelected = value === true;
      return (
        <button
          key={key}
          type="button"
          onClick={() => updateValue(key, !isSelected)}
          className={`relative p-4 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-primary bg-primary/5 font-bold text-primary' : error ? 'border-red-300 text-slate-600' : 'border-slate-100 text-slate-600'}`}
        >
          {isSelected && (
            <Check className="absolute top-3 right-3 w-4 h-4 text-[#22C55E]" />
          )}
          {fieldDef.label}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </button>
      );
    }

    return (
      <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${error ? 'border-red-300' : 'border-slate-100 hover:bg-slate-50'}`}>
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => updateValue(key, e.target.checked)}
          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
        />
        <span className="text-sm text-slate-700">{fieldDef.label}</span>
        {error && <span className="text-xs text-red-500 ml-auto">{error}</span>}
      </label>
    );
  };

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2 && validateSections(step2Sections)) {
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep((current) => Math.max(1, current - 1));
    setStepError('');
  };

  const handleSubmit = () => {
    if (!validateSections(step3Sections)) {
      return;
    }

    const meta: Record<string, { required: boolean; public: boolean; label: string; type: string }> = {};
    const values: Record<string, any> = {};

    sections.forEach((section) => {
      section.fields.forEach((field) => {
        const key = normalizeKey(field.label);
        const value = formState[key] ?? getDefaultValue(field.type);
        values[key] = value;
        meta[key] = {
          required: field.required,
          public: field.public,
          label: field.label,
          type: field.type
        };
      });
    });

    const fullName = values.ime_i_prezime || [values.ime, values.prezime].filter(Boolean).join(' ') || values.ime_tvrtke || selectedCategory.name;
    const locations = Array.isArray(values.lokacija) ? values.lokacija : [];
    const priceField = sections.find((section) => section.title === 'CIJENE')?.fields[0];
    const price = priceField ? String(values[normalizeKey(priceField.label)] || '') : '';
    const tags = sections
      .filter((section) => !GENERAL_SECTION_TITLES.includes(section.title))
      .flatMap((section) => section.fields)
      .filter((field) => field.type === 'Checkbox' && values[normalizeKey(field.label)] === true)
      .map((field) => field.label);

    const payload = {
      category: selectedCategory.name,
      values,
      meta
    };

    onSubmit({
      id: Math.random().toString(36).slice(2, 11),
      rating: 5.0,
      reviewsCount: 0,
      image: 'https://picsum.photos/seed/user/400/300',
      type: selectedCategory.id,
      name: fullName,
      price,
      location: locations.join(', '),
      description: String(values.opis_usluge || ''),
      tags,
      form_payload: payload
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                {step > 1 && (
                  <button onClick={prevStep} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                  </button>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Objavi oglas</h2>
                  <p className="text-sm text-slate-500">Korak {step} od 3</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Odaberite kategoriju</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {CATEGORY_OPTIONS.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategoryId(category.id)}
                          className={`flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left ${selectedCategoryId === category.id ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                        >
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${selectedCategoryId === category.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-slate-900">{category.name}</h4>
                            <p className="text-slate-500 text-sm">{category.desc}</p>
                          </div>
                          <ChevronRight className="ml-auto w-6 h-6 text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  {step2Sections.map((section) => {
                    const checkboxFields = section.fields.filter((field) => field.type === 'Checkbox');
                    const otherFields = section.fields.filter((field) => field.type !== 'Checkbox');

                    return (
                      <div key={section.title} className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                        {section.title === 'TIP RADA' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {section.fields.map((field) => renderField(field, section.title))}
                          </div>
                        ) : (
                          <>
                            {checkboxFields.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {checkboxFields.map((field) => renderField(field, section.title))}
                              </div>
                            )}
                            {otherFields.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {otherFields.map((field) => renderField(field, section.title))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  {step3Sections.map((section) => (
                    <div key={section.title} className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {section.fields.map((field) => (
                          <div key={normalizeKey(field.label)} className={field.type === 'Izbornik - checkbox' || normalizeKey(field.label).includes('opis') ? 'md:col-span-2' : ''}>
                            {renderField(field, section.title)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {stepError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {stepError}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center sticky bottom-0 z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
              >
                Odustani
              </button>
              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Prethodno
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                  >
                    Dalje
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-8 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                  >
                    Objavi oglas
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
