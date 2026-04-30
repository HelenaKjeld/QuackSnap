<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { compressImage } from '@/utils/imageCompressor'

const router = useRouter()
const { authSession, currentUserName, setCurrentUserName, clearAuthSession } = useAuth()
const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

type ProfileResponse = {
  error: string | null
  data?: {
    id: string
    fullName: string
    userName: string
    email: string
    bio?: string
    profileImageUrl?: string
    registerDate?: string
  }
}

type PostCreator = {
  _id?: string
  userName?: string
  fullName?: string
}

type PostComment = string | {
  _id?: string
  text: string
  createdBy?: string | PostCreator
}

type PostItem = {
  _id: string
  name: string
  description: string
  imageUrl: string
  comments?: PostComment[]
  _createdBy: string | PostCreator
}

const loading = ref(false)
const postsLoading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const imageCompressing = ref(false)
const isEditing = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
const postsError = ref('')
const posts = ref<PostItem[]>([])

const form = ref({
  fullName: '',
  userName: '',
  email: '',
  password: '',
  bio: '',
  profileImageUrl: '',
})

const initials = computed(() => {
  const source = form.value.fullName || form.value.userName || currentUserName.value || 'QS'
  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
})

const userPosts = computed(() =>
  posts.value.filter((post) => {
    if (!authSession.value?.userId) {
      return false
    }

    if (typeof post._createdBy === 'string') {
      return post._createdBy === authSession.value.userId
    }

    return post._createdBy._id === authSession.value.userId
  }),
)

const avatarUrl = computed(() => form.value.profileImageUrl || userPosts.value[0]?.imageUrl || '')
const userComments = computed(() =>
  posts.value.flatMap((post) =>
    (post.comments ?? []).filter((comment) => commentAuthorId(comment) === authSession.value?.userId),
  ),
)
const commentCount = computed(() => userComments.value.length)

function commentAuthorId(comment: PostComment): string | null {
  if (typeof comment === 'string' || !comment.createdBy) {
    return null
  }

  if (typeof comment.createdBy === 'string') {
    return comment.createdBy
  }

  return comment.createdBy._id ?? null
}

function creatorName(post: PostItem): string {
  if (typeof post._createdBy === 'string') {
    return form.value.userName || post._createdBy
  }

  return post._createdBy.userName ?? post._createdBy.fullName ?? form.value.userName
}

function onLogout() {
  clearAuthSession()
  void router.push('/')
}

async function loadProfile() {
  if (!authSession.value?.token) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE}/api/user/me`, {
      headers: {
        'auth-token': authSession.value.token,
      },
    })

    const data = (await response.json()) as ProfileResponse
    if (!response.ok || !data.data) {
      errorMessage.value = data?.error ?? 'Could not load profile.'
      return
    }

    form.value.fullName = data.data.fullName
    form.value.userName = data.data.userName
    form.value.email = data.data.email
    form.value.bio = data.data.bio ?? ''
    form.value.profileImageUrl = data.data.profileImageUrl ?? ''
  } catch {
    errorMessage.value = 'Could not connect to backend.'
  } finally {
    loading.value = false
  }
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

    posts.value = (await response.json()) as PostItem[]
  } catch {
    postsError.value = 'Could not connect to backend to load posts.'
  } finally {
    postsLoading.value = false
  }
}

async function onAvatarSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  imageCompressing.value = true
  statusMessage.value = ''
  errorMessage.value = ''

  try {
    form.value.profileImageUrl = await compressImage(file, 640, 640, 180)
  } catch {
    errorMessage.value = 'Could not process profile image.'
  } finally {
    imageCompressing.value = false
    input.value = ''
  }
}

async function onSaveProfile() {
  if (!authSession.value?.token) {
    return
  }

  saving.value = true
  statusMessage.value = ''
  errorMessage.value = ''

  try {
    const payload: Record<string, string> = {
      fullName: form.value.fullName,
      userName: form.value.userName,
      email: form.value.email,
      bio: form.value.bio,
      profileImageUrl: form.value.profileImageUrl,
    }

    if (form.value.password.trim()) {
      payload.password = form.value.password.trim()
    }

    const response = await fetch(`${API_BASE}/api/user/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': authSession.value.token,
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json()) as ProfileResponse
    if (!response.ok || !data.data) {
      errorMessage.value = data?.error ?? 'Could not update profile.'
      return
    }

    setCurrentUserName(data.data.userName)
    form.value.password = ''
    form.value.bio = data.data.bio ?? ''
    form.value.profileImageUrl = data.data.profileImageUrl ?? ''
    statusMessage.value = 'Profile updated.'
    isEditing.value = false
  } catch {
    errorMessage.value = 'Could not connect to backend.'
  } finally {
    saving.value = false
  }
}

async function onDeleteAccount() {
  if (!authSession.value?.token || deleting.value) {
    return
  }

  const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.')
  if (!confirmed) {
    return
  }

  deleting.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE}/api/user/me`, {
      method: 'DELETE',
      headers: {
        'auth-token': authSession.value.token,
      },
    })

    if (!response.ok) {
      const data = (await response.json()) as { error?: string }
      errorMessage.value = data?.error ?? 'Could not delete account.'
      return
    }

    clearAuthSession()
    void router.push('/')
  } catch {
    errorMessage.value = 'Could not connect to backend.'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  void Promise.all([loadProfile(), loadPosts()])
})
</script>

<template>
  <main class="mx-auto w-full max-w-5xl pb-12">
    <p v-if="loading" class="py-10 text-center text-zinc-300">Loading profile...</p>

    <section v-else class="border-b border-white/15 pb-6">
      <div class="flex items-center justify-between gap-4 py-4">
        <h1 class="truncate text-2xl font-semibold">{{ form.userName || currentUserName }}</h1>
        <button
          class="rounded-lg border border-white/20 bg-white px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200"
          type="button"
          @click="isEditing = !isEditing"
        >
          {{ isEditing ? 'Close edit' : 'Edit profile' }}
        </button>
      </div>

      <div class="grid gap-6 md:grid-cols-[180px_1fr] md:items-start">
        <div class="grid justify-items-center gap-3">
          <div
            class="grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-[conic-gradient(from_180deg,#f97316,#ec4899,#22c55e,#f97316)] p-1 md:h-40 md:w-40"
          >
            <div class="grid h-full w-full place-items-center overflow-hidden rounded-full bg-[#06170e]">
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                :alt="`${form.userName} profile picture`"
                class="h-full w-full object-cover"
              />
              <span v-else class="text-3xl font-black text-white">{{ initials }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div class="grid grid-cols-2 gap-2 text-center">
            <div>
              <strong class="block text-2xl">{{ userPosts.length }}</strong>
              <span class="text-sm text-zinc-300">Posts</span>
            </div>
            <div>
              <strong class="block text-2xl">{{ commentCount }}</strong>
              <span class="text-sm text-zinc-300">Comments</span>
            </div>
          </div>

          <div class="space-y-1">
            <p class="font-bold">{{ form.fullName || 'QuackSnap creator' }}</p>
            <p class="max-w-2xl whitespace-pre-line text-zinc-100">
              {{ form.bio || 'No bio yet. Add a short description in edit profile.' }}
            </p>
            <p class="text-sm text-zinc-400">{{ form.email }}</p>
          </div>

          <div class="flex flex-wrap gap-2">
            <RouterLink
              class="rounded-lg bg-[#154f30] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1d6b42]"
              to="/?createPost=1"
            >
              Create post
            </RouterLink>
            <button
              class="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              type="button"
              @click="onLogout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <form
          v-if="isEditing"
          class="mt-6 grid gap-4 rounded-lg border border-white/15 bg-[#030b07] p-4"
          @submit.prevent="onSaveProfile"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-1.5 font-semibold">
              Full name
              <input
                v-model="form.fullName"
                class="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                type="text"
                minlength="3"
                maxlength="255"
                required
              />
            </label>

            <label class="grid gap-1.5 font-semibold">
              Username
              <input
                v-model="form.userName"
                class="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                type="text"
                minlength="3"
                maxlength="255"
                required
              />
            </label>
          </div>

          <label class="grid gap-1.5 font-semibold">
            Bio
            <textarea
              v-model="form.bio"
              class="min-h-24 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              maxlength="280"
            />
          </label>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-1.5 font-semibold">
              Email
              <input
                v-model="form.email"
                class="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                type="email"
                required
              />
            </label>

            <label class="grid gap-1.5 font-semibold">
              New password
              <input
                v-model="form.password"
                class="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                type="password"
                minlength="6"
                maxlength="30"
                placeholder="Leave blank to keep current password"
              />
            </label>
          </div>

          <label class="grid gap-1.5 font-semibold">
            Profile picture
            <input
              :disabled="imageCompressing"
              class="rounded-lg border border-white/20 bg-black/20 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70"
              type="file"
              accept="image/*"
              @change="onAvatarSelect"
            />
          </label>

          <div class="flex flex-wrap gap-3">
            <button
              :disabled="saving || imageCompressing"
              class="rounded-lg bg-[#154f30] px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
            >
              {{ saving ? 'Saving...' : 'Save changes' }}
            </button>
            <button
              :disabled="deleting"
              class="rounded-lg bg-red-600 px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              @click="onDeleteAccount"
            >
              {{ deleting ? 'Deleting...' : 'Delete account' }}
            </button>
          </div>
        </form>
      </Transition>

      <p v-if="statusMessage" class="mt-3 font-semibold text-emerald-300">{{ statusMessage }}</p>
      <p v-if="errorMessage" class="mt-3 font-semibold text-red-300">{{ errorMessage }}</p>
    </section>

    <section>
      <div class="border-b border-white/15 text-center">
        <h2 class="border-b-2 border-white py-3 text-sm font-bold uppercase tracking-[0.18em] text-white">
          Posts
        </h2>
      </div>

      <div class="pt-4">
        <p v-if="postsLoading" class="py-8 text-center text-zinc-300">Loading posts...</p>
        <p v-else-if="postsError" class="py-8 text-center font-semibold text-red-300">{{ postsError }}</p>
        <div v-else-if="userPosts.length" class="grid grid-cols-3 gap-1 md:gap-2">
          <article
            v-for="post in userPosts"
            :key="post._id"
            class="group relative aspect-square overflow-hidden bg-black"
          >
            <img :src="post.imageUrl" :alt="post.name" class="h-full w-full object-cover transition group-hover:scale-105" />
            <div class="absolute inset-0 grid content-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
              <h2 class="line-clamp-1 text-sm font-bold">{{ post.name }}</h2>
              <p class="line-clamp-2 text-xs text-zinc-200">{{ post.description }}</p>
            </div>
          </article>
        </div>
        <div v-else class="grid place-items-center gap-3 py-12 text-center">
          <p class="text-xl font-bold">No posts yet</p>
          <RouterLink class="rounded-lg bg-white px-4 py-2 text-sm font-bold text-zinc-950" to="/?createPost=1">
            Create your first post
          </RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>
