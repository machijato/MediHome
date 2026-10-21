import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Slot = { id: string; key: string; name: string | null; width_px: number | null; height_px: number | null };
type Creative = { id: string; image_url: string | null; target_url: string | null; alt_text: string | null };
type Campaign = {
  id: string;
  slot_id: string | null;
  campaign_name: string | null;
  advertiser_name: string | null;
  advertiser_contact: string | null;
  status: string | null;
  is_active: boolean | null;
  start_at: string | null;
  end_at: string | null;
  ad_creatives: Creative[] | null;
};

type FormState = {
  slotId: string;
  campaignName: string;
  advertiserName: string;
  advertiserContact: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  targetUrl: string;
  altText: string;
};

const emptyForm = (slotId = ''): FormState => ({
  slotId,
  campaignName: '',
  advertiserName: '',
  advertiserContact: '',
  startDate: '',
  endDate: '',
  imageUrl: '',
  targetUrl: '',
  altText: '',
});

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

// Slika može biti puni https URL ili datoteka s vlastite stranice (npr. /ads/baner.jpg).
export function isValidImageUrl(value: string): boolean {
  return isHttpsUrl(value) || /^\/[A-Za-z0-9._\-/]+$/.test(value);
}

export function campaignState(c: Pick<Campaign, 'status' | 'is_active' | 'start_at' | 'end_at'>, now = new Date()): 'live' | 'paused' | 'scheduled' | 'ended' {
  if (!c.is_active || c.status !== 'active') return 'paused';
  if (c.start_at && new Date(c.start_at) > now) return 'scheduled';
  if (c.end_at && new Date(c.end_at) < now) return 'ended';
  return 'live';
}

const STATE_LABEL: Record<ReturnType<typeof campaignState>, string> = {
  live: 'Aktivna',
  paused: 'Pauzirana',
  scheduled: 'Zakazana',
  ended: 'Završila',
};

const fmtDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('hr-HR') : '–');

export function AdminAds() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [slotsRes, campaignsRes] = await Promise.all([
      supabase.from('ad_slots').select('id, key, name, width_px, height_px').order('key'),
      supabase
        .from('ad_campaigns')
        .select('id, slot_id, campaign_name, advertiser_name, advertiser_contact, status, is_active, start_at, end_at, ad_creatives(id, image_url, target_url, alt_text)')
        .order('created_at', { ascending: false }),
    ]);
    if (slotsRes.error || campaignsRes.error) {
      console.error('[admin-ads] load failed:', slotsRes.error?.message ?? campaignsRes.error?.message);
      setLoadError(true);
      setLoading(false);
      return;
    }
    setLoadError(false);
    setSlots((slotsRes.data ?? []) as Slot[]);
    setCampaigns((campaignsRes.data ?? []) as unknown as Campaign[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const slotName = (id: string | null) => {
    const slot = slots.find((s) => s.id === id);
    return slot ? `${slot.name ?? slot.key}${slot.width_px ? ` (${slot.width_px}×${slot.height_px} px)` : ''}` : '–';
  };

  const setActive = async (campaign: Campaign, active: boolean) => {
    setActionError('');
    const { data, error } = await supabase
      .from('ad_campaigns')
      .update({ is_active: active, status: active ? 'active' : 'paused', updated_at: new Date().toISOString() })
      .eq('id', campaign.id)
      .select('id');
    if (error || !data || data.length === 0) {
      console.error('[admin-ads] toggle failed:', error?.message ?? 'no rows');
      setActionError('Promjena kampanje nije uspjela.');
      return;
    }
    await load();
  };

  const remove = async (campaign: Campaign) => {
    if (!window.confirm(`Trajno obrisati kampanju „${campaign.campaign_name ?? 'bez naziva'}“ i njezine banere?`)) return;
    setActionError('');
    const creativesRes = await supabase.from('ad_creatives').delete().eq('campaign_id', campaign.id);
    const campaignRes = creativesRes.error ? null : await supabase.from('ad_campaigns').delete().eq('id', campaign.id).select('id');
    if (creativesRes.error || !campaignRes || campaignRes.error || !campaignRes.data || campaignRes.data.length === 0) {
      console.error('[admin-ads] delete failed:', creativesRes.error?.message ?? campaignRes?.error?.message ?? 'no rows');
      setActionError('Brisanje kampanje nije uspjelo.');
      return;
    }
    await load();
  };

  const validate = (): string => {
    if (!form.slotId) return 'Odaberite mjesto prikaza.';
    if (!form.campaignName.trim()) return 'Upišite naziv kampanje.';
    if (!form.startDate || !form.endDate) return 'Upišite datum početka i završetka.';
    if (new Date(form.endDate) < new Date(form.startDate)) return 'Datum završetka mora biti nakon datuma početka.';
    if (!isValidImageUrl(form.imageUrl.trim())) return 'Adresa slike mora biti https poveznica ili datoteka s ove stranice (npr. /ads/baner.jpg).';
    if (!isHttpsUrl(form.targetUrl.trim())) return 'Odredišna poveznica mora počinjati s https://.';
    if (!form.altText.trim()) return 'Upišite opis slike (alt tekst).';
    return '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setFormError(problem);
    if (problem) return;

    setSaving(true);
    const startAt = new Date(`${form.startDate}T00:00:00`).toISOString();
    const endAt = new Date(`${form.endDate}T23:59:59`).toISOString();
    const { data: created, error: campaignError } = await supabase
      .from('ad_campaigns')
      .insert({
        slot_id: form.slotId,
        campaign_name: form.campaignName.trim(),
        advertiser_name: form.advertiserName.trim() || null,
        advertiser_contact: form.advertiserContact.trim() || null,
        status: 'active',
        is_active: true,
        start_at: startAt,
        end_at: endAt,
        priority: 1,
        rotation_interval_seconds: 5,
      })
      .select('id')
      .maybeSingle();

    if (campaignError || !created) {
      console.error('[admin-ads] create campaign failed:', campaignError?.message);
      setSaving(false);
      setFormError('Kampanju nije moguće spremiti.');
      return;
    }

    const { error: creativeError } = await supabase.from('ad_creatives').insert({
      campaign_id: created.id,
      title: form.campaignName.trim(),
      image_url: form.imageUrl.trim(),
      target_url: form.targetUrl.trim(),
      alt_text: form.altText.trim(),
      weight: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    if (creativeError) {
      console.error('[admin-ads] create creative failed:', creativeError.message);
      // Ne ostavljamo kampanju bez banera: pauziramo je da se ne prikazuje prazna.
      await supabase.from('ad_campaigns').update({ is_active: false, status: 'paused' }).eq('id', created.id);
      setSaving(false);
      setFormError('Kampanja je spremljena, ali baner nije; kampanja je pauzirana. Pokušajte ponovno.');
      await load();
      return;
    }

    setSaving(false);
    setShowForm(false);
    setForm(emptyForm());
    await load();
  };

  const input = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm';

  return (
    <section data-testid="admin-ads" className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reklame</h2>
          <p className="text-sm text-slate-500">Kampanje i baneri koji se prikazuju na stranici. Plaćeni sadržaj uvijek se prikazuje s oznakom „Oglas“.</p>
        </div>
        <button
          type="button"
          data-testid="admin-ads-new"
          onClick={() => {
            setShowForm((v) => !v);
            setForm(emptyForm(slots[0]?.id ?? ''));
            setFormError('');
          }}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90"
        >
          {showForm ? 'Zatvori' : 'Nova kampanja'}
        </button>
      </div>

      {actionError && <p data-testid="admin-ads-error" className="text-sm text-red-600">{actionError}</p>}

      {showForm && (
        <form data-testid="admin-ads-form" onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700 space-y-1">
              Mjesto prikaza
              <select data-testid="ad-form-slot" className={input} value={form.slotId} onChange={(e) => setForm({ ...form, slotId: e.target.value })}>
                <option value="">Odaberite…</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>{s.name ?? s.key}{s.width_px ? ` (${s.width_px}×${s.height_px} px)` : ''}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 space-y-1">
              Naziv kampanje
              <input data-testid="ad-form-name" className={input} value={form.campaignName} onChange={(e) => setForm({ ...form, campaignName: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700 space-y-1">
              Oglašivač (nije obavezno)
              <input data-testid="ad-form-advertiser" className={input} value={form.advertiserName} onChange={(e) => setForm({ ...form, advertiserName: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700 space-y-1">
              Kontakt oglašivača (nije obavezno)
              <input data-testid="ad-form-contact" className={input} value={form.advertiserContact} onChange={(e) => setForm({ ...form, advertiserContact: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700 space-y-1">
              Početak
              <input data-testid="ad-form-start" type="date" className={input} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700 space-y-1">
              Završetak
              <input data-testid="ad-form-end" type="date" className={input} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700 space-y-1 sm:col-span-2">
              Adresa slike banera (https://… ili /ads/datoteka.jpg)
              <input data-testid="ad-form-image" className={input} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700 space-y-1 sm:col-span-2">
              Odredišna poveznica (https://…)
              <input data-testid="ad-form-target" className={input} value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700 space-y-1 sm:col-span-2">
              Opis slike (alt tekst)
              <input data-testid="ad-form-alt" className={input} value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} />
            </label>
          </div>
          {isValidImageUrl(form.imageUrl.trim()) && (
            <img data-testid="ad-form-preview" src={form.imageUrl.trim()} alt="Pregled banera" className="max-w-full h-auto max-h-32 rounded-lg border border-slate-200" />
          )}
          {formError && <p data-testid="ad-form-error" className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            data-testid="ad-form-save"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? 'Spremanje...' : 'Spremi kampanju'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Učitavanje...</p>
      ) : loadError ? (
        <p data-testid="admin-ads-load-error" className="text-sm text-red-600">Reklame nije moguće učitati.</p>
      ) : campaigns.length === 0 ? (
        <p data-testid="admin-ads-empty" className="text-sm text-slate-600">Nema kampanja. Nijedan baner se trenutno ne prikazuje.</p>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((campaign) => {
            const state = campaignState(campaign);
            const creative = campaign.ad_creatives?.[0];
            return (
              <li key={campaign.id} data-testid="admin-ad-campaign" className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
                {creative?.image_url && (
                  <img src={creative.image_url} alt={creative.alt_text ?? 'Baner'} className="w-full sm:w-48 h-auto max-h-24 object-contain rounded-lg border border-slate-100" />
                )}
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{campaign.campaign_name ?? 'Bez naziva'}</p>
                  <p className="text-sm text-slate-500">
                    {slotName(campaign.slot_id)} · {fmtDate(campaign.start_at)} – {fmtDate(campaign.end_at)}
                    {campaign.advertiser_name ? ` · ${campaign.advertiser_name}` : ''}
                  </p>
                  {creative?.target_url && <p className="text-xs text-slate-400 truncate">{creative.target_url}</p>}
                  <span
                    data-testid="admin-ad-state"
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      state === 'live' ? 'bg-emerald-100 text-emerald-700' : state === 'paused' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {STATE_LABEL[state]}
                  </span>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="admin-ad-toggle"
                    onClick={() => setActive(campaign, !(campaign.is_active && campaign.status === 'active'))}
                    className="px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    {campaign.is_active && campaign.status === 'active' ? 'Pauziraj' : 'Aktiviraj'}
                  </button>
                  <button
                    type="button"
                    data-testid="admin-ad-delete"
                    onClick={() => remove(campaign)}
                    className="px-3 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Obriši
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
