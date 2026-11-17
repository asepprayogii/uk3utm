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
      <img src={data.url} alt={`Kode QRIS ${data.title}`} className="w-full object-contain" />
      <p className="mt-3 text-center text-xs text-ink-500">Scan QRIS ini dengan aplikasi bank atau e-wallet.</p>
    </Modal>
  )
}

const actionBase = 'flex w-full items-center gap-3 border p-3 text-left transition-colors'
const actionGold = `${actionBase} border-ink-900 hover:bg-ink-900 hover:text-paper-50`
const actionGreen = actionGold

function ContactLink({ number, name, title }) {
  return (
    <a href={waLink(number, title)} target="_blank" rel="noopener noreferrer" className={actionGreen}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-current">
        <MessageCircle size={16} aria-hidden="true" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{name || 'Contact Person'}</div>
        <div className="text-xs opacity-70">{number}</div>
      </div>
      <span className="text-xs font-semibold">WhatsApp →</span>
    </a>
  )
}

function ServiceCard({ service: s, onOpenQris }) {
  const hasAction = s.cp_wa || s.cp_wa2 || s.form_url || s.qris_url

  return (
    <article className="border-t border-ink-900 pt-6">
      {s.image_url && <FramedImage src={s.image_url} alt={s.title} className="mb-5" />}

      <div className="pb-8">
        <div className="mb-3 flex items-center gap-3">
          <ServiceIcon iconKey={s.icon} className="h-6 w-6 shrink-0 text-brand-600" />
          <h2 className="display text-3xl">{s.title}</h2>
        </div>

        {s.description && <p className="mb-5 max-w-xl leading-relaxed text-ink-700">{s.description}</p>}

        <div className="flex flex-col gap-3">
          {s.qris_url && (
            <button type="button" onClick={() => onOpenQris({ url: s.qris_url, title: s.title })} className={actionGold}>
              <div className="h-10 w-10 shrink-0 overflow-hidden bg-white">
                <img src={s.qris_url} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Scan QRIS / Barcode</div>
                <div className="text-xs opacity-70">Tap untuk memperbesar</div>
              </div>
              <span className="text-xs">→</span>
            </button>
          )}

          {s.form_url && (
            <a href={s.form_url} target="_blank" rel="noopener noreferrer" className={actionGold}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-current">
                <BookOpen size={16} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Isi Formulir Online</div>
                <div className="text-xs opacity-70">Buka Google Form</div>
              </div>
              <span className="text-xs">→</span>
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
      <div className="flex flex-col gap-10">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} onOpenQris={setQris} />
        ))}
      </div>
    </PageLayout>
  )
}
