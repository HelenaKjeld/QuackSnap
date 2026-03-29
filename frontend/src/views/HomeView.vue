<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <main>
    <TheWelcome />
    <section class="register-cta">
      <RouterLink class="register-button" to="/register">Go To Register Form</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.register-cta {
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

.register-button:hover {
  opacity: 0.9;
}
</style>
