// src/router/modules/file.ts
import type { RouteRecordRaw } from 'vue-router'

const fileRoutes: RouteRecordRaw = {
  path: '/file',
  name: 'FileModule',
  component: () => import('@/layouts/FileLayout.vue'),
  meta: {
    title: '文件管理',
    icon: 'folder',
    requiresAuth: false
  },
  children: [
  ]
}

export default fileRoutes
