// src/router/modules/file.ts
import type { RouteRecordRaw } from 'vue-router'

import bookRoutes from './file/book'
import metaRoutes from './file/meta'
import musicRoutes from "@/router/modules/file/music.ts";

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
    {
      path: '',
      name: 'FileDashboard',
      component: () => import('@/pages/FileManage/Dashboard.vue'),
      meta: {
        title: 'File Manage Dashboard'
      }
    },
    ...bookRoutes,
    ...metaRoutes,
    ...musicRoutes
  ]
}

export default fileRoutes
