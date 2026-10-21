import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BLOCKED_ERROR_MESSAGE, isBlockedError } from '../lib/blocked';
import { REPORT_REASONS, Review, replyOf } from './types';

export type MyReport = { review_id: string; status: 'open' | 'accepted' | 'rejected'; reason: string };

const REPORT_STATUS_LABEL: Record<MyReport['status'], string> = {
  open: 'Prijava je poslana i čeka pregled administratora.',
  accepted: 'Prijava je prihvaćena, recenzija je uklonjena ili ispravljena.',
  rejected: 'Prijava je odbijena, recenzija ostaje objavljena.',
};

export function OwnerActions({ review, report, onChanged }: { review: Review; report?: MyReport; onChanged: () => Promise<void> }) {
  const reply = replyOf(review);
  const [mode, setMode] = useState<'none' | 'reply' | 'report'>('none');
  const [replyText, setReplyText] = useState(reply?.reply_text ?? '');
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const saveReply = async () => {
    const text = replyText.trim();
    if (!text) {
      setMessage('Upišite tekst odgovora.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { error } = await supabase.from('review_replies').upsert({ review_id: review.id, reply_text: text }, { onConflict: 'review_id' });
    setBusy(false);
    if (error) {
      console.error('[owner-reviews] reply failed:', error.message);
      setMessage(isBlockedError(error) ? BLOCKED_ERROR_MESSAGE : 'Odgovor nije moguće spremiti. Pokušajte ponovno.');
      return;
    }
    setMode('none');
    await onChanged();
  };

  const deleteReply = async () => {
    setBusy(true);
    const { error } = await supabase.from('review_replies').delete().eq('review_id', review.id);
    setBusy(false);
    if (error) {
      setMessage(isBlockedError(error) ? BLOCKED_ERROR_MESSAGE : 'Odgovor nije moguće obrisati.');
      return;
    }
    setReplyText('');
    await onChanged();
  };

  const sendReport = async () => {
    setBusy(true);
    setMessage('');
    const { error } = await supabase
      .from('review_reports')
      .insert({ review_id: review.id, reason, details: details.trim() === '' ? null : details.trim() });
    setBusy(false);
    if (error) {
      console.error('[owner-reviews] report failed:', error.message);
      setMessage(error.code === '23505' ? 'Ovu recenziju ste već prijavili.' : isBlockedError(error) ? BLOCKED_ERROR_MESSAGE : 'Prijavu nije moguće poslati. Pokušajte ponovno.');
      return;
    }
    setMode('none');
    setDetails('');
    await onChanged();
  };

  return (
    <div className="mt-3 space-y-3">
      {report && (
        <p data-testid="owner-report-status" className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          {REPORT_STATUS_LABEL[report.status]}
        </p>
      )}

      {mode === 'none' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="owner-reply-open"
            onClick={() => setMode('reply')}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-primary/40 hover:text-primary"
          >
            {reply ? 'Uredi odgovor' : 'Odgovori'}
          </button>
          {reply && (
            <button
              type="button"
              onClick={deleteReply}
              disabled={busy}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-red-200 hover:text-red-600"
            >
              Obriši odgovor
            </button>
          )}
          {!report && (
            <button
              type="button"
              data-testid="owner-report-open"
              onClick={() => setMode('report')}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-red-200 hover:text-red-600"
            >
              Prijavi recenziju
            </button>
          )}
        </div>
      )}

      {mode === 'reply' && (
        <div className="space-y-2">
          <textarea
            data-testid="owner-reply-input"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Vaš javni odgovor na recenziju"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <p className="text-xs text-slate-500">Odgovor je javno vidljiv. Ne upisujte zdravstvene podatke korisnika.</p>
          <div className="flex gap-2">
            <button type="button" data-testid="owner-reply-save" onClick={saveReply} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white disabled:opacity-60">
              {busy ? 'Spremanje...' : 'Spremi odgovor'}
            </button>
            <button type="button" onClick={() => setMode('none')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700">Odustani</button>
          </div>
        </div>
      )}

      {mode === 'report' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor={`report-reason-${review.id}`}>Razlog prijave</label>
          <select
            id={`report-reason-${review.id}`}
            data-testid="owner-report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <textarea
            data-testid="owner-report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Objašnjenje za administratora (nije obavezno)"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <div className="flex gap-2">
            <button type="button" data-testid="owner-report-send" onClick={sendReport} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white disabled:opacity-60">
              {busy ? 'Slanje...' : 'Pošalji prijavu'}
            </button>
            <button type="button" onClick={() => setMode('none')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700">Odustani</button>
          </div>
        </div>
      )}

      {message && <p role="alert" className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
