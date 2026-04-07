<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const { authSession, currentUserName, setCurrentUserName, clearAuthSession } = useAuth()
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

type ProfileResponse = {
    error: string | null
    data?: {
        id: string
        fullName: string
        userName: string
        email: string
        registerDate?: string
    }
}

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')

const form = ref({
    fullName: '',
    userName: '',
    email: '',
    password: '',
})

function onLogout() {
    clearAuthSession()
    void router.push('/')
}

async function loadProfile() {
    if (!authSession.value?.token) {
        return
    }

    loading.value = true
    errorMessage.value = ''

    try {
        const response = await fetch(`${API_BASE}/api/user/me`, {
            headers: {
                'auth-token': authSession.value.token,
            },
        })

        const data = (await response.json()) as ProfileResponse
        if (!response.ok || !data.data) {
            errorMessage.value = data?.error ?? 'Could not load profile.'
            return
        }

        form.value.fullName = data.data.fullName
        form.value.userName = data.data.userName
        form.value.email = data.data.email
    } catch {
        errorMessage.value = 'Could not connect to backend.'
    } finally {
        loading.value = false
    }
}

async function onSaveProfile() {
    if (!authSession.value?.token) {
        return
    }

    saving.value = true
    statusMessage.value = ''
    errorMessage.value = ''

    try {
        const payload: Record<string, string> = {
            fullName: form.value.fullName,
            userName: form.value.userName,
            email: form.value.email,
        }

        if (form.value.password.trim()) {
            payload.password = form.value.password.trim()
        }

        const response = await fetch(`${API_BASE}/api/user/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': authSession.value.token,
            },
            body: JSON.stringify(payload),
        })

        const data = (await response.json()) as ProfileResponse
        if (!response.ok || !data.data) {
            errorMessage.value = data?.error ?? 'Could not update profile.'
            return
        }

        setCurrentUserName(data.data.userName)
        form.value.password = ''
        statusMessage.value = 'Profile updated successfully.'
    } catch {
        errorMessage.value = 'Could not connect to backend.'
    } finally {
        saving.value = false
    }
}

async function onDeleteAccount() {
    if (!authSession.value?.token || deleting.value) {
        return
    }

    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.')
    if (!confirmed) {
        return
    }

    deleting.value = true
    errorMessage.value = ''

    try {
        const response = await fetch(`${API_BASE}/api/user/me`, {
            method: 'DELETE',
            headers: {
                'auth-token': authSession.value.token,
            },
        })

        if (!response.ok) {
            const data = (await response.json()) as { error?: string }
            errorMessage.value = data?.error ?? 'Could not delete account.'
            return
        }

        clearAuthSession()
        void router.push('/')
    } catch {
        errorMessage.value = 'Could not connect to backend.'
    } finally {
        deleting.value = false
    }
}

onMounted(() => {
    void loadProfile()
})
</script>

<template>
    <main class="grid place-items-center px-4 py-8">
        <section class="w-full max-w-[560px] rounded-xl border border-[var(--color-border)] p-5">
            <h1 class="text-3xl font-semibold">Profile</h1>
            <p class="mb-5 mt-2 opacity-80">This page is only visible when you are logged in.</p>

            <p v-if="loading">Loading profile...</p>

            <form v-if="!loading" class="grid gap-4" @submit.prevent="onSaveProfile">
                <label class="grid gap-1.5 font-semibold">
                    Full name
                    <input v-model="form.fullName"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2" type="text"
                        minlength="3" maxlength="255" required />
                </label>

                <label class="grid gap-1.5 font-semibold">
                    Username
                    <input v-model="form.userName"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2" type="text"
                        minlength="3" maxlength="255" required />
                </label>

                <label class="grid gap-1.5 font-semibold">
                    Email
                    <input v-model="form.email"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2" type="email"
                        required />
                </label>

                <label class="grid gap-1.5 font-semibold">
                    New password (optional)
                    <input v-model="form.password"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2" type="password"
                        minlength="6" maxlength="30" placeholder="Leave blank to keep current password" />
                </label>

                <div class="mt-2 flex flex-wrap gap-3">
                    <button :disabled="saving"
                        class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
                        type="submit">
                        {{ saving ? 'Saving...' : 'Save changes' }}
                    </button>
                    <button :disabled="deleting"
                        class="cursor-pointer rounded-lg bg-red-600 px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
                        type="button" @click="onDeleteAccount">
                        {{ deleting ? 'Deleting...' : 'Delete account' }}
                    </button>
                    <button class="cursor-pointer rounded-lg bg-zinc-700 px-4 py-2 font-bold text-white" type="button"
                        @click="onLogout">
                        Logout
                    </button>
                </div>
            </form>

            <div class="mt-4 grid gap-2">
                <p class="text-sm opacity-80">
                    Signed in as: <strong>{{ currentUserName }}</strong>
                </p>
                <p class="text-sm opacity-80">
                    User ID: <span>{{ authSession?.userId }}</span>
                </p>
            </div>

            <p v-if="statusMessage" class="mt-3 font-semibold text-green-600">{{ statusMessage }}</p>
            <p v-if="errorMessage" class="mt-3 font-semibold text-red-600">{{ errorMessage }}</p>
        </section>
    </main>
</template>
