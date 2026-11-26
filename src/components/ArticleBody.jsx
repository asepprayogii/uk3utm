// Isi halaman baca ala berita: di layar lebar gambar di samping (menempel saat di-scroll) dan teks di sebelahnya,
// jadi isi langsung terbaca tanpa menggulung melewati gambar besar. Di ponsel: gambar di atas, teks di bawah.
// Gambar tampil apa adanya (rasio asli, tanpa latar atau ruang kosong di sisinya); bila terlalu tinggi, mengecil proporsional.
// Tanpa gambar: hanya kolom teks.
export default function ArticleBody({ image, alt = '', children }) {
  if (!image) return <article>{children}</article>
  return (
    <article className="grid gap-8 md:grid-cols-12 md:gap-12">
      <div className="md:col-span-5">
        <div className="md:sticky md:top-24">
          <img src={image} alt={alt} className="block h-auto max-h-[85vh] w-auto max-w-full border border-paper-300" />
        </div>
      </div>
      <div className="md:col-span-7">{children}</div>
    </article>
  )
}
