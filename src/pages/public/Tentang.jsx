import { supabase } from '../../lib/supabase'
import { currentPeriod } from '../../lib/format'
import { linkDisplay } from '../../lib/social'
import { DEFAULT_ABOUT, fetchContent, parseActivities } from '../../lib/siteContent'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import LogoMeaning from '../../components/LogoMeaning'
import Linkified from '../../components/Linkified'
import Reveal from '../../components/Reveal'
import VisionMission from '../../components/VisionMission'
import SocialIcon from '../../components/SocialIcon'
import { ErrorState, Loading } from '../../components/States'

const INITIAL = { content: {}, links: [] }

async function load() {
  const [content, links] = await Promise.all([
    fetchContent(),
    unwrap(supabase.from('links').select('*').order('order_index')).then((r) => r ?? []).catch(() => []),
  ])
  return { content, links }
}

function Facts({ items }) {
  return (
    <dl className="border-t border-ink-900">
      {items.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-paper-300 py-3 text-sm">
          <dt className="kicker pt-0.5">{k}</dt>
          <dd className="font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function Tentang() {
  const { data, loading, error, retry } = useAsyncData(load, INITIAL, { live: true })
  const { content, links } = data
  const activities = parseActivities(content.activities)
  const mission = (content.mission ?? '').split('\n').map((m) => m.replace(/^[•-]\s*/, '').trim()).filter(Boolean)
  // Baris yang hanya dipatahkan saat mengetik digabung, supaya teks mengalir rapi mengikuti lebar halaman.
  const paragraphs = (content.history ?? '').split(/\n\s*\n/).map((t) => t.replace(/\s*\n\s*/g, ' ').replace(/ {2,}/g, ' ').trim()).filter(Boolean)
  const hasHistory = !!content.founded || paragraphs.length > 0
  const hasFoundation = !!content.vision || mission.length > 0

  const facts = [
    ['Nama', 'Unit Kegiatan Kerohanian Kristen (UK3)'],
    ['Persekutuan', 'Doa Revive'],
    ['Kampus', 'Universitas Trunodjoyo Madura'],
    ...(content.founded ? [['Berdiri', content.founded]] : []),
    ['Periode', currentPeriod()],
  ]
  const anchors = [
    ['pengantar', 'Pengantar'],
    ['makna-logo', 'Makna Logo'],
    ...(hasHistory ? [['sejarah', 'Sejarah']] : []),
    ...(hasFoundation ? [['visi-misi', 'Visi & Misi']] : []),
    ...(activities.length > 0 ? [['kegiatan', 'Kegiatan']] : []),
    ...(links.length > 0 ? [['terhubung', 'Terhubung']] : []),
  ]

  return (
    <PageLayout
      eyebrow="Mengenal Kami"
      title="Tentang UK3"
      description="Siapa kami, dari mana kami berasal, dan apa yang kami kerjakan bersama."
      width="max-w-6xl"
    >
      {loading && <Loading />}
      {error && <ErrorState message="Halaman gagal dimuat." onRetry={retry} />}

      {!loading && !error && (
        <div>
          {anchors.length > 2 && (
            <nav aria-label="Isi halaman" className="-mt-2 mb-12 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold sm:mb-16">
              {anchors.map(([id, label]) => (
                <a key={id} href={`#${id}`} className="border-b border-transparent pb-0.5 text-ink-500 transition-colors hover:border-brand-600 hover:text-brand-600">{label}</a>
              ))}
            </nav>
          )}

          {/* Pengantar */}
          <Reveal as="section" id="pengantar" className="scroll-mt-24 grid gap-10 md:grid-cols-12 md:gap-14">
            <div className="md:col-span-7">
              <p className="display text-[1.75rem] leading-snug font-normal sm:text-4xl sm:leading-tight"><Linkified text={content.about ?? DEFAULT_ABOUT} /></p>
            </div>
            <div className="md:col-span-5"><Facts items={facts} /></div>
          </Reveal>

          {/* Makna logo (Anggaran Dasar Pasal 2) */}
          <Reveal as="section" id="makna-logo" className="mt-20 scroll-mt-24 border-t border-ink-900 pt-6 sm:mt-28">
            <div className="kicker mb-3">Makna Logo</div>
            <h2 className="display mb-10 max-w-3xl text-3xl font-normal sm:text-5xl">Setiap bagian lambang punya arti.</h2>
            <LogoMeaning />
          </Reveal>

          {/* Sejarah */}
          {hasHistory && (
            <Reveal as="section" id="sejarah" className="mt-20 scroll-mt-24 border-t border-ink-900 pt-6 sm:mt-28">
              <div className="kicker mb-6">Sejarah</div>
              <div className="grid gap-8 md:grid-cols-12 md:gap-14">
                {content.founded && (
                  <div className="md:col-span-4">
                    <div className="md:sticky md:top-28">
                    <div className="text-xs font-bold tracking-wider text-ink-500 uppercase">Berdiri</div>
                    <div className="display mt-2 text-5xl text-brand-600 sm:text-6xl">{content.founded}</div>
                    </div>
                  </div>
                )}
                {paragraphs.length > 0 && (
                  <div className={`${content.founded ? 'md:col-span-8' : 'md:col-span-12'} max-w-[40rem] text-ink-900`}>
                    {paragraphs.map((t, i) => (
                      <p key={i} className={i === 0 ? 'display text-2xl leading-snug font-normal text-pretty sm:text-[1.75rem]' : 'mt-6 text-[17px] leading-[1.85] text-pretty text-ink-700'}><Linkified text={t} /></p>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {/* Visi & Misi */}
          {hasFoundation && (
            <Reveal as="section" id="visi-misi" className="mt-20 scroll-mt-24 border-t border-ink-900 pt-6 sm:mt-28">
              <div className="kicker mb-6">Visi &amp; Misi</div>
              <VisionMission vision={content.vision} mission={mission} />
            </Reveal>
          )}

          {/* Kegiatan */}
          {activities.length > 0 && (
            <Reveal as="section" id="kegiatan" className="mt-20 scroll-mt-24 border-t border-ink-900 pt-6 sm:mt-28">
              <div className="kicker mb-6">Kegiatan rutin</div>
              <ul>
                {activities.map((a, i) => (
                  <li key={i} className="grid gap-2 border-b border-paper-300 py-6 first:pt-0 md:grid-cols-12 md:gap-10">
                    <h3 className="display text-2xl sm:text-3xl md:col-span-5">{a.title}</h3>
                    <p className="leading-relaxed text-ink-700 md:col-span-7"><Linkified text={a.description} /></p>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {/* Terhubung */}
          {links.length > 0 && (
            <Reveal as="section" id="terhubung" className="mt-20 scroll-mt-24 border-t border-ink-900 pt-6 sm:mt-28">
              <div className="kicker mb-6">Terhubung dengan kami</div>
              <ul className="flex flex-wrap gap-3">
                {links.map((l) => {
                  const d = linkDisplay(l)
                  return (
                    <li key={l.id}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" title={d.platformName} className="inline-flex items-center gap-3 border border-ink-900 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-ink-900 hover:text-paper-50">
                        <SocialIcon platform={d.platform} size={18} />
                        {d.text}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </Reveal>
          )}
        </div>
      )}
    </PageLayout>
  )
}
