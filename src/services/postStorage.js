import { createId } from '../utils/createId.js'

const POSTS_KEY = 'jeyamohan-local-posts-v1'
const POSTS_DATABASE = 'jeyamohan-local-posts-v1'
const POSTS_DATABASE_VERSION = 1
const POSTS_STORE = 'snapshots'
const POSTS_SNAPSHOT_ID = 'all-posts'
const POST_DRAFT_KEY = 'jeyamohan-post-draft-v1'
let databasePromise

function normalizePosts(value) {
  if (!Array.isArray(value)) return []
  const seenIds = new Set()
  return value.filter((post) => post && typeof post === 'object').map((post) => {
    let id = typeof post.id === 'string' && post.id.trim() ? post.id : createId('post')
    if (seenIds.has(id)) id = createId('post')
    seenIds.add(id)
    return {
      id,
      text: typeof post.text === 'string' ? post.text : '',
      image: post.image && typeof post.image.src === 'string'
        ? { src: post.image.src, name: typeof post.image.name === 'string' ? post.image.name : '' }
        : null,
      createdAt: typeof post.createdAt === 'string' && Number.isFinite(Date.parse(post.createdAt))
        ? post.createdAt
        : new Date().toISOString(),
      syncStatus: post.syncStatus === 'pending' ? 'pending' : 'local-only',
    }
  })
}

function combinePostSnapshots(primary, recovery) {
  const combined = normalizePosts(primary)
  const ids = new Set(combined.map((post) => post.id))
  for (const post of normalizePosts(recovery)) {
    if (!ids.has(post.id)) {
      combined.push(post)
      ids.add(post.id)
    }
  }
  return combined
}

function readPostCache() {
  try {
    const value = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]')
    const posts = Array.isArray(value) ? value : value?.posts
    return {
      posts: normalizePosts(posts),
      savedAt: Number.isFinite(value?.savedAt) ? value.savedAt : 0,
    }
  } catch {
    return { posts: [], savedAt: 0 }
  }
}

function openPostsDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('IndexedDB is unavailable.'))
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(POSTS_DATABASE, POSTS_DATABASE_VERSION)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(POSTS_STORE)) {
          request.result.createObjectStore(POSTS_STORE, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Could not open local post storage.'))
      request.onblocked = () => reject(new Error('Local post storage is blocked by another tab.'))
    })
  }
  return databasePromise
}

function readPostsSnapshot(database) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(POSTS_STORE, 'readonly')
    const request = transaction.objectStore(POSTS_STORE).get(POSTS_SNAPSHOT_ID)
    request.onsuccess = () => resolve({
      posts: Array.isArray(request.result?.posts) ? request.result.posts : [],
      savedAt: Number.isFinite(request.result?.savedAt) ? request.result.savedAt : 0,
    })
    request.onerror = () => reject(request.error || new Error('Could not read locally saved posts.'))
    transaction.onabort = () => reject(transaction.error || new Error('Could not read locally saved posts.'))
  })
}

function writePostsSnapshot(database, posts, savedAt) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(POSTS_STORE, 'readwrite')
    transaction.objectStore(POSTS_STORE).put({ id: POSTS_SNAPSHOT_ID, posts, savedAt })
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error || new Error('Could not save locally queued posts.'))
    transaction.onabort = () => reject(transaction.error || new Error('Could not save locally queued posts.'))
  })
}

export function loadPosts() {
  return readPostCache().posts
}

export function loadPostDraft() {
  return localStorage.getItem(POST_DRAFT_KEY) || ''
}

export function savePostDraft(text) {
  if (typeof text !== 'string') return false
  try {
    if (text) localStorage.setItem(POST_DRAFT_KEY, text)
    else localStorage.removeItem(POST_DRAFT_KEY)
    return true
  } catch {
    return false
  }
}

export async function loadStoredPosts() {
  const cached = readPostCache()
  try {
    const database = await openPostsDatabase()
    const stored = await readPostsSnapshot(database)
    const cacheIsNewer = cached.savedAt > stored.savedAt
    const primary = cacheIsNewer ? cached.posts : stored.posts
    const recovery = cacheIsNewer ? stored.posts : cached.posts
    const recoveredPosts = combinePostSnapshots(primary, recovery)
    const recoveredAt = Math.max(cached.savedAt, stored.savedAt)
    const needsRecoveryWrite = recoveredPosts.length !== stored.posts.length
      || stored.savedAt !== recoveredAt
    if (needsRecoveryWrite && recoveredPosts.length) {
      await writePostsSnapshot(database, recoveredPosts, recoveredAt || Date.now())
    }
    return recoveredPosts
  } catch {
    return cached.posts
  }
}

export async function savePosts(posts) {
  const snapshot = normalizePosts(posts)
  const savedAt = Date.now()
  let cacheSaved = false
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify({ version: 1, savedAt, posts: snapshot }))
    cacheSaved = true
  } catch {
    // Large images can exceed localStorage; IndexedDB remains the primary store.
  }

  try {
    const database = await openPostsDatabase()
    await writePostsSnapshot(database, snapshot, savedAt)
    return true
  } catch {
    return cacheSaved
  }
}

export function createLocalPost({ text = '', image = null, syncStatus = 'local-only' } = {}) {
  return {
    id: createId('post'),
    text: typeof text === 'string' ? text.trim() : '',
    image: image && typeof image.src === 'string'
      ? { src: image.src, name: typeof image.name === 'string' ? image.name : '' }
      : null,
    createdAt: new Date().toISOString(),
    syncStatus: syncStatus === 'pending' ? 'pending' : 'local-only',
  }
}
