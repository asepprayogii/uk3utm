import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, Crown, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { removeByUrl } from '../../lib/storage'
import {
  BPH_POSITIONS, DEPARTMENTS, DEPT_POSITIONS, DIVISIONS, FIXED_GROUPS, GROUP_LABELS, KADEP_POSITION,
  autoLevel, autoOrder, groupCommittee, structureIssues, validateMember,
} from '../../lib/committee'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useImageField } from '../../hooks/useImageField'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Field'
import ImageUpload from '../../components/ui/ImageUpload'
import Modal from '../../components/ui/Modal'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const CUSTOM = '__custom'
const fetchCommittee = () => unwrap(supabase.from('committee').select('*')).then((r) => r ?? [])

const CATEGORIES = [
  { id: 'Pembina', title: 'Pembina', hint: 'Pendamping organisasi' },
  { id: 'Pembimbing', title: 'Pembimbing', hint: 'Dosen / pembimbing' },
  { id: 'BPH', title: 'BPH', hint: 'Ketua, sekretaris, dll.' },
  { id: 'Departemen', title: 'Departemen', hint: 'Kepala & anggota divisi' },
]

const blankForm = (base = {}) => ({
  name: '', category: 'BPH', dept: DEPARTMENTS[0], preset: BPH_POSITIONS[0], custom: '', division: '', ...base,
})

function presetsFor(category) {
  if (category === 'BPH') return BPH_POSITIONS
  if (category === 'Departemen') return DEPT_POSITIONS
  return []
}

function formFromMember(m) {
  const category = FIXED_GROUPS.includes(m.department) ? m.department : 'Departemen'
  const presets = presetsFor(category)
  const inPreset = presets.includes(m.position)
  return {
    name: m.name ?? '', category, dept: category === 'Departemen' ? m.department : DEPARTMENTS[0],
    preset: category === 'Pembina' || category === 'Pembimbing' ? CUSTOM : inPreset ? m.position : CUSTOM,
    custom: inPreset ? '' : (m.position ?? ''), division: m.division ?? '',
  }
}

// Nilai yang benar-benar disimpan ke database, diturunkan dari pilihan di form.
function toRecord(f) {
  const department = f.category === 'Departemen' ? f.dept : f.category
  const fixedLabel = f.category === 'Pembina' || f.category === 'Pembimbing'
  const position = (f.preset === CUSTOM || fixedLabel ? f.custom : f.preset).trim() || (fixedLabel ? f.category : '')
  const is_kadep = f.category === 'Departemen' && position.toLowerCase() === KADEP_POSITION.toLowerCase()
  const division = f.category === 'Departemen' && !is_kadep ? f.division : ''
  return { name: f.name.trim(), position, department, division, is_kadep }
}

function MemberRow({ m, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-paper-300 bg-white p-3 transition-shadow hover:shadow-soft">
      <Avatar name={m.name} src={m.photo_url} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-ink-900">{m.name}</span>
          {m.is_kadep && <Badge tone="gold" icon={Crown}>Kepala</Badge>}
          {m.division && <Badge tone="brand">{m.division}</Badge>}
          {!m.photo_url && <Badge tone="gray">Belum ada foto</Badge>}
        </div>
        <div className="text-sm text-ink-500">{m.position}</div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button type="button" onClick={() => onEdit(m)} aria-label={`Ubah ${m.name}`} className="rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-brand-700"><Pencil size={17} /></button>
        <button type="button" onClick={() => onDelete(m)} aria-label={`Hapus ${m.name}`} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
      </div>
    </div>
  )
}

function Section({ title, sub, members, onEdit, onDelete }) {
  if (members.length === 0) return null
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-bold tracking-wide text-brand-800 uppercase">{title}</h2>
        {sub && <span className="text-xs text-ink-400">{sub}</span>}
        <span className="text-xs text-ink-400">· {members.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {members.map((m) => <MemberRow key={m.id} m={m} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
    </section>
  )
}

function PreviewCard({ record, photo }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
      <div className="mb-2 text-[11px] font-bold tracking-widest text-brand-600 uppercase">Pratinjau di website</div>
      <div className="flex items-center gap-3">
        <Avatar name={record.name || '?'} src={photo} size="md" />
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink-900">{record.name || 'Nama pengurus'}</div>
          <div className="text-xs font-semibold tracking-wide text-gold-700 uppercase">{record.position || 'Jabatan'}</div>
          <div className="mt-0.5 text-xs text-ink-500">
            {record.department}{record.is_kadep ? ' · Kepala Departemen' : record.division ? ` · Divisi ${record.division}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManageCommittee() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchCommittee, EMPTY)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null) // { editing: member|null }
  const [form, setForm] = useState(blankForm())
  const [saving, setSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const photo = useImageField(null)

  // `data` dari useAsyncData hanya dimuat sekali; perubahan lokal disimpan di sini.
  const [local, setLocal] = useState(null)
  const list = local ?? data
  const refresh = useCallback(async () => {
    try {
      setLocal(await fetchCommittee())
    } catch (e) {
      toast.error(`Gagal memuat ulang: ${e.message}`)
    }
  }, [toast])

  const issues = useMemo(() => structureIssues(list).filter((i) => !i.includes('foto')), [list])
  const record = toRecord(form)
  const { errors, warnings } = validateMember(record, list, modal?.editing?.id ?? null)

  const q = query.trim().toLowerCase()
  const filtered = list.filter((m) => {
    if (q && !`${m.name} ${m.position} ${m.division ?? ''}`.toLowerCase().includes(q)) return false
    return filter === 'all' || m.department === filter
  })
  const g = groupCommittee(filtered)

  const chips = [
    { id: 'all', label: 'Semua', count: list.length },
    ...[...FIXED_GROUPS, ...DEPARTMENTS].map((d) => ({ id: d, label: d, count: list.filter((m) => m.department === d).length })),
  ]

  function openAdd() {
    if (DEPARTMENTS.includes(filter)) setForm(blankForm({ category: 'Departemen', dept: filter, preset: DEPT_POSITIONS[2] }))
    else if (FIXED_GROUPS.includes(filter)) setForm(blankForm({ category: filter, preset: presetsFor(filter)[0] ?? CUSTOM }))
    else setForm(blankForm())
    photo.reset(null)
    setShowErrors(false)
    setModal({ editing: null })
  }

  function openEdit(m) {
    setForm(formFromMember(m))
    photo.reset(m.photo_url ?? null)
    setShowErrors(false)
    setModal({ editing: m })
  }

  function setCategory(category) {
    const presets = presetsFor(category)
    setForm((f) => ({ ...f, category, preset: presets[0] ?? CUSTOM, custom: '', division: '' }))
  }

  async function save(addAnother = false) {
    setShowErrors(true)
    if (errors.length > 0) return
    setSaving(true)
    try {
      const { url, changed, oldUrl } = await photo.commit('committee')
      const row = {
        ...record, photo_url: url,
        order_index: autoOrder(record.position, record.department, record.is_kadep),
        level: autoLevel(record.department, record.is_kadep),
      }
      const editing = modal.editing
      if (editing) await unwrap(supabase.from('committee').update(row).eq('id', editing.id))
      else await unwrap(supabase.from('committee').insert(row))
      if (changed && oldUrl) removeByUrl(oldUrl)
      toast.success(editing ? 'Data pengurus diperbarui.' : `${row.name} ditambahkan.`)
      await refresh()
      if (addAnother && !editing) {
        setForm((f) => blankForm({ category: f.category, dept: f.dept, preset: presetsFor(f.category)[0] ?? CUSTOM, division: f.division }))
        photo.reset(null)
        setShowErrors(false)
      } else {
        setModal(null)
      }
    } catch (e) {
      toast.error(`Gagal menyimpan: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function remove(m) {
    const ok = await confirm({ title: `Hapus ${m.name}?`, message: 'Pengurus ini akan hilang dari website. Tindakan ini tidak bisa dibatalkan.', confirmLabel: 'Ya, hapus' })
    if (!ok) return
    try {
      await unwrap(supabase.from('committee').delete().eq('id', m.id))
      if (m.photo_url) removeByUrl(m.photo_url)
      toast.success(`${m.name} dihapus.`)
      await refresh()
    } catch (e) {
      toast.error(`Gagal menghapus: ${e.message}`)
    }
  }

  const presets = presetsFor(form.category)
  const isFixed = form.category === 'Pembina' || form.category === 'Pembimbing'
  const divisions = DIVISIONS[form.dept] ?? []
  const knownDivision = divisions.includes(form.division)

  return (
    <AdminPage
      title="Kepengurusan"
      description="Atur susunan pengurus yang tampil di halaman Kepengurusan. Urutan dan tampilan diatur otomatis dari jabatan."
      action={<Button icon={Plus} onClick={openAdd}>Tambah Pengurus</Button>}
    >
      {loading && <Loading />}
      {error && <ErrorState message="Data pengurus gagal dimuat." onRetry={retry} />}

      {!loading && !error && (
        <>
          {issues.length > 0 && list.length > 0 && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <div className="font-bold">Struktur belum lengkap</div>
                <ul className="mt-1 list-disc pl-4">{issues.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            </div>
          )}

          {list.length === 0 ? (
            <Card><EmptyState icon={Users} title="Belum ada pengurus" action={<Button icon={Plus} onClick={openAdd}>Tambah pengurus pertama</Button>}>
              Mulai dari Ketua BPH, lalu lengkapi anggota lainnya. Urutan di website akan tersusun otomatis.
            </EmptyState></Card>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-3">
                <Input icon={Search} placeholder="Cari nama atau jabatan…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Cari pengurus" />
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter kelompok">
                  {chips.filter((c) => c.id === 'all' || c.count > 0 || filter === c.id).map((c) => (
                    <button key={c.id} type="button" role="tab" aria-selected={filter === c.id} onClick={() => setFilter(c.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${filter === c.id ? 'border-brand-700 bg-brand-700 text-white' : 'border-paper-300 bg-white text-ink-700 hover:bg-brand-50'}`}>
                      {c.label} <span className="opacity-60">{c.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 && <EmptyState title="Tidak ada hasil">Coba kata kunci atau filter lain.</EmptyState>}
              <div className="flex flex-col gap-8">
                <Section title={GROUP_LABELS.Pembina} members={g.pembina} onEdit={openEdit} onDelete={remove} />
                <Section title={GROUP_LABELS.Pembimbing} members={g.pembimbing} onEdit={openEdit} onDelete={remove} />
                <Section title={GROUP_LABELS.BPH} members={g.bph} onEdit={openEdit} onDelete={remove} />
                {g.departments.map((d) => (
                  <Section key={d.name} title={`Departemen ${d.name}`} members={[...d.kadep, ...d.divisions.flatMap((x) => x.members), ...d.others]} onEdit={openEdit} onDelete={remove} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal
        open={!!modal}
        onClose={() => !saving && setModal(null)}
        title={modal?.editing ? 'Ubah Pengurus' : 'Tambah Pengurus'}
        description="Isi dari atas ke bawah. Pratinjau menunjukkan hasilnya di website."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>Batal</Button>
            {!modal?.editing && <Button variant="secondary" onClick={() => save(true)} loading={saving}>Simpan & tambah lagi</Button>}
            <Button onClick={() => save(false)} loading={saving}>{modal?.editing ? 'Simpan Perubahan' : 'Simpan'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2 text-sm font-semibold text-ink-900"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 text-xs text-white">1</span>Pengurus ini berada di mana?</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategory(c.id)} aria-pressed={form.category === c.id}
                  className={`rounded-xl border p-3 text-left transition-colors ${form.category === c.id ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' : 'border-paper-300 hover:bg-paper-50'}`}>
                  <div className="text-sm font-bold text-ink-900">{c.title}</div>
                  <div className="text-xs text-ink-500">{c.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {form.category === 'Departemen' && (
              <Select label="Departemen" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value, division: '' })}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </Select>
            )}
            {!isFixed && (
              <Select label="Jabatan" value={form.preset} onChange={(e) => setForm({ ...form, preset: e.target.value })}>
                {presets.map((p) => <option key={p}>{p}</option>)}
                <option value={CUSTOM}>Lainnya (ketik sendiri)…</option>
              </Select>
            )}
            {(isFixed || form.preset === CUSTOM) && (
              <Input label={isFixed ? 'Jabatan (opsional)' : 'Nama jabatan'} placeholder={isFixed ? form.category : 'mis. Sekretaris II'} value={form.custom} onChange={(e) => setForm({ ...form, custom: e.target.value })} />
            )}
            {form.category === 'Departemen' && !record.is_kadep && (
              <Select label="Divisi" hint="Kosongkan bila anggota departemen secara umum." value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })}>
                <option value="">— Tanpa divisi —</option>
                {divisions.map((d) => <option key={d}>{d}</option>)}
                {form.division && !knownDivision && <option>{form.division}</option>}
              </Select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <Input label="Nama lengkap" required placeholder="Nama sesuai yang ingin ditampilkan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <ImageUpload field={photo} shape="circle" label="Foto" hint="Dipotong persegi otomatis." name={form.name} />
          </div>

          <PreviewCard record={record} photo={photo.preview} />

          {showErrors && errors.length > 0 && (
            <ul role="alert" className="list-disc rounded-xl border border-red-200 bg-red-50 py-3 pr-4 pl-8 text-sm text-red-800">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          )}
          {warnings.length > 0 && (
            <ul className="list-disc rounded-xl border border-amber-200 bg-amber-50 py-3 pr-4 pl-8 text-sm text-amber-900">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
          )}
        </div>
      </Modal>
    </AdminPage>
  )
}
