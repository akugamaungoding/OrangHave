import React from 'react';
import StoryPage from './StoryPage';
import ReachPage from './ReachPage';
import WildlifePage from './WildlifePage';
import ActionPage from './ActionPage';
import { SectionDecor } from '../components';
import useScrollReveal from '../hooks/useScrollReveal';

/* ════════════════════════════════════════════════════════════════════
   H.O.M.E. — Home
   A full-screen welcome over an animated illustration (satellite radar
   watching a burning rainforest), then one continuous scroll:
   story → cross-border haze → wildlife → take action.
   ════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  useScrollReveal(['story', 'reach', 'wildlife', 'action']);

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
          <p className="text-xs font-bold tracking-widest text-emerald-300 uppercase drop-shadow">
            NASA Space Apps · Dancing with the SARs
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-cream-50 drop-shadow-lg sm:text-6xl">
            Welcome to HOME 🥺
          </h1>
          <p className="mt-2 font-hand text-2xl text-amber-200 drop-shadow sm:text-3xl">Habitat of Our Missing Endangered</p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-cream-100 drop-shadow sm:text-lg">
            We watch Indonesia&apos;s forest fires from space, using radar that sees through smoke, to show which
            wildlife homes are in danger <strong className="text-cream-50">right now</strong>.
          </p>
        </div>
      </section>

      {/* ── One continuous scroll ─────────────────────────────────────── */}
      {/* Background style A: watercolor illustrations at the edges */}
      <section id="story" className="relative isolate scroll-mt-16 overflow-hidden border-t border-paper-edge">
        <SectionDecor variant="watercolor" />
        <StoryPage embedded />
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
