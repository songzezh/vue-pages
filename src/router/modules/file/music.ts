import {type RouteRecordRaw} from "vue-router";

const musicRoutes: RouteRecordRaw[] = [
  {
    path: 'music/albums',
    component: () => import('@/pages/FileManage/MusicAlbumList.vue'),
    meta: {
      title: '音乐专辑'
    }
  },
  {
    path: 'music/genres',
    component: () => import('@/pages/FileManage/MusicGenreList.vue'),
    meta: {
      title: '音乐流派'
    }
  }
]

export default musicRoutes
