import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface LigneFacture {
  bl_numero: string
  nom_produit: string
  total: number
}

interface ParamsFacture {
  numero: string
  semaine: number
  annee: number
  date: string
  profil: { nom: string; adresse: string; siret: string; email: string }
  lignes: LigneFacture[]
  ca_eligible: number
  montant_commission: number
}

export function genererPDFFacture(p: ParamsFacture) {
  const doc = new jsPDF()

  // En-tête émetteur
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE DE COMMISSION', 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(p.profil.nom, 14, 38)
  doc.text(p.profil.adresse, 14, 44)
  if (p.profil.siret) doc.text(`SIRET : ${p.profil.siret}`, 14, 50)

  // Destinataire
  doc.setFont('helvetica', 'bold')
  doc.text('Destinataire :', 130, 38)
  doc.setFont('helvetica', 'normal')
  doc.text('FR Négoce', 130, 44)

  // Infos facture
  doc.setFillColor(99, 102, 241)
  doc.roundedRect(14, 60, 182, 18, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(`N° ${p.numero}`, 20, 71)
  doc.text(`Semaine ${p.semaine} — ${p.annee}`, 105, 71, { align: 'center' })
  doc.text(`Date : ${new Date(p.date).toLocaleDateString('fr-FR')}`, 190, 71, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  // Tableau des lignes
  autoTable(doc, {
    startY: 86,
    head: [['BL', 'Produit', 'CA HT']],
    body: p.lignes.map(l => [l.bl_numero, l.nom_produit, `${l.total.toFixed(2)} €`]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: { 2: { halign: 'right' } },
  })

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // Récapitulatif
  doc.setFontSize(10)
  doc.text(`CA HT éligible :`, 120, finalY)
  doc.setFont('helvetica', 'bold')
  doc.text(`${p.ca_eligible.toFixed(2)} €`, 190, finalY, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.text(`Taux de commission :`, 120, finalY + 8)
  doc.text(`4%`, 190, finalY + 8, { align: 'right' })

  doc.setFillColor(99, 102, 241)
  doc.roundedRect(110, finalY + 14, 84, 14, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL À PAYER :', 116, finalY + 23)
  doc.text(`${p.montant_commission.toFixed(2)} €`, 188, finalY + 23, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  doc.save(`${p.numero}.pdf`)
}
