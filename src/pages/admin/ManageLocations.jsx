import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { supabase } from '../../lib/supabase'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import { EmptyState, ErrorState, Loading } from '../../components/States'

L.Marker.prototype.options.icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] })

const EMPTY = []
const MAP_CENTER = [-7.0123, 113.8623]
const BLANK = { name: '', lat: null, lng: null, radius_m: 150 }
const fetchAll = () => unwrap(supabase.from('locations').select('*').order('name')).then((r) => r ?? [])

function LocationPicker({ position, onChange }) {
  useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) })
  return position ? <Marker position={position} /> : null
}

function FlyTo({ coords }) {
  const map = useMap()
  useEffect(() => { if (coords) map.flyTo(coords, 18, { duration: 1.2 }) }, [coords, map])
  return null
}

export default function ManageLocations() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchAll, EMPTY)
  const [local, setLocal] = useState(null)
  const list = local ?? data
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [flyTo, setFlyTo] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const refresh = useCallback(async () => {
    try { setLocal(await fetchAll()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  function open(item = null) {
    setForm(item ? { name: item.name, lat: item.lat, lng: item.lng, radius_m: item.radius_m ?? 150 } : BLANK)
    setQuery('')
    setResults([])
    setFormError('')
    setFlyTo(null)
    setModal({ editing: item })
  }

  function search(value) {
    setQuery(value)
    clearTimeout(timer.current)
    if (value.length < 3) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=id`, { headers: { 'Accept-Language': 'id' } })
        setResults(await res.json())
      } catch { setResults([]) } finally { setSearching(false) }
    }, 500)
  }

  function pick(r) {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    setForm((f) => ({ ...f, lat, lng }))
    setFlyTo([lat, lng])
    setQuery(r.display_name.split(',')[0])
    setResults([])
  }

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim()) return setFormError('Nama lokasi wajib diisi.')
    if (form.lat == null || form.lng == null) return setFormError('Tandai titik lokasi di peta atau cari alamatnya.')
    setSaving(true)
    setFormError('')
    try {
      const row = { name: form.name.trim(), lat: form.lat, lng: form.lng, radius_m: form.radius_m || 150 }
      if (modal.editing) await unwrap(supabase.from('locations').update(row).eq('id', modal.editing.id))
      else await unwrap(supabase.from('locations').insert(row))
      toast.success('Lokasi disimpan.')
      setModal(null)
      await refresh()
    } catch (err) { setFormError(err.message) } finally { setSaving(false) }
  }

  async function remove(l) {
    if (!(await confirm({ title: `Hapus lokasi “${l.name}”?`, message: 'Sesi yang memakai lokasi ini bisa terpengaruh.', confirmLabel: 'Ya, hapus' }))) return
    try { await unwrap(supabase.from('locations').delete().eq('id', l.id)); toast.success('Lokasi dihapus.'); await refresh() } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  const hasPin = form.lat != null && form.lng != null

  return (
    <AdminPage title="Lokasi Absensi" description="Peserta hanya bisa absen bila berada dalam radius lokasi yang Anda tentukan." action={<Button icon={Plus} onClick={() => open()}>Tambah Lokasi</Button>}>
      {loading && <Loading />}
      {error && <ErrorState message="Lokasi gagal dimuat." onRetry={retry} />}
      {!loading && !error && list.length === 0 && <Card><EmptyState icon={MapPin} title="Belum ada lokasi" action={<Button icon={Plus} onClick={() => open()}>Tambah lokasi</Button>}>Buat lokasi sebelum membuat sesi absensi.</EmptyState></Card>}
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((l) => (
          <Card key={l.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><MapPin size={20} /></span>
              <div className="min-w-0">
                <h3 className="truncate font-bold text-ink-900">{l.name}</h3>
                <div className="text-xs text-ink-500">Radius {l.radius_m} m · {l.lat?.toFixed(5)}, {l.lng?.toFixed(5)}</div>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => open(l)} aria-label={`Ubah ${l.name}`} className="rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-brand-700"><Pencil size={17} /></button>
              <button type="button" onClick={() => remove(l)} aria-label={`Hapus ${l.name}`} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => !saving && setModal(null)} title={modal?.editing ? 'Ubah Lokasi' : 'Lokasi Baru'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>Batal</Button><Button type="submit" form="location-form" loading={saving}>Simpan</Button></>}>
        <form id="location-form" onSubmit={save} className="flex flex-col gap-5">
          <Input label="Nama lokasi" required placeholder="mis. GSG UTM" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="relative">
            <Input label="Cari alamat atau gedung" icon={Search} placeholder="Ketik nama tempat…" value={query} onChange={(e) => search(e.target.value)} hint={searching ? 'Mencari…' : 'Atau klik langsung di peta untuk menandai titik.'} />
            {results.length > 0 && (
              <div className="absolute top-[4.25rem] right-0 left-0 z-[1000] overflow-hidden rounded-xl border border-paper-300 bg-white shadow-lift">
                {results.map((r) => (
                  <button key={r.place_id ?? r.display_name} type="button" onClick={() => pick(r)} className="block w-full border-b border-paper-200 px-4 py-2.5 text-left last:border-0 hover:bg-brand-50">
                    <div className="text-sm font-semibold text-ink-900">{r.display_name.split(',')[0]}</div>
                    <div className="truncate text-xs text-ink-400">{r.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="h-64 overflow-hidden rounded-xl border border-paper-300">
              <MapContainer center={hasPin ? [form.lat, form.lng] : MAP_CENTER} zoom={17} scrollWheelZoom className="h-full w-full">
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FlyTo coords={flyTo} />
                <LocationPicker position={hasPin ? [form.lat, form.lng] : null} onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
                {hasPin && <Circle center={[form.lat, form.lng]} radius={form.radius_m || 150} pathOptions={{ color: '#7B3BA8', fillColor: '#7B3BA8', fillOpacity: 0.15 }} />}
              </MapContainer>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              {hasPin ? <><span className="text-brand-700">📍 {form.lat.toFixed(6)}, {form.lng.toFixed(6)}</span><button type="button" onClick={() => setForm({ ...form, lat: null, lng: null })} className="font-semibold text-red-600">Hapus pin</button></> : <span className="text-ink-400">Belum ada titik dipilih</span>}
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold text-ink-700"><span>Radius zona kehadiran</span><span className="text-brand-700">{form.radius_m} m</span></div>
            <input type="range" min="50" max="300" step="10" value={form.radius_m} onChange={(e) => setForm({ ...form, radius_m: parseInt(e.target.value, 10) })} className="w-full accent-brand-700" aria-label="Radius" />
            <div className="flex justify-between text-xs text-ink-400"><span>50 m (ketat)</span><span>300 m (longgar)</span></div>
          </div>
          {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</div>}
        </form>
      </Modal>
    </AdminPage>
  )
}
