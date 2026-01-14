<script setup lang="ts">
// 导入Vue和Quasar相关模块
import { computed } from 'vue'

// 定义卡片数据接口
interface DashboardCard {
  id: number
  title: string
  value: string
  subtext: string
  icon: string
  iconBgColor: string
  iconShadowColor: string
  iconColor?: string // 可选，默认为白色
}

// 卡片数据 - 集中管理，便于维护和扩展
const cardsData: DashboardCard[] = [
  {
    id: 1,
    title: 'Total Files',
    value: '777m',
    subtext: '+70 Files',
    icon: 'trending_up',
    iconBgColor: 'rgb(250, 108, 14)',
    iconShadowColor: 'rgba(235, 101, 11, 0.37)',
    iconColor: 'white'
  },
  {
    id: 2,
    title: 'Books',
    value: '543k',
    subtext: '+22 Books',
    icon: 'percent',
    iconBgColor: 'rgb(37, 139, 170)',
    iconShadowColor: 'rgba(23, 78, 95, 0.37)',
    iconColor: 'white'
  },
  {
    id: 3,
    title: 'Musics',
    value: '9998',
    subtext: '+79 Musics',
    icon: 'people_alt',
    iconBgColor: 'rgb(70, 177, 60)',
    iconShadowColor: 'rgba(12, 97, 16, 0.37)',
    iconColor: 'white'
  },
  {
    id: 4,
    title: 'Films',
    value: '799m',
    subtext: '+66 Films',
    icon: 'currency_exchange',
    iconBgColor: 'rgb(17, 48, 85)',
    iconShadowColor: 'rgba(16, 61, 119, 0.37)',
    iconColor: 'white'
  }
]

// 计算属性：获取卡片响应式类名（用于最后一个卡片的特殊间距处理）
const getCardSpacingClass = computed(() => (index: number) => {
  const baseClass = 'col-lg-3 col-md-3 col-sm-6 col-xs-6'

  // 如果是最后一个卡片，添加特殊的间距类
  if (index === cardsData.length - 1) {
    return `${baseClass} q-pl-sm q-mt-lg-none q-mt-md-none q-mt-sm-md q-mt-xs-md`
  }

  // 根据索引返回不同的间距类
  if (index === 0) {
    return `${baseClass} q-pr-sm`
  } else if (index === 1) {
    return `${baseClass} q-px-sm q-px-md-sm q-pl-sm-sm q-pl-xs-sm`
  } else {
    return `${baseClass} q-px-sm q-px-md-sm q-pr-sm-sm q-pr-xs-sm`
  }
})
</script>

<template>
  <q-page class="q-pa-md">
    <!-- 主容器 -->
    <div class="row col-12">
      <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <!-- 卡片行 -->
        <div class="row">
          <!-- 动态渲染卡片 -->
          <div
            v-for="(card, index) in cardsData"
            :key="card.id"
            :class="getCardSpacingClass(index)"
          >
            <!-- 卡片组件 -->
            <q-card class="q-pa-md dashboard-card">
              <!-- 图标区域 -->
              <div class="row q-py-md full-width items-center justify-center">
                <div
                  class="icon-box justify-center items-center"
                  :style="{
                    backgroundColor: card.iconBgColor,
                    boxShadow: `0 0 60px 0 ${card.iconShadowColor}`
                  }"
                >
                  <q-icon
                    class="items-center full-height full-width vertical-middle"
                    :name="card.icon"
                    size="md"
                    :color="card.iconColor || 'white'"
                  />
                </div>
              </div>

              <!-- 卡片标题 -->
              <div class="row text-weight-bold text-h6 full-width justify-center">
                {{ card.title }}
              </div>

              <!-- 子文本 -->
              <div class="row text-grey-7 full-width justify-center">
                {{ card.subtext }}
              </div>

              <!-- 主数值 -->
              <div class="row text-weight-bold text-h4 full-width justify-center">
                {{ card.value }}
              </div>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
/* 图标容器基础样式 - 使用通用类名避免重复 */
.icon-box {
  height: 4rem;
  width: 4rem;
  border-radius: 50%;
}

/* 卡片悬停效果 - 增强交互性 */
.dashboard-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* 响应式调整 - 确保小屏幕上的良好显示 */
@media (max-width: 599px) {
  .icon-box {
    height: 3.5rem;
    width: 3.5rem;
  }

  .dashboard-card .text-h4 {
    font-size: 1.75rem;
  }

  .dashboard-card .text-h6 {
    font-size: 1rem;
  }
}
</style>
