import { useContext } from 'react'
import { UIContext } from '../context/uiContext'

export function useUI() {
  return useContext(UIContext)
}
