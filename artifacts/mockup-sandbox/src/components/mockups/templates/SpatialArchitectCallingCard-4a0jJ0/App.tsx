import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  Minus,
  Orbit,
  Waves,
  Phone,
  Mail,
  MapPin,
  Scan,
  Sparkles,
} from 'lucide-react';

const ROWS = [
  {
    label: 'SPATIAL MAPPING',
    orbit: 'Full LiDAR volumetric scan · 0.4mm fidelity',
    drift: 'Photogrammetric capture · room-by-room',
    orbitHas: true,
    driftHas: true,
  },
  {
    label: 'LIGHT CHOREOGRAPHY',
    orbit: 'Circadian engine, 1,440 daily keyframes',
    drift: 'Three preset scenes, manual dimming',
    orbitHas: true,
    driftHas: true,
  },
  {
    label: 'MATERIAL LIBRARY',
    orbit: 'Mycelium composites, anodised brass, raw clay',
    drift: 'Curated catalogue of 60 warm-neutral finishes',
    orbitHas: true,
    driftHas: true,
  },
  {
    label: 'ADAPTIVE FURNITURE',
    orbit: 'Kinetic partitions + responsive seating grid',
    drift: 'Modular pieces, manual reconfiguration',
    orbitHas: true,
    driftHas: false,
  },
  {
    label: 'ATMOSPHERIC SENSING',
    orbit: 'CO₂, humidity, acoustic field — live tuning',
    drift: 'Quarterly environmental audit',
    orbitHas: true,
    driftHas: false,
  },
  {
    label: 'DIGITAL TWIN',
    orbit: 'Persistent twin, updated nightly',
    drift: 'Static model at handover',
    orbitHas: true,
    driftHas: false,
  },
  {
    label: 'TIMELINE',
    orbit: '14–22 weeks',
    drift: '5–8 weeks',
    orbitHas: true,
    driftHas: true,
  },
  {
    label: 'INVESTMENT',
    orbit: 'From €184,000',
    drift: 'From €38,500',
    orbitHas: true,
    driftHas: true,
  },
];

export default function App() {
  const [side, setSide] = useState('orbit');

  return (
    <div className="min-h-screen bg-[#16110b] text-[#ece1cf] antialiased relative overflow-hidden">
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Saira+Condensed:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root { color-scheme: dark; }
        ::selection { background: #d79b4f; color: #1c1610; }
        .font-cond { font-family: 'Saira Condensed', sans-serif; }
        .font-serif-wide { font-family: 'Fraunces', serif; }
        .grain::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
        }
        .scanlines::after {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(236,225,207,0.025) 0px,
            rgba(236,225,207,0.025) 1px,
            transparent 1px,
            transparent 4px
          );
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 28px rgba(215,155,79,0.22), inset 0 0 18px rgba(215,155,79,0.06); }
          50% { box-shadow: 0 0 48px rgba(215,155,79,0.38), inset 0 0 26px rgba(215,155,79,0.12); }
        }
        .card-glow { animation: pulseGlow 5s ease-in-out infinite; }
        @keyframes drift {
          0% { transform: translateY(0px); opacity: 0.55; }
          50% { transform: translateY(-6px); opacity: 1; }
          100% { transform: translateY(0px); opacity: 0.55; }
        }
        .tick { animation: drift 4s ease-in-out infinite; }
        .row-line { transition: background 0.35s ease, border-color 0.35s ease; }
        .row-line:hover { background: rgba(215,155,79,0.05); }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #16110b; }
        ::-webkit-scrollbar-thumb { background: #3a2f22; border-radius: 0; }
        `,
        }}
      />

      {/* ambient glow fields */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full bg-[#d79b4f] opacity-[0.07] blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-[#a8703a] opacity-[0.08] blur-[160px]" />

      <div className="relative grain scanlines">
        {/* ====== NAV ====== */}
        <header className="border-b border-[#3a2f22] px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 border border-[#d79b4f] rotate-45 flex items-center justify-center">
                <div className="w-2 h-2 bg-[#d79b4f] shadow-[0_0_10px_#d79b4f]" />
              </div>
              <span className="font-cond text-sm tracking-[0.45em] uppercase text-[#ece1cf]">
                Aurum Habitat Systems
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8 font-cond text-[13px] tracking-[0.3em] uppercase text-[#9b8a6f]">
              {['Protocols', 'Field Works', 'Materials', 'Contact'].map((n) => (
                <a
                  key={n}
                  href="#"
                  className="hover:text-[#d79b4f] transition-colors duration-300"
                >
                  {n}
                </a>
              ))}
            </nav>
            <span className="font-cond text-[12px] tracking-[0.35em] text-[#6e5f49]">
              REF / AHS—2049
            </span>
          </div>
        </header>

        {/* ====== MAIN ASYMMETRIC GRID ====== */}
        <main className="grid grid-cols-1 lg:grid-cols-3 min-h-[calc(100vh-4rem)]">
          {/* ------ LEFT 1/3 : THE CARD ------ */}
          <section className="lg:col-span-1 border-r border-[#3a2f22] px-6 lg:px-12 py-12 flex flex-col justify-between relative">
            <div>
              <p className="font-cond text-[12px] tracking-[0.5em] uppercase text-[#9b8a6f] mb-10">
                Identification Artifact · 01
              </p>

              {/* The business card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="card-glow relative bg-[#1d1710] border border-[#d79b4f]/50 p-7 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#d79b4f] opacity-[0.08] blur-2xl" />
                {/* corner ticks */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#d79b4f]" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[#d79b4f]" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[#d79b4f]" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#d79b4f]" />

                <div className="flex items-start justify-between mb-10">
                  <div className="w-10 h-10 border border-[#d79b4f] rotate-45 flex items-center justify-center">
                    <Sparkles size={14} className="text-[#d79b4f] -rotate-45" />
                  </div>
                  <span className="font-cond text-[11px] tracking-[0.4em] text-[#6e5f49]">
                    47.36°N / 8.54°E
                  </span>
                </div>

                <h1 className="font-serif-wide font-light text-[2rem] leading-[1.05] tracking-wide text-[#f0e6d4] mb-1">
                  Mara Veyl
                </h1>
                <p className="font-cond text-[12px] tracking-[0.4em] uppercase text-[#d79b4f] mb-8">
                  Principal Spatial Architect
                </p>

                <div className="space-y-3 font-cond text-[13px] tracking-[0.18em] text-[#bcab8e]">
                  <div className="flex items-center gap-3">
                    <Mail size={13} className="text-[#d79b4f]" />
                    mara@aurumhabitat.systems
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={13} className="text-[#d79b4f]" />
                    +41 44 280 11 49
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={13} className="text-[#d79b4f]" />
                    Werkraum 7, Zürich-West
                  </div>
                </div>

                {/* faux machine code strip */}
                <div className="mt-9 pt-5 border-t border-[#3a2f22] flex items-end justify-between">
                  <div className="flex gap-[3px]">
                    {[5, 9, 4, 11, 6, 10, 5, 8, 12, 6, 9, 4, 7, 11, 5, 8].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="tick w-[2px] bg-[#d79b4f]"
                          style={{
                            height: `${h + 8}px`,
                            animationDelay: `${i * 0.18}s`,
                          }}
                        />
                      )
                    )}
                  </div>
                  <Scan size={16} className="text-[#6e5f49]" />
                </div>
              </motion.div>

              <p className="font-serif-wide italic font-light text-[15px] leading-relaxed text-[#9b8a6f] mt-10 max-w-xs">
                “A room should anticipate you — adjusting its light, its
                acoustics, its very geometry, before you ask.”
              </p>
            </div>

            <div className="mt-12 flex items-center justify-between font-cond text-[11px] tracking-[0.4em] uppercase text-[#6e5f49]">
              <span>EST. 2031</span>
              <span>SPECULATIVE INTERIORS</span>
            </div>
          </section>

          {/* ------ RIGHT 2/3 : THE VS COMPARISON ------ */}
          <section className="lg:col-span-2 px-6 lg:px-14 py-12 relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
            >
              <p className="font-cond text-[12px] tracking-[0.5em] uppercase text-[#9b8a6f] mb-5">
                Protocol Comparison · Choose Your Habitat
              </p>
              <h2 className="font-serif-wide font-light text-[2.6rem] lg:text-[3.4rem] leading-[1.05] tracking-wide max-w-2xl">
                Two ways to live{' '}
                <span className="italic text-[#d79b4f]">slightly ahead</span> of
                the present.
              </h2>
            </motion.div>

            {/* toggle */}
            <div className="mt-10 flex items-center gap-px border border-[#3a2f22] w-fit font-cond text-[13px] tracking-[0.3em] uppercase">
              {[
                { id: 'orbit', label: 'Orbit Protocol', icon: Orbit },
                { id: 'drift', label: 'Drift Protocol', icon: Waves },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSide(id)}
                  className={`flex items-center gap-2 px-6 py-3 transition-all duration-300 ${
                    side === id
                      ? 'bg-[#d79b4f] text-[#1c1610] shadow-[0_0_24px_rgba(215,155,79,0.35)]'
                      : 'text-[#9b8a6f] hover:text-[#ece1cf]'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* column headers */}
            <div className="mt-12 grid grid-cols-12 gap-4 pb-4 border-b border-[#d79b4f]/40">
              <div className="col-span-4 font-cond text-[11px] tracking-[0.4em] uppercase text-[#6e5f49] self-end">
                Specification
              </div>
              <div
                className={`col-span-4 transition-opacity duration-300 ${
                  side === 'orbit' ? 'opacity-100' : 'opacity-45'
                }`}
              >
                <p className="font-cond text-[11px] tracking-[0.4em] uppercase text-[#d79b4f] mb-1">
                  AHS / 01
                </p>
                <p className="font-serif-wide text-2xl tracking-wide">Orbit</p>
                <p className="font-cond text-[12px] tracking-[0.2em] text-[#9b8a6f] mt-1">
                  Total responsive habitat
                </p>
              </div>
              <div
                className={`col-span-4 transition-opacity duration-300 ${
                  side === 'drift' ? 'opacity-100' : 'opacity-45'
                }`}
              >
                <p className="font-cond text-[11px] tracking-[0.4em] uppercase text-[#d79b4f] mb-1">
                  AHS / 02
                </p>
                <p className="font-serif-wide text-2xl tracking-wide">Drift</p>
                <p className="font-cond text-[12px] tracking-[0.2em] text-[#9b8a6f] mt-1">
                  Adaptive refresh, light touch
                </p>
              </div>
            </div>

            {/* rows */}
            <div>
              {ROWS.map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.06 }}
                  className="row-line grid grid-cols-12 gap-4 py-5 border-b border-[#2c241a]"
                >
                  <div className="col-span-4 font-cond text-[12px] tracking-[0.35em] uppercase text-[#9b8a6f] self-center">
                    {row.label}
                  </div>
                  <div
                    className={`col-span-4 flex items-start gap-3 transition-opacity duration-300 ${
                      side === 'orbit' ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    {row.orbitHas ? (
                      <Check
                        size={14}
                        className="mt-1 shrink-0 text-[#d79b4f] drop-shadow-[0_0_6px_rgba(215,155,79,0.8)]"
                      />
                    ) : (
                      <Minus size={14} className="mt-1 shrink-0 text-[#5c4f3c]" />
                    )}
                    <p className="font-cond text-[14px] tracking-[0.08em] leading-snug text-[#d8cbb2]">
                      {row.orbit}
                    </p>
                  </div>
                  <div
                    className={`col-span-4 flex items-start gap-3 transition-opacity duration-300 ${
                      side === 'drift' ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    {row.driftHas ? (
                      <Check
                        size={14}
                        className="mt-1 shrink-0 text-[#d79b4f] drop-shadow-[0_0_6px_rgba(215,155,79,0.8)]"
                      />
                    ) : (
                      <Minus size={14} className="mt-1 shrink-0 text-[#5c4f3c]" />
                    )}
                    <p className="font-cond text-[14px] tracking-[0.08em] leading-snug text-[#d8cbb2]">
                      {row.drift}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA strip */}
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <p className="font-serif-wide italic font-light text-[15px] text-[#9b8a6f] max-w-sm leading-relaxed">
                Both protocols begin with a one-hour atmospheric reading of your
                space. Bring nothing but the keys.
              </p>
              <a
                href="#"
                className="group flex items-center gap-3 border border-[#d79b4f] px-7 py-4 font-cond text-[13px] tracking-[0.35em] uppercase text-[#d79b4f] hover:bg-[#d79b4f] hover:text-[#1c1610] hover:shadow-[0_0_36px_rgba(215,155,79,0.4)] transition-all duration-300"
              >
                Reserve {side === 'orbit' ? 'Orbit' : 'Drift'} Reading
                <ArrowUpRight
                  size={16}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </a>
            </div>
          </section>
        </main>

        {/* ====== FOOTER ====== */}
        <footer className="border-t border-[#3a2f22] px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 font-cond text-[11px] tracking-[0.4em] uppercase text-[#6e5f49]">
          <span>Aurum Habitat Systems — Interiors for the near future</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#d79b4f] shadow-[0_0_8px_#d79b4f]" />
            Studio online · Zürich / Kyoto / Marfa
          </span>
        </footer>
      </div>
    </div>
  );
}