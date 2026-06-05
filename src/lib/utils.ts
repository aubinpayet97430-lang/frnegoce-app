export function genNumero(prefix: string): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${date}-${rand}`
}

export function formatEuro(val: number): string {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function calcMarge(prixAchat: number, prixVente: number): number {
  if (prixVente === 0) return 0
  return ((prixVente - prixAchat) / prixVente) * 100
}
