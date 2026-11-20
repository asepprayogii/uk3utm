// Visi & Misi: tampilan yang sama di beranda dan halaman Tentang.
export default function VisionMission({ vision, mission }) {
  return (
    <>
      {vision && (
        <blockquote className="display mx-auto max-w-4xl text-center text-3xl font-normal text-balance italic sm:text-5xl">“{vision}”</blockquote>
      )}
      {mission.length > 0 && (
        <ol className={`${vision ? 'mt-14' : ''} grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3`}>
          {mission.map((m, i) => (
            <li key={i} className="border-t border-paper-300 pt-4">
              <span className="mb-3 block h-px w-8 bg-brand-600" aria-hidden="true" />
              <p className="leading-relaxed">{m}</p>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
