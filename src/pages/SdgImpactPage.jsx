import React from 'react';
import { Link } from 'react-router-dom';
import SdgMark from '../components/SdgMark';

/* ════════════════════════════════════════════════════════════════════
   Why it matters — the three UN Sustainable Development Goals that
   karhutla (forest & peatland fire) hits hardest, each with:
     · the SDG tile (official goal number & colour; drawings are ours)
     · a one-line story quote
     · the impact: which SDG target, what is at stake, what H.O.M.E. does
     · links to the sources already used elsewhere in the app
   ════════════════════════════════════════════════════════════════════ */

const GOALS = [
  {
    n: 15,
    title: 'Life on Land',
    color: '#56C02B',
    quote:
      'Behind walls of impenetrable smoke, terrified orangutans cling helplessly to burning branches—our radar pierces through the darkness to find them before their only home becomes their unmarked grave.',
    targets: [
      { id: '15.1', text: 'conserve and restore forest and inland freshwater ecosystems' },
      { id: '15.5', text: 'halt biodiversity loss and protect threatened species' },
    ],
    stake:
      'Peat-swamp forest in Kalimantan is the last home of species such as the Bornean orangutan, Sunda pangolin and helmeted hornbill — all listed as Critically Endangered. A fire does not only burn trees; it cuts the corridors animals use to escape, feed and breed.',
    action:
      'H.O.M.E. lays every fire hotspot over wildlife habitat, scores how much each spot looks like a recorded habitat (Random Forest habitat suitability), and turns the riskiest places into rescue missions — pointing people to the teams who rescue animals on the ground.',
    links: [
      { label: 'Fire & habitat map', to: '/map' },
      { label: 'IUCN Red List', href: 'https://www.iucnredlist.org/' },
      { label: 'BOS Foundation', href: 'https://www.orangutan.or.id/' },
    ],
    sdgUrl: 'https://sdgs.un.org/goals/goal15',
  },
  {
    n: 13,
    title: 'Climate Action',
    color: '#3F7E44',
    quote:
      'In a few desperate hours, millennia of ancient peat that kept our planet cool bleed into the atmosphere as suffocating ash, quietly stealing tomorrow from generations who haven’t even had the chance to live.',
    targets: [
      { id: '13.1', text: 'strengthen resilience to climate-related hazards and natural disasters' },
      { id: '13.3', text: 'improve education and awareness on climate change' },
    ],
    stake:
      'Peat is carbon stored over thousands of years. When it is drained and burns, that carbon goes back into the air — and peat fires can smoulder underground long after the flames are gone. Every fire season undoes centuries of storage.',
    action:
      'H.O.M.E. watches for fires early (NASA FIRMS, cross-checked against BRIN’s national hotspot system), shows what the land looked like before and after, and teaches the science through games — so communities and decision-makers can act before a hotspot becomes a burned peat dome.',
    links: [
      { label: 'Science & Method', href: '#science' },
      { label: 'Peat carbon after fire (BRIN RIN)', href: 'https://hdl.handle.net/20.500.12690/RIN/UKGMFG' },
      { label: 'Peatland land cover 1990–2022 (BRIN RIN)', href: 'https://hdl.handle.net/20.500.12690/RIN/0SOBUS' },
    ],
    sdgUrl: 'https://sdgs.un.org/goals/goal13',
  },
  {
    n: 3,
    title: 'Good Health and Well-being',
    color: '#4C9F38',
    quote:
      'Hundreds of miles away across the sea, innocent children wake up coughing behind sealed bedroom windows, breathing the poisoned ghosts of a burning forest they were born too late to save.',
    targets: [
      { id: '3.9', text: 'reduce deaths and illnesses from air pollution' },
    ],
    stake:
      'Smoke from peat fires does not stop at borders. In bad seasons the haze has reached Malaysia and Singapore: schools have closed, flights have waited, and people have struggled to breathe — far from the fire itself.',
    action:
      'H.O.M.E. shows where the smoke travels and who shares the same air, so the story is not only about a distant forest but about every neighbour downwind — and every early warning protects lungs as well as habitats.',
    links: [
      { label: 'Cross-border haze', href: '#reach' },
      { label: 'Health and Haze (Planetary Health Alliance)', href: 'https://planetaryhealthalliance.org/wp-content/uploads/2025/02/Health-and-Haze.pdf' },
      { label: 'Malaysia shuts schools, 2019 (Dawn/AFP)', href: 'https://www.dawn.com/news/1506111' },
    ],
    sdgUrl: 'https://sdgs.un.org/goals/goal3',
  },
];

function GoalLink({ link }) {
  const cls =
    'inline-flex items-center rounded-full border border-paper-edge bg-paper-warm px-3 py-1 text-xs font-semibold text-charcoal-800 hover:bg-cream-200';
  if (link.to) {
    return (
      <Link to={link.to} className={cls}>
        {link.label} →
      </Link>
    );
  }
  const external = /^https?:/.test(link.href);
  return (
    <a
      href={link.href}
      className={cls}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label} {external ? '↗' : '↓'}
    </a>
  );
}

export default function SdgImpactPage({ embedded = false }) {
  const Title = embedded ? 'h2' : 'h1';
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold tracking-widest text-moss-700 uppercase">Why it matters · UN SDGs</p>
        <Title className="mt-1 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">
          One fire. Three global goals at risk.
        </Title>
        <p className="mt-3 text-base leading-relaxed text-charcoal-700 sm:text-lg">
          Forest and peatland fires hit life on land, the climate, and human health at the same time. Here is what is
          at stake for each Sustainable Development Goal — and what H.O.M.E. does about it.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {GOALS.map((g) => (
          <article
            key={g.n}
            className="flex flex-col overflow-hidden rounded-3xl border border-paper-edge bg-cream-50 shadow-md"
          >
            {/* SDG tile + title on the goal colour */}
            <div className="flex items-center gap-4 p-5 text-white" style={{ backgroundColor: g.color }}>
              <div className="rounded-lg bg-white p-1 shadow-md">
                <SdgMark n={g.n} tileOnly />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase opacity-90">SDG {g.n}</p>
                <h3 className="font-display text-2xl leading-tight font-bold">{g.title}</h3>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <blockquote
                className="border-l-4 pl-3 font-serif text-base leading-relaxed text-charcoal-900 italic"
                style={{ borderColor: g.color }}
              >
                “{g.quote}”
              </blockquote>

              <div className="mt-5">
                <h4 className="text-xs font-bold tracking-widest text-moss-700 uppercase">The impact</h4>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {g.targets.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: g.color }}
                      title={`SDG target ${t.id}`}
                    >
                      Target {t.id}: {t.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-charcoal-700">
                  <strong className="text-charcoal-900">What is at stake. </strong>
                  {g.stake}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
                  <strong className="text-charcoal-900">What H.O.M.E. does. </strong>
                  {g.action}
                </p>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {g.links.map((l) => (
                  <GoalLink key={l.label} link={l} />
                ))}
                <a
                  href={g.sdgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
                  style={{ backgroundColor: g.color }}
                >
                  UN SDG {g.n} ↗
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="text-xs text-charcoal-500">
        Goal numbers and colours follow the United Nations Sustainable Development Goals; the tile drawings are
        H.O.M.E.&apos;s own, not the official UN icon set.
      </p>
    </div>
  );
}
