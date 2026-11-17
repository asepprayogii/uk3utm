import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { PORTRAIT_RATIO, autoCrop, clampCrop } from '../../lib/image'
import Button from './Button'

const FRAME_W = 280
const FRAME_H = FRAME_W * PORTRAIT_RATIO

/**
 * Atur posisi foto profil (rasio 4:5): geser untuk memindah, geser slider untuk memperbesar.
 * Posisi awal otomatis. Enter = Pakai, Escape = batal (hanya menutup dialog ini).
 */
export default function CropDialog({ file, initial, onApply, onCancel }) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  const [dim, setDim] = useState(null)
  const [crop, setCrop] = useState(null)
  const drag = useRef(null)
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
      } else if (e.key === 'Enter' && cropRef.current) {
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

  const scale = crop ? FRAME_W / crop.w : 1 // piksel layar per piksel sumber
  const maxW = dim ? Math.min(dim.w, dim.h / PORTRAIT_RATIO) : 1
  const zoom = crop ? maxW / crop.w : 1

  function move(dx, dy) {
    setCrop((c) => clampCrop({ ...c, x: c.x - dx / scale, y: c.y - dy / scale }, dim.w, dim.h))
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
      <div role="dialog" aria-modal="true" aria-label="Atur posisi foto" className="w-full max-w-sm animate-sheet-in rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <h2 className="text-lg font-bold text-ink-900">Atur posisi foto</h2>
        <p className="mt-0.5 text-sm text-ink-500">Geser foto untuk memindah, geser slider untuk memperbesar.</p>

        <div
          data-testid="crop-frame"
          className="relative mx-auto mt-4 touch-none overflow-hidden rounded-sm bg-paper-200 select-none"
          style={{ width: FRAME_W, height: FRAME_H, cursor: 'grab' }}
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
          onKeyDown={(e) => {
            const step = 12
            const d = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key]
            if (d && crop) { e.preventDefault(); move(d[0], d[1]) }
          }}
        >
          <img
            src={url}
            alt="Foto yang dipotong"
            draggable={false}
            onLoad={onLoad}
            className="pointer-events-none absolute top-0 left-0 max-w-none"
            style={crop && dim ? { width: dim.w * scale, height: dim.h * scale, transform: `translate(${-crop.x * scale}px, ${-crop.y * scale}px)` } : { opacity: 0 }}
          />
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
