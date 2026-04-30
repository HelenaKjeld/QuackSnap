<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { compressImage, getCompressionRatio } from '@/utils/imageCompressor'

type PostCreator = {
  userName?: string
  fullName?: string
  _id?: string
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

const { isLoggedIn, authSession } = useAuth()
const route = useRoute()
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
const commentDrafts = ref<Record<string, string>>({})
const commentErrors = ref<Record<string, string>>({})
const commentSubmitting = ref<Record<string, boolean>>({})
const commentDeleting = ref<Record<string, boolean>>({})
const expandedComments = ref<Record<string, boolean>>({})
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

function commentText(comment: PostComment): string {
  return typeof comment === 'string' ? comment : comment.text
}

function commentId(comment: PostComment): string | null {
  return typeof comment === 'string' ? null : comment._id ?? null
}

function commentsIncludeText(comments: PostComment[], text: string): boolean {
  return comments.some((comment) => commentText(comment) === text)
}

function postIncludesComment(postId: string, text: string): boolean {
  const post = posts.value.find((item) => item._id === postId)
  return commentsIncludeText(post?.comments ?? [], text)
}

function commentAuthorId(comment: PostComment): string | null {
  if (typeof comment === 'string' || !comment.createdBy) {
    return null
  }

  if (typeof comment.createdBy === 'string') {
    return comment.createdBy
  }

  return comment.createdBy._id ?? null
}

function commentAuthor(comment: PostComment): string {
  if (typeof comment === 'string') {
    return 'Someone'
  }

  if (!comment.createdBy || typeof comment.createdBy === 'string') {
    return 'Someone'
  }

  return comment.createdBy.userName ?? comment.createdBy.fullName ?? 'Someone'
}

function canDeleteComment(comment: PostComment): boolean {
  return Boolean(authSession.value?.userId && commentId(comment) && commentAuthorId(comment) === authSession.value.userId)
}

function visibleComments(post: PostItem): PostComment[] {
  const comments = post.comments ?? []
  return expandedComments.value[post._id] ? comments : comments.slice(0, 2)
}

function hasHiddenComments(post: PostItem): boolean {
  return (post.comments?.length ?? 0) > 2
}

function toggleComments(postId: string) {
  expandedComments.value[postId] = !expandedComments.value[postId]
}

function updatePost(updatedPost: PostItem) {
  posts.value = posts.value.map((post) => (post._id === updatedPost._id ? updatedPost : post))
}

function removeVisibleComment(postId: string, targetCommentId: string) {
  posts.value = posts.value.map((post) => {
    if (post._id !== postId) {
      return post
    }

    return {
      ...post,
      comments: (post.comments ?? []).filter((comment) => commentId(comment) !== targetCommentId),
    }
  })
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

async function onDeleteComment(post: PostItem, comment: PostComment) {
  if (!authSession.value?.token) {
    commentErrors.value[post._id] = 'You need to be logged in to delete a comment.'
    return
  }

  const targetCommentId = commentId(comment)
  if (!targetCommentId || !canDeleteComment(comment)) {
    commentErrors.value[post._id] = 'You can only delete your own comments.'
    return
  }

  commentDeleting.value[targetCommentId] = true
  commentErrors.value[post._id] = ''

  try {
    const response = await fetch(`${API_BASE}/api/comments/${post._id}/${targetCommentId}`, {
      method: 'DELETE',
      headers: {
        'auth-token': authSession.value.token,
      },
    })

    const data = await response.json()
    if (!response.ok) {
      commentErrors.value[post._id] = data?.error ?? 'Could not delete comment.'
      return
    }

    const updatedPost = data as Partial<PostItem>
    if (updatedPost._id === post._id && Array.isArray(updatedPost.comments)) {
      updatePost(updatedPost as PostItem)
    } else {
      removeVisibleComment(post._id, targetCommentId)
    }
  } catch {
    commentErrors.value[post._id] = 'Could not connect to backend to delete comment.'
  } finally {
    commentDeleting.value[targetCommentId] = false
  }
}

async function onCreateComment(post: PostItem) {
  if (!authSession.value?.token) {
    commentErrors.value[post._id] = 'You need to be logged in to comment.'
    return
  }

  const comment = (commentDrafts.value[post._id] ?? '').trim()
  if (!comment) {
    commentErrors.value[post._id] = 'Write a comment first.'
    return
  }

  commentSubmitting.value[post._id] = true
  commentErrors.value[post._id] = ''

  try {
    const response = await fetch(`${API_BASE}/api/comments/${post._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': authSession.value.token,
      },
      body: JSON.stringify({ comment }),
    })

    const data = await response.json()
    if (!response.ok) {
      commentErrors.value[post._id] = data?.details
        ? `${data.error ?? 'Could not add comment.'} ${data.details}`
        : data?.error ?? 'Could not add comment.'
      return
    }

    const updatedPost = data as Partial<PostItem>

    if (Array.isArray(data)) {
      commentErrors.value[post._id] = 'Comment route returned a search response. Restart the backend dev server and try again.'
      return
    }

    if (
      updatedPost._id === post._id &&
      Array.isArray(updatedPost.comments) &&
      commentsIncludeText(updatedPost.comments, comment)
    ) {
      updatePost(updatedPost as PostItem)
    } else {
      await loadPosts()
      if (!postIncludesComment(post._id, comment)) {
        commentErrors.value[post._id] = 'Comment was not saved. Please try again.'
        return
      }
    }

    commentDrafts.value[post._id] = ''
  } catch {
    commentErrors.value[post._id] = 'Could not connect to backend to add comment.'
  } finally {
    commentSubmitting.value[post._id] = false
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
  isCreatePostOpen.value = route.query.createPost === '1'
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

          <section class="mt-4 border-t border-white/10 pt-3">
            <div v-if="post.comments?.length" class="grid gap-2">
              <div v-for="(comment, index) in visibleComments(post)" :key="commentId(comment) ?? `${post._id}-${index}`"
                class="flex items-start justify-between gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-100">
                <p class="min-w-0">
                  <strong>{{ commentAuthor(comment) }}</strong>
                  <span class="ml-1 break-words">{{ commentText(comment) }}</span>
                </p>
                <button v-if="canDeleteComment(comment)" :disabled="commentDeleting[commentId(comment) ?? '']"
                  class="shrink-0 cursor-pointer text-xs font-bold text-red-300 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button" @click="onDeleteComment(post, comment)">
                  {{ commentDeleting[commentId(comment) ?? ''] ? 'Deleting...' : 'Delete' }}
                </button>
              </div>

              <button v-if="hasHiddenComments(post)"
                class="w-fit cursor-pointer text-sm font-bold text-emerald-300 hover:text-emerald-200" type="button"
                @click="toggleComments(post._id)">
                {{ expandedComments[post._id] ? 'Hide comments' : `Show comments (${post.comments.length - 2} more)` }}
              </button>
            </div>
            <p v-else class="text-sm text-zinc-400">No comments yet.</p>

            <form v-if="isLoggedIn" class="mt-3 flex gap-2 max-sm:grid" @submit.prevent="onCreateComment(post)">
              <input v-model="commentDrafts[post._id]"
                class="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
                type="text" maxlength="280" placeholder="Add a comment..." />
              <button :disabled="commentSubmitting[post._id]"
                class="rounded-lg bg-white px-4 py-2 text-sm font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70"
                type="submit">
                {{ commentSubmitting[post._id] ? 'Posting...' : 'Post' }}
              </button>
            </form>
            <p v-else class="mt-3 text-sm text-zinc-400">Log in to comment.</p>
            <p v-if="commentErrors[post._id]" class="mt-2 text-sm font-semibold text-red-300">
              {{ commentErrors[post._id] }}
            </p>
          </section>
        </article>
      </div>
    </section>
  </main>
</template>
