export type ReviewAnswer = { question_id: string | null; question_text: string; score: number };

export type ReviewReply = { reply_text: string; created_at: string };

export type Review = {
  id: string;
  listing_id: string;
  reviewer_user_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  used_service_month: string;
  status: 'published' | 'hidden';
  edited_by_moderator: boolean;
  created_at: string;
  listing_review_answers: ReviewAnswer[];
  // Jedan odgovor po recenziji; PostgREST može vratiti objekt ili polje.
  review_replies: ReviewReply | ReviewReply[] | null;
};

export const REVIEW_SELECT =
  'id, listing_id, reviewer_user_id, reviewer_name, rating, comment, used_service_month, status, edited_by_moderator, created_at, listing_review_answers(question_id, question_text, score), review_replies(reply_text, created_at)';

export function replyOf(review: Review): ReviewReply | null {
  const r = review.review_replies;
  if (!r) return null;
  return Array.isArray(r) ? (r[0] ?? null) : r;
}

export const REPORT_REASONS: Array<{ value: string; label: string }> = [
  { value: 'nije_koristio_uslugu', label: 'Autor nije koristio uslugu' },
  { value: 'lazna_recenzija', label: 'Lažna ili namještena recenzija' },
  { value: 'neprimjeren_sadrzaj', label: 'Neprimjeren sadržaj' },
  { value: 'osobni_podaci', label: 'Sadrži osobne ili zdravstvene podatke' },
  { value: 'ostalo', label: 'Ostalo' },
];

export function reasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}
