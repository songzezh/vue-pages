<!-- FileLayout.vue -->
<script setup lang="ts">
import { ref } from 'vue'

// 定义类型
interface SubModule {
  name: string
  label: string
  icon: string
  to: string
}

interface Module {
  name: string
  caption: string
  icon: string
  submodules: SubModule[]
}

const leftDrawerOpen = ref<boolean>(false)

const modules = ref<Module[]>([
  {
    name: 'book-manage',
    caption: '图书管理',
    icon: 'menu_book',
    submodules: [
      {
        name: 'book_search',
        label: '图书搜索',
        icon: 'manage_search',
        to: '/file/book',
      },
      {
        name: 'press_list',
        label: '出版社',
        icon: 'source',
        to: '/file/press',
      },
      {
        name: 'press_series_list',
        label: '丛书信息',
        icon: 'collections_bookmark',
        to: '/file/press/serie',
      },
      {
        name: 'reading_list',
        label: '书单管理',
        icon: 'list',
        to: '/file/reading',
      },
      {
        name: 'clc_code',
        label: '中图法分类',
        icon: 'class',
        to: '/file/book/libCode'
      },
      {
        name: 'subject',
        label: '图书类别',
        icon: 'category',
        to: '/file/book/subject'
      },
      {
        name: 'author_list',
        label: '图书作者',
        icon: 'people',
        to: '/file/book/contributors'
      }
    ]
  },
  {
    name: 'music_manage',
    caption: '影音管理',
    icon: 'library_music',
    submodules: [
      {
        name: 'movie_list',
        label: '电影搜索',
        icon: 'movie',
        to: '/file/movie',
      },
      {
        name: 'filmmaker_list',
        label: '影视制作人',
        icon: 'people',
        to: '/file/filmmaker',
      },
      {
        name: 'music_list',
        label: '音乐搜索',
        icon: 'pageview',
        to: '/file/music'
      },
      {
        name: 'album_list',
        label: '音乐专辑',
        icon: 'album',
        to: '/file/music/album'
      },
      {
        name: 'playlist',
        label: '歌单',
        icon: 'queue_music',
        to: '/file/music/playlist'
      },
      {
        name: 'player_list',
        label: '艺术家',
        icon: 'broadcast_on_personal',
        to: '/file/music/player'
      }
    ]
  },
  {
    name: 'file_metadata_manage',
    caption: '文件管理',
    icon: 'file_present',
    submodules: [
      {
        name: 'file_list',
        label: '文件列表',
        icon: 'list',
        to: '/file/metadata'
      },
      {
        name: 'file_format',
        label: '文件格式',
        icon: 'format_align_justify',
        to: '/file/metadata/format'
      }
    ]
  },
])


// 控制是否打开左侧边栏 left side
function toggleLeftDrawer(): void {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<template>
  <!-- 页面整体布局格式 -->
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <!-- 页面头部 -->
    <q-header elevated class="bg-white text-grey-8" height-hint="64">
      <q-toolbar class="GNL__toolbar">
        <q-toolbar-title
          v-if="$q.screen.gt.xs"
          shrink
          class="row items-center no-wrap text-weight-bold"
          @click="toggleLeftDrawer"
        >
          文件管理
        </q-toolbar-title>

        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn round flat>
            <q-avatar size="26px">
              <img src="@/assets/avatar.webp" alt="Avatar">
            </q-avatar>
            <q-tooltip>Account</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- 左侧边栏 -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-white"
      :width="280"
    >
      <q-scroll-area class="fit">
        <q-list padding bordered class="text-grey-8">
          <template v-for="module in modules" :key="module.name">
            <!-- 有子模块的情况：使用 q-expansion-item -->
            <q-expansion-item
              v-if="module.submodules && module.submodules.length > 0"
              :icon="module.icon"
              :caption="module.caption"
              expand-separator
              header-class="text-weight-medium"
            >
              <!-- 添加缩进 -->
              <div class="q-pl-lg">
                <q-list>
                  <q-item
                    v-for="submodule in module.submodules"
                    :key="submodule.name"
                    :to="submodule.to"
                    clickable
                    v-ripple
                    :content-inset-level="1"
                  >
                    <q-item-section avatar>
                      <q-icon :name="submodule.icon"/>
                    </q-item-section>
                    <q-item-section>
                      {{ submodule.label }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-expansion-item>
            <!-- 没有子模块的情况：使用 q-item -->
            <q-item
              v-else
              :key="module.name + '-item'"
              class="GNL__drawer-item"
              clickable
              v-ripple
            >
              <q-item-section avatar>
                <q-icon :name="module.icon"/>
              </q-item-section>
              <q-item-section>
                {{ module.caption }}
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- 页面内容 -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
/* 可以添加自定义样式 */
</style>
