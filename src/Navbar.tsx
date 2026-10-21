import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { MapPin, User, Menu, X, PlusCircle } from 'lucide-react';
import { NotificationBell } from './components/NotificationBell';

interface NavbarProps {
  onPostAdClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  user?: any;
  isAdmin?: boolean;
}

const NAV_LINKS = [
  { to: '/o-nama', label: 'O nama', testId: 'nav-about-link' },
  { to: '/clanci', label: 'Blog', testId: 'nav-blog-link' },
];

export const Navbar: React.FC<NavbarProps> = ({ onPostAdClick, onLoginClick, onLogoutClick, user, isAdmin = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Izbornik na mobitelu zatvara se pri promjeni stranice.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" data-testid="navbar-logo-link" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
              MediHome
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 mr-auto ml-8" data-testid="main-nav">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                data-testid={link.testId}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onPostAdClick}
              data-testid="open-create-listing"
              className="hidden lg:flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-full transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-5 h-5" />
              Objavi oglas
            </button>
            {user && <NotificationBell user={user} isAdmin={isAdmin} />}
            {user ? (
              <div data-testid="auth-user-chip" className="flex items-center gap-3 px-4 py-2 bg-slate-200 rounded-full">
                <span className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</span>
                <Link
                  to="/moj-profil"
                  data-testid="nav-my-profile-link"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Moj profil
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    data-testid="nav-admin-link"
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={onLogoutClick}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Odjava
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                data-testid="open-auth-modal"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="font-medium hidden sm:block">Prijava</span>
              </button>
            )}
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <MapPin className="w-6 h-6" />
            </button>
            <button
              type="button"
              data-testid="mobile-menu-toggle"
              aria-label={menuOpen ? 'Zatvori izbornik' : 'Otvori izbornik'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="md:hidden p-2 text-slate-600"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div data-testid="mobile-menu" className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`mobile-${link.testId}`}
              className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            data-testid="mobile-open-create-listing"
            onClick={() => {
              setMenuOpen(false);
              onPostAdClick();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-primary text-white font-bold rounded-xl"
          >
            <PlusCircle className="w-5 h-5" />
            Objavi oglas
          </button>
        </div>
      )}
    </nav>
  );
};
