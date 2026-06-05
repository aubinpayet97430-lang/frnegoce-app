import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BonCommandeVente, BonLivraisonVente, BonCommandeAchat } from '@/types'

export function genererPDFVente(bc: BonCommandeVente) {
  const doc = new jsPDF()
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('BON DE COMMANDE', 105, 20, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Client : ${bc.client_nom}`, 14, 38)
  doc.text(`N° : ${bc.numero}`, 14, 46)
  doc.text(`Date : ${new Date(bc.date).toLocaleDateString('fr-FR')}`, 14, 54)

  autoTable(doc, {
    startY: 64,
    head: [['Produit', 'Caisses', 'PCB', 'Unité', 'Prix unit.', 'Total']],
    body: bc.lignes.map(l => [
      l.nom_produit,
      l.quantite_caisses,
      l.pcb,
      l.unite,
      `${l.prix_unitaire.toFixed(2)} €`,
      `${l.total.toFixed(2)} €`,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
    foot: [['', '', '', '', 'TOTAL', `${bc.total_bc.toFixed(2)} €`]],
    footStyles: { fontStyle: 'bold', fillColor: [243, 244, 246] },
  })
  doc.save(`BC_${bc.numero}.pdf`)
}

export function genererPDFBL(bl: BonLivraisonVente) {
  const doc = new jsPDF()
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('BON DE LIVRAISON', 105, 20, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Client : ${bl.client_nom}`, 14, 38)
  doc.text(`N° BL : ${bl.numero}`, 14, 46)
  doc.text(`N° BC : ${bl.bc_numero}`, 14, 54)
  doc.text(`Date : ${new Date(bl.date).toLocaleDateString('fr-FR')}`, 14, 62)

  autoTable(doc, {
    startY: 72,
    head: [['Produit', 'Caisses', 'PCB', 'Unité', 'Prix unit.', 'Total']],
    body: bl.lignes.map(l => [
      l.nom_produit,
      l.quantite_caisses,
      l.pcb,
      l.unite,
      `${l.prix_unitaire.toFixed(2)} €`,
      `${l.total.toFixed(2)} €`,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
    foot: [['', '', '', '', 'TOTAL BL', `${bl.total_bl.toFixed(2)} €`]],
    footStyles: { fontStyle: 'bold', fillColor: [243, 244, 246] },
  })
  doc.save(`BL_${bl.numero}.pdf`)
}

export function genererPDFAchat(bc: BonCommandeAchat) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('BON DE COMMANDE ACHAT', 148, 20, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fournisseur : ${bc.fournisseur}`, 14, 38)
  doc.text(`N° : ${bc.numero}`, 14, 46)
  doc.text(`Date : ${new Date(bc.date).toLocaleDateString('fr-FR')}`, 14, 54)

  autoTable(doc, {
    startY: 64,
    head: [['Produit', 'Caisses', 'PCB', 'Unité', 'Prix achat', 'Total achat', 'Prix vente', 'Total vente', 'Marge']],
    body: bc.lignes.map(l => [
      l.nom_produit,
      l.quantite_caisses,
      l.pcb,
      l.unite,
      `${l.prix_achat.toFixed(2)} €`,
      `${l.total_achat.toFixed(2)} €`,
      `${l.prix_vente.toFixed(2)} €`,
      `${l.total_vente.toFixed(2)} €`,
      `${l.marge.toFixed(1)} %`,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [245, 158, 11] },
    foot: [['', '', '', '', '', `${bc.total_achat.toFixed(2)} €`, '', `${bc.total_vente.toFixed(2)} €`, `${bc.marge_totale.toFixed(1)} %`]],
    footStyles: { fontStyle: 'bold', fillColor: [243, 244, 246] },
  })
  doc.save(`BCA_${bc.numero}.pdf`)
}
