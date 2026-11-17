import { useCallback, useState } from 'react'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PLATFORMS, buildUrl, detectPlatform, editableValue, extractHandle, linkDisplay } from '../../lib/social'
import { friendlyError } from '../../lib/errors'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import SocialIcon from '../../components/SocialIcon'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input } from '../../components/ui/Field'
import { ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchLinks = () => unwrap(supabase.from('links').select('*').order('order_index')).then((r) => r ?? [])

// Satu akun per platform. Hanya "Lainnya" (formulir, dll.) yang boleh lebih dari satu.
const SINGLE = PLATFORMS.filter((p) => p.id !== 'other')
const needsLabel = (id) => id === 'whatsapp' || id === 'other'

export default function ManageLinks() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchLinks, EMPTY)
  const [local, setLocal] = useState(null)
  const links = local ?? data
  const [dlg, setDlg] = useState(null) // { platform, link? }
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    try { setLocal(await fetchLinks()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  function openDialog(platform, link = null) {
    setDlg({ platform, link })
    setValue(link ? editableValue(link) : '')
    setLabel(link && needsLabel(platform) ? (link.label ?? '') : '')
  }

  const platform = dlg ? PLATFORMS.find((p) => p.id === dlg.platform) : null
  const url = dlg ? buildUrl(dlg.platform, value) : ''
  const handle = dlg ? extractHandle(dlg.platform, url) || (value.trim() && !/^https?:|\./i.test(value.trim()) ? `@${value.trim().replace(/^@/, '').replace(/\s+/g, '')}` : '') : ''

  async function save(e) {
    e.preventDefault()
    if (!url) return toast.error('Isi akun atau link dulu.')
    if (needsLabel(dlg.platform) && !label.trim()) return toast.error(dlg.platform === 'whatsapp' ? 'Isi nama yang tampil, mis. nama Ketua Umum.' : 'Isi nama tampilan.')
    const name = needsLabel(dlg.platform) ? label.trim() : handle || platform.label
    setSaving(true)
    try {
      if (dlg.link) await unwrap(supabase.from('links').update({ label: name, url }).eq('id', dlg.link.id))
      else await unwrap(supabase.from('links').insert({ label: name, url, order_index: links.length }))
      toast.success(dlg.link ? 'Perubahan disimpan.' : 'Tersimpan dan tampil di beranda.')
      setDlg(null)
      await refresh()
    } catch (err) { toast.error(friendlyError(err, 'menyimpan tautan')) } finally { setSaving(false) }
  }

  async function remove(l) {
    const d = linkDisplay(l)
    if (!(await confirm({ title: `Hapus “${d.text}”?`, message: 'Akan hilang dari beranda dan halaman Tentang.', confirmLabel: 'Ya, hapus' }))) return
    try { await unwrap(supabase.from('links').delete().eq('id', l.id)); await refresh() } catch (err) { toast.error(friendlyError(err, 'menghapus')) }
  }

  const row = (l) => {
    const d = linkDisplay(l)
    return (
      <div key={l.id} className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-ink-900">{d.text}</div>
          <div className="truncate text-xs text-ink-400">{l.url}</div>
        </div>
        <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`Buka ${d.text}`} className="rounded-lg p-2 text-ink-400 hover:bg-brand-50 hover:text-brand-700"><ExternalLink size={16} /></a>
        <button type="button" onClick={() => openDialog(detectPlatform(l.url), l)} aria-label={`Ubah ${d.text}`} className="rounded-lg p-2 text-ink-400 hover:bg-brand-50 hover:text-brand-700"><Pencil size={16} /></button>
        <button type="button" onClick={() => remove(l)} aria-label={`Hapus ${d.text}`} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
      </div>
    )
  }

  const others = links.filter((l) => detectPlatform(l.url) === 'other')

  return (
    <AdminPage title="Sosmed & Tautan" description="Satu akun untuk tiap platform. Isi username atau link; alamat lengkap dibuat otomatis dan username tampil di website.">
      {loading && <Loading />}
      {error && <ErrorState message="Tautan gagal dimuat." onRetry={retry} />}
      {!loading && !error && (
        <div className="flex max-w-3xl flex-col gap-6">
          <Card className="divide-y divide-paper-200">
            {SINGLE.map((p) => {
              const mine = links.filter((l) => detectPlatform(l.url) === p.id)
              return (
                <div key={p.id} className="flex items-start gap-4 p-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><SocialIcon platform={p.id} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="kicker mb-1">{p.label}</div>
                    {mine.length === 0 && <div className="text-sm text-ink-400">Belum diisi.</div>}
                    {mine.map(row)}
                    {mine.length > 1 && <p className="mt-2 text-xs text-red-700">Ada lebih dari satu akun {p.label}. Hapus yang tidak dipakai agar tinggal satu.</p>}
                  </div>
                  {mine.length === 0 && <Button size="sm" variant="secondary" icon={Plus} onClick={() => openDialog(p.id)}>Tambah</Button>}
                </div>
              )
            })}
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="kicker">Tautan lainnya</div>
                <p className="text-xs text-ink-400">Mis. formulir pendaftaran atau website lain. Boleh lebih dari satu.</p>
              </div>
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => openDialog('other')}>Tambah</Button>
            </div>
            {others.length === 0 ? <div className="text-sm text-ink-400">Belum ada.</div> : <div className="flex flex-col gap-2">{others.map(row)}</div>}
          </Card>
        </div>
      )}

      <Modal
        open={!!dlg}
        onClose={() => setDlg(null)}
        title={dlg ? `${dlg.link ? 'Ubah' : 'Tambah'} ${platform.label}` : ''}
        footer={<><Button variant="secondary" onClick={() => setDlg(null)}>Batal</Button><Button type="submit" form="link-form" loading={saving}>Simpan</Button></>}
      >
        {dlg && (
          <form id="link-form" onSubmit={save} noValidate className="flex flex-col gap-4">
            <Input autoFocus label="Akun atau link" placeholder={platform.placeholder} hint={platform.hint} value={value} onChange={(e) => setValue(e.target.value)} />
            {needsLabel(dlg.platform) && (
              <Input
                label={dlg.platform === 'whatsapp' ? 'Nama yang ditampilkan' : 'Nama tampilan'}
                placeholder={dlg.platform === 'whatsapp' ? 'mis. nama Ketua Umum' : 'mis. Formulir Pendaftaran'}
                hint={dlg.platform === 'whatsapp' ? 'Ditulis sendiri, biasanya nama Ketua Umum.' : undefined}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            )}
            {url && (
              <p className="rounded-xl bg-paper-100 px-3 py-2 text-xs break-all text-ink-500">
                {needsLabel(dlg.platform) ? 'Tautan: ' : 'Tampil sebagai: '}
                <b className="text-ink-900">{needsLabel(dlg.platform) ? url : handle || platform.label}</b>
              </p>
            )}
          </form>
        )}
      </Modal>
    </AdminPage>
  )
}
