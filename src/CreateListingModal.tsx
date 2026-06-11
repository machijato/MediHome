import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, MapPin, Euro, Info, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Phone, Globe, Activity, Home, Package } from 'lucide-react';
import { ZUPANIJE } from './constants';
import { supabase } from './lib/supabase';
import { generateListingSlug } from './utils/slugify';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
  editListing?: {
    id: string;
    title: string;
    description: string;
    price_from: number;
    price_unit: string;
    city: string;
    category_slug: string;
  } | null;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSubmit, editListing = null }) => {
  const isEditMode = Boolean(editListing);
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'fizioterapeut',
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
    { id: 'fizioterapeut', name: 'Fizioterapeut', desc: 'Fizikalna terapija, masaža, vježbe', icon: Activity },
    { id: 'kucna-njega', name: 'Njega u kući', desc: 'Medicinske sestre, njega osoba', icon: Home },
    { id: 'najam-opreme', name: 'Oprema', desc: 'Najam i prodaja', icon: Package },
    { id: 'sanitetski-prijevoz', name: 'Sanitetski prijevoz', desc: 'Prijevoz bolesnika i nepokretnih osoba', icon: Activity },
  ];

  const physioSpecs = [
    'Mišićno-koštana (Muskuloskeletna) fizioterapija',
    'Neurološka fizioterapija',
    'Pedijatrijska fizioterapija',
    'Kardiorespiratorna fizioterapija',
    'Sportska fizioterapija',
    'Gerijatrijska fizioterapija',
    'Fizioterapija u ginekologiji i opstetriciji',
    'Onkološka fizioterapija',
    'Ostalo',
  ];

  const physioMethods = [
    'Manualna terapija',
    'Kineziterapija (Medicinska gimnastika)',
    'Medicinska i sportska masaža',
    'Elektroterapija (TENS, IFS, Galvanska struja)',
    'Magnetoterapija',
    'Ultrazvučna terapija',
    'Laseroterapija',
    'Terapija udarnim valom',
    'Proprioceptivna neuromuskularna facilitacija',
    'Kinezio taping',
    'Ostalo',
  ];

  const nurseServices = [
    { id: 'care', label: 'Zdravstvena njega u kući', sub: 'previjanje rana, primjena terapije, njega stome ili katetera' },
    { id: 'monitoring', label: 'Praćenje zdravstvenog stanja', sub: 'mjerenje tlaka, razina šečera u krvi i promatranje bolesnika' },
    { id: 'palliative', label: 'Palijativna skrb', sub: 'briga za teško oboljele u terminalnoj fazi' },
    { id: 'help', label: 'Pomoć u kući', sub: 'osobna higijena, prehrana, dostava obroka, pospremanje, nabava' },
    { id: 'other', label: 'Ostalo', sub: '' },
  ];

  const equipmentOptions = [
    'Invalidska kolica',
    'Bolnički krevet',
    'Hodalice i štake',
    'Medicinski madraci',
    'Oprema za kretanje i rehabilitaciju',
    'Ostalo',
  ];

  const transportOptions = [
    'Prijevoz pacijenata',
    'Prijevoz osoba s invaliditetom',
    'Ležeći transport',
    'Pratnja medicinskog osoblja',
    'Ostalo',
  ];

  const toggleSelection = (list: string[], item: string, field: string) => {
    const newList = list.includes(item) 
      ? list.filter(i => i !== item) 
      : [...list, item];
    setFormData({ ...formData, [field]: newList });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from<File>(e.target.files ?? []);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter((file) => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      uploadPreviews.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setUploadPreviews([]);
      setSubmitError('Dozvoljeni formati su: JPG, PNG, WebP. GIF i drugi formati nisu podržani.');
      e.target.value = '';
      return;
    }

    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      uploadPreviews.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setUploadPreviews([]);
      setSubmitError('Maksimalna veličina slike je 5MB.');
      e.target.value = '';
      return;
    }

    setSubmitError('');
    uploadPreviews.forEach((url) => URL.revokeObjectURL(url));
    const limited = files.slice(0, 3);
    setSelectedFiles(limited);
    setUploadPreviews(limited.map((file) => URL.createObjectURL(file)));
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(uploadPreviews[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setUploadPreviews(uploadPreviews.filter((_, i) => i !== index));
  };

  const saveSelectedOptions = async (listingId: string, categoryId: string, selectedOptionLabels: string[]) => {
    if (selectedOptionLabels.length === 0) {
      return;
    }

    const { data: optionsData, error: optionsError } = await supabase
      .from('service_option_groups')
      .select('service_options(id, label)')
      .eq('category_id', categoryId);

    const fetchedServiceOptions = (optionsData ?? [])
      .flatMap((group: any) => group.service_options ?? []);
    const fetchedOptionLabels = fetchedServiceOptions.map((option: any) => option.label);
    const missingLabels = selectedOptionLabels.filter(
      (label) => !fetchedOptionLabels.includes(label)
    );

    if (optionsError) {
      console.error('Greška pri dohvaćanju service_options za odabrane opcije oglasa:', {
        selectedOptionLabels,
        fetchedServiceOptions,
        missingLabels: selectedOptionLabels,
        supabaseInsertError: optionsError,
      });
      return;
    }

    if (missingLabels.length > 0) {
      console.error('Neke odabrane opcije nisu pronađene u service_options i neće blokirati spremanje oglasa:', {
        selectedOptionLabels,
        fetchedServiceOptions,
        missingLabels,
        supabaseInsertError: null,
      });
    }

    const optionIds = Array.from(new Set(
      fetchedServiceOptions
        .filter((option: any) => selectedOptionLabels.includes(option.label))
        .map((option: any) => option.id)
    ));

    if (optionIds.length === 0) {
      return;
    }

    const selectedOptionsRows = optionIds.map((optionId) => ({
      listing_id: listingId,
      option_id: optionId,
    }));

    const { error: selectedOptionsError } = await supabase
      .from('listing_selected_options')
      .insert(selectedOptionsRows);

    if (selectedOptionsError) {
      console.error('Greška pri unosu listing_selected_options; oglas i slike nastavljaju se spremati bez blokiranja modala:', {
        selectedOptionLabels,
        fetchedServiceOptions,
        missingLabels,
        supabaseInsertError: selectedOptionsError,
      });
    }
  };

  const handleSubmit = async (filesToUpload = selectedFiles) => {
    setSubmitError('');
    setSubmitSuccess(false);
    setIsSubmitting(true);

    const priceFrom = Number.parseFloat(formData.price.replace(',', '.'));
    const selectedCity = formData.locations[0] || editListing?.city || '';

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Greška pri dohvaćanju prijavljenog korisnika:', userError);
      setSubmitError('Došlo je do greške pri provjeri prijave. Pokušajte ponovno.');
      setIsSubmitting(false);
      return;
    }

    if (!userData.user) {
      setSubmitError('Za objavu oglasa morate biti prijavljeni.');
      setIsSubmitting(false);
      return;
    }

    let listingIdForImages: string | null = null;
    const selectedOptionLabels = [
      ...(formData.specialization ?? []),
      ...(formData.methods ?? []),
      ...(formData.services ?? []),
      ...(formData.workTypes.includes('teren') ? ['Dolazak u dom / teren'] : []),
      ...(formData.workTypes.includes('ustanova') ? ['Rad u ustanovi / ordinaciji'] : []),
    ];

    if (isEditMode && editListing?.id) {
      const { error: updateError } = await supabase
        .from('provider_listings')
        .update({
          title: formData.name,
          description: formData.description,
          price_from: Number.isFinite(priceFrom) ? priceFrom : 0,
          price_unit: 'EUR',
          city: selectedCity,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editListing.id);

      if (updateError) {
        console.error('Greška pri ažuriranju oglasa u Supabase:', updateError);
        setSubmitError('Greška pri ažuriranju oglasa.');
        setIsSubmitting(false);
        return;
      }

      listingIdForImages = editListing.id;

      const { data: category, error: categoryError } = await supabase
        .from('service_categories')
        .select('id')
        .eq('slug', formData.type)
        .maybeSingle();

      if (categoryError) {
        console.error('Greška pri dohvaćanju kategorije za ažuriranje opcija oglasa:', categoryError);
      }

      const { error: deleteOptionsError } = await supabase
        .from('listing_selected_options')
        .delete()
        .eq('listing_id', editListing.id);

      if (deleteOptionsError) {
        console.error('Greška pri brisanju postojećih listing_selected_options; spremanje oglasa se nastavlja:', deleteOptionsError);
      }

      if (category?.id) {
        await saveSelectedOptions(editListing.id, category.id, selectedOptionLabels);
      }
    } else {
      const { data: providerProfile, error: providerProfileError } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (providerProfileError) {
        console.error('Greška pri dohvaćanju provider profila:', providerProfileError);
        setSubmitError('Došlo je do greške pri pronalasku profila pružatelja usluge.');
        setIsSubmitting(false);
        return;
      }

      if (!providerProfile?.id) {
        setSubmitError('Vaš korisnički račun još nema profil pružatelja usluge.');
        setIsSubmitting(false);
        return;
      }

      const { data: category, error: categoryError } = await supabase
        .from('service_categories')
        .select('id')
        .eq('slug', formData.type)
        .maybeSingle();

      if (categoryError) {
        console.error('Greška pri dohvaćanju kategorije:', categoryError);
        setSubmitError('Došlo je do greške pri odabiru kategorije. Pokušajte ponovno.');
        setIsSubmitting(false);
        return;
      }

      if (!category?.id) {
        setSubmitError('Odabrana kategorija trenutno nije dostupna.');
        setIsSubmitting(false);
        return;
      }

      const generatedSlug = generateListingSlug(formData.name);

      const { data: insertedListing, error: listingError } = await supabase
        .from('provider_listings')
        .insert({
          title: formData.name,
          slug: generatedSlug,
          description: formData.description,
          city: formData.locations[0] || '',
          price_from: Number.isFinite(priceFrom) ? priceFrom : 0,
          price_unit: 'EUR',
          category_id: category.id,
          provider_profile_id: providerProfile.id,
        })
        .select('id')
        .single();

      if (listingError || !insertedListing?.id) {
        console.error('Greška pri unosu oglasa u Supabase:', listingError);
        setSubmitError('Došlo je do greške pri spremanju oglasa. Pokušajte ponovno.');
        setIsSubmitting(false);
        return;
      }

      listingIdForImages = insertedListing.id;

      await saveSelectedOptions(insertedListing.id, category.id, selectedOptionLabels);
    }

    let hasUploadError = false;

    if (filesToUpload.length > 0 && listingIdForImages) {
      setIsUploading(true);
      try {
        if (isEditMode && editListing?.id) {
          await supabase
            .from('listing_images')
            .delete()
            .eq('listing_id', editListing.id);
        }

        for (let i = 0; i < filesToUpload.length; i += 1) {
          const file = filesToUpload[i];
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `${listingIdForImages}/${Date.now()}-${sanitizedName}`;

          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(storagePath, file, { upsert: false });

          if (uploadError) {
            throw uploadError;
          }

          const { data: urlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(storagePath);

          if (!urlData?.publicUrl) {
            continue;
          }

          await supabase.from('listing_images').insert({
            listing_id: listingIdForImages,
            image_url: urlData.publicUrl,
            storage_path: storagePath,
            is_primary: i === 0,
            display_order: i,
          });
        }
      } catch (err) {
        hasUploadError = true;
        console.error('Greška pri uploadu slika:', err);
        setSubmitError('Greška pri uploadu slike. Oglas je spremljen bez fotografije.');
      } finally {
        setIsUploading(false);
      }
    }

    if (hasUploadError) {
      setSubmitError('Greška pri uploadu slike. Oglas je spremljen bez fotografije.');
    }

    setSubmitSuccess(true);
    setIsSubmitting(false);
  };

  const handleSkipAndSubmit = async () => {
    uploadPreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setUploadPreviews([]);
    await handleSubmit([]);
  };

  const handleSubmitWithImages = async () => {
    await handleSubmit(selectedFiles);
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  useEffect(() => {
    if (isOpen) {
      setSubmitSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editListing) {
      setFormData(prev => ({
        ...prev,
        name: editListing.title ?? '',
        description: editListing.description ?? '',
        price: String(editListing.price_from ?? ''),
        type: editListing.category_slug ?? 'fizioterapeut',
        locations: editListing.city ? [editListing.city] : prev.locations,
      }));
      setStep(2);
    }
  }, [editListing]);

  useEffect(() => () => {
    uploadPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [uploadPreviews]);

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
            data-testid="create-listing-modal"
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                {step > (isEditMode ? 2 : 1) && (
                  <button onClick={prevStep} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                  </button>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Uredi oglas' : 'Objavi oglas'}</h2>
                  <p className="text-sm text-slate-500">Korak {step} od 4</p>
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
                  <div className="grid grid-cols-1 gap-4" data-testid="category-selection">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        data-testid={`category-${cat.id}`}
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

              {step === 2 && formData.type === 'fizioterapeut' && (
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

              {step === 2 && formData.type === 'kucna-njega' && (
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



              {step === 2 && formData.type === 'najam-opreme' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Odaberite opremu koju nudite</h3>
                  <div className="space-y-3">
                    {equipmentOptions.map(option => (
                      <label key={option} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.services.includes(option) ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.services.includes(option)}
                          onChange={() => toggleSelection(formData.services, option, 'services')}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="font-medium text-slate-900">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && formData.type === 'sanitetski-prijevoz' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Odaberite vrstu prijevoza</h3>
                  <div className="space-y-3">
                    {transportOptions.map(option => (
                      <label key={option} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.services.includes(option) ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.services.includes(option)}
                          onChange={() => toggleSelection(formData.services, option, 'services')}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="font-medium text-slate-900">{option}</span>
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
                        data-testid="input-title"
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
                        {formData.type === 'najam-opreme' ? 'Cijena (npr. 5€/dan)' : 'Cijena (npr. 30€/h)'}
                      </label>
                      <div className="relative">
                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          data-testid="input-price"
                          required
                          type="text"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder={formData.type === 'najam-opreme' ? '5€/dan' : '30€/h'}
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Lokacije (Županije - označite sve gdje nudite uslugu)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl" data-testid="input-city">
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
                      data-testid="input-description"
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

              {step === 4 && (
                submitSuccess ? (
                  <div
                    data-testid="listing-submit-success"
                    className="flex flex-col items-center justify-center py-12 text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {isEditMode ? 'Izmjene su poslane na pregled!' : 'Oglas je poslan na pregled!'}
                    </h3>
                    <p className="text-slate-500 text-sm max-w-xs">
                      {isEditMode
                        ? 'Vaše izmjene čekaju odobrenje administratora.'
                        : 'Vaš oglas je uspješno kreiran i čeka odobrenje administratora.'}
                    </p>
                    <button
                      type="button"
                      data-testid="listing-success-close"
                      onClick={() => { onSubmit(); onClose(); }}
                      className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      Zatvori
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Dodajte fotografije <span className="text-sm font-normal text-slate-500">(neobavezno)</span></h3>
                      <p className="text-sm text-slate-500 mt-2">Maksimalno 3 fotografije. Prva fotografija bit će naslovna.</p>
                    </div>
                    <label
                      data-testid="image-upload-label"
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <input
                        data-testid="image-upload-input"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-slate-400" />
                      <span className="font-semibold text-slate-700">Odaberite fotografije</span>
                    </label>

                    {uploadPreviews.length > 0 && (
                      <div data-testid="image-upload-preview" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {uploadPreviews.map((src, i) => (
                          <div key={src} className="border border-slate-200 rounded-xl p-3 space-y-2">
                            <img src={src} alt={`Preview ${i + 1}`} className="w-full h-28 object-cover rounded-lg" />
                            <button
                              type="button"
                              data-testid={`remove-image-${i}`}
                              onClick={() => removeImage(i)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              Ukloni
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {submitError && (
              <div className="px-6 py-3 border-t border-slate-100 bg-white">
                <p className="text-sm text-red-600" data-testid="error-message">{submitError}</p>
              </div>
            )}

            {/* Footer */}
            {!submitSuccess && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center sticky bottom-0 z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
              >
                Odustani
              </button>
              <div className="flex gap-3">
                {step > (isEditMode ? 2 : 1) && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Prethodno
                  </button>
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    data-testid="next-step"
                    className="px-8 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                  >
                    Dalje
                  </button>
                ) : (
                  <>
                  <button
                    type="button"
                    onClick={handleSkipAndSubmit}
                    data-testid="skip-image-upload"
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Preskočite za sada
                  </button>
                  <button
                    onClick={handleSubmitWithImages}
                    disabled={isSubmitting || isUploading}
                    data-testid="submit-listing"
                    className="px-8 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                  >
                    {isUploading ? 'Učitavanje slika...' : isSubmitting ? 'Objavljujem...' : isEditMode ? 'Spremi izmjene' : 'Objavi oglas'}
                  </button>
                  </>
                )}
              </div>
            </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
