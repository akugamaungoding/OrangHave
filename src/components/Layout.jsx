import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';
import NasaSplashScreen from './NasaSplashScreen';
import MissionBriefModal from './MissionBriefModal';

/**
 * Main Layout component for H.O.M.E. (NASA Space Apps "Dancing with the SARs" Edition)
 * Provides:
 * - Cinematic Orbital & SAR Handshake Splash Screen (with replay capability)
 * - NASA Judge & Pitch Brief Modal
 * - Storybook paper texture background throughout
 * - Skip to main content accessibility link
 * - Sticky responsive navigation with SoundToggle and mobile drawer
 * - Main viewport container supporting either direct children or nested Router <Outlet />
 * - Comprehensive footer with partner attributions and donation disclaimers
 */
export default function Layout({ children }) {
  const { pathname } = useLocation();
  const hideFooter = pathname === '/map' || pathname.startsWith('/map/');
  const [forceSplash, setForceSplash] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  const handleReplaySplash = () => {
    setForceSplash(true);
  };

  return (
    <div className="paper-texture min-h-screen flex flex-col text-charcoal-800 antialiased selection:bg-amber-200 selection:text-charcoal-900">
      {/* Cinematic NASA Orbital & SAR Splash Screen */}
      <NasaSplashScreen
        forceOpen={forceSplash}
        onComplete={() => setForceSplash(false)}
      />

      {/* NASA Judge & Pitch Brief Modal */}
      <MissionBriefModal
        isOpen={briefOpen}
        onClose={() => setBriefOpen(false)}
        onReplaySplash={handleReplaySplash}
      />

      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-moss-700 focus:text-cream-50 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-sm transition-all"
      >
        Skip to main content
      </a>

      {/* Responsive Navigation Header */}
      <Navigation
        onOpenBrief={() => setBriefOpen(true)}
        onReplaySplash={handleReplaySplash}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex="-1"
        className="flex-1 w-full focus:outline-none"
      >
        {children || <Outlet />}
      </main>

      {/* Storybook Footer (hidden on /map for full-viewport map experience) */}
      {!hideFooter && <Footer />}
    </div>
  );
}
