<script setup lang="ts">
import { ref } from 'vue'

type RegisterPayload = {
    fullName: string
    userName: string
    email: string
    password: string
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

async function onSubmit() {
    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
        const response = await fetch('http://localhost:4000/api/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(form.value),
        })

        const data = await response.json()

        if (!response.ok) {
            errorMessage.value = data?.error ?? 'Registration failed. Please try again.'
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
        errorMessage.value = 'Could not connect to backend. Make sure the API is running on port 4000.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main class="register-view">
        <section class="card">
            <h1>Create account</h1>
            <p class="subtitle">Register a new QuackSnap user and send it directly to your backend.</p>

            <form class="form" @submit.prevent="onSubmit">
                <label>
                    Full Name
                    <input v-model="form.fullName" type="text" required minlength="3" maxlength="255" />
                </label>

                <label>
                    Username
                    <input v-model="form.userName" type="text" required minlength="3" maxlength="255" />
                </label>

                <label>
                    Email
                    <input v-model="form.email" type="email" required />
                </label>

                <label>
                    Password
                    <input v-model="form.password" type="password" required minlength="6" maxlength="30" />
                </label>

                <button :disabled="loading" type="submit">
                    {{ loading ? 'Registering...' : 'Register User' }}
                </button>
            </form>

            <p v-if="successMessage" class="status success">{{ successMessage }}</p>
            <p v-if="errorMessage" class="status error">{{ errorMessage }}</p>
        </section>
    </main>
</template>

<style scoped>
.register-view {
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
    background: #2563eb;
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