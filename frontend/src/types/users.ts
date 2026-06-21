import type { UserRole } from '../types'
export interface UserCreatePayload {
  email: string
  full_name: string
  password: string
  role: UserRole
}

export interface UserUpdatePayload {
  email?: string
  full_name?: string
  role?: UserRole
  is_active?: boolean
  password?: string
}
