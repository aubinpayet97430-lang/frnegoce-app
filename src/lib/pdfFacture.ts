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
  date_debut: string
  date_fin: string
  date_emission: string
  profil: { nom: string; adresse: string; siren: string; email: string; mention_activite?: string }
  client: { nom: string; adresse: string; siret?: string }
  lignes: LigneFacture[]
  ca_eligible: number
  montant_commission: number
  mention_tva: string
  conditions_reglement?: string
}

export function genererPDFFacture(p: ParamsFacture) {
  const doc = new jsPDF()
  const dateDebut = new Date(p.date_debut).toLocaleDateString('fr-FR')
  const dateFin = new Date(p.date_fin).toLocaleDateString('fr-FR')
  const dateEmission = new Date(p.date_emission).toLocaleDateString('fr-FR')

  // ── Bloc émetteur (gauche) ──
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(p.profil.nom, 14, 22)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (p.profil.mention_activite) doc.text(p.profil.mention_activite, 14, 28)
  if (p.profil.siren) doc.text(`SIREN ${p.profil.siren}${p.profil.adresse ? ' — ' + p.profil.adresse : ''}`, 14, 34)
  if (p.mention_tva) doc.text(p.mention_tva, 14, 40)

  // ── Bloc client (droite) ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Facturé à :', 130, 22)
  doc.setFont('helvetica', 'normal')
  doc.text(p.client.nom, 130, 28)
  if (p.client.adresse) {
    const lignes = p.client.adresse.split('\n')
    lignes.forEach((l, i) => doc.text(l, 130, 34 + i * 6))
    if (p.client.siret) doc.text(`SIRET ${p.client.siret}`, 130, 34 + lignes.length * 6)
  } else if (p.client.siret) {
    doc.text(`SIRET ${p.client.siret}`, 130, 34)
  }

  // ── Bandeau facture ──
  doc.setFillColor(99, 102, 241)
  doc.roundedRect(14, 50, 182, 22, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(`FACTURE N° ${p.numero}`, 105, 60, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date : ${dateEmission}`, 20, 68)
  doc.text(`Période : Semaine ${p.semaine} — du ${dateDebut} au ${dateFin}`, 105, 68, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // ── Regroupement par produit ──
  const parProduit = new Map<string, number>()
  p.lignes.forEach(l => {
    parProduit.set(l.nom_produit, (parProduit.get(l.nom_produit) || 0) + l.total)
  })
  const lignesGroupees = Array.from(parProduit.entries()).sort((a, b) => b[1] - a[1])

  // ── Tableau ──
  autoTable(doc, {
    startY: 80,
    head: [['Désignation', 'CA HT', 'Commission 4%']],
    body: lignesGroupees.map(([nom, total]) => [
      nom,
      `${total.toFixed(2)} €`,
      `${(total * 0.04).toFixed(2)} €`,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 35 },
    },
  })

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // ── Récap ──
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('CA HT éligible :', 120, finalY)
  doc.setFont('helvetica', 'bold')
  doc.text(`${p.ca_eligible.toFixed(2)} €`, 195, finalY, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.text('Taux de commission :', 120, finalY + 7)
  doc.text('4 %', 195, finalY + 7, { align: 'right' })

  // ── NET À PAYER ──
  doc.setFillColor(99, 102, 241)
  doc.roundedRect(110, finalY + 13, 84, 14, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('NET À PAYER :', 116, finalY + 22)
  doc.text(`${p.montant_commission.toFixed(2)} €`, 188, finalY + 22, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  // ── Pied de page ──
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(120, 120, 120)
  const mentionY = 278
  doc.text('TVA non applicable — Article 293B du CGI', 105, mentionY, { align: 'center' })
  if (p.conditions_reglement) {
    doc.text(p.conditions_reglement, 105, mentionY + 5, { align: 'center' })
  }
  doc.setTextColor(0, 0, 0)

  doc.save(`${p.numero}.pdf`)
}
