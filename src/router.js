import { createRouter, createWebHashHistory } from 'vue-router'
import WorkspacePage from './pages/WorkspacePage.vue'
import BackupPage from './pages/BackupPage.vue'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.vue'

const routes = [
  { path: '/', redirect: '/compose' },
  { path: '/compose', name: 'compose', component: WorkspacePage, meta: { title: 'Home' } },
  { path: '/profile', name: 'profile', component: WorkspacePage, meta: { title: 'Profile' } },
  { path: '/editor', name: 'editor', component: WorkspacePage, meta: { title: 'Article Editor' } },
  { path: '/seo', name: 'seo', component: WorkspacePage, meta: { title: 'SEO Settings' } },
  { path: '/published', name: 'published', component: WorkspacePage, meta: { title: 'Published Post' } },
  { path: '/articles', name: 'articles', component: WorkspacePage, meta: { title: 'Articles' } },
  { path: '/bookmarks', name: 'bookmarks', component: WorkspacePage, meta: { title: 'Bookmarks' } },
  { path: '/archive', name: 'archive', component: WorkspacePage, meta: { title: 'Archive' } },
  { path: '/backup', name: 'backup', component: BackupPage, meta: { title: 'Backup and restore' } },
  { path: '/privacy-policy', name: 'privacy-policy', component: PrivacyPolicyPage, meta: { title: 'Privacy Policy' } },
  { path: '/external-ai-tools', name: 'external-ai-tools', component: WorkspacePage, meta: { title: 'Multi-AI Search' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: WorkspacePage, meta: { title: 'Not found' } },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
