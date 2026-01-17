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
  label: string
  icon: string
  submodules: SubModule[]
}

const leftDrawerOpen = ref<boolean>(false)

const modules = ref<Module[]>([
  {
    name: 'book-manage',
    label: '图书管理',
    icon: 'menu_book',
    submodules: [
      {
        name: 'book_search',
        label: '图书搜索',
        icon: 'manage_search',
        to: '/file/book',
      },
      {
        name: 'publisher_list',
        label: '出版社',
        icon: 'source',
        to: '/file/book/publisher',
      },
      {
        name: 'publisher_series_list',
        label: '丛书信息',
        icon: 'collections_bookmark',
        to: '/file/book/publisher/series',
      },
      {
        name: 'reading_list',
        label: '书单管理',
        icon: 'list',
        to: '/file/book/reading',
      },
      {
        name: 'clc_code',
        label: '中图法分类',
        icon: 'class',
        to: '/file/book/libClass'
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
    label: '影音管理',
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
    label: '文件管理',
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
  <q-layout
    view="hHh lpR fFf"
    :class="$q.dark.isActive ? 'layout_dark' : 'layout_light'"
  >
    <!-- 页面头部 -->
    <q-header
      elevated
      :class="$q.dark.isActive ? 'header_dark' : 'header_light'">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          :icon="leftDrawerOpen ? 'menu_open': 'menu'"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title
          @click="toggleLeftDrawer"
        >
          文件管理
        </q-toolbar-title>

        <q-space />
        <!-- 主题切换  -->
        <q-btn
          class="q-mr-xs bg-grey-3 q-py-xs q-px-sm custom-border"
          flat
          @click="$q.dark.toggle()"
          color="black"
          :icon="$q.dark.isActive ? 'nights_stay' : 'wb_sunny'"
        />

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
    >
      <q-scroll-area class="fit" :class="$q.dark.isActive ? 'drawer_dark' : 'drawer_light'">
        <q-list padding bordered>
          <template v-for="module in modules" :key="module.name">
            <!-- 有子模块的情况：使用 q-expansion-item -->
            <q-expansion-item
              v-if="module.submodules && module.submodules.length > 0"
              :icon="module.icon"
              :label="module.label"
              expand-separator
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
              clickable
              v-ripple
            >
              <q-item-section avatar>
                <q-icon :name="module.icon"/>
              </q-item-section>
              <q-item-section>
                {{ module.label }}
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

.layout_light {
  background: white;
}

.layout_dark {
  background: linear-gradient(145deg, #2e3d57 15%, rgb(7, 18, 34) 70%);
  color: white;
}

.drawer_light {
  background: #2e3d57;
  color: white;
}

.drawer_dark {
  background: linear-gradient(145deg, #2e3d57 15%, rgb(7, 18, 34) 70%);
  /* background: #2e3d57; */
  color: white;
}

.header_light {
  background: white;
  color: teal;
}

.header_dark {
  background: linear-gradient(145deg, #2e3d57 15%, rgb(7, 18, 34) 70%);
  /* background: black; */
}

</style>
