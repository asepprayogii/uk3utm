import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { prepareImage, formatBytes } from '../../lib/image'
import { useUI } from '../../hooks/useUI'
import Avatar from './Avatar'
import Button from './Button'

/**
 * Unggah gambar dengan pratinjau, drag & drop, dan kompres otomatis.
 * `field` berasal dari useImageField().
 * shape: 'wide' (banner 16:9) | 'square' | 'circle' (foto profil, dipotong persegi otomatis)
 */
export default function ImageUpload({ field, label, hint, shape = 'wide', lossless = false, maxSize, name }) {
  const { toast } = useUI()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [info, setInfo] = useState('')

  async function handleFile(file) {
    if (!file) return
    setBusy(true)
    try {
      const prepared = await prepareImage(file, {
        square: shape === 'circle' || shape === 'square',
        lossless,
        maxSize: maxSize ?? (shape === 'circle' ? 640 : lossless ? 1400 : 1600),
      })
      field.select(prepared)
      setInfo(`${formatBytes(file.size)} → ${formatBytes(prepared.blob.size)}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const input = (
    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
  )

  if (shape === 'circle') {
    return (
      <div>
        {label && <div className="mb-1.5 text-xs font-semibold text-ink-700">{label}</div>}
        <div className="flex items-center gap-4 rounded-xl border border-paper-300 bg-white p-4">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              handleFile(e.dataTransfer.files?.[0])
            }}
            className={`rounded-full ${drag ? 'ring-4 ring-brand-300' : ''}`}
          >
            <Avatar name={name} src={field.preview} size="xl" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" icon={busy ? Loader2 : ImagePlus} disabled={busy} onClick={() => inputRef.current?.click()}>
                {field.hasImage ? 'Ganti foto' : 'Pilih foto'}
              </Button>
              {field.hasImage && (
                <Button size="sm" variant="dangerSoft" icon={Trash2} onClick={field.remove}>
                  Hapus
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-400">{info || hint || 'Foto otomatis dipotong persegi dan diperkecil.'}</p>
          </div>
        </div>
        {input}
      </div>
    )
  }

  const aspect = shape === 'square' ? 'aspect-square max-w-[16rem]' : 'aspect-video'

  return (
    <div>
      {label && <div className="mb-1.5 text-xs font-semibold text-ink-700">{label}</div>}
      <div
        onClick={() => !field.hasImage && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={`group relative ${aspect} w-full overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          drag ? 'border-brand-500 bg-brand-50' : 'border-paper-300 bg-paper-50'
        } ${field.hasImage ? '' : 'cursor-pointer hover:border-brand-300 hover:bg-brand-50/50'}`}
      >
        {field.preview ? (
          <>
            <img src={field.preview} alt="Pratinjau" className={`h-full w-full ${lossless ? 'bg-white object-contain p-2' : 'object-cover'}`} />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-xs text-white/90">{info}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={busy} onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
                  Ganti
                </Button>
                <Button size="sm" variant="dangerSoft" icon={Trash2} onClick={(e) => { e.stopPropagation(); field.remove() }}>
                  Hapus
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            {busy ? <Loader2 className="animate-spin text-brand-500" /> : <ImagePlus className="text-brand-400" />}
            <div className="text-sm font-semibold text-ink-700">Klik atau tarik gambar ke sini</div>
            <div className="text-xs text-ink-400">{hint || 'JPG, PNG, atau WebP. Otomatis diperkecil.'}</div>
          </div>
        )}
      </div>
      {input}
    </div>
  )
}
