/** Reproducción de audio compatible con Android/iOS (Piper WAV y desbloqueo por gesto). */

let sharedAudio: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null
let mediaUnlocked = false

const SILENT_WAV =
  'data:audio/wav;base64,TU0YIAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjY5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8='

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio()
    sharedAudio.preload = 'auto'
    sharedAudio.setAttribute('playsinline', 'true')
    sharedAudio.volume = 1
  }
  return sharedAudio
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioContext = new Ctx()
  }
  return audioContext
}

/** Desbloquea HTML Audio + Web Audio (llamar en el mismo tick del toque del usuario). */
export function unlockMediaAudio(): void {
  if (mediaUnlocked) return
  try {
    const audio = getSharedAudio()
    audio.src = SILENT_WAV
    void audio.play().catch(() => {})
  } catch {
    // ignore
  }
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
  } catch {
    // ignore
  }
  mediaUnlocked = true
}

async function playViaWebAudio(blob: Blob): Promise<void> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  const raw = await blob.arrayBuffer()
  const audioBuffer = await ctx.decodeAudioData(raw.slice(0))
  await new Promise<void>((resolve) => {
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    source.onended = () => resolve()
    source.start(0)
  })
}

async function playViaHtmlAudio(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob)
  const audio = getSharedAudio()
  try {
    audio.pause()
    audio.currentTime = 0
    audio.src = url
    await audio.play()
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('No se pudo reproducir el audio'))
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function playAudioBlob(blob: Blob): Promise<void> {
  try {
    await playViaWebAudio(blob)
  } catch {
    await playViaHtmlAudio(blob)
  }
}

export function isAndroidDevice(): boolean {
  return /Android/i.test(navigator.userAgent)
}
