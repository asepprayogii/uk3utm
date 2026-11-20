import { useState } from 'react'

// Sumber: Anggaran Dasar UK3 UTM, Bab I, Bagian Kedua, Pasal 2 (Lambang dan Bendera).
// `area` = daerah sentuh pada gambar logo (piksel, gambar 797 x 744). Tanpa kotak: bagian yang dipilih
// diterangi (sisanya meredup) dan artinya terbuka otomatis di daftar.
const W = 797
const H = 744
const PARTS = [
  { id: 'segi-lima', title: 'Segi Lima', meaning: 'Simbol Pancasila.', area: [0, 0, W, H], glow: true },
  { id: 'merpati', title: 'Burung Merpati', meaning: 'Simbol penyertaan Roh Kudus.', area: [330, 140, 150, 105] },
  { id: 'salib', title: 'Salib', meaning: 'Lambang pengorbanan Kristus.', area: [310, 245, 185, 245] },
  { id: 'buku', title: 'Buku', meaning: 'Simbol insan akademis.', area: [272, 482, 262, 118] },
  { id: 'alfa-omega', title: 'Alfa dan Omega', meaning: 'Simbol mempercayai Allah sebagai awal dan akhir dari segalanya.', area: [294, 500, 222, 80] },
]
// Urutan tampil di daftar: dari atas lambang ke bawah, Segi Lima terakhir.
const LIST = ['merpati', 'salib', 'buku', 'alfa-omega', 'segi-lima'].map((id) => PARTS.find((p) => p.id === id))

const COLORS = [
  { name: 'Putih', object: 'Bendera', meaning: 'Kudus', swatch: '#FFFFFF' },
  { name: 'Ungu', object: 'Lambang', meaning: 'Kemuliaan Allah', swatch: '#49016F' },
]

export default function LogoMeaning() {
  const [active, setActive] = useState(null)
  const current = PARTS.find((p) => p.id === active) ?? null
  const spot = current && !current.glow ? current.area : null
  const pad = 18

  return (
    <div className="grid gap-10 md:grid-cols-12 md:gap-14">
      {/* Logo: arahkan kursor atau ketuk bagian lambang */}
      <div className="md:col-span-5">
        <div className="relative mx-auto aspect-[797/744] w-full max-w-md bg-paper-100">
          <img
            src="/logo-uk3.png"
            alt="Lambang UK3 UTM"
            className="absolute inset-0 h-full w-full object-contain transition-[filter] duration-300"
            // Segi Lima = bentuk lambang itu sendiri: siluetnya diberi cahaya aksen.
            style={{ filter: current?.glow ? 'drop-shadow(0 0 2px #B5452B) drop-shadow(0 0 7px #B5452B)' : 'none' }}
          />
          {/* Peredam: seluruh lambang meredup kecuali bagian yang dipilih */}
          <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <filter id="logo-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16" /></filter>
              <mask id="logo-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                <rect x="0" y="0" width={W} height={H} fill="white" />
                <rect
                  fill="black"
                  filter="url(#logo-soft)"
                  style={{
                    x: spot ? spot[0] - pad : W / 2,
                    y: spot ? spot[1] - pad : H / 2,
                    width: spot ? spot[2] + pad * 2 : 0,
                    height: spot ? spot[3] + pad * 2 : 0,
                    transition: 'x 350ms ease, y 350ms ease, width 350ms ease, height 350ms ease',
                  }}
                />
              </mask>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill="#F4EFE6" mask="url(#logo-mask)" style={{ opacity: spot ? 0.82 : 0, transition: 'opacity 300ms ease' }} />
          </svg>
          {/* Daerah sentuh tak terlihat; Segi Lima di lapisan paling bawah, bagian kecil di atasnya */}
          {PARTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setActive(p.id)}
              onFocus={() => setActive(p.id)}
              onClick={() => setActive(p.id)}
              aria-label={`${p.title}: ${p.meaning}`}
              aria-pressed={p.id === active}
              style={{ left: `${(p.area[0] / W) * 100}%`, top: `${(p.area[1] / H) * 100}%`, width: `${(p.area[2] / W) * 100}%`, height: `${(p.area[3] / H) * 100}%` }}
              className="absolute cursor-pointer bg-transparent outline-offset-2 focus-visible:outline-2 focus-visible:outline-brand-600"
            />
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-ink-500">Arahkan kursor atau ketuk bagian lambang.</p>
      </div>

      {/* Daftar makna */}
      <div className="md:col-span-7">
        <ol className="border-t border-ink-900" aria-label="Makna lambang">
          {LIST.map((p) => {
            const on = p.id === active
            return (
              <li key={p.id} className="border-b border-paper-300">
                <button
                  type="button"
                  onClick={() => setActive(p.id)}
                  onMouseEnter={() => setActive(p.id)}
                  aria-expanded={on}
                  className="group flex w-full items-baseline gap-4 py-4 text-left"
                >
                  <span aria-hidden="true" className={`mt-3 h-2 w-2 shrink-0 self-start transition-colors ${on ? 'bg-brand-600' : 'bg-ink-300 group-hover:bg-brand-600'}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`display block text-2xl transition-colors sm:text-3xl ${on ? 'text-ink-900' : 'text-ink-700 group-hover:text-brand-600'}`}>{p.title}</span>
                    <span className={`grid transition-all duration-300 ease-out ${on ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <span className="overflow-hidden"><span className="block text-base leading-relaxed text-ink-700">{p.meaning}</span></span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="sr-only" aria-live="polite">{current ? `${current.title}: ${current.meaning}` : ""}</p>

        {/* Warna */}
        <div className="mt-10">
          <div className="kicker mb-4">Warna</div>
          <div className="grid gap-4 sm:grid-cols-2">
            {COLORS.map((c) => (
              <div key={c.name} className="flex items-center gap-4 border border-paper-300 p-4">
                <span className="h-14 w-14 shrink-0 border border-ink-900" style={{ background: c.swatch }} aria-hidden="true" />
                <div>
                  <div className="text-xs font-bold tracking-wider text-ink-500 uppercase">{c.object} {c.name.toLowerCase()}</div>
                  <div className="display mt-1 text-2xl">{c.meaning}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs text-ink-400">Sumber: Anggaran Dasar UK3 UTM, Bab I Pasal 2.</p>
      </div>
    </div>
  )
}
