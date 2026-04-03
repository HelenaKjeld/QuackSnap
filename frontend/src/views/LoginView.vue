<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

type LoginPayload = {
    email: string
    password: string
}

type LoginResponse = {
    error: string | null
    data?: {
        userId: string
        userName?: string
        token: string
    }
}

const form = ref<LoginPayload>({
    email: '',
    password: '',
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const router = useRouter()
const route = useRoute()
const { setAuthSession } = useAuth()
const API_BASE = import.meta.env.VITE_API_URL

async function onSubmit() {
    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
        const response = await fetch(`${API_BASE}/api/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(form.value),
        })

        const data = (await response.json()) as LoginResponse

        if (!response.ok || !data.data?.token || !data.data.userId) {
            errorMessage.value = data?.error ?? 'Login failed. Please check your email and password.'
            return
        }

        setAuthSession({
            userId: data.data.userId,
            userName: data.data.userName ?? form.value.email,
            token: data.data.token,
        })

        successMessage.value = 'Login successful.'
        const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
        await router.push(redirectPath)
    } catch {
        errorMessage.value = 'Could not connect to backend. Make sure the API is running.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main class="grid place-items-center px-4 py-8">
        <section class="w-full max-w-[520px] rounded-xl border border-[var(--color-border)] p-5">
            <h1 class="text-4xl">Log in</h1>
            <p class="mb-4 text-[color:var(--color-text)] opacity-80">Sign in to see your user name and manage your
                session.</p>

            <form class="grid gap-4" data-testid="login-form" @submit.prevent="onSubmit">
                <label class="grid gap-1.5 font-semibold">
                    Email
                    <input v-model="form.email"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-[color:var(--color-text)]"
                        type="email" required data-testid="login-email" />
                </label>

                <label class="grid gap-1.5 font-semibold">
                    Password
                    <input v-model="form.password"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-[color:var(--color-text)]"
                        type="password" required minlength="6" maxlength="30" data-testid="login-password" />
                </label>

                <button :disabled="loading"
                    class="cursor-pointer rounded-lg bg-teal-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    type="submit" data-testid="login-submit">
                    {{ loading ? 'Logging in...' : 'Login' }}
                </button>
            </form>

            <p v-if="successMessage" class="mt-4 font-semibold text-green-600">{{ successMessage }}</p>
            <p v-if="errorMessage" class="mt-4 font-semibold text-red-600">{{ errorMessage }}</p>
        </section>
    </main>
</template>
