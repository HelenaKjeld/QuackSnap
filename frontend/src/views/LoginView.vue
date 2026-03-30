<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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
const { setAuthSession } = useAuth()

async function onSubmit() {
    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
        const response = await fetch('http://localhost:4000/api/user/login', {
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
        await router.push('/')
    } catch {
        errorMessage.value = 'Could not connect to backend. Make sure the API is running on port 4000.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main class="login-view">
        <section class="card">
            <h1>Log in</h1>
            <p class="subtitle">Sign in to see your user name and manage your session.</p>

            <form class="form" @submit.prevent="onSubmit">
                <label>
                    Email
                    <input v-model="form.email" type="email" required />
                </label>

                <label>
                    Password
                    <input v-model="form.password" type="password" required minlength="6" maxlength="30" />
                </label>

                <button :disabled="loading" type="submit">
                    {{ loading ? 'Logging in...' : 'Login' }}
                </button>
            </form>

            <p v-if="successMessage" class="status success">{{ successMessage }}</p>
            <p v-if="errorMessage" class="status error">{{ errorMessage }}</p>
        </section>
    </main>
</template>

<style scoped>
.login-view {
    display: grid;
    place-items: center;
    padding: 2rem 1rem;
}

.card {
    width: min(100%, 520px);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1.25rem;
}

.subtitle {
    margin-bottom: 1rem;
    color: var(--color-text);
    opacity: 0.8;
}

.form {
    display: grid;
    gap: 0.9rem;
}

label {
    display: grid;
    gap: 0.4rem;
    font-weight: 600;
}

input {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.55rem 0.75rem;
    background: transparent;
    color: var(--color-text);
}

button {
    border: 0;
    border-radius: 8px;
    padding: 0.7rem 1rem;
    font-weight: 700;
    background: #0f766e;
    color: #ffffff;
    cursor: pointer;
}

button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.status {
    margin-top: 0.9rem;
    font-weight: 600;
}

.success {
    color: #16a34a;
}

.error {
    color: #dc2626;
}
</style>