import React from 'react';
import StoryPage from './StoryPage';
import ReachPage from './ReachPage';
import WildlifePage from './WildlifePage';
import ActionPage from './ActionPage';
import SciencePage from './SciencePage';
import { SectionDecor } from '../components';
import useScrollReveal from '../hooks/useScrollReveal';

/* ════════════════════════════════════════════════════════════════════
   H.O.M.E. — Home
   A full-screen welcome over an animated illustration (satellite radar
   watching a burning rainforest), then one continuous scroll:
   story → cross-border haze → wildlife → take action.
   ════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  useScrollReveal(['story', 'science', 'reach', 'wildlife', 'action']);

  return (
    <div>
      {/* ── Welcome ───────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[calc(100vh-4rem)] items-start justify-center overflow-hidden">
        <img
          src="/assets/art/hero-orbit-v2.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[88%_center] md:object-center"
        />
        <div className="mx-3 mt-[5vh] mb-16 max-w-4xl rounded-3xl bg-[#06120f]/40 px-4 py-6 text-center backdrop-blur-[3px] sm:px-6 md:mx-auto md:mt-[11vh] md:bg-transparent md:py-0 md:backdrop-blur-none">
          {/* Maskot H.O.M.E.: orangutan kecil yang rumahnya terbakar */}
          <picture>
            <source srcSet="/icons/mascot.webp" type="image/webp" />
            <img
              src="/icons/mascot.png"
              alt="H.O.M.E. mascot: a little orangutan crying beside a burning tree"
              width="160"
              height="160"
              className="mx-auto mb-2 h-28 w-28 animate-[mascot-bob_3.2s_ease-in-out_infinite] drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] select-none sm:h-36 sm:w-36 motion-reduce:animate-none"
              draggable="false"
            />
          </picture>
          <h1 className="font-display text-4xl font-bold tracking-tight text-cream-50 drop-shadow-lg sm:text-6xl">
            Welcome to HOME
          </h1>
          <p className="mt-2 font-hand text-2xl text-amber-200 drop-shadow sm:text-3xl">Habitat of Our Missing Endangered</p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-cream-100 drop-shadow sm:text-lg">
            We watch Indonesia&apos;s forest fires from space, using radar that sees through smoke, to show which
            wildlife homes are in danger <strong className="text-cream-50">right now</strong>.
          </p>
          {/* Jalan pintas untuk juri, dosen & peneliti */}
          <a
            href="#science"
            className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-cream-50/30 bg-[#06120f]/55 px-4 py-2 text-xs font-semibold text-cream-50 backdrop-blur-sm transition-colors hover:bg-[#06120f]/75 sm:text-sm"
          >
            <span className="text-amber-200">🔬 Science &amp; Method</span>
            <span className="hidden text-cream-200/80 sm:inline">· Random Forest · NDVI · Habitat suitability</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      {/* ── One continuous scroll ─────────────────────────────────────── */}
      {/* Background style A: watercolor illustrations at the edges */}
      <section id="story" className="relative isolate scroll-mt-16 overflow-hidden border-t border-paper-edge">
        <SectionDecor variant="watercolor" />
        <StoryPage embedded />
      </section>
      {/* Science & Method — untuk juri, dosen & pakar (tema tetap karhutla) */}
      <section id="science" className="relative isolate scroll-mt-16 overflow-hidden border-t border-paper-edge">
        <SectionDecor variant="contour" />
        <SciencePage embedded />
      </section>
      {/* Background style B: soft solid colour + map contour lines */}
      <section id="reach" className="relative isolate scroll-mt-16 overflow-hidden border-t border-paper-edge">
        <SectionDecor variant="contour" />
        <ReachPage embedded />
      </section>
      {/* Background style C: Dayak-inspired pattern */}
      <section id="wildlife" className="relative isolate scroll-mt-16 overflow-hidden border-t border-paper-edge">
        <SectionDecor variant="dayak" />
        <WildlifePage embedded />
      </section>
      {/* Background style D: pale landscape banner */}
      <section id="action" className="relative isolate scroll-mt-16 overflow-hidden border-t border-paper-edge">
        <SectionDecor variant="banner" />
        <ActionPage embedded />
      </section>
    </div>
  );
}
