import Navbar from './Navbar'
import Footer from './Footer'

// Kerangka standar halaman publik: navbar, konten utama, footer.
export default function PageLayout({ children, width = 'max-w-4xl' }) {
  return (
    <div className="flex min-h-screen flex-col bg-navy-950 text-cream">
      <Navbar />
      <main className={`mx-auto w-full flex-1 px-5 pt-28 pb-20 sm:px-6 ${width}`}>{children}</main>
      <Footer />
    </div>
  )
}
