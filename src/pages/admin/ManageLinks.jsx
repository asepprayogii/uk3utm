import { useCallback, useState } from 'react'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PLATFORMS, buildUrl, detectPlatform } from '../../lib/social'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import SocialIcon from '../../components/SocialIcon'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchLinks = () => unwrap(supabase.from('links').select('*').order('order_index')).then((r) => r ?? [])

export default function ManageLinks() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchLinks, EMPTY)
  const [local, setLocal] = useState(null)
  const links = local ?? data
  const [platform, setPlatform] = useState('instagram')
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const current = PLATFORMS.find((p) => p.id === platform)
  const preview = buildUrl(platform, value)

  const refresh = useCallback(async () => {
    try { setLocal(await fetchLinks()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  async function add(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const name = label.trim() || (platform === 'other' ? preview.replace(/^https?:\/\//, '') : current.label)
      await unwrap(supabase.from('links').insert({ label: name, url: preview, order_index: links.length }))
      setValue('')
      setLabel('')
      toast.success('Tautan ditambahkan dan tampil di beranda.')
      await refresh()
    } catch (err) { toast.error(`Gagal menambah tautan: ${err.message}`) } finally { setSaving(false) }
  }

  async function remove(l) {
    if (!(await confirm({ title: `Hapus “${l.label}”?`, message: 'Tautan akan hilang dari beranda.', confirmLabel: 'Ya, hapus' }))) return
    try { await unwrap(supabase.from('links').delete().eq('id', l.id)); await refresh() } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  return (
    <AdminPage title="Sosmed & Tautan" description="Tambahkan media sosial atau tautan penting. Cukup pilih platform dan isi username; alamat lengkapnya dibuat otomatis.">
      {loading && <Loading />}
      {error && <ErrorState message="Tautan gagal dimuat." onRetry={retry} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-ink-900">Tambah tautan</h2>
            <form onSubmit={add} className="flex flex-col gap-4">
              <div>
                <div className="mb-1.5 text-xs font-semibold text-ink-700">1. Pilih platform</div>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button key={p.id} type="button" aria-pressed={platform === p.id} onClick={() => setPlatform(p.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors ${platform === p.id ? 'border-brand-700 bg-brand-50 text-brand-800 ring-1 ring-brand-700' : 'border-paper-300 text-ink-700 hover:bg-paper-50'}`}>
                      <SocialIcon platform={p.id} size={22} /> {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="2. Isi akun atau link" required placeholder={current.placeholder} hint={current.hint} value={value} onChange={(e) => setValue(e.target.value)} />
              {platform === 'other' && <Input label="Nama tampilan" required placeholder="mis. Formulir Pendaftaran" value={label} onChange={(e) => setLabel(e.target.value)} />}
              {preview && <p className="rounded-xl bg-paper-100 px-3 py-2 text-xs break-all text-ink-500">Akan tersimpan sebagai: <b className="text-ink-900">{preview}</b></p>}
              <div><Button type="submit" icon={Plus} loading={saving}>Tambah</Button></div>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-ink-900">Tampil di beranda</h2>
            <ul className="flex flex-col gap-2">
              {links.length === 0 && <li className="rounded-xl border border-dashed border-paper-300 py-8 text-center text-sm text-ink-400">Belum ada tautan.</li>}
              {links.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-paper-300 px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><SocialIcon platform={detectPlatform(l.url)} /></span>
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold text-ink-900">{l.label}</div><div className="truncate text-xs text-ink-400">{l.url}</div></div>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`Buka ${l.label}`} className="rounded-lg p-2 text-ink-400 hover:bg-brand-50 hover:text-brand-700"><ExternalLink size={16} /></a>
                  <button type="button" onClick={() => remove(l)} aria-label={`Hapus ${l.label}`} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </AdminPage>
  )
}
