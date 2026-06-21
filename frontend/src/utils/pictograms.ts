/** Pictogramas AAC: imágenes ARASAAC + emoji como respaldo. */

const ARASAAC_BASE = 'https://static.arasaac.org/pictograms'

const PICTOGRAM_IMAGE_IDS: Record<string, number> = {
  yo: 6632,
  quiero: 5441,
  no: 5526,
  sí: 5584,
  más: 3220,
  ayuda: 12252,
  dolor: 2367,
  comer: 6456,
  tomar: 6061,
  ir: 8142,
  baño: 6929,
  casa: 6964,
  mamá: 2458,
  papá: 31146,
  frío: 4652,
  calor: 35561,
  cansado: 35537,
  feliz: 9907,
  triste: 35545,
  miedo: 10261,
  jugar: 23392,
  dormir: 6479,
  parar: 7196,
  gracias: 8129,
  'por favor': 8195,
  'tengo hambre': 35559,
  'tengo sed': 7273,
  'me duele': 2367,
  'necesito ayuda': 12252,
  emergencia: 8687,
  pan: 2494,
  agua: 32464,
  leche: 2445,
}

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

function pictogramUrl(id: number): string {
  return `${ARASAAC_BASE}/${id}/${id}_500.png`
}

function lookupImageId(label: string, spokenText?: string): number | null {
  const key = label.toLowerCase().trim()
  if (PICTOGRAM_IMAGE_IDS[key]) return PICTOGRAM_IMAGE_IDS[key]

  const spoken = (spokenText ?? label).toLowerCase().trim()
  if (PICTOGRAM_IMAGE_IDS[spoken]) return PICTOGRAM_IMAGE_IDS[spoken]

  if (spoken.includes('hambre')) return PICTOGRAM_IMAGE_IDS['tengo hambre']
  if (spoken.includes('sed')) return PICTOGRAM_IMAGE_IDS['tengo sed']
  if (spoken.includes('duele') || spoken.includes('dolor')) return PICTOGRAM_IMAGE_IDS.dolor
  if (spoken.includes('ayuda')) return PICTOGRAM_IMAGE_IDS.ayuda
  if (spoken.includes('casa')) return PICTOGRAM_IMAGE_IDS.casa
  if (spoken.includes('baño')) return PICTOGRAM_IMAGE_IDS.baño
  if (spoken.includes('emergenc') || spoken.includes('urgente')) return PICTOGRAM_IMAGE_IDS.emergencia

  return null
}

/** Imagen pictográfica AAC (ARASAAC) para la acción/palabra. */
export function getPictogramImageUrl(label: string, spokenText?: string): string | null {
  const id = lookupImageId(label, spokenText)
  return id ? pictogramUrl(id) : null
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
