import type {
  AACButton,
  AutomationAction,
  Board,
  BoardSummary,
  ChatMessage,
  ChatStatus,
  EmergencyContact,
  HistoryEntry,
  Phrase,
  Profile,
  User,
} from '../types'
import type { UserCreatePayload, UserUpdatePayload } from '../types/users'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  private token: string | null = localStorage.getItem('tota_token')

  setToken(token: string | null) {
    this.token = token
    if (token) localStorage.setItem('tota_token', token)
    else localStorage.removeItem('tota_token')
  }

  getToken() {
    return this.token
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (this.token) headers.Authorization = `Bearer ${this.token}`

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers })

    if (response.status === 204) return undefined as T

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error desconocido' }))
      throw new Error(error.detail || 'Error en la solicitud')
    }

    return response.json()
  }

  login(email: string, password: string) {
    return this.request<{ access_token: string }>('/auth/login/json', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  me() {
    return this.request<User>('/auth/me')
  }

  getProfile() {
    return this.request<Profile>('/profiles/me')
  }

  updateProfile(data: Partial<Profile>) {
    return this.request<Profile>('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  getDefaultBoard() {
    return this.request<Board>('/boards/default')
  }

  listBoards() {
    return this.request<BoardSummary[]>('/boards')
  }

  createBoard(data: { name: string; description?: string; is_default?: boolean; grid_columns?: number }) {
    return this.request<BoardSummary>('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateBoard(id: number, data: Partial<BoardSummary>) {
    return this.request<BoardSummary>(`/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  deleteBoard(id: number) {
    return this.request(`/boards/${id}`, { method: 'DELETE' })
  }

  getBoard(id: number) {
    return this.request<Board>(`/boards/${id}`)
  }

  getFrequentPhrases() {
    return this.request<Phrase[]>('/phrases/frequent')
  }

  getHistory(limit = 50) {
    return this.request<HistoryEntry[]>(`/history?limit=${limit}`)
  }

  recordHistory(phrase_text: string, button_ids: number[]) {
    return this.request('/history', {
      method: 'POST',
      body: JSON.stringify({ phrase_text, button_ids, spoken: true }),
    })
  }

  getSuggestions(phrase: string, use_ai = false) {
    return this.request<{ suggestions: string[]; source: string }>('/suggestions', {
      method: 'POST',
      body: JSON.stringify({ phrase, use_ai }),
    })
  }

  getChatStatus() {
    return this.request<ChatStatus>('/chat/status')
  }

  sendChat(messages: ChatMessage[]) {
    return this.request<{ reply: string; source: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })
  }

  getAutomationActions() {
    return this.request<AutomationAction[]>('/automation/actions')
  }

  executeAutomation(action_id: number, confirmed: boolean) {
    return this.request<{ success: boolean; message: string; requires_confirmation: boolean }>(
      '/automation/execute',
      {
        method: 'POST',
        body: JSON.stringify({ action_id, confirmed }),
      },
    )
  }

  getEmergencyContacts() {
    return this.request<EmergencyContact[]>('/emergency/contacts')
  }

  triggerEmergency(message: string, confirmed: boolean) {
    return this.request<{ success: boolean; message: string }>('/emergency/trigger', {
      method: 'POST',
      body: JSON.stringify({ message, confirmed }),
    })
  }

  updateButton(id: number, data: Partial<AACButton>) {
    return this.request<AACButton>(`/buttons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  createButton(data: Record<string, unknown>) {
    return this.request<AACButton>('/buttons', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  deleteButton(id: number) {
    return this.request(`/buttons/${id}`, { method: 'DELETE' })
  }

  reorderButtons(boardId: number, buttonIds: number[]) {
    return this.request('/buttons/reorder', {
      method: 'POST',
      body: JSON.stringify({ board_id: boardId, button_ids: buttonIds }),
    })
  }

  createCategory(data: Record<string, unknown>) {
    return this.request(`/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getSettings() {
    return this.request<Array<{ key: string; value: Record<string, unknown> }>>('/settings')
  }

  listUsers() {
    return this.request<User[]>('/users')
  }

  createUser(data: UserCreatePayload) {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateUser(id: number, data: UserUpdatePayload) {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async uploadButtonImage(buttonId: number, file: File) {
    const form = new FormData()
    form.append('file', file)
    const headers: Record<string, string> = {}
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    const response = await fetch(`${API_BASE}/uploads/button/${buttonId}`, {
      method: 'POST',
      headers,
      body: form,
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error al subir imagen' }))
      throw new Error(error.detail || 'Error al subir imagen')
    }
    return response.json() as Promise<{ image_url: string; button_id: number }>
  }

  removeButtonImage(buttonId: number) {
    return this.request(`/uploads/button/${buttonId}/image`, { method: 'DELETE' })
  }

  resolveMediaUrl(url: string | null | undefined) {
    if (!url) return null
    if (url.startsWith('http') || url.startsWith('/')) return url
    return `${API_BASE}/${url.replace(/^\//, '')}`
  }

  getTtsConfig() {
    return this.request<{
      default_provider: string
      piper_url: string | null
      piper_http_url: string | null
      piper_wyoming_host: string | null
      piper_wyoming_port: number | null
    }>('/tts/config')
  }

  synthesizeTts(
    text: string,
    options: { provider?: string; piper_url?: string; language?: string } = {},
  ) {
    return this.request<{
      text: string
      provider: string
      use_browser: boolean
      audio_base64?: string | null
      audio_content_type?: string
    }>('/tts/synthesize', {
      method: 'POST',
      body: JSON.stringify({
        text,
        language: options.language ?? 'es-AR',
        provider: options.provider,
        piper_url: options.piper_url,
      }),
    })
  }

  testPiper(piperUrl: string | undefined, text = 'Hola, probando Piper') {
    return this.request<{
      provider: string
      use_browser: boolean
      audio_base64?: string | null
      audio_content_type?: string
    }>('/tts/test-piper', {
      method: 'POST',
      body: JSON.stringify({
        piper_url: piperUrl?.trim() || null,
        text,
      }),
    })
  }
}

export const api = new ApiClient()
