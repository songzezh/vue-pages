import {type RouteRecordRaw} from "vue-router";

const musicRoutes: RouteRecordRaw[] = [
  {
    path: 'music',
    component: () => import('@/pages/FileManage/MusicList.vue'),
    meta: {
      title: 'Music Search'
    }
  },
  {
    path: 'music/albums',
    component: () => import('@/pages/FileManage/MusicAlbumList.vue'),
    meta: {
      title: '音乐专辑'
    }
  },
  {
    path: 'music/playlist',
    component: () => import('@/pages/FileManage/MusicPlaylist.vue'),
    meta: {
      title: 'Music Playlist'
    }
  },
  {
    path: 'music/contributor',
    component: () => import('@/pages/FileManage/MusicContributorList.vue'),
    meta: {
      title: 'Music Contributor'
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
