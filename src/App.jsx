import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';

// Page Imports
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import GamePage from './pages/GamePage';
import GameHubPage from './pages/GameHubPage';
import MissionMapPage from './pages/MissionMapPage';
import KarhutlaArcadeGamePage from './pages/KarhutlaArcadeGamePage';

/**
 * ScrollToTop helper: scrolls window back to (0, 0) on route change
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Link dengan #anchor (mis. /#chapter-choice): gulir ke bagian itu setelah halaman dirender
    if (hash) {
      let tries = 0;
      const tryScroll = () => {
        const el = document.getElementById(hash.slice(1));
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
        } else if (tries < 20) {
          tries += 1;
          setTimeout(tryScroll, 100);
        }
      };
      tryScroll();
      return;
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname, hash]);

  return null;
}

/**
 * 404 Not Found Page
 */
function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <span className="text-6xl mb-4 block" role="img" aria-label="Forest leaf">
        🍃
      </span>
      <h1 className="font-hand text-6xl font-bold text-moss-900">404</h1>
      <p className="font-serif text-lg text-charcoal-700 mt-2 italic">
        The forest canopy is dense here. We couldn&apos;t find this page.
      </p>
      <a
        href="/"
        className="mt-6 inline-block rounded-xl bg-moss-700 px-6 py-3 text-sm font-semibold text-cream-50 hover:bg-moss-800 transition-colors shadow-xs"
      >
        Return to Tuki&apos;s Home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Pusat Misi: pilih game → peta misi Radar Rescue / Arcade Bom Air */}
          <Route path="/game" element={<GameHubPage />} />
          <Route path="/game/radar-rescue" element={<MissionMapPage />} />
          <Route path="/game/play" element={<GamePage />} />
          <Route path="/game/karhutla-arcade" element={<KarhutlaArcadeGamePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
