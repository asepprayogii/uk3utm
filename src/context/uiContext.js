import { createContext } from 'react'

// toast: { success(msg), error(msg), info(msg) }
// confirm: (opsi) => Promise<boolean>
export const UIContext = createContext({
  toast: { success() {}, error() {}, info() {} },
  confirm: async () => false,
})
