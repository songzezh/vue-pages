<script setup lang="ts">

import {ref} from "vue";

const isLeftSidebarOpen = ref<boolean>(false)

</script>

<template>
  <!-- 文件管理头部 -->
  <q-layout view="lHh lpR lff" class="full-height">
    <q-header class="q-py-xs header" height-hint="48" bordered
              style="box-shadow: rgba(0, 0, 0, 0) 0px 2px 12px 0px; padding-bottom: 2px">
      <q-toolbar style="margin-top: -5px">
        <div class="q-pr-md">
          <q-btn flat dense round aria-label="Menu" :icon="isLeftSidebarOpen ? 'menu_open' : 'menu'"/>
        </div>
      </q-toolbar>
    </q-header>
  </q-layout>
</template>

<style scoped>

</style>
