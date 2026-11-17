import { useEffect, useRef, useState } from 'react'

// Muncul pelan (naik sedikit + memudar) saat masuk layar. Hanya sekali, dan dilewati bila pengguna memilih gerak minimal.
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...props }) {
  const ref = useRef(null)
  // Langsung tampil bila gerak dikurangi atau browser tak mendukung IntersectionObserver.
  const [shown, setShown] = useState(() => typeof window === 'undefined' || typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown])

  return (
    <Tag ref={ref} style={{ '--d': `${delay}ms` }} className={`reveal ${shown ? 'is-in' : ''} ${className}`} {...props}>
      {children}
    </Tag>
  )
}
