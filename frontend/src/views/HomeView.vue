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
    <section class="mt-5 flex flex-wrap items-center gap-3">
      <RouterLink v-if="!isLoggedIn"
        class="inline-block rounded-lg bg-blue-600 px-4 py-3 font-bold text-white no-underline transition hover:opacity-90"
        to="/register">
        Register
      </RouterLink>
      <RouterLink v-if="!isLoggedIn"
        class="inline-block rounded-lg bg-teal-700 px-4 py-3 font-bold text-white no-underline transition hover:opacity-90"
        to="/login">
        Login 
      </RouterLink>
      <div v-if="isLoggedIn" class="flex items-center gap-3">
        Logged in as: <strong>{{ currentUserName }}</strong>
        <button class="cursor-pointer rounded-lg bg-red-600 px-3 py-2 font-bold text-white" type="button"
          @click="onLogout">
          Logout
        </button>
      </div>
    </section>
  </main>
</template>
