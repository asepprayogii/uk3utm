export default function PageHeader({ eyebrow, title, subtitle, className = 'mb-12' }) {
  return (
    <header className={`text-center ${className}`}>
      {eyebrow && <div className="mb-2 text-xs tracking-widest uppercase text-gold-500">{eyebrow}</div>}
      <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
      {subtitle && <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream/40">{subtitle}</p>}
    </header>
  )
}
