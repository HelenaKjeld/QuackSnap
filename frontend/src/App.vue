<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const { isLoggedIn, currentUserName, clearAuthSession } = useAuth()

function onLogout() {
  clearAuthSession()
  void router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#06170e] text-zinc-100 antialiased">
    <header class="sticky top-0 z-10 border-b border-white/15 bg-[#030b07]/70 backdrop-blur-md">
      <div class="mx-auto max-w-[1200px] px-4 py-3">
        <nav class="flex w-full flex-wrap items-center justify-center gap-1 text-[0.95rem] lg:gap-2 lg:text-base"
          data-testid="nav">
          <RouterLink
            class="inline-block border-l border-white/15 px-4 py-1 text-zinc-300 no-underline transition hover:text-white first:border-l-0"
            to="/" data-testid="nav-home">Home</RouterLink>
          <RouterLink
            class="inline-block border-l border-white/15 px-4 py-1 text-zinc-300 no-underline transition hover:text-white first:border-l-0"
            to="/about" data-testid="nav-about">About</RouterLink>
          <RouterLink v-if="!isLoggedIn"
            class="inline-block border-l border-white/15 px-4 py-1 text-zinc-300 no-underline transition hover:text-white first:border-l-0"
            to="/register" data-testid="nav-register">Register</RouterLink>
          <RouterLink v-if="!isLoggedIn"
            class="inline-block border-l border-white/15 px-4 py-1 text-zinc-300 no-underline transition hover:text-white first:border-l-0"
            to="/login" data-testid="nav-login">Login</RouterLink>
          <RouterLink v-if="isLoggedIn"
            class="inline-block border-l border-white/15 px-4 py-1 text-zinc-300 no-underline transition hover:text-white first:border-l-0"
            to="/profile" data-testid="nav-profile">Profile</RouterLink>
          <span v-if="isLoggedIn"
            class="ml-3 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800"
            data-testid="nav-user-name">
            {{ currentUserName }}
          </span>
          <button v-if="isLoggedIn" class="ml-2 cursor-pointer rounded-lg bg-red-600 px-3 py-1 text-white" type="button"
            data-testid="nav-logout" @click="onLogout">
            Logout
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-[1200px] p-4 text-zinc-100">
      <RouterView />
    </main>
  </div>
</template>

<style>
@import 'tailwindcss';
</style>
