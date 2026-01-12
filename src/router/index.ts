import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import fileRoutes from "@/router/modules/file.ts";

// 静态路由（不需要权限）
export const constantRoutes: RouteRecordRaw[] = [
  fileRoutes
]

// 动态路由（需要权限）
export const asyncRoutes: RouteRecordRaw[] = [
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
})

export default router
