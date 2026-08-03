import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function LocationPicker({ position, onPositionChange }) {
  useMapEvents({
    click(e) { onPositionChange(e.latlng.lat, e.latlng.lng) },
  })
  return position ? <Marker position={position} /> : null
}

function FlyToLocation({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords) map.flyTo(coords, 18, { duration: 1.2 })
  }, [coords])
  return null
}

export default function ManageLocations() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', lat: null, lng: null, radius_m: 150 })

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [flyTo, setFlyTo] = useState(null)
  const searchTimeout = useRef(null)

  const mapCenter = [-7.0123, 113.8623]

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('locations').select('*').order('name')
    setLocations(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditData(null)
    setForm({ name: '', lat: null, lng: null, radius_m: 150 })
    setSearchQuery('')
    setSearchResults([])
    setError('')
    setShowForm(true)
  }

  function openEdit(loc) {
    setEditData(loc)
    setForm({ name: loc.name, lat: loc.lat, lng: loc.lng, radius_m: loc.radius_m })
    setSearchQuery('')
    setSearchResults([])
    setError('')
    setShowForm(true)
  }

  // Search alamat pakai Nominatim
  async function handleSearch(query) {
    setSearchQuery(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (query.length < 3) { setSearchResults([]); return }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=id`,
          { headers: { 'Accept-Language': 'id' } }
        )
        const data = await res.json()
        setSearchResults(data)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
  }

  function selectResult(result) {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setForm(f => ({ ...f, lat, lng }))
    setFlyTo([lat, lng])
    setSearchQuery(result.display_name.split(',')[0])
    setSearchResults([])
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama lokasi wajib diisi'); return }
    if (!form.lat || !form.lng) { setError('Pilih titik lokasi di peta'); return }
    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      lat: form.lat,
      lng: form.lng,
      radius_m: form.radius_m || 150,
    }

    if (editData) {
      const { error } = await supabase
        .from('locations')
        .update(payload)
        .eq('id', editData.id)
        .select()
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from('locations')
        .insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }

    setSaving(false)
    setShowForm(false)
    fetchData()
  }

  async function handleDelete(id) {
    await supabase.from('locations').delete().eq('id', id)
    setDeleteConfirm(null)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">

      {/* TOPBAR */}
      <div className="border-b border-[#C9A84C]/10 bg-[#0d1525]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-[#F5F0E8]/40 hover:text-[#C9A84C] text-sm transition-colors">
              ← Dashboard
            </Link>
            <span className="text-[#F5F0E8]/20">/</span>
            <span className="text-sm font-medium">Lokasi PD</span>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] transition-all"
          >
            + Tambah Lokasi
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* LIST */}
        {loading ? (
          <div className="text-center text-[#F5F0E8]/30 py-10 text-sm">Memuat...</div>
        ) : locations.length === 0 ? (
          <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">
            Belum ada lokasi. Klik "+ Tambah Lokasi".
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {locations.map(loc => (
              <div key={loc.id} className="p-5 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">{loc.name}</h3>
                  <div className="text-[#F5F0E8]/40 text-xs">
                    📍 {loc.lat?.toFixed(6)}, {loc.lng?.toFixed(6)}
                  </div>
                  <div className="text-[#C9A84C] text-xs mt-1">Radius: {loc.radius_m}m</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(loc)}
                    className="px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all">
                    Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(loc)}
                    className="px-3 py-1.5 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all">
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORM MODAL */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="font-semibold text-[#C9A84C] mb-5">
                  {editData ? 'Edit Lokasi' : 'Tambah Lokasi PD'}
                </h2>
                <form onSubmit={handleSave} className="flex flex-col gap-4">

                  {/* Nama lokasi */}
                  <input
                    type="text"
                    placeholder="Nama lokasi (contoh: GSG UTM)"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                  />

                  {/* Search alamat */}
                  <div className="relative">
                    <div className="text-xs text-[#F5F0E8]/40 mb-2">Cari alamat atau nama gedung</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ketik nama tempat, gedung, atau alamat..."
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60 pr-10"
                      />
                      {searching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C9A84C] text-xs animate-pulse">
                          ...
                        </div>
                      )}
                    </div>

                    {/* Hasil pencarian */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl overflow-hidden shadow-xl">
                        {searchResults.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectResult(r)}
                            className="w-full text-left px-4 py-3 text-xs text-[#F5F0E8]/80 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C] transition-colors border-b border-[#C9A84C]/10 last:border-0"
                          >
                            <div className="font-medium">{r.display_name.split(',')[0]}</div>
                            <div className="text-[#F5F0E8]/30 mt-0.5 truncate">{r.display_name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PETA */}
                  <div>
                    <div className="text-xs text-[#F5F0E8]/40 mb-2">
                      Atau klik langsung di peta untuk menandai lokasi
                    </div>
                    <div className="h-64 rounded-xl overflow-hidden border border-[#C9A84C]/20">
                      <MapContainer
                        center={form.lat && form.lng ? [form.lat, form.lng] : mapCenter}
                        zoom={17}
                        scrollWheelZoom={true}
                        className="h-full w-full"
                      >
                        <TileLayer
                          attribution='&copy; OpenStreetMap'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <FlyToLocation coords={flyTo} />
                        <LocationPicker
                          position={form.lat && form.lng ? [form.lat, form.lng] : null}
                          onPositionChange={(lat, lng) => setForm({...form, lat, lng})}
                        />
                        {form.lat && form.lng && (
                          <Circle
                            center={[form.lat, form.lng]}
                            radius={form.radius_m || 150}
                            pathOptions={{ color: '#C9A84C', fillColor: '#C9A84C', fillOpacity: 0.15 }}
                          />
                        )}
                      </MapContainer>
                    </div>
                    {form.lat && form.lng ? (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-[#C9A84C]">
                          📍 {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                        </span>
                        <button type="button"
                          onClick={() => setForm({...form, lat: null, lng: null})}
                          className="text-xs text-red-400 hover:text-red-300">
                          Hapus pin
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-[#F5F0E8]/20">Belum ada titik dipilih</div>
                    )}
                  </div>

                  {/* RADIUS */}
                  <div>
                    <div className="flex justify-between text-xs text-[#F5F0E8]/40 mb-2">
                      <span>Radius zona kehadiran</span>
                      <span className="text-[#C9A84C] font-medium">{form.radius_m}m</span>
                    </div>
                    <input
                      type="range" min="50" max="300"
                      value={form.radius_m}
                      onChange={e => setForm({...form, radius_m: parseInt(e.target.value)})}
                      className="w-full accent-[#C9A84C]"
                    />
                    <div className="flex justify-between text-xs text-[#F5F0E8]/20 mt-1">
                      <span>50m (ketat)</span>
                      <span>300m (longgar)</span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-[#C9A84C] text-[#080d17] font-semibold py-3 rounded-xl text-sm hover:bg-[#D4B483] disabled:opacity-50 transition-all">
                      {saving ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Lokasi'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 py-3 rounded-xl text-sm hover:bg-[#F5F0E8]/5 transition-all">
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-2xl">⚠</span>
              </div>
              <h3 className="font-semibold mb-2">Hapus Lokasi?</h3>
              <p className="text-[#F5F0E8]/50 text-sm mb-6">
                Lokasi <span className="text-[#F5F0E8] font-medium">"{deleteConfirm.name}"</span> akan dihapus permanen.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 py-2.5 rounded-xl text-sm hover:bg-[#F5F0E8]/5 transition-all">
                  Batal
                </button>
                <button onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm hover:bg-red-600 transition-all">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}