// router/modules/book.ts
import { type RouteRecordRaw } from 'vue-router'

const bookRoutes: RouteRecordRaw[] = [
  {
    path: 'book',
    component: () => import('@/pages/FileManage/BookList.vue'),
    meta: {
      title: '书籍列表'
    },
    children: []
  },
  {
    path: 'book/libClass',
    component: () => import('@/pages/FileManage/BookLibClass.vue'),
  },
  {
    path: 'book/publisher',
    component: () => import('@/pages/FileManage/BookPublisher.vue'),
  },
  {
    path: 'book/publisher/series',
    component: () => import('@/pages/FileManage/BookPublisherSeries.vue'),
    meta: {
      title: "丛书信息"
    }
  },
  {
    path: 'book/reading',
    component: () => import('@/pages/FileManage/ReadingList.vue'),
    meta: {
      title: "书单信息"
    }
  },
  {
    path: 'book/reading/detail/:id',
    component: () => import('@/pages/FileManage/ReadingListDetail.vue'),
    meta: {
      title: "书单详情"
    }
  },
  {
    path: 'book/subject',
    component: () => import('@/pages/FileManage/BookSubject.vue'),
    meta: {
      title: '学科信息'
    }
  }
]

export default bookRoutes
