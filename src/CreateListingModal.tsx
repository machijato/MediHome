import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, MapPin, Euro, Info, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Phone, Globe, Activity, Home, Package } from 'lucide-react';
import { ZUPANIJE } from './constants';
import { supabase } from './lib/supabase';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'physio',
    price: '',
    locations: [ZUPANIJE[0]] as string[],
    description: '',
    specialization: [] as string[],
    otherSpecialization: '',
    methods: [] as string[],
    workTypes: ['teren'] as string[], // Multiple selection allowed
    services: [] as string[],
    phone: '',
    website: ''
  });

  const categories = [
    { id: 'physio', name: 'Fizioterapeut', desc: 'Fizikalna terapija, masaža, vježbe', icon: Activity },
    { id: 'nurse', name: 'Njega u kući', desc: 'Medicinske sestre, njega osoba', icon: Home },
    { id: 'equipment', name: 'Oprema', desc: 'Najam i prodaja', icon: Package },
    { id: 'transport', name: 'Sanitetski prijevoz', desc: 'Prijevoz bolesnika i nepokretnih osoba', icon: Activity },
  ];

  const physioSpecs = [
    'Ortopedska rehabilitacija',
    'Fizioterapija kralježnice',
    'Sportska fizioterapija',
    'Neurološka rehabilitacija',
    'Pedijatrijska fizioterapija',
    'Reumatološka rehabilitacija',
    'Kronična bol'
  ];

  const physioMethods = [
    'Manualna terapija',
    'Medicinska i sportska masaža',
    'Elektroterapija',
    'Magnetoterapija',
    'Ultrazvučna terapija',
    'Laser visokog intenziteta',
    'Ostalo'
  ];

  const nurseServices = [
    { id: 'care', label: 'Zdravstvena njega u kući', sub: 'previjanje rana, primjena terapije, njega stome ili katetera' },
    { id: 'monitoring', label: 'Praćenje stanja', sub: 'mjerenje tlaka, razina šečera u krvi i promatranje bolesnika' },
    { id: 'palliative', label: 'Palijativna skrb', sub: 'briga za teško oboljele u terminalnoj fazi' },
    { id: 'help', label: 'Pomoć u kući', sub: 'osobna higijena, prehrana, dostava obroka, pospremanje, nabava' }
  ];

  const toggleSelection = (list: string[], item: string, field: string) => {
    const newList = list.includes(item) 
      ? list.filter(i => i !== item) 
      : [...list, item];
    setFormData({ ...formData, [field]: newList });
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setIsSubmitting(true);

    const categoryIdByType: Record<string, string> = {
      physio: '11111111-1111-1111-1111-111111111111',
      nurse: '22222222-2222-2222-2222-222222222222',
      equipment: '33333333-3333-3333-3333-333333333333',
      transport: '44444444-4444-4444-4444-444444444444',
    };

    const priceFrom = Number.parseFloat(formData.price.replace(',', '.'));

    const { error } = await supabase.from('provider_listings').insert({
      title: formData.name,
      description: formData.description,
      city: formData.locations[0] || '',
      price_from: Number.isFinite(priceFrom) ? priceFrom : 0,
      price_unit: 'EUR',
      category_id: categoryIdByType[formData.type] || categoryIdByType.physio,
      provider_profile_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      status: 'approved',
    });

    if (error) {
      console.error('Greška pri unosu oglasa u Supabase:', error);
      setSubmitError('Došlo je do greške pri spremanju oglasa. Pokušajte ponovno.');
      setIsSubmitting(false);
      return;
    }

    onSubmit({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      rating: 5.0,
      reviewsCount: 0,
      location: formData.locations.join(', '),
      image: 'https://picsum.photos/seed/user/400/300',
      tags: [...formData.specialization, ...formData.methods, ...formData.services, ...formData.workTypes]
    });

    onClose();
    window.location.reload();
  };

  const nextStep = () => {
    if (step === 1 && (formData.type === 'equipment' || formData.type === 'transport')) {
      setStep(3); // Skip step 2 for equipment and transport
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step === 3 && (formData.type === 'equipment' || formData.type === 'transport')) {
      setStep(1);
    } else {
      setStep(step - 1);
    }
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
            {/* Header */}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Odaberite kategoriju</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setFormData({ ...formData, type: cat.id });
                          nextStep();
                        }}
                        className={`flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left ${
                          formData.type === cat.id 
                            ? 'border-primary bg-primary/5 shadow-md' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          formData.type === cat.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <cat.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900">{cat.name}</h4>
                          <p className="text-slate-500 text-sm">{cat.desc}</p>
                        </div>
                        <ChevronRight className="ml-auto w-6 h-6 text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && formData.type === 'physio' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Tip rada (moguće označiti oba)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => toggleSelection(formData.workTypes, 'teren', 'workTypes')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.workTypes.includes('teren') ? 'border-primary bg-primary/5 font-bold text-primary' : 'border-slate-100 text-slate-600'
                        }`}
                      >
                        Teren (dolazak kod pacijenta)
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSelection(formData.workTypes, 'ustanova', 'workTypes')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.workTypes.includes('ustanova') ? 'border-primary bg-primary/5 font-bold text-primary' : 'border-slate-100 text-slate-600'
                        }`}
                      >
                        Ustanova (fizioterapeutska praksa)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Specijalizacija</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {physioSpecs.map(spec => (
                        <label key={spec} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.specialization.includes(spec)}
                            onChange={() => toggleSelection(formData.specialization, spec, 'specialization')}
                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-700">{spec}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-bold text-slate-700 block mb-2">Ostalo (navedite):</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Upišite drugu specijalizaciju..."
                        value={formData.otherSpecialization}
                        onChange={e => setFormData({ ...formData, otherSpecialization: e.target.value })}
                      />
                      <p className="text-xs text-slate-400 mt-1">* Podliježe autorizaciji administratora</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Metode i oblici terapije</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {physioMethods.map(method => (
                        <label key={method} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.methods.includes(method)}
                            onChange={() => toggleSelection(formData.methods, method, 'methods')}
                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-700">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && formData.type === 'nurse' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Odaberite usluge koje nudite</h3>
                  <div className="space-y-4">
                    {nurseServices.map(service => (
                      <label key={service.id} className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.services.includes(service.label) ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service.label)}
                          onChange={() => toggleSelection(formData.services, service.label, 'services')}
                          className="mt-1 w-6 h-6 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="block font-bold text-slate-900">{service.label}</span>
                          <span className="block text-sm text-slate-500 mt-1">{service.sub}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Ime i prezime / Naziv</label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="npr. Ivan Horvat"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">
                        {formData.type === 'equipment' ? 'Cijena (npr. 5€/dan)' : 'Cijena (npr. 30€/h)'}
                      </label>
                      <div className="relative">
                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          required
                          type="text"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder={formData.type === 'equipment' ? '5€/dan' : '30€/h'}
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Lokacije (Županije - označite sve gdje nudite uslugu)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      {ZUPANIJE.map(z => (
                        <label key={z} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.locations.includes(z)}
                            onChange={() => toggleSelection(formData.locations, z, 'locations')}
                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-700">{z}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Kontakt broj</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          required
                          type="tel"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="091 123 4567"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Web adresa (opcionalno)</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="url"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="https://www.vasastranica.hr"
                          value={formData.website}
                          onChange={e => setFormData({...formData, website: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Opis usluge</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      placeholder="Detaljno opišite što nudite..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center sticky bottom-0 z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
              >
                Odustani
              </button>
              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}
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
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                  >
                    {isSubmitting ? 'Spremanje...' : 'Objavi oglas'}
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
