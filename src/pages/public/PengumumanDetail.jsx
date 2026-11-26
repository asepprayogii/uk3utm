import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Megaphone, Pin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import Linkified from '../../components/Linkified'
import ArticleBody from '../../components/ArticleBody'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const INITIAL = { item: null, others: [] }

export default function PengumumanDetail() {
  const { id } = useParams()
  const fetcher = useCallback(async () => {
    const [item, others] = await Promise.all([
      unwrap(supabase.from('announcements').select('*').eq('id', id).maybeSingle()),
      unwrap(supabase.from('announcements').select('*').neq('id', id).order('created_at', { ascending: false }).limit(3)),
    ])
    return { item, others: others ?? [] }
  }, [id])
  const { data, loading, error, retry } = useAsyncData(fetcher, INITIAL, { live: true })
  const { item, others } = data

  return (
    <PageLayout eyebrow={item ? formatDate(item.created_at) : 'Pengumuman'} title={item?.title ?? 'Pengumuman'} crumbLabel="Baca" crumbs={[{ to: '/pengumuman', label: 'Pengumuman' }]} reading={!item?.image_url}>
      {loading && <Loading />}
      {error && <ErrorState message="Pengumuman gagal dimuat." onRetry={retry} />}
      {!loading && !error && !item && (
        <EmptyState icon={Megaphone} title="Pengumuman tidak ditemukan" action={<Button to="/pengumuman" variant="secondary">Lihat semua pengumuman</Button>}>Mungkin sudah dihapus atau linknya keliru.</EmptyState>
      )}
      {item && (
        <ArticleBody image={item.image_url} alt={item.title}>
          {item.pinned && <div className="mb-4"><Badge tone="gold" icon={Pin}>Disematkan</Badge></div>}
          <div className="text-[17px] leading-[1.85] whitespace-pre-line text-ink-900"><Linkified text={item.content} /></div>
          <div className="mt-10 border-t border-ink-900 pt-6">
            <Button to="/pengumuman" variant="secondary" icon={ArrowLeft}>Semua pengumuman</Button>
          </div>
        </ArticleBody>
      )}
      {others.length > 0 && item && (
        <section className="mt-16">
          <h2 className="kicker mb-4">Pengumuman lainnya</h2>
          <div className="border-b border-ink-900">
            {others.map((a) => (
              <Link key={a.id} to={`/pengumuman/${a.id}`} className="group block border-t border-ink-900 py-5">
                <time dateTime={a.created_at} className="kicker">{formatDate(a.created_at)}</time>
                <div className="display mt-1 text-2xl group-hover:text-brand-600">{a.title}</div>
                <div className="mt-1 line-clamp-2 text-sm text-ink-700">{excerpt(a.content, 100)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageLayout>
  )
}
