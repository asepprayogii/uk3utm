import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import Linkified from '../../components/Linkified'
import Button from '../../components/ui/Button'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const INITIAL = { item: null, others: [] }

export default function RenunganDetail() {
  const { id } = useParams()
  const fetcher = useCallback(async () => {
    const [item, others] = await Promise.all([
      unwrap(supabase.from('devotionals').select('*').eq('id', id).maybeSingle()),
      unwrap(supabase.from('devotionals').select('*').neq('id', id).order('created_at', { ascending: false }).limit(3)),
    ])
    return { item, others: others ?? [] }
  }, [id])
  const { data, loading, error, retry } = useAsyncData(fetcher, INITIAL, { live: true })
  const { item, others } = data

  return (
    <PageLayout eyebrow={item ? formatDate(item.created_at) : 'Renungan'} title={item?.title ?? 'Renungan'} crumbLabel="Baca" crumbs={[{ to: '/renungan', label: 'Renungan' }]} reading>
      {loading && <Loading />}
      {error && <ErrorState message="Renungan gagal dimuat." onRetry={retry} />}
      {!loading && !error && !item && (
        <EmptyState icon={BookOpen} title="Renungan tidak ditemukan" action={<Button to="/renungan" variant="secondary">Lihat semua renungan</Button>}>Mungkin sudah dihapus atau linknya keliru.</EmptyState>
      )}
      {item && (
        <article>
          {item.image_url && <img src={item.image_url} alt={item.title} className="mb-8 w-full border border-paper-300 bg-paper-200" />}
          {item.verse && (
            <blockquote className="mb-8 border-l-2 border-brand-600 pl-5 text-lg leading-relaxed text-ink-700 italic sm:text-xl">“<Linkified text={item.verse} />”</blockquote>
          )}
          <div className="text-[17px] leading-[1.85] whitespace-pre-line text-ink-900"><Linkified text={item.content} /></div>
          <div className="mt-10 border-t border-ink-900 pt-6"><Button to="/renungan" variant="secondary" icon={ArrowLeft}>Semua renungan</Button></div>
        </article>
      )}
      {others.length > 0 && item && (
        <section className="mt-16">
          <h2 className="kicker mb-4">Renungan lainnya</h2>
          <div className="border-b border-ink-900">
            {others.map((d) => (
              <Link key={d.id} to={`/renungan/${d.id}`} className="group block border-t border-ink-900 py-5">
                <time dateTime={d.created_at} className="kicker">{formatDate(d.created_at)}</time>
                <div className="display mt-1 text-2xl group-hover:text-brand-600">{d.title}</div>
                <div className="mt-1 line-clamp-2 text-sm text-ink-700">{d.verse || excerpt(d.content, 100)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageLayout>
  )
}
