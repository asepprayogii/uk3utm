import { useCallback, useState } from 'react'
import { uploadPrepared } from '../lib/storage'

/**
 * Menyimpan status satu gambar di form: URL lama, gambar baru yang sudah dikompres,
 * atau penghapusan. `commit(folder)` mengunggah (bila perlu) dan mengembalikan URL akhir.
 */
export function useImageField(initialUrl = null) {
  const [state, setState] = useState({ url: initialUrl, prepared: null, removed: false })

  const reset = useCallback((url = null) => setState({ url, prepared: null, removed: false }), [])
  const select = useCallback((prepared) => setState((s) => ({ ...s, prepared, removed: false })), [])
  const remove = useCallback(() => setState((s) => ({ ...s, prepared: null, removed: true })), [])

  const preview = state.prepared?.preview ?? (state.removed ? null : state.url)

  async function commit(folder) {
    if (state.prepared) return { url: await uploadPrepared(state.prepared, folder), changed: true, oldUrl: state.url }
    if (state.removed) return { url: null, changed: true, oldUrl: state.url }
    return { url: state.url, changed: false, oldUrl: null }
  }

  return { preview, hasImage: !!preview, select, remove, reset, commit }
}
