/** Pictogramas visuales por palabra AAC (emoji de alto contraste, sin dependencias externas). */

const PICTOGRAMS: Record<string, string> = {
  yo: '👤',
  quiero: '👉',
  no: '❌',
  sí: '✅',
  más: '➕',
  ayuda: '🆘',
  dolor: '🤕',
  comer: '🍽️',
  tomar: '🥤',
  ir: '🚶',
  baño: '🚻',
  casa: '🏠',
  mamá: '👩',
  papá: '👨',
  frío: '🥶',
  calor: '🥵',
  cansado: '😴',
  feliz: '😊',
  triste: '😢',
  miedo: '😨',
  jugar: '🎮',
  dormir: '🛏️',
  parar: '🛑',
  gracias: '🙏',
  'por favor': '🙏',
  'tengo hambre': '🍔',
  'tengo sed': '💧',
  'me duele': '💊',
  'necesito ayuda': '🆘',
  emergencia: '🚨',
}

export function getPictogram(label: string, spokenText?: string): string | null {
  const key = label.toLowerCase().trim()
  if (PICTOGRAMS[key]) return PICTOGRAMS[key]
  const spoken = (spokenText ?? label).toLowerCase().trim()
  if (PICTOGRAMS[spoken]) return PICTOGRAMS[spoken]
  if (spoken.includes('hambre')) return '🍔'
  if (spoken.includes('sed')) return '💧'
  if (spoken.includes('duele') || spoken.includes('dolor')) return '🤕'
  if (spoken.includes('ayuda')) return '🆘'
  if (spoken.includes('casa')) return '🏠'
  if (spoken.includes('baño')) return '🚻'
  return null
}
