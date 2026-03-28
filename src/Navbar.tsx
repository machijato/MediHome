import React from 'react';
import { Search, MapPin, User, Menu, Heart, PlusCircle } from 'lucide-react';

interface NavbarProps {
  onPostAdClick: () => void;
  onAuthClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onPostAdClick, onAuthClick }) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
              MediHome
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onPostAdClick}
              className="hidden lg:flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-full transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-5 h-5" />
              Objavi oglas
            </button>
            <button onClick={onAuthClick} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors">
              <User className="w-5 h-5" />
              <span className="font-medium hidden sm:block">Prijava</span>
            </button>
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <MapPin className="w-6 h-6" />
            </button>
            <button className="md:hidden p-2 text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
