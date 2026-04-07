<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuth } from '@/stores/auth'
import { compressImage, getCompressionRatio } from '@/utils/imageCompressor'

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

const { isLoggedIn, authSession } = useAuth()
const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

const posts = ref<PostItem[]>([])
const postsLoading = ref(false)
const postsError = ref('')

const creatingPost = ref(false)
const createPostError = ref('')
const createPostSuccess = ref('')
const isCreatePostOpen = ref(false)
const imageCompressing = ref(false)
const compressionMessage = ref('')
const form = ref({
  name: '',
  description: '',
  imageUrl: '',
})

function toggleCreatePost() {
  isCreatePostOpen.value = !isCreatePostOpen.value
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
    const response = await fetch(`${API_BASE}/api/posts`)
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

  imageCompressing.value = true
  compressionMessage.value = 'Compressing image...'

  try {
    // Compress with max size of 300KB
    const compressedImageUrl = await compressImage(file, 1200, 1200, 300)
    form.value.imageUrl = compressedImageUrl
    compressionMessage.value = 'Image compressed successfully ✓'
    setTimeout(() => {
      compressionMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Image compression failed:', error)
    compressionMessage.value = 'Failed to compress image, using original'
    // Fallback to original image if compression fails
    const reader = new FileReader()
    reader.onload = () => {
      form.value.imageUrl = String(reader.result ?? '')
    }
    reader.readAsDataURL(file)
  } finally {
    imageCompressing.value = false
  }
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
    const response = await fetch(`${API_BASE}/api/posts`, {
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
  <main class="space-y-8">
    <section v-if="isLoggedIn" class="mx-auto grid w-full max-w-3xl justify-items-center">
      <button type="button"
        class="cursor-pointer rounded-xl border border-white/20 bg-[#154f30] px-5 py-3 font-bold text-white"
        @click="toggleCreatePost">
        {{ isCreatePostOpen ? 'Close Create Post' : 'Open Create Post' }}
      </button>

      <Transition enter-active-class="transition duration-300 ease-out"
        enter-from-class="-translate-y-3 scale-[0.98] opacity-0" enter-to-class="translate-y-0 scale-100 opacity-100"
        leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0 scale-100 opacity-100"
        leave-to-class="-translate-y-3 scale-[0.98] opacity-0">
        <div v-if="isCreatePostOpen"
          class="mt-3 w-full rounded-xl border border-white/20 bg-zinc-900/75 p-5 shadow-[0_12px_28px_rgba(10,20,35,0.35)]">
          <h2 class="text-2xl font-semibold">Create Post</h2>
          <p class="mb-4 opacity-80">Add a name, description and image to create a post.</p>

          <form class="grid gap-4" @submit.prevent="onCreatePost">
            <label class="grid gap-1.5 font-medium">
              Post Name
              <input v-model="form.name" class="rounded-lg border border-white/20 bg-black/20 px-3 py-2" type="text"
                minlength="3" maxlength="255" required />
            </label>

            <label class="grid gap-1.5 font-medium">
              Description
              <textarea v-model="form.description"
                class="min-h-28 rounded-lg border border-white/20 bg-black/20 px-3 py-2" minlength="3" maxlength="1024"
                required />
            </label>

            <label class="grid gap-1.5 font-medium">
              Upload Image
              <input :disabled="imageCompressing"
                class="rounded-lg border border-white/20 bg-black/20 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70"
                type="file" accept="image/*" @change="onImageSelect" required />
            </label>

            <p v-if="compressionMessage" class="text-sm font-semibold text-emerald-400">{{ compressionMessage }}</p>

            <img v-if="form.imageUrl" :src="form.imageUrl" alt="Preview"
              class="max-h-56 w-full rounded-lg object-cover" />

            <button :disabled="creatingPost"
              class="cursor-pointer rounded-lg bg-[#154f30] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              type="submit">
              {{ creatingPost ? 'Creating...' : 'Create Post' }}
            </button>
          </form>

          <p v-if="createPostSuccess" class="mt-3 font-semibold text-green-600">{{ createPostSuccess }}</p>
          <p v-if="createPostError" class="mt-3 font-semibold text-red-600">{{ createPostError }}</p>
        </div>
      </Transition>
    </section>

    <section class="space-y-3">
      <h2 class="text-center text-3xl font-semibold md:text-4xl">Only the Finest Quacks</h2>
      <p v-if="postsLoading">Loading posts...</p>
      <p v-if="postsError" class="font-semibold text-red-600">{{ postsError }}</p>
      <p v-else-if="!postsLoading && posts.length === 0" class="text-zinc-300">No posts yet. Be the first to create one.
      </p>

      <div v-if="!postsLoading && !postsError" class="grid justify-items-center gap-4">
        <article v-for="post in posts" :key="post._id"
          class="w-[min(50vw,980px)] rounded-2xl border border-white/20 bg-[#030b07] p-4 shadow-[0_12px_28px_rgba(10,20,35,0.35)] max-md:w-[min(92vw,980px)]">
          <img :src="post.imageUrl" :alt="post.name" class="mb-3 max-h-[55vh] w-full rounded-xl object-cover" />
          <h3 class="text-xl font-semibold">{{ post.name }}</h3>
          <p class="mb-2 opacity-90">{{ post.description }}</p>
          <p class="text-sm opacity-80">Created by: <strong>{{ creatorName(post) }}</strong></p>
        </article>
      </div>
    </section>
  </main>
</template>
