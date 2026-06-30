export type UserRole = 'admin' | 'terapeuta' | 'familiar' | 'usuario'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: number
  user_id: number
  display_name: string
  avatar_url: string | null
  high_contrast: boolean
  voice_rate: number
  voice_pitch: number
  language: string
  preferences: Record<string, unknown> | null
}

export interface Category {
  id: number
  board_id: number
  name: string
  color: string
  icon: string | null
  sort_order: number
}

export interface ButtonAction {
  id: number
  button_id: number
  action_type: string
  provider: string
  config: Record<string, unknown> | null
  requires_confirmation: boolean
}

export interface AACButton {
  id: number
  board_id: number
  category_id: number | null
  label: string
  spoken_text: string
  color: string
  icon: string | null
  image_url: string | null
  sort_order: number
  is_emergency: boolean
  actions: ButtonAction[]
}

export interface Board {
  id: number
  owner_id: number
  name: string
  description: string | null
  is_default: boolean
  grid_columns: number
  categories: Category[]
  buttons: AACButton[]
}

export interface BoardSummary {
  id: number
  owner_id: number
  name: string
  description: string | null
  is_default: boolean
  grid_columns: number
}

export interface Phrase {
  id: number
  user_id: number
  text: string
  spoken_text: string
  is_favorite: boolean
  use_count: number
}

export interface HistoryEntry {
  id: number
  user_id: number
  phrase_text: string
  button_ids: number[] | null
  spoken: boolean
  created_at: string
}

export interface AutomationAction {
  id: number
  user_id: number
  name: string
  description: string | null
  action_type: string
  provider: string
  config: Record<string, unknown> | null
  icon: string | null
  is_active: boolean
  requires_confirmation: boolean
}

export interface EmergencyContact {
  id: number
  user_id: number
  name: string
  phone: string | null
  email: string | null
  relationship_type: string | null
  is_primary: boolean
}

export interface SelectedToken {
  buttonId: number
  label: string
  spoken: string
  imageUrl?: string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatStatus {
  provider: string
  available: boolean
  model?: string | null
  ollama_url?: string | null
}

export type TtsMode = 'browser' | 'piper'

export interface TtsPreferences {
  tts_mode?: TtsMode
  piper_url?: string
}
