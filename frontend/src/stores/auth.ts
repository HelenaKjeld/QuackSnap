import { computed, ref } from 'vue'

export type AuthSession = {
  userId: string
  userName: string
  token: string
}

const STORAGE_KEY = 'quacksnap.auth'

function loadAuthFromStorage(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

const authSession = ref<AuthSession | null>(loadAuthFromStorage())

function setAuthSession(session: AuthSession): void {
  authSession.value = session
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function clearAuthSession(): void {
  authSession.value = null
  window.localStorage.removeItem(STORAGE_KEY)
}

export function useAuth() {
  return {
    authSession,
    isLoggedIn: computed(() => authSession.value !== null),
    currentUserName: computed(() => authSession.value?.userName ?? ''),
    setAuthSession,
    clearAuthSession,
  }
}
