import { useCallback, useMemo, useState } from 'react'
import { Copy, KeyRound, Pencil, Plus, Shuffle, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ROLE_LABEL } from '../../lib/adminNav'
import { formatDate, timeAgo } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Field'
import { ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchAccounts = () => unwrap(supabase.rpc('akun_daftar')).then((r) => r ?? [])

const ROLE_OPTIONS = [
  ['bph', 'BPH', 'Semua fitur, termasuk kelola akun.'],
  ['penatalayanan', 'Penatalayanan', 'Seluruh konten website, tanpa bagian Pembinaan.'],
  ['pembinaan', 'Pembinaan', 'Absensi, mahasiswa, pengumuman, dan layanannya.'],
  ['dopiper', 'Dopiper', 'Pengumuman, renungan, dan layanannya.'],
  ['mikat', 'Mikat', 'Pengumuman dan layanannya.'],
  ['viewer', 'Nonaktif', 'Tidak bisa mengubah apa pun (akun tetap ada).'],
]
const ROLE_TONE = { bph: 'gold', penatalayanan: 'brand', pembinaan: 'brand', dopiper: 'brand', mikat: 'brand', viewer: 'gray' }
const roleName = (r) => (r === 'viewer' ? 'Nonaktif' : ROLE_LABEL[r] ?? r)

// Kata sandi acak yang mudah diketik: tanpa huruf yang mirip (0/O, 1/l/I).
function randomPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

function accountError(err, action) {
  const msg = err?.message ?? String(err)
  if (/akun_(daftar|buat|ubah|sandi|hapus)|PGRST202|schema cache|could not find the function/i.test(msg)) {
    return `Fitur akun belum aktif di database. Jalankan file supabase/kelola-akun.sql di Supabase (SQL Editor), lalu coba lagi.`
  }
  if (/permission denied|Hanya BPH/i.test(msg)) return 'Hanya akun BPH yang boleh mengelola akun.'
  return `Gagal ${action}: ${msg}`
}

export default function ManageAccounts() {
  const { toast, confirm } = useUI()
  const { user } = useAuth()
  const { data, loading, error, retry } = useAsyncData(fetchAccounts, EMPTY)
  const [local, setLocal] = useState(null)
  const accounts = local ?? data
  const [dlg, setDlg] = useState(null) // { mode: 'baru' | 'ubah' | 'sandi', acc? }
  const [form, setForm] = useState({ email: '', name: '', role: 'mikat', password: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const bphCount = useMemo(() => accounts.filter((a) => a.role === 'bph').length, [accounts])

  const refresh = useCallback(async () => {
    try { setLocal(await fetchAccounts()) } catch (e) { toast.error(accountError(e, 'memuat ulang')) }
  }, [toast])

  function open(mode, acc = null) {
    setFormError('')
    setDlg({ mode, acc })
    setForm({
      email: acc?.email ?? '',
      name: acc?.name ?? '',
      role: acc?.role ?? 'mikat',
      password: mode === 'baru' ? randomPassword() : '',
    })
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function copyPassword() {
    try { await navigator.clipboard.writeText(form.password); toast.success('Kata sandi disalin.') } catch { toast.error('Gagal menyalin. Salin manual dari kolomnya.') }
  }

  async function submit(e) {
    e.preventDefault()
    setFormError('')
    const { mode, acc } = dlg
    if (mode !== 'ubah' && form.password.length < 8) return setFormError('Kata sandi minimal 8 karakter.')
    if (mode === 'baru' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setFormError('Format email belum benar.')
    setSaving(true)
    try {
      if (mode === 'baru') {
        await unwrap(supabase.rpc('akun_buat', { p_email: form.email, p_password: form.password, p_role: form.role, p_name: form.name }))
        toast.success(`Akun ${form.email.trim().toLowerCase()} dibuat. Catat kata sandinya.`)
      } else if (mode === 'ubah') {
        await unwrap(supabase.rpc('akun_ubah', { p_id: acc.id, p_role: form.role, p_name: form.name }))
        toast.success('Perubahan disimpan.')
      } else {
        await unwrap(supabase.rpc('akun_sandi', { p_id: acc.id, p_password: form.password }))
        toast.success(`Kata sandi ${acc.email} diganti.`)
      }
      setDlg(null)
      await refresh()
    } catch (err) {
      setFormError(accountError(err, mode === 'baru' ? 'membuat akun' : mode === 'ubah' ? 'menyimpan' : 'mengganti kata sandi'))
    } finally { setSaving(false) }
  }

  async function remove(a) {
    if (!(await confirm({
      title: `Hapus akun ${a.email}?`,
      message: 'Akun ini tidak bisa masuk lagi dan tidak bisa dikembalikan. Konten yang pernah dibuatnya tetap ada. Untuk sekadar menutup akses, ubah perannya menjadi Nonaktif.',
      confirmLabel: 'Ya, hapus akun',
    }))) return
    try { await unwrap(supabase.rpc('akun_hapus', { p_id: a.id })); toast.success('Akun dihapus.'); await refresh() } catch (err) { toast.error(accountError(err, 'menghapus akun')) }
  }

  const title = dlg?.mode === 'baru' ? 'Tambah akun' : dlg?.mode === 'ubah' ? 'Ubah akun' : 'Ganti kata sandi'

  return (
    <AdminPage
      title="Akun"
      description="Akun yang bisa masuk ke panel admin. Peran menentukan menu apa yang terbuka. Hanya BPH yang melihat halaman ini."
      action={<Button icon={Plus} onClick={() => open('baru')}>Tambah akun</Button>}
    >
      {loading && <Loading />}
      {error && <ErrorState message={accountError(error, 'memuat akun')} onRetry={retry} />}
      {!loading && !error && (
        <Card className="max-w-4xl divide-y divide-paper-200">
          {accounts.map((a) => {
            const me = a.id === user?.id
            return (
              <div key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-ink-900">{a.name || a.email}</span>
                    <Badge tone={ROLE_TONE[a.role] ?? 'gray'}>{roleName(a.role)}</Badge>
                    {me && <Badge tone="green">Kamu</Badge>}
                    {!a.terkonfirmasi && <Badge tone="amber">Belum dikonfirmasi</Badge>}
                  </div>
                  {a.name && <div className="truncate text-sm text-ink-500">{a.email}</div>}
                  <div className="mt-0.5 text-xs text-ink-400">
                    {a.terakhir_masuk ? `Terakhir masuk ${timeAgo(a.terakhir_masuk)}` : 'Belum pernah masuk'} · dibuat {formatDate(a.dibuat)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => open('ubah', a)} aria-label={`Ubah ${a.email}`} className="rounded-lg p-2 text-ink-400 hover:bg-brand-50 hover:text-brand-700"><Pencil size={16} /></button>
                  <button type="button" onClick={() => open('sandi', a)} aria-label={`Ganti kata sandi ${a.email}`} className="rounded-lg p-2 text-ink-400 hover:bg-brand-50 hover:text-brand-700"><KeyRound size={16} /></button>
                  {!me && <button type="button" onClick={() => remove(a)} aria-label={`Hapus ${a.email}`} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>}
                </div>
              </div>
            )
          })}
          {accounts.length === 0 && <div className="p-6 text-sm text-ink-400">Belum ada akun.</div>}
        </Card>
      )}

      <Modal
        open={!!dlg}
        onClose={() => setDlg(null)}
        title={title}
        description={dlg?.mode !== 'baru' ? dlg?.acc?.email : undefined}
        footer={<><Button variant="secondary" onClick={() => setDlg(null)}>Batal</Button><Button type="submit" form="akun-form" loading={saving}>{dlg?.mode === 'baru' ? 'Buat akun' : 'Simpan'}</Button></>}
      >
        {dlg && (
          <form id="akun-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
            {dlg.mode === 'baru' && <Input autoFocus label="Email" type="email" placeholder="mis. departemen@gmail.com" value={form.email} onChange={set('email')} />}
            {dlg.mode !== 'sandi' && (
              <>
                <Input label="Nama tampilan" placeholder="mis. Penatalayanan" hint="Opsional. Sapaan di panel admin memakai nama departemen dari peran." value={form.name} onChange={set('name')} />
                <Select
                  label="Peran"
                  value={form.role}
                  onChange={set('role')}
                  hint={ROLE_OPTIONS.find((r) => r[0] === form.role)?.[2]}
                  disabled={dlg.mode === 'ubah' && dlg.acc?.role === 'bph' && bphCount < 2}
                >
                  {ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
                {dlg.mode === 'ubah' && dlg.acc?.role === 'bph' && bphCount < 2 && (
                  <p className="-mt-2 text-xs text-ink-400">Ini satu-satunya akun BPH, jadi perannya dikunci. Jadikan akun lain BPH dulu untuk mengubahnya.</p>
                )}
              </>
            )}
            {dlg.mode !== 'ubah' && (
              <div>
                <Input
                  autoFocus={dlg.mode === 'sandi'}
                  label={dlg.mode === 'sandi' ? 'Kata sandi baru' : 'Kata sandi'}
                  hint="Minimal 8 karakter. Catat dan berikan ke pemegang akun; setelah disimpan tidak bisa dilihat lagi."
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" icon={Shuffle} onClick={() => setForm((f) => ({ ...f, password: randomPassword() }))}>Acak</Button>
                  <Button size="sm" variant="secondary" icon={Copy} onClick={copyPassword} disabled={!form.password}>Salin</Button>
                </div>
              </div>
            )}
            {formError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
          </form>
        )}
      </Modal>
    </AdminPage>
  )
}
