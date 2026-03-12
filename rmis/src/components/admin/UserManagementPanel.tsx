import { useState, useEffect } from 'react'
import { userService, type User, type UserRole } from '../../services/user.service'

const UserManagementPanel = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterRole, setFilterRole] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(true)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await userService.listUsers({ 
        role: filterRole !== 'All' ? filterRole : undefined,
        q: searchTerm || undefined
      })
      setUsers(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [filterRole, searchTerm])

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active'
      await userService.setStatus(user.id, newStatus)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      )
    } catch (err: any) {
      alert(err.message || 'Failed to update user status')
    }
  }

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const password = String(formData.get('password'))
    
    if (!password) {
      alert('Password is required')
      return
    }

    try {
      const newUser = await userService.createUser({
        username: String(formData.get('username')),
        fullName: String(formData.get('fullName')),
        email: String(formData.get('email')),
        role: String(formData.get('role')) as UserRole,
        password,
        mustChangePassword,
      })
      setUsers([newUser, ...users])
      setShowAddModal(false)
      setGeneratedPassword('')
      setShowPassword(false)
      setMustChangePassword(true)
    } catch (err: any) {
      alert(err.message || 'Failed to create user')
    }
  }

  const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%^&*(),.?'
    const all = uppercase + lowercase + numbers + special

    let password = ''
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += special[Math.floor(Math.random() * special.length)]

    for (let i = 4; i < 12; i++) {
      password += all[Math.floor(Math.random() * all.length)]
    }

    password = password.split('').sort(() => Math.random() - 0.5).join('')
    setGeneratedPassword(password)
    setShowPassword(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="mt-1 text-sm text-slate-500">Manage system users and role assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Add New User
        </button>
      </div>

      <div className="flex gap-3 rounded-xl bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Radiologist">Radiologist</option>
          <option value="Technician">Technician</option>
          <option value="Physician">Physician</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-semibold">User ID</th>
                <th className="px-6 py-3 font-semibold">Full Name</th>
                <th className="px-6 py-3 font-semibold">Username</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Last Login</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                    {user.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{user.fullName}</td>
                  <td className="px-6 py-4 text-slate-600">{user.username}</td>
                  <td className="px-6 py-4 text-slate-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        user.role === 'Admin'
                          ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200'
                          : user.role === 'Radiologist'
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'
                            : user.role === 'Technician'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                              : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
                      }`}
                    >
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 tabular-nums">
                    {!user.lastLoginAt
                      ? 'Never'
                      : new Date(user.lastLoginAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          user.status === 'Active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
            <p className="mt-1 text-sm text-slate-500 mb-6">Create a new user account with secure credentials.</p>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="e.g. jdoe"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. j.doe@hospital.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Assign Role</label>
                <select
                  name="role"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Admin">Admin</option>
                  <option value="Radiologist">Radiologist</option>
                  <option value="Technician">Technician</option>
                  <option value="Physician">Physician</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <div className="flex gap-2">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={generatedPassword}
                    onChange={(e) => setGeneratedPassword(e.target.value)}
                    placeholder="Enter or generate password"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generateSecurePassword}
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  🔐 Generate Secure Password
                </button>
                <p className="mt-1 text-xs text-slate-500">
                  Must be 8+ chars with uppercase, lowercase, number, and special character
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200">
                <input
                  type="checkbox"
                  id="mustChangePassword"
                  checked={mustChangePassword}
                  onChange={(e) => setMustChangePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="mustChangePassword" className="text-sm text-slate-700">
                  Require password change on first login
                </label>
              </div>
              {generatedPassword && showPassword && (
                <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                  <p className="text-xs font-medium text-blue-900 mb-1">Generated Password (copy now):</p>
                  <code className="text-sm font-mono text-blue-700 break-all">{generatedPassword}</code>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setGeneratedPassword('')
                    setShowPassword(false)
                    setMustChangePassword(true)
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementPanel
