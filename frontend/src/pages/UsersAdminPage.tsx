import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import type { User, UserRole } from '../types'
import type { UserCreatePayload } from '../types/users'

const ROLES: UserRole[] = ['admin', 'terapeuta', 'familiar', 'usuario']

const emptyForm: UserCreatePayload = {
  email: '',
  full_name: '',
  password: '',
  role: 'usuario',
}

export function UsersAdminPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<UserCreatePayload>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPassword, setEditPassword] = useState('')

  const loadUsers = () => {
    api
      .listUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar usuarios'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.createUser(form)
      setForm(emptyForm)
      setMessage('Usuario creado con tablero AAC inicial')
      loadUsers()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al crear')
    }
  }

  const handleUpdate = async (user: User) => {
    setMessage('')
    try {
      await api.updateUser(user.id, {
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        ...(editPassword ? { password: editPassword } : {}),
      })
      setEditingId(null)
      setEditPassword('')
      setMessage('Usuario actualizado')
      loadUsers()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al actualizar')
    }
  }

  const roleOptions = currentUser?.role === 'admin' ? ROLES : ROLES.filter((r) => r !== 'admin')

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-bold">Administración de usuarios</h1>
        <p className="mb-6 text-slate-600">Crear y gestionar cuentas de TOTA AAC</p>

        {error && <p className="mb-4 text-red-600">{error}</p>}
        {message && <p className="mb-4 text-green-600">{message}</p>}

        <section className="surface mb-8 rounded-2xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Nuevo usuario</h2>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm">Nombre</span>
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm">Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm">Contraseña</span>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm">Rol</span>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Crear usuario
              </button>
            </div>
          </form>
        </section>

        <section className="surface rounded-2xl border overflow-hidden">
          <h2 className="border-b px-6 py-4 text-lg font-semibold">Usuarios ({users.length})</h2>
          {loading ? (
            <p className="p-6">Cargando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Activo</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="px-4 py-3">
                        {editingId === user.id ? (
                          <input
                            value={user.full_name}
                            onChange={(e) =>
                              setUsers((prev) =>
                                prev.map((u) =>
                                  u.id === user.id ? { ...u, full_name: e.target.value } : u,
                                ),
                              )
                            }
                            className="w-full rounded border px-2 py-1"
                          />
                        ) : (
                          user.full_name
                        )}
                      </td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        {editingId === user.id ? (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              setUsers((prev) =>
                                prev.map((u) =>
                                  u.id === user.id ? { ...u, role: e.target.value as UserRole } : u,
                                ),
                              )
                            }
                            className="rounded border px-2 py-1"
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        ) : (
                          user.role
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === user.id ? (
                          <input
                            type="checkbox"
                            checked={user.is_active}
                            onChange={(e) =>
                              setUsers((prev) =>
                                prev.map((u) =>
                                  u.id === user.id ? { ...u, is_active: e.target.checked } : u,
                                ),
                              )
                            }
                          />
                        ) : user.is_active ? (
                          'Sí'
                        ) : (
                          'No'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === user.id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="password"
                              placeholder="Nueva contraseña (opcional)"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="rounded border px-2 py-1"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdate(user)}
                                className="rounded bg-green-600 px-3 py-1 text-white"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditPassword('')
                                  loadUsers()
                                }}
                                className="rounded border px-3 py-1"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingId(user.id)}
                            className="rounded border px-3 py-1 hover:bg-slate-50"
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
