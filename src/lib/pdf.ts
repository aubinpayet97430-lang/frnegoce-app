import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BonCommande } from '@/types'

export function genererPDF(bc: BonCommande) {
  const doc = new jsPDF()

  // En-tête
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('BON DE COMMANDE', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Client : Vindemia Logistique', 14, 40)
  doc.text(`N° : ${bc.numero}`, 14, 48)
  doc.text(`Date : ${new Date(bc.date).toLocaleDateString('fr-FR')}`, 14, 56)

  // Tableau des produits
  autoTable(doc, {
    startY: 68,
    head: [['Produit', 'Quantité', 'Unité', 'Prix unitaire', 'Total']],
    body: bc.lignes.map((l) => [
      l.nom,
      l.quantite,
      l.unite === 'kg' ? 'kg' : l.unite === 'caisse' ? 'caisse(s)' : 'unité(s)',
      `${l.prix.toFixed(2)} €`,
      `${(l.quantite * l.prix).toFixed(2)} €`,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [34, 197, 94] },
    foot: [
      [
        '',
        '',
        '',
        'TOTAL',
        `${bc.lignes.reduce((s, l) => s + l.quantite * l.prix, 0).toFixed(2)} €`,
      ],
    ],
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
  })

  doc.save(`BC_${bc.numero}_${bc.date}.pdf`)
}
