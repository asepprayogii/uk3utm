import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []

const fetchDevotionals = () =>
  unwrap(supabase.from('devotionals').select('*').order('created_at', { ascending: false })).then(
    (rows) => rows ?? [],
  )

export default function Renungan() {
  const { data, loading, error, retry } = useAsyncData(fetchDevotionals, EMPTY)
  const [selected, setSelected] = useState(null)

  function open(item) {
    setSelected(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageLayout>
      <PageHeader eyebrow="Firman" title="Renungan" />

      {loading && <Loading />}
      {error && <ErrorState message="Renungan gagal dimuat." onRetry={retry} />}

      {selected ? (
        <article>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-gold-500 hover:underline"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Kembali
          </button>
          {selected.image_url && (
            <img
              src={selected.image_url}
              alt={selected.title}
              className="mb-6 h-56 w-full rounded-2xl object-cover md:h-72"
            />
          )}
          {selected.verse && <blockquote className="mb-4 text-sm italic text-gold-500">“{selected.verse}”</blockquote>}
          <h2 className="mb-2 text-2xl font-bold">{selected.title}</h2>
          <time dateTime={selected.created_at} className="mb-5 block text-xs text-cream/30">
            {formatDate(selected.created_at)}
          </time>
          <p className="whitespace-pre-line leading-relaxed text-cream/70">{selected.content}</p>
        </article>
      ) : (
        <>
          {!loading && !error && data.length === 0 && <EmptyState>Belum ada renungan.</EmptyState>}
          <div className="grid gap-5 md:grid-cols-2">
            {data.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => open(d)}
                className="rounded-2xl border border-gold-500/15 bg-navy-800 p-5 text-left transition-colors hover:border-gold-500/30"
              >
                {d.image_url && (
                  <img
                    src={d.image_url}
                    alt=""
                    loading="lazy"
                    className="mb-4 h-36 w-full rounded-xl object-cover"
                  />
                )}
                {d.verse && <div className="mb-2 text-xs italic text-gold-500">“{d.verse}”</div>}
                <h3 className="mb-2 font-semibold">{d.title}</h3>
                <p className="line-clamp-3 text-sm text-cream/50">{d.content}</p>
                <div className="mt-3 text-xs text-cream/30">{formatDate(d.created_at)}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </PageLayout>
  )
}
