import { useEffect, useRef, useState } from 'react'
import {
  Heart,
  HandHeart,
  BookOpen,
  MessageCircle,
  Package,
  Megaphone,
  Music,
  Dumbbell,
  Palette,
  Users,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toWaNumber } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const ICON_MAP = { HandHeart, BookOpen, MessageCircle, Heart, Package, Megaphone, Music, Dumbbell, Palette, Users }
const EMPTY = []

const fetchServices = () =>
  unwrap(supabase.from('services').select('*').eq('is_active', true).order('order_index')).then(
    (rows) => rows ?? [],
  )

function ServiceIcon({ iconKey, className }) {
  const Icon = ICON_MAP[iconKey] ?? HandHeart
  return <Icon className={className} aria-hidden="true" />
}

function waLink(number, title) {
  const text = encodeURIComponent(`Halo UK3 UTM! Saya ingin ${title}.`)
  return `https://wa.me/${toWaNumber(number)}?text=${text}`
}

function QrisModal({ data, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`QRIS ${data.title}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6"
      onClick={onClose}
    >
      <div className="w-full max-w-xs rounded-2xl bg-white p-4 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 text-sm font-semibold text-navy-950">{data.title}</div>
        <img src={data.url} alt={`Kode QRIS ${data.title}`} className="w-full rounded-xl object-contain" />
        <div className="mt-3 text-xs text-navy-950/50">Scan QRIS untuk berdonasi</div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-4 rounded-full bg-navy-950 px-6 py-2 text-sm text-white"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}

const actionBase =
  'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors w-full'
const actionGold = `${actionBase} border-gold-500/20 hover:border-gold-500/50 hover:bg-gold-500/5`
const actionGreen = `${actionBase} border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5`

function ContactLink({ number, name, title }) {
  return (
    <a href={waLink(number, title)} target="_blank" rel="noopener noreferrer" className={actionGreen}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
        <MessageCircle size={16} className="text-green-400" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{name || 'Contact Person'}</div>
        <div className="text-xs text-cream/40">{number}</div>
      </div>
      <span className="text-xs font-medium text-green-400">WhatsApp →</span>
    </a>
  )
}

function ServiceCard({ service: s, onOpenQris }) {
  const hasAction = s.cp_wa || s.cp_wa2 || s.form_url || s.qris_url

  return (
    <article className="overflow-hidden rounded-2xl border border-gold-500/15 bg-navy-800">
      {s.image_url && <img src={s.image_url} alt={s.title} loading="lazy" className="h-44 w-full object-cover" />}

      <div className="p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-500/20 bg-gold-500/10">
            <ServiceIcon iconKey={s.icon} className="h-5 w-5 text-gold-500" />
          </div>
          <h2 className="text-lg font-semibold">{s.title}</h2>
        </div>

        {s.description && <p className="mb-5 text-sm leading-relaxed text-cream/50">{s.description}</p>}

        <div className="flex flex-col gap-3">
          {s.qris_url && (
            <button type="button" onClick={() => onOpenQris({ url: s.qris_url, title: s.title })} className={actionGold}>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white">
                <img src={s.qris_url} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Scan QRIS / Barcode</div>
                <div className="text-xs text-cream/40">Tap untuk memperbesar</div>
              </div>
              <span className="text-xs text-gold-500">→</span>
            </button>
          )}

          {s.form_url && (
            <a href={s.form_url} target="_blank" rel="noopener noreferrer" className={actionGold}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/10">
                <BookOpen size={16} className="text-gold-500" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Isi Formulir Online</div>
                <div className="text-xs text-cream/40">Buka Google Form</div>
              </div>
              <span className="text-xs text-gold-500">→</span>
            </a>
          )}

          {s.cp_wa && <ContactLink number={s.cp_wa} name={s.cp_name} title={s.title} />}
          {s.cp_wa2 && <ContactLink number={s.cp_wa2} name={s.cp_name2} title={s.title} />}

          {!hasAction && (
            <div className="py-2 text-center text-xs text-cream/30">Info kontak akan segera ditambahkan</div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Layanan() {
  const { data: services, loading, error, retry } = useAsyncData(fetchServices, EMPTY)
  const [qris, setQris] = useState(null)

  return (
    <PageLayout width="max-w-2xl">
      <PageHeader
        eyebrow="Kami Ada Untukmu"
        title="Layanan UK3"
        subtitle="Hubungi kami untuk berbagai kebutuhan rohani dan organisasi."
      />

      {qris && <QrisModal data={qris} onClose={() => setQris(null)} />}

      {loading && <Loading />}
      {error && <ErrorState message="Layanan gagal dimuat." onRetry={retry} />}
      {!loading && !error && services.length === 0 && <EmptyState>Belum ada layanan aktif.</EmptyState>}

      <div className="flex flex-col gap-5">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} onOpenQris={setQris} />
        ))}
      </div>
    </PageLayout>
  )
}
