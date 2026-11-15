import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link } from 'react-router-dom';
import { t } from '../i18n';
import SoundToggle from './SoundToggle';

const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.home', icon: '🏡' },
  { path: '/game', labelKey: 'nav.game', icon: '🎮' },
  { path: '/map', labelKey: 'nav.map', icon: '🗺️' },
];

export default function Navigation({ onOpenBrief, onReplaySplash }) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef(null);
  const hamburgerButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Handle ESC key to close drawer and restore focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        hamburgerButtonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-t-[3px] border-t-[#18442e] border-b border-[#d8cbb2] bg-gradient-to-r from-[#fbf7ee]/95 via-[#f6efdf]/95 to-[#fbf7ee]/95 shadow-[0_6px_24px_rgba(24,68,46,0.08)] backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

        {/* Brand Logo & Tagline */}
        <Link
          to="/"
          className="group flex items-center gap-3 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5e3a]"
          aria-label="H.O.M.E. — Return to homepage"
        >
          {/* Logo: maskot H.O.M.E. (sama dengan favicon) */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#faf6ee] ring-2 ring-[#c89d54]/45 shadow-sm transition-transform duration-200 group-hover:scale-105">
            <img
              src="/icons/icon-192.png"
              alt=""
              aria-hidden="true"
              width="40"
              height="40"
              className="h-9 w-9 object-contain select-none"
              draggable="false"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-hand text-2xl font-bold leading-none tracking-wide text-[#18442e] transition-colors group-hover:text-[#1b5e3a]">
                H.O.M.E.
              </span>
              <span className="hidden lg:inline-block rounded-full border border-[#c89d54]/50 bg-[#f0e5cf] px-1.5 py-0.5 font-mono text-[8.5px] font-bold tracking-wider text-[#6e5128] uppercase">
                NASA EO
              </span>
            </div>
            <span className="hidden sm:inline font-serif text-[10.5px] leading-tight tracking-wide text-[#5c5346] max-w-[15rem]">
              {t('meta.expanded')}
            </span>
          </div>
        </Link>

        {/* Desktop & Tablet Pill Navigation */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full border border-[#d6c8ad] bg-[#efe6d3]/85 p-1 shadow-inner"
          aria-label="Primary Navigation"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs lg:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#18442e] text-[#faf6ee] shadow-sm'
                    : 'text-[#443c32] hover:bg-[#faf6ee]/80 hover:text-[#18442e]'
                }`
              }
            >
              <span className="text-xs leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <SoundToggle inline />

          {/* Mobile / Tablet Hamburger Toggle */}
          <button
            ref={hamburgerButtonRef}
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="xl:hidden inline-flex items-center justify-center p-2 rounded-lg text-charcoal-700 hover:bg-cream-200 hover:text-charcoal-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss-600 cursor-pointer"
          >
            <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
            <div className="w-5 h-5 relative flex items-center justify-center">
              <span
                className={`absolute h-0.5 w-5 bg-charcoal-800 rounded transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                  }`}
              />
              <span
                className={`absolute h-0.5 w-5 bg-charcoal-800 rounded transition-all duration-200 ${isOpen ? 'opacity-0' : 'opacity-100'
                  }`}
              />
              <span
                className={`absolute h-0.5 w-5 bg-charcoal-800 rounded transition-all duration-300 ${isOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
                  }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/*
        Laci menu mobile dirender lewat portal ke <body>. Header memakai backdrop-blur, dan
        backdrop-filter membuat elemen `fixed` di dalamnya diposisikan relatif ke header —
        akibatnya laci yang tersembunyi (translate-x-full) ikut memperlebar halaman di HP.
      */}
      {createPortal(
      <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-950/40 backdrop-blur-xs transition-opacity xl:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer (Slide in from Right) */}
      <aside
        id="mobile-navigation-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-xs bg-paper-warm border-l border-paper-edge p-6 shadow-2xl transition-transform duration-300 ease-out xl:hidden flex flex-col justify-between overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
      >
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-paper-edge">
            <div className="flex items-center gap-2">
              <span className="font-hand text-2xl font-bold text-moss-900">H.O.M.E.</span>
              <span className="text-xs text-charcoal-500 font-serif">Storybook Menu</span>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss-600 cursor-pointer"
              aria-label="Close navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <nav className="mt-6 flex flex-col gap-1.5" aria-label="Mobile Navigation Links">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-base font-medium transition-colors ${isActive
                    ? 'bg-moss-100 text-moss-900 font-semibold border-l-4 border-moss-600'
                    : 'text-charcoal-700 hover:bg-cream-200 hover:text-charcoal-900'
                  }`
                }
              >
                <span>{t(item.labelKey)}</span>
                <span className="text-xs text-moss-700 opacity-60">→</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Drawer Footer Disclaimer & Sound */}
        <div className="pt-6 mt-6 border-t border-paper-edge flex flex-col gap-3">
          {onOpenBrief && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenBrief();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-charcoal-950 border border-sky-500/40 px-4 py-2.5 text-xs font-mono font-semibold text-sky-300 hover:bg-charcoal-900 cursor-pointer"
            >
              <span>🛰️ Open NASA Judge Brief &amp; Logic Trail</span>
            </button>
          )}
          {onReplaySplash && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onReplaySplash();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-moss-600/40 bg-cream-100 px-4 py-2 text-xs font-semibold text-moss-900 hover:bg-cream-200 cursor-pointer"
            >
              <span>▶ Replay 3D Orbital Splash</span>
            </button>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-charcoal-600">Ambient Atmosphere:</span>
            <SoundToggle />
          </div>
          <p className="text-[11px] leading-relaxed text-charcoal-500 italic">
            "{t('meta.tagline')}"
          </p>
        </div>
      </aside>
      </>,
      document.body,
      )}
    </header>
  );
}
