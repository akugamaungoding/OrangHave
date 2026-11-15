import React from 'react';
import { Link } from 'react-router-dom';
import { DonationDisclaimer } from '../components';

/* ════════════════════════════════════════════════════════════════════
   Take Action — direct links to conservation partners working on the
   ground in Indonesia, plus simple things anyone can do today.
   H.O.M.E. never handles money: every button goes to the partner's own site.
   ════════════════════════════════════════════════════════════════════ */

const PARTNERS = [
  {
    id: 'bos',
    name: 'BOS Foundation',
    full: 'Borneo Orangutan Survival Foundation',
    where: 'Central & East Kalimantan',
    since: 'Since 1991',
    art: '/assets/art/orangutan.svg',
    what: [
      'Rescues, rehabilitates and releases orangutans',
      'Protects and restores forest habitat, including peatland',
      'Works with local communities on fire prevention',
    ],
    donate: 'https://www.orangutan.or.id/',
    learn: 'https://www.orangutan.or.id/partners',
    learnLabel: 'BOS partners worldwide',
    accent: 'from-moss-800 to-moss-950',
  },
  {
    id: 'iar',
    name: 'IAR Indonesia (YIARI)',
    full: 'Yayasan Inisiasi Alam Rehabilitasi Indonesia, partner of International Animal Rescue',
    where: 'Ketapang, West Kalimantan',
    since: 'Orangutan centre since 2013',
    art: '/assets/art/hornbill.svg',
    what: [
      'Rescues orangutans from fires, farms and illegal pet trade',
      'Rehabilitates and releases them into protected forest',
      'Rescues slow lorises and other primates',
    ],
    donate: 'https://www.internationalanimalrescue.org/',
    learn: 'https://yiari.or.id/',
    learnLabel: 'Visit YIARI Indonesia',
    accent: 'from-amber-800 to-orange-950',
  },
];

const EVERYDAY = [
  { icon: '📣', title: 'Share the story', text: 'Send the interactive story to a friend or class. Awareness is where it starts.', to: '/#story', cta: 'Open the story' },
  { icon: '🛒', title: 'Shop deforestation-free', text: 'Look for certified sustainable palm oil and paper. Ask brands where theirs comes from.' },
  { icon: '🔥', title: 'Report fires early', text: 'Live near a forest? Report smoke or fire to local authorities quickly. Early reports stop spread.' },
  { icon: '🎮', title: 'Learn by playing', text: 'Our rescue missions teach how radar finds animals through smoke.', to: '/game', cta: 'Play a mission' },
];

const COLLAB = [
  { icon: '🔬', who: 'Researchers', text: 'Use our open fire, habitat and radar layers. Every dataset is listed with its source.', to: '/map' },
  { icon: '🏫', who: 'Schools', text: 'Use the story and games in class to teach climate, peat and wildlife.', to: '/#story' },
  { icon: '🌿', who: 'NGOs & communities', text: 'Want your fire or rescue data on the map? Open an issue on our GitHub.', href: 'https://github.com/akugamaungoding/OrangHave/issues' },
];

export default function ActionPage({ embedded = false }) {
  const Title = embedded ? 'h2' : 'h1';
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold tracking-widest text-moss-700 uppercase">Take Action</p>
        <Title className="mt-1 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">Help the people saving them.</Title>
        <p className="mt-3 text-base leading-relaxed text-charcoal-700 sm:text-lg">
          Satellites can see the fire, but people on the ground put it out and carry the animals to safety. Support
          the Indonesian teams doing that work every day.
        </p>
      </header>

      {/* Partners */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2" aria-label="Conservation partners">
        {PARTNERS.map((p) => (
          <article key={p.id} className="flex flex-col overflow-hidden rounded-3xl border border-paper-edge bg-cream-50 shadow-md">
            <div className={`flex items-center gap-4 bg-gradient-to-br ${p.accent} p-5 text-cream-50`}>
              <img src={p.art} alt="" className="h-16 w-16 shrink-0 rounded-full bg-cream-50/90 p-1" />
              <div>
                <h2 className="font-display text-2xl font-bold">{p.name}</h2>
                <p className="text-xs text-cream-200/80">{p.full}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-moss-100 px-2.5 py-1 text-moss-900">📍 {p.where}</span>
                <span className="rounded-full bg-cream-200 px-2.5 py-1 text-charcoal-800">{p.since}</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-charcoal-700">
                {p.what.map((w) => (
                  <li key={w} className="flex gap-2"><span className="text-moss-600">✓</span>{w}</li>
                ))}
              </ul>
              <div className="mt-auto grid grid-cols-1 gap-2 pt-5 sm:grid-cols-2">
                <a
                  href={p.donate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold whitespace-nowrap text-charcoal-900 shadow-sm hover:bg-amber-400"
                >
                  💛 Donate on their site ↗
                </a>
                <a
                  href={p.learn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-paper-edge px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-charcoal-800 hover:bg-cream-200"
                >
                  {p.learnLabel} ↗
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>
      <DonationDisclaimer />

      {/* Everyday actions */}
      <section>
        <h2 className="font-display text-xl font-bold text-charcoal-900">No money? You can still help.</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EVERYDAY.map((a) => (
            <div key={a.title} className="flex flex-col rounded-2xl border border-paper-edge bg-paper-warm p-4">
              <span className="text-2xl" aria-hidden="true">{a.icon}</span>
              <h3 className="mt-1 font-display font-bold text-charcoal-900">{a.title}</h3>
              <p className="text-sm text-charcoal-700">{a.text}</p>
              {a.to && (
                <Link to={a.to} className="mt-auto pt-2 text-sm font-semibold text-moss-800 underline underline-offset-2">
                  {a.cta} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Collaboration */}
      <section className="rounded-3xl bg-moss-950 p-6 text-cream-50">
        <h2 className="font-display text-xl font-bold">Collaborate with H.O.M.E.</h2>
        <p className="mt-1 text-sm text-cream-200/80">This project is open. Here&apos;s how different groups can work with us.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {COLLAB.map((c) => {
            const inner = (
              <>
                <span className="text-2xl" aria-hidden="true">{c.icon}</span>
                <h3 className="mt-1 font-bold">{c.who} →</h3>
                <p className="text-sm text-cream-200/80">{c.text}</p>
              </>
            );
            return c.href ? (
              <a key={c.who} href={c.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-white/5 p-4 hover:bg-white/10">{inner}</a>
            ) : (
              <Link key={c.who} to={c.to} className="rounded-2xl bg-white/5 p-4 hover:bg-white/10">{inner}</Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
