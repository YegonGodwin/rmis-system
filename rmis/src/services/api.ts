type ApiErrorPayload = {
  message?: string
}

export class ApiError extends Error {
  status: number
  payload?: ApiErrorPayload

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000/api/v1'

const TOKEN_KEY = 'rmis_token'

export const tokenStore = {
  get() {
    return localStorage.getItem(TOKEN_KEY)
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
  },
}

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

const parseJsonSafe = async (res: Response) => {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const api = {
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const token = tokenStore.get()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const res = await fetch(buildUrl(path), {
      ...init,
      headers,
    })

    if (res.status === 401) {
      tokenStore.clear()
    }

    if (!res.ok) {
      const payload = (await parseJsonSafe(res)) as ApiErrorPayload | null
      const msg = payload?.message || `Request failed with status ${res.status}`
      throw new ApiError(res.status, msg, payload ?? undefined)
    }

    return (await parseJsonSafe(res)) as T
  },

  get<T>(path: string) {
    return this.request<T>(path)
  },

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  },

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  },

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  },

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' })
  },
}
