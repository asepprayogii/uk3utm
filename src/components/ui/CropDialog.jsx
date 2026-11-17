import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { PORTRAIT_RATIO, autoCrop, clampCrop } from '../../lib/image'
import Button from './Button'

// Area tampil foto menyesuaikan ukuran layar supaya seluruh dialog (termasuk tombol) selalu terlihat di HP.
const stageBox = () => ({ w: Math.max(200, Math.min(320, window.innerWidth - 72)), h: Math.max(180, Math.min(420, window.innerHeight - 250)) })

/**
 * Atur posisi foto profil (rasio 4:5): geser untuk memindah, geser slider untuk memperbesar.
 * Posisi awal otomatis. Enter = Pakai, Escape = batal (hanya menutup dialog ini).
 */
export default function CropDialog({ file, initial, onApply, onCancel }) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  const [dim, setDim] = useState(null)
  const [crop, setCrop] = useState(null)
  const drag = useRef(null)
  const [box] = useState(stageBox)
  const cropRef = useRef(null)
  const applyRef = useRef(onApply)
  const cancelRef = useRef(onCancel)
  useEffect(() => {
    applyRef.current = onApply
    cancelRef.current = onCancel
    cropRef.current = crop
  })
  useEffect(() => () => URL.revokeObjectURL(url), [url])

  // Capture + stopImmediatePropagation: Escape/Enter hanya berlaku untuk dialog ini, bukan formulir di belakangnya.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        cancelRef.current?.()
      } else if (e.key === 'Enter' && cropRef.current && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault()
        e.stopImmediatePropagation()
        applyRef.current?.(cropRef.current)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  function onLoad(e) {
    const w = e.currentTarget.naturalWidth
    const h = e.currentTarget.naturalHeight
    setDim({ w, h })
    setCrop(clampCrop(initial ?? autoCrop(w, h), w, h))
  }

  // Seluruh foto ditampilkan (k = piksel layar per piksel sumber); kotak 4:5 menunjukkan bagian yang dipakai.
  const k = dim ? Math.min(box.w / dim.w, box.h / dim.h) : 1
  const maxW = dim ? Math.min(dim.w, dim.h / PORTRAIT_RATIO) : 1
  const zoom = crop ? maxW / crop.w : 1

  function move(dx, dy) {
    setCrop((c) => clampCrop({ ...c, x: c.x + dx / k, y: c.y + dy / k }, dim.w, dim.h))
  }
  function setZoom(z) {
    setCrop((c) => {
      const w = maxW / Math.min(Math.max(z, 1), 6)
      const cx = c.x + c.w / 2
      const cy = c.y + (c.w * PORTRAIT_RATIO) / 2
      return clampCrop({ w, x: cx - w / 2, y: cy - (w * PORTRAIT_RATIO) / 2 }, dim.w, dim.h)
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-ink-900/70 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div role="dialog" aria-modal="true" aria-label="Atur posisi foto" className="max-h-[100dvh] w-full max-w-sm animate-sheet-in overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <h2 className="text-lg font-bold text-ink-900">Atur posisi foto</h2>
        <p className="mt-0.5 text-sm text-ink-500">Geser kotak ke bagian yang ingin dipakai. Geser slider untuk memperbesar atau memperkecil kotak.</p>

        <div className="mt-4 flex justify-center">
          <div
            data-testid="crop-stage"
            className="relative touch-none overflow-hidden rounded-sm bg-paper-200 select-none"
            style={dim ? { width: dim.w * k, height: dim.h * k, cursor: 'grab' } : { width: box.w, height: box.h }}
            tabIndex={0}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              drag.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerMove={(e) => {
              if (!drag.current || !crop) return
              move(e.clientX - drag.current.x, e.clientY - drag.current.y)
              drag.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerUp={() => { drag.current = null }}
            onPointerCancel={() => { drag.current = null }}
            onWheel={(e) => crop && setZoom(zoom - Math.sign(e.deltaY) * 0.2)}
            onKeyDown={(e) => {
              if (e.key === '+' || e.key === '=') return setZoom(zoom + 0.25)
              if (e.key === '-') return setZoom(zoom - 0.25)
              const step = 12
              const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
              if (d && crop) { e.preventDefault(); move(d[0], d[1]) }
            }}
          >
            <img src={url} alt="Foto yang dipotong" draggable={false} onLoad={onLoad} className="pointer-events-none block h-full w-full" style={dim ? undefined : { opacity: 0 }} />
            {crop && dim && (
              <div
                data-testid="crop-box"
                className="pointer-events-none absolute border-2 border-white"
                style={{ left: crop.x * k, top: crop.y * k, width: crop.w * k, height: crop.w * PORTRAIT_RATIO * k, boxShadow: '0 0 0 9999px rgba(28,28,28,0.6)' }}
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" aria-label="Perkecil" onClick={() => setZoom(zoom - 0.25)} className="rounded-lg p-1.5 text-ink-500 hover:bg-paper-100"><Minus size={18} /></button>
          <input type="range" aria-label="Perbesar" min="1" max="6" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-1 flex-1 accent-brand-600" />
          <button type="button" aria-label="Perbesar" onClick={() => setZoom(zoom + 0.25)} className="rounded-lg p-1.5 text-ink-500 hover:bg-paper-100"><Plus size={18} /></button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => dim && setCrop(clampCrop(autoCrop(dim.w, dim.h), dim.w, dim.h))}>Atur ulang</Button>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={onCancel}>Batal</Button>
            <Button size="sm" disabled={!crop} onClick={() => applyRef.current?.(crop)}>Pakai</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
