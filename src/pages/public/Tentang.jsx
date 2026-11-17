import { ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { detectPlatform } from '../../lib/social'
import { DEFAULT_ABOUT, fetchContent, parseActivities } from '../../lib/siteContent'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
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

function Block({ eyebrow, title, children }) {
  return (
    <section className="border-t border-ink-900 pt-4">
      <div className="grid gap-6 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-4">
          <div className="kicker mb-3">{eyebrow}</div>
          <h2 className="display text-3xl sm:text-4xl">{title}</h2>
        </div>
        <div className="md:col-span-8">{children}</div>
      </div>
    </section>
  )
}

export default function Tentang() {
  const { data, loading, error, retry } = useAsyncData(load, INITIAL)
  const { content, links } = data
  const activities = parseActivities(content.activities)
  const mission = (content.mission ?? '').split('\n').map((m) => m.replace(/^[•-]\s*/, '').trim()).filter(Boolean)
  const paragraphs = (content.history ?? '').split(/\n{2,}/).map((t) => t.trim()).filter(Boolean)

  return (
    <PageLayout
      eyebrow="Mengenal Kami"
      title="Tentang UK3"
      description="Unit Kegiatan Kerohanian Kristen Universitas Trunodjoyo Madura, Persekutuan Doa Revive."
      width="max-w-6xl"
    >
      {loading && <Loading />}
      {error && <ErrorState message="Halaman gagal dimuat." onRetry={retry} />}

      {!loading && !error && (
        <div className="flex flex-col gap-14 sm:gap-20">
          <Block eyebrow="Pengantar" title="Apa itu UK3?">
            <p className="display text-2xl font-normal sm:text-3xl">{content.about ?? DEFAULT_ABOUT}</p>
          </Block>

          {(content.founded || paragraphs.length > 0) && (
            <Block eyebrow="Sejarah" title="Kapan berdiri?">
              {content.founded && (
                <p className="mb-6">
                  <span className="kicker block">Berdiri</span>
                  <span className="display mt-1 block text-4xl text-brand-600 sm:text-5xl">{content.founded}</span>
                </p>
              )}
              <div className="flex max-w-2xl flex-col gap-4 leading-[1.85] text-ink-900">
                {paragraphs.map((t, i) => <p key={i} className="whitespace-pre-line">{t}</p>)}
              </div>
            </Block>
          )}

          {(content.vision || mission.length > 0) && (
            <Block eyebrow="Fondasi" title="Visi & Misi">
              {content.vision && (
                <div className="mb-8">
                  <div className="kicker mb-2">Visi</div>
                  <p className="display text-2xl font-normal sm:text-3xl">{content.vision}</p>
                </div>
              )}
              {mission.length > 0 && (
                <div>
                  <div className="kicker mb-2">Misi</div>
                  <ol className="border-t border-ink-900">
                    {mission.map((m, i) => (
                      <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-2 border-b border-paper-300 py-4 leading-relaxed">
                        <span className="display text-xl text-brand-600 tabular-nums">{i + 1}</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </Block>
          )}

          {activities.length > 0 && (
            <Block eyebrow="Pelayanan" title="Kegiatan kami">
              <ol className="border-t border-ink-900">
                {activities.map((a, i) => (
                  <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-2 border-b border-paper-300 py-5">
                    <span className="text-xs font-bold text-ink-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="display text-2xl">{a.title}</h3>
                      {a.description && <p className="mt-2 max-w-xl leading-relaxed text-ink-700">{a.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Block>
          )}

          {links.length > 0 && (
            <Block eyebrow="Terhubung" title="Media sosial & kontak">
              <ul className="border-t border-ink-900">
                {links.map((l) => (
                  <li key={l.id} className="border-b border-paper-300">
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-4 font-semibold hover:text-brand-600">
                      <SocialIcon platform={detectPlatform(l.url)} />
                      <span className="flex-1">{l.label}</span>
                      <ExternalLink size={16} className="text-ink-400 group-hover:text-brand-600" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      )}
    </PageLayout>
  )
}
