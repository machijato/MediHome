import React from 'react';
import { Activity, HeartPulse, Package } from 'lucide-react';
import { Navbar } from '../Navbar';

interface LegalSection {
  title: string;
  paragraphs?: string[];
  listItems?: string[];
}

interface LegalPageLayoutProps {
  title: string;
  sections: LegalSection[];
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, sections }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onPostAdClick={() => {}} />

      <main className="flex-1 py-12 sm:py-16 px-4">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-10">{title}</h1>

          <div className="space-y-10 text-slate-700 leading-relaxed text-base sm:text-lg">
            {sections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.listItems && (
                  <ul className="list-disc pl-6 space-y-2">
                    {section.listItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="pt-8 border-t border-slate-100 flex flex-col md:row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs">© 2024 MediHome. Sva prava pridržana.</p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Activity className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors"><HeartPulse className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Package className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
