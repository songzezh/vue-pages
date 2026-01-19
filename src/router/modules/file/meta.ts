import type { RouteRecordRaw } from 'vue-router'

const metaRoutes: RouteRecordRaw[] = [
  {
    path: 'meta/list',
    component: () => import('@/pages/FileManage/FileMetaList.vue'),
    meta: {
      title: '文件元数据'
    }
  }
]

export default metaRoutes
