import { useState } from 'react'
import type { FormEvent } from 'react'
import { auth } from '../services/auth'
import ChangePasswordModal from '../components/ChangePasswordModal'

type LoginPageProps = {
  onAdminLogin: () => void
  onPhysicianLogin: () => void
  onRadiologistLogin: () => void
  onTechnicianLogin: () => void
}

const LoginPage = ({ onAdminLogin, onPhysicianLogin, onRadiologistLogin, onTechnicianLogin }: LoginPageProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [pendingRole, setPendingRole] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)

    const username = String(formData.get('username') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!username || !password) {
      setError('Username and password are required')
      return
    }

    try {
      setIsSubmitting(true)
      const { user } = await auth.login(username, password)

      // Check if user must change password
      if (user.mustChangePassword) {
        setPendingRole(user.role)
        setShowChangePassword(true)
        return
      }

      // Navigate based on role
      navigateByRole(user.role)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const navigateByRole = (role: string) => {
    if (role === 'Admin') {
      onAdminLogin()
    } else if (role === 'Physician') {
      onPhysicianLogin()
    } else if (role === 'Radiologist') {
      onRadiologistLogin()
    } else if (role === 'Technician') {
      onTechnicianLogin()
    } else {
      setError('Unsupported user role')
    }
  }

  const handlePasswordChangeSuccess = () => {
    setShowChangePassword(false)
    if (pendingRole) {
      navigateByRole(pendingRole)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-xl rounded-2xl bg-white/80 p-6 shadow-sm sm:p-10">
        <div className="mb-10 flex items-center justify-center gap-2 text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-blue-600">
              <path d="M12 3a9 9 0 1 0 9 9 1 1 0 1 0-2 0 7 7 0 1 1-7-7 1 1 0 1 0 0-2Z" />
              <path d="M8.5 11.5a1 1 0 0 0 0 1.41l2.59 2.59a1 1 0 0 0 1.41-1.41L9.91 11.5a1 1 0 0 0-1.41 0Zm6.79-4.29-4.83 4.83a1 1 0 0 0 1.41 1.41l4.83-4.83a1 1 0 1 0-1.41-1.41Z" />
            </svg>
          </span>
          <span className="text-2xl font-bold">RMIS</span>
        </div>

        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to your RMIS account</p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-800">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-800">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="h-11 w-full rounded-lg border border-slate-300 px-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-blue-600"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
                    <path d="M2.7 4.29a1 1 0 0 0-1.4 1.42l3.1 3.09A12.63 12.63 0 0 0 1 12s4 7 11 7a10.7 10.7 0 0 0 4.33-.88l2.97 2.96a1 1 0 0 0 1.4-1.42Zm7.83 7.84a2 2 0 0 0 2.34 2.34Zm4.94 1.9-1.53-1.53a2.96 2.96 0 0 0-3.44-3.44L8.98 7.53A8.68 8.68 0 0 1 12 7c7 0 11 5 11 5a17.3 17.3 0 0 1-3.52 3.93Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
                    <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Remember Me
            </label>
            <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-12 w-full rounded-lg bg-blue-600 text-base font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>

      {showChangePassword && (
        <ChangePasswordModal
          onSuccess={handlePasswordChangeSuccess}
          isRequired={true}
        />
      )}
    </main>
  )
}

export default LoginPage
