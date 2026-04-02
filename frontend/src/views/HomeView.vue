<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '@/stores/auth'

type PostCreator = {
  userName?: string
  fullName?: string
  _id?: string
}

type PostItem = {
  _id: string
  name: string
  description: string
  imageUrl: string
  _createdBy: string | PostCreator
}

const { isLoggedIn, currentUserName, clearAuthSession, authSession } = useAuth()

const posts = ref<PostItem[]>([])
const postsLoading = ref(false)
const postsError = ref('')

const creatingPost = ref(false)
const createPostError = ref('')
const createPostSuccess = ref('')
const form = ref({
  name: '',
  description: '',
  imageUrl: '',
})

function onLogout() {
  clearAuthSession()
}

function creatorName(post: PostItem): string {
  if (typeof post._createdBy === 'string') {
    return post._createdBy
  }

  return post._createdBy.userName ?? post._createdBy.fullName ?? 'Unknown user'
}

async function loadPosts() {
  postsLoading.value = true
  postsError.value = ''

  try {
    const response = await fetch('http://localhost:4000/api/posts')
    if (!response.ok) {
      postsError.value = 'Could not load posts.'
      return
    }

    const data = (await response.json()) as PostItem[]
    posts.value = data
  } catch {
    postsError.value = 'Could not connect to backend to load posts.'
  } finally {
    postsLoading.value = false
  }
}

async function onImageSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    form.value.imageUrl = String(reader.result ?? '')
  }
  reader.readAsDataURL(file)
}

async function onCreatePost() {
  if (!authSession.value?.userId) {
    createPostError.value = 'You need to be logged in to create a post.'
    return
  }

  creatingPost.value = true
  createPostError.value = ''
  createPostSuccess.value = ''

  try {
    const response = await fetch('http://localhost:4000/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': authSession.value.token,
      },
      body: JSON.stringify({
        name: form.value.name,
        description: form.value.description,
        imageUrl: form.value.imageUrl,
        _createdBy: authSession.value.userId,
      }),
    })

    const responseText = await response.text()
    if (!response.ok) {
      createPostError.value = responseText || 'Could not create post.'
      return
    }

    createPostSuccess.value = 'Post created successfully.'
    form.value = { name: '', description: '', imageUrl: '' }
    await loadPosts()
  } catch {
    createPostError.value = 'Could not connect to backend to create post.'
  } finally {
    creatingPost.value = false
  }
}

onMounted(() => {
  void loadPosts()
})
</script>

<template>
  <main class="space-y-6">
    <section class="mt-5 flex flex-wrap items-center gap-3" data-testid="home-status">
      <div v-if="isLoggedIn" class="flex items-center gap-3" data-testid="home-logged-in">
        Logged in as: <strong data-testid="home-user-name">{{ currentUserName }}</strong>
        <button class="cursor-pointer rounded-lg bg-red-600 px-3 py-2 font-bold text-white" type="button"
          data-testid="home-logout" @click="onLogout">
          Logout
        </button>
      </div>
    </section>

    <section v-if="isLoggedIn" class="max-w-2xl rounded-xl border border-[var(--color-border)] p-5">
      <h2 class="text-2xl font-semibold">Create Post</h2>
      <p class="mb-4 opacity-80">Add a name, description and image to create a post.</p>

      <form class="grid gap-4" @submit.prevent="onCreatePost">
        <label class="grid gap-1.5 font-medium">
          Post Name
          <input v-model="form.name" class="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2"
            type="text" minlength="3" maxlength="255" required />
        </label>

        <label class="grid gap-1.5 font-medium">
          Description
          <textarea v-model="form.description"
            class="min-h-28 rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2" minlength="3"
            maxlength="1024" required />
        </label>

        <label class="grid gap-1.5 font-medium">
          Upload Image
          <input class="rounded-lg border border-[var(--color-border)] px-3 py-2" type="file" accept="image/*"
            @change="onImageSelect" required />
        </label>

        <img v-if="form.imageUrl" :src="form.imageUrl" alt="Preview" class="max-h-56 w-full rounded-lg object-cover" />

        <button :disabled="creatingPost"
          class="cursor-pointer rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
          type="submit">
          {{ creatingPost ? 'Creating...' : 'Create Post' }}
        </button>
      </form>

      <p v-if="createPostSuccess" class="mt-3 font-semibold text-green-600">{{ createPostSuccess }}</p>
      <p v-if="createPostError" class="mt-3 font-semibold text-red-600">{{ createPostError }}</p>
    </section>

    <section class="space-y-3">
      <h2 class="text-2xl font-semibold">Latest Posts</h2>
      <p v-if="postsLoading">Loading posts...</p>
      <p v-if="postsError" class="font-semibold text-red-600">{{ postsError }}</p>

      <div v-if="!postsLoading && !postsError" class="grid gap-4">
        <article v-for="post in posts" :key="post._id" class="rounded-xl border border-[var(--color-border)] p-4">
          <img :src="post.imageUrl" :alt="post.name" class="mb-3 max-h-72 w-full rounded-lg object-cover" />
          <h3 class="text-xl font-semibold">{{ post.name }}</h3>
          <p class="mb-2 opacity-90">{{ post.description }}</p>
          <p class="text-sm opacity-80">Created by: <strong>{{ creatorName(post) }}</strong></p>
        </article>
      </div>
    </section>
  </main>
</template>
