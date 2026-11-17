import { supabase } from '../../lib/supabase'
import { currentPeriod } from '../../lib/format'
import { linkDisplay } from '../../lib/social'
import { DEFAULT_ABOUT, fetchContent, parseActivities } from '../../lib/siteContent'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import Reveal from '../../components/Reveal'
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
  const { data, loading, error, retry } = useAsyncData(load, INITIAL)
  const { content, links } = data
  const activities = parseActivities(content.activities)
  const mission = (content.mission ?? '').split('\n').map((m) => m.replace(/^[•-]\s*/, '').trim()).filter(Boolean)
  const paragraphs = (content.history ?? '').split(/\n{2,}/).map((t) => t.trim()).filter(Boolean)
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
              <p className="display text-[1.75rem] leading-snug font-normal sm:text-4xl sm:leading-tight">{content.about ?? DEFAULT_ABOUT}</p>
            </div>
            <div className="md:col-span-5"><Facts items={facts} /></div>
          </Reveal>

          {/* Sejarah */}
          {hasHistory && (
            <Reveal as="section" id="sejarah" className="mt-20 scroll-mt-24 border-t border-ink-900 pt-6 sm:mt-28">
              <div className="kicker mb-6">Sejarah</div>
              <div className="grid gap-8 md:grid-cols-12 md:gap-14">
                {content.founded && (
                  <div className="md:col-span-4">
                    <div className="text-xs font-bold tracking-wider text-ink-500 uppercase">Berdiri</div>
                    <div className="display mt-2 text-5xl text-brand-600 sm:text-6xl">{content.founded}</div>
                  </div>
                )}
                {paragraphs.length > 0 && (
                  <div className={`${content.founded ? 'md:col-span-8' : 'md:col-span-12'} gap-10 leading-[1.85] text-ink-900 md:columns-2`}>
                    {paragraphs.map((t, i) => (
                      <p key={i} className="mb-4 break-inside-avoid-column whitespace-pre-line">{t}</p>
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
              {content.vision && (
                <blockquote className="display mx-auto max-w-4xl text-center text-3xl font-normal italic sm:text-5xl">“{content.vision}”</blockquote>
              )}
              {mission.length > 0 && (
                <ol className="mt-14 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                  {mission.map((m, i) => (
                    <li key={i} className="border-t border-paper-300 pt-4">
                      <span className="display block text-4xl text-brand-600 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      <p className="mt-2 leading-relaxed">{m}</p>
                    </li>
                  ))}
                </ol>
              )}
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
                    <p className="leading-relaxed text-ink-700 md:col-span-7">{a.description}</p>
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
