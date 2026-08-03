import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import {
  Heart, HandHeart, BookOpen, MessageCircle,
  Package, Megaphone, Music, Dumbbell, Palette, Users
} from 'lucide-react'

const ICON_MAP = {
  HandHeart, BookOpen, MessageCircle, Heart,
  Package, Megaphone, Music, Dumbbell, Palette, Users
}

function ServiceIcon({ iconKey, className }) {
  const Icon = ICON_MAP[iconKey] ?? HandHeart
  return <Icon className={className} />
}

export default function Layanan() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrisModal, setQrisModal] = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('order_index')
      setServices(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  function waLink(number, title) {
    const clean = number?.replace(/\D/g, '')
    const text = encodeURIComponent(`Halo UK3 UTM! Saya ingin ${title}.`)
    return `https://wa.me/${clean}?text=${text}`
  }

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">
      <Navbar />

      {/* QRIS MODAL */}
      {qrisModal && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6"
          onClick={() => setQrisModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-xs w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[#080d17] font-semibold text-sm mb-3">{qrisModal.title}</div>
            <img src={qrisModal.url} alt="QRIS" className="w-full object-contain rounded-xl" />
            <div className="text-[#080d17]/50 text-xs mt-3">Scan QRIS untuk berdonasi</div>
            <button
              onClick={() => setQrisModal(null)}
              className="mt-4 px-6 py-2 bg-[#080d17] text-white rounded-full text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <div className="text-center mb-12">
          <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Kami Ada Untukmu</div>
          <h1 className="text-3xl font-bold mb-3" style={{fontFamily:'Cinzel,serif'}}>Layanan UK3</h1>
          <p className="text-[#F5F0E8]/40 text-sm">Hubungi kami untuk berbagai kebutuhan rohani dan organisasi.</p>
        </div>

        {loading && (
          <div className="text-center text-[#F5F0E8]/30 py-20 animate-pulse text-sm">Memuat...</div>
        )}

        <div className="flex flex-col gap-5">
          {services.map(s => (
            <div key={s.id} className="rounded-2xl border border-[#C9A84C]/15 bg-[#111827] overflow-hidden">

              {/* Gambar */}
              {s.image_url && (
                <img src={s.image_url} alt={s.title} className="w-full h-44 object-cover" />
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <ServiceIcon iconKey={s.icon} className="w-5 h-5 text-[#C9A84C]" />
                  </div>
                  <h2 className="font-semibold text-lg">{s.title}</h2>
                </div>

                {s.description && (
                  <p className="text-[#F5F0E8]/50 text-sm leading-relaxed mb-5">{s.description}</p>
                )}

                <div className="flex flex-col gap-3">

                  {/* QRIS */}
                  {s.qris_url && (
                    <button
                      onClick={() => setQrisModal({ url: s.qris_url, title: s.title })}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-all w-full text-left"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                        <img src={s.qris_url} className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#F5F0E8]">Scan QRIS / Barcode</div>
                        <div className="text-xs text-[#F5F0E8]/30">Tap untuk perbesar</div>
                      </div>
                      <span className="text-[#C9A84C] text-xs">→</span>
                    </button>
                  )}

                  {/* Google Form */}
                  {s.form_url && (
                    <a href={s.form_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} className="text-[#C9A84C]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Isi Formulir Online</div>
                        <div className="text-xs text-[#F5F0E8]/30">Buka Google Form</div>
                      </div>
                      <span className="text-[#C9A84C] text-xs">→</span>
                    </a>
                  )}

                  {/* CP 1 */}
                  {s.cp_wa && (
                    <a href={waLink(s.cp_wa, s.title)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={16} className="text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{s.cp_name || 'Contact Person'}</div>
                        <div className="text-xs text-[#F5F0E8]/30">{s.cp_wa}</div>
                      </div>
                      <span className="text-green-400 text-xs font-medium">WA →</span>
                    </a>
                  )}

                  {/* CP 2 */}
                  {s.cp_wa2 && (
                    <a href={waLink(s.cp_wa2, s.title)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={16} className="text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{s.cp_name2}</div>
                        <div className="text-xs text-[#F5F0E8]/30">{s.cp_wa2}</div>
                      </div>
                      <span className="text-green-400 text-xs font-medium">WA →</span>
                    </a>
                  )}

                  {!s.cp_wa && !s.form_url && !s.qris_url && (
                    <div className="text-xs text-[#F5F0E8]/20 text-center py-2">
                      Info kontak akan segera ditambahkan
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}