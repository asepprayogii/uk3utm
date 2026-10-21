// Ekspor daftar hadir ke PDF. Dimuat on-demand (jspdf cukup besar).

async function loadImageAsDataUrl(url) {
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'no-cache' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const fmtDate = (v) => new Date(v).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const fmtTime = (v) => new Date(v).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

/** Mengembalikan jumlah tanda tangan yang gagal dimuat (0 = semua tampil). */
export async function exportAttendancePdf(session, attendances) {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

  const doc = new JsPDF('p', 'mm', 'a4')
  const pageW = doc.internal.pageSize.getWidth()

  const sigMap = {}
  let missing = 0
  for (const a of attendances) {
    if (!a.signature_url) continue
    const data = await loadImageAsDataUrl(a.signature_url)
    if (data) sigMap[a.id] = data
    else missing++
  }

  const grouped = attendances.reduce((acc, a) => {
    const key = a.angkatan || 'Tidak Diketahui'
    ;(acc[key] ??= []).push(a)
    return acc
  }, {})
  const angkatanList = Object.keys(grouped).sort()

  let y = 15
  doc.setFontSize(14).setFont('helvetica', 'bold')
  doc.text('UNIT KEGIATAN KEROHANIAN KRISTEN', pageW / 2, y, { align: 'center' })
  y += 6
  doc.setFontSize(11).setFont('helvetica', 'normal')
  doc.text('Universitas Trunojoyo Madura', pageW / 2, y, { align: 'center' })
  y += 5
  doc.text('Persekutuan Doa Revive', pageW / 2, y, { align: 'center' })
  y += 4
  doc.setDrawColor(201, 162, 74).setLineWidth(0.8).line(14, y, pageW - 14, y)
  y += 8

  doc.setFontSize(12).setFont('helvetica', 'bold')
  doc.text('DAFTAR HADIR PERSEKUTUAN DOA', pageW / 2, y, { align: 'center' })
  y += 6
  doc.setFontSize(10).setFont('helvetica', 'normal')
  doc.text(session?.title ?? '', pageW / 2, y, { align: 'center' })
  y += 5
  doc.setFontSize(9).setTextColor(120, 120, 120)
  doc.text(`${session ? fmtDate(session.date) : ''}${session?.locations ? ' · ' + session.locations.name : ''}`, pageW / 2, y, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  y += 10

  for (const angkatan of angkatanList) {
    const members = grouped[angkatan]
    if (y > 230) {
      doc.addPage()
      y = 15
    }
    doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(85, 34, 124)
    doc.text(`Angkatan ${angkatan}  (${members.length} orang)`, 14, y)
    doc.setTextColor(0, 0, 0)
    y += 5

    autoTable(doc, {
      startY: y,
      head: [['No', 'Nama', 'NIM', 'Kakak Bimbing', 'Jam', 'Tanda Tangan']],
      body: members.map((a, i) => [i + 1, a.name, a.nim, a.kakak_bimbing || '-', fmtTime(a.scanned_at), '']),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [85, 34, 124], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 248, 253] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 35, halign: 'center', minCellHeight: 18 },
      },
      didDrawCell: (d) => {
        if (d.section !== 'body' || d.column.index !== 5) return
        const sig = sigMap[members[d.row.index]?.id]
        if (!sig) return
        try {
          doc.addImage(sig, 'PNG', d.cell.x + 2, d.cell.y + 1, 31, 14)
        } catch {
          missing++
        }
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  doc.setFontSize(10).setFont('helvetica', 'bold')
  doc.text(`Total Kehadiran: ${attendances.length} orang`, 14, y)
  y += 14
  doc.setFont('helvetica', 'normal')
  doc.text('Mengetahui,', pageW - 60, y)
  y += 22
  doc.line(pageW - 70, y, pageW - 14, y)
  y += 5
  doc.text('Koordinator Pembinaan', pageW - 68, y)

  doc.setFontSize(8).setTextColor(180, 180, 180)
  doc.text(`Dicetak otomatis · Sistem Absensi UK3 UTM · ${new Date().toLocaleDateString('id-ID')}`, pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })

  doc.save(`absensi-${(session?.title ?? 'pd').replace(/[^\w-]+/g, '-')}.pdf`)
  return missing
}
