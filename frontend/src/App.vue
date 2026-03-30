<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useRouter } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const { isLoggedIn, currentUserName, clearAuthSession } = useAuth()

function onLogout() {
  clearAuthSession()
  void router.push('/')
}
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink v-if="!isLoggedIn" to="/register">Register</RouterLink>
        <RouterLink v-if="!isLoggedIn" to="/login">Login</RouterLink>
        <span v-if="isLoggedIn" class="user-badge">{{ currentUserName }}</span>
        <button v-if="isLoggedIn" class="logout-button" type="button" @click="onLogout">Logout</button>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

.user-badge {
  display: inline-block;
  margin-left: 1rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: #e0f2fe;
  color: #075985;
  font-size: 0.8rem;
  font-weight: 700;
}

.logout-button {
  margin-left: 0.6rem;
  border: 0;
  border-radius: 8px;
  padding: 0.3rem 0.75rem;
  background: #dc2626;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
