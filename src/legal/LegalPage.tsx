import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { LEGAL_DRAFT, LEGAL_UPDATED } from './operator';

type LegalPageProps = {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
};

export function LegalPage({ title, description, path, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title={title} description={description} canonicalPath={path} />
      <main data-testid="legal-page" className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <nav className="text-sm text-slate-500">
          <Link to="/" className="hover:text-primary">Početna</Link> <span aria-hidden>›</span> {title}
        </nav>
        <h1 data-testid="legal-page-title" className="text-4xl font-extrabold text-slate-900">{title}</h1>
        {LEGAL_DRAFT && (
          <div data-testid="legal-draft-banner" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <strong>Nacrt teksta.</strong> Ovaj dokument još nije pravno pregledan i nije konačan. Podaci označeni uglatim zagradama bit će dopunjeni prije objave.
          </div>
        )}
        <p className="text-sm text-slate-500">Zadnja izmjena: {LEGAL_UPDATED}</p>
        {children}
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-600 leading-relaxed">{children}</p>;
}

export function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-6 space-y-1.5 text-slate-600 leading-relaxed">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function MailLink({ email, subject }: { email: string; subject?: string }) {
  const href = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  return (
    <a className="text-primary font-semibold hover:underline" href={href}>
      {email}
    </a>
  );
}
