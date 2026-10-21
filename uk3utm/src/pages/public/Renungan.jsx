import { useState } from 'react'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchDevotionals = () =>
  unwrap(supabase.from('devotionals').select('*').order('created_at', { ascending: false })).then((rows) => rows ?? [])

export default function Renungan() {
  const { data, loading, error, retry } = useAsyncData(fetchDevotionals, EMPTY)
  const [selected, setSelected] = useState(null)

  function open(item) {
    setSelected(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageLayout
      eyebrow="Firman Tuhan"
      title="Renungan"
      description="Bacaan singkat untuk menguatkan iman setiap hari."
      width={selected ? 'max-w-3xl' : 'max-w-5xl'}
    >
      {loading && <Loading />}
      {error && <ErrorState message="Renungan gagal dimuat." onRetry={retry} />}

      {selected ? (
        <article>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Semua renungan
          </button>
          {selected.image_url && (
            <img src={selected.image_url} alt={selected.title} className="mb-8 max-h-96 w-full rounded-2xl object-cover" />
          )}
          {selected.verse && (
            <blockquote className="mb-6 border-l-4 border-gold-400 bg-gold-200/30 py-3 pr-4 pl-5 font-display text-xl text-brand-800 italic">
              “{selected.verse}”
            </blockquote>
          )}
          <h2 className="font-display text-4xl font-bold text-brand-900">{selected.title}</h2>
          <time dateTime={selected.created_at} className="mt-2 mb-6 block text-xs font-medium text-ink-400">
            {formatDate(selected.created_at)}
          </time>
          <p className="text-lg leading-[1.85] whitespace-pre-line text-ink-700">{selected.content}</p>
        </article>
      ) : (
        <>
          {!loading && !error && data.length === 0 && (
            <EmptyState icon={BookOpen} title="Belum ada renungan">Renungan baru akan muncul di sini.</EmptyState>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            {data.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => open(d)}
                className="overflow-hidden rounded-2xl border border-paper-300 bg-white text-left transition-shadow hover:shadow-lift"
              >
                {d.image_url && <img src={d.image_url} alt="" loading="lazy" className="h-44 w-full object-cover" />}
                <div className="p-6">
                  {d.verse && <div className="mb-2 font-display text-lg text-gold-700 italic">“{d.verse}”</div>}
                  <h3 className="text-lg font-bold text-ink-900">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{excerpt(d.content, 140)}</p>
                  <div className="mt-4 text-xs font-medium text-ink-400">{formatDate(d.created_at)}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </PageLayout>
  )
}
