import { useState } from 'react'
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
import FramedImage from '../../components/FramedImage'
import Modal from '../../components/ui/Modal'
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
  return (
    <Modal open onClose={onClose} title={`QRIS ${data.title}`} size="sm">
      <img src={data.url} alt={`Kode QRIS ${data.title}`} className="w-full rounded-xl object-contain" />
      <p className="mt-3 text-center text-xs text-ink-500">Scan QRIS ini dengan aplikasi bank atau e-wallet.</p>
    </Modal>
  )
}

const actionBase = 'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors'
const actionGold = `${actionBase} border-paper-300 hover:border-brand-300 hover:bg-brand-50`
const actionGreen = `${actionBase} border-green-200 hover:border-green-400 hover:bg-green-50`

function ContactLink({ number, name, title }) {
  return (
    <a href={waLink(number, title)} target="_blank" rel="noopener noreferrer" className={actionGreen}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
        <MessageCircle size={16} className="text-green-600" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-ink-900">{name || 'Contact Person'}</div>
        <div className="text-xs text-ink-500">{number}</div>
      </div>
      <span className="text-xs font-semibold text-green-600">WhatsApp →</span>
    </a>
  )
}

function ServiceCard({ service: s, onOpenQris }) {
  const hasAction = s.cp_wa || s.cp_wa2 || s.form_url || s.qris_url

  return (
    <article className="overflow-hidden rounded-2xl border border-paper-300 bg-white">
      {s.image_url && <FramedImage src={s.image_url} alt={s.title} />}

      <div className="p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50">
            <ServiceIcon iconKey={s.icon} className="h-5 w-5 text-brand-700" />
          </div>
          <h2 className="text-lg font-bold text-ink-900">{s.title}</h2>
        </div>

        {s.description && <p className="mb-5 text-sm leading-relaxed text-ink-500">{s.description}</p>}

        <div className="flex flex-col gap-3">
          {s.qris_url && (
            <button type="button" onClick={() => onOpenQris({ url: s.qris_url, title: s.title })} className={actionGold}>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white">
                <img src={s.qris_url} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink-900">Scan QRIS / Barcode</div>
                <div className="text-xs text-ink-500">Tap untuk memperbesar</div>
              </div>
              <span className="text-xs text-brand-700">→</span>
            </button>
          )}

          {s.form_url && (
            <a href={s.form_url} target="_blank" rel="noopener noreferrer" className={actionGold}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <BookOpen size={16} className="text-brand-700" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink-900">Isi Formulir Online</div>
                <div className="text-xs text-ink-500">Buka Google Form</div>
              </div>
              <span className="text-xs text-brand-700">→</span>
            </a>
          )}

          {s.cp_wa && <ContactLink number={s.cp_wa} name={s.cp_name} title={s.title} />}
          {s.cp_wa2 && <ContactLink number={s.cp_wa2} name={s.cp_name2} title={s.title} />}

          {!hasAction && (
            <div className="py-2 text-center text-xs text-ink-400">Info kontak akan segera ditambahkan</div>
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
    <PageLayout eyebrow="Kami Ada Untukmu" title="Layanan UK3" description="Hubungi kami untuk kebutuhan rohani dan organisasi." width="max-w-3xl">
      {qris && <QrisModal data={qris} onClose={() => setQris(null)} />}
      {loading && <Loading />}
      {error && <ErrorState message="Layanan gagal dimuat." onRetry={retry} />}
      {!loading && !error && services.length === 0 && <EmptyState icon={HandHeart} title="Belum ada layanan aktif">Layanan akan tampil di sini.</EmptyState>}
      <div className="flex flex-col gap-6">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} onOpenQris={setQris} />
        ))}
      </div>
    </PageLayout>
  )
}
