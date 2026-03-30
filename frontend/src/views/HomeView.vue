<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuth } from '@/stores/auth'

const { isLoggedIn, currentUserName, clearAuthSession } = useAuth()

function onLogout() {
  clearAuthSession()
}
</script>

<template>
  <main>
    <section class="actions">
      <RouterLink v-if="!isLoggedIn" class="register-button" to="/register">Go To Register Form</RouterLink>
      <RouterLink v-if="!isLoggedIn" class="login-button" to="/login">Go To Login Form</RouterLink>
      <div v-if="isLoggedIn" class="session-box">
        Logged in as: <strong>{{ currentUserName }}</strong>
        <button class="logout-button" type="button" @click="onLogout">Logout</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-top: 1.2rem;
}

.register-button {
  display: inline-block;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.login-button {
  display: inline-block;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  background: #0f766e;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.register-button:hover {
  opacity: 0.9;
}

.login-button:hover {
  opacity: 0.9;
}

.session-box {
  display: flex;
  gap: 0.7rem;
  align-items: center;
}

.logout-button {
  border: 0;
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  background: #dc2626;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
</style>
