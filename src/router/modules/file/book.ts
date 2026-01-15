// router/modules/book.ts
import { type RouteRecordRaw } from 'vue-router'

const bookRoutes: RouteRecordRaw = {
  path: 'book',
  component: () => import('@/pages/FileManage/BookList.vue'),
  meta: {
    title: '书籍列表'
  },
  children: [
  ]
}

export default bookRoutes
