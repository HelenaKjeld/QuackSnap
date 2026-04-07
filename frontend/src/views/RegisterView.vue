<script setup lang="ts">
import { ref } from 'vue'

type RegisterPayload = {
    fullName: string
    userName: string
    email: string
    password: string
}

type RegisterErrorResponse = {
    error?: string
}

const form = ref<RegisterPayload>({
    fullName: '',
    userName: '',
    email: '',
    password: '',
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function onSubmit() {
    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
        const response = await fetch(`${API_BASE}/api/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(form.value),
        })

        const responseText = await response.text()
        let data: RegisterErrorResponse | null = null

        try {
            data = responseText ? (JSON.parse(responseText) as RegisterErrorResponse) : null
        } catch {
            data = null
        }

        if (!response.ok) {
            errorMessage.value = data?.error ?? responseText ?? 'Registration failed. Please try again.'
            return
        }

        successMessage.value = 'User registered successfully.'
        form.value = {
            fullName: '',
            userName: '',
            email: '',
            password: '',
        }
    } catch {
        errorMessage.value = 'Could not connect to backend. Check your VITE_API_URL setting.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main class="grid place-items-center px-4 py-8">
        <section class="w-full max-w-[520px] rounded-xl border border-[var(--color-border)] p-5">
            <h1 class="text-4xl">Create account</h1>
            <p class="mb-4 text-[color:var(--color-text)] opacity-80">Register a new QuackSnap user and send it directly
                to your backend.</p>

            <form class="grid gap-4" @submit.prevent="onSubmit">
                <label class="grid gap-1.5 font-semibold">
                    Full Name
                    <input v-model="form.fullName"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-[color:var(--color-text)]"
                        type="text" required minlength="3" maxlength="255" />
                </label>

                <label class="grid gap-1.5 font-semibold">
                    Username
                    <input v-model="form.userName"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-[color:var(--color-text)]"
                        type="text" required minlength="3" maxlength="255" />
                </label>

                <label class="grid gap-1.5 font-semibold">
                    Email
                    <input v-model="form.email"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-[color:var(--color-text)]"
                        type="email" required />
                </label>

                <label class="grid gap-1.5 font-semibold">
                    Password
                    <input v-model="form.password"
                        class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-[color:var(--color-text)]"
                        type="password" required minlength="6" maxlength="30" />
                </label>

                <button :disabled="loading"
                    class="cursor-pointer rounded-lg bg-blue-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    type="submit">
                    {{ loading ? 'Registering...' : 'Register User' }}
                </button>
            </form>

            <p v-if="successMessage" class="mt-4 font-semibold text-green-600">{{ successMessage }}</p>
            <p v-if="errorMessage" class="mt-4 font-semibold text-red-600">{{ errorMessage }}</p>
        </section>
    </main>
</template>
