import type {
  AACButton,
  AutomationAction,
  Board,
  EmergencyContact,
  HistoryEntry,
  Phrase,
  Profile,
  User,
} from '../types'

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

  createCategory(data: Record<string, unknown>) {
    return this.request(`/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getSettings() {
    return this.request<Array<{ key: string; value: Record<string, unknown> }>>('/settings')
  }
}

export const api = new ApiClient()
