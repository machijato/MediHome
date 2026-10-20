import React from 'react';
import { ADMIN_CONTACT_EMAIL } from '../lib/contact';

export function BannedNotice({ what }: { what: 'listing' | 'review' }) {
  const subject = encodeURIComponent('Zahtjev za odblokiranje računa');
  return (
    <div data-testid="banned-notice" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p className="font-semibold mb-1">Vaš račun je blokiran.</p>
      <p>
        {what === 'listing' ? 'Ne možete objavljivati ni uređivati oglase.' : 'Ne možete ostavljati recenzije.'} Za odblokiranje obratite se administratoru na{' '}
        <a data-testid="banned-contact-link" className="underline font-semibold" href={`mailto:${ADMIN_CONTACT_EMAIL}?subject=${subject}`}>
          {ADMIN_CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
