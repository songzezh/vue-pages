import {type RouteRecordRaw} from "vue-router";

const musicRoutes: RouteRecordRaw[] = [
  {
    path: 'music/albums',
    component: () => import('@/pages/FileManage/MusicAlbumList.vue'),
    meta: {
      title: '音乐流派'
    }
  }
]

export default musicRoutes
