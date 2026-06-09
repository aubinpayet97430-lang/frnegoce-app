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
  client: { nom: string; adresse: string }
  lignes: LigneFacture[]
  ca_eligible: number
  montant_commission: number
  mention_tva?: string
}

export function genererPDFFacture(p: ParamsFacture) {
  const doc = new jsPDF()

  // Titre
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE DE COMMISSION', 105, 20, { align: 'center' })

  // Bloc émetteur (gauche)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(p.profil.nom, 14, 36)
  doc.setFont('helvetica', 'normal')
  if (p.profil.adresse) doc.text(p.profil.adresse, 14, 42)
  if (p.profil.siret) doc.text(`SIRET : ${p.profil.siret}`, 14, 48)
  if (p.profil.email) doc.text(p.profil.email, 14, 54)

  // Bloc client / destinataire (droite)
  doc.setFont('helvetica', 'bold')
  doc.text('Facturé à :', 130, 36)
  doc.setFont('helvetica', 'normal')
  doc.text(p.client.nom || '—', 130, 42)
  if (p.client.adresse) {
    const lignesAdresse = p.client.adresse.split('\n')
    lignesAdresse.forEach((ligne, i) => doc.text(ligne, 130, 48 + i * 6))
  }

  // Bandeau infos facture
  doc.setFillColor(99, 102, 241)
  doc.roundedRect(14, 62, 182, 16, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`N° ${p.numero}`, 20, 72)
  doc.text(`Semaine ${p.semaine} — ${p.annee}`, 105, 72, { align: 'center' })
  doc.text(`Date : ${new Date(p.date).toLocaleDateString('fr-FR')}`, 190, 72, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  // Tableau des lignes
  autoTable(doc, {
    startY: 84,
    head: [['BL', 'Produit', 'CA HT']],
    body: p.lignes.map(l => [l.bl_numero, l.nom_produit, `${l.total.toFixed(2)} €`]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: { 2: { halign: 'right' } },
  })

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // Récapitulatif
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('CA HT éligible :', 120, finalY)
  doc.setFont('helvetica', 'bold')
  doc.text(`${p.ca_eligible.toFixed(2)} €`, 190, finalY, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.text('Taux de commission :', 120, finalY + 8)
  doc.text('4 %', 190, finalY + 8, { align: 'right' })

  // Total à payer
  doc.setFillColor(99, 102, 241)
  doc.roundedRect(110, finalY + 14, 84, 14, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL À PAYER :', 116, finalY + 23)
  doc.text(`${p.montant_commission.toFixed(2)} €`, 188, finalY + 23, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  // Mention légale TVA
  const mention = p.mention_tva || 'TVA non applicable, art. 293 B du CGI'
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(120, 120, 120)
  doc.text(mention, 105, 285, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  doc.save(`${p.numero}.pdf`)
}
