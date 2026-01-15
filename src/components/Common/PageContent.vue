<template>
  <q-page class="fit" :padding="padding">
    <!-- 滚动区域：当 scrollable 为 true 时启用 -->
    <q-scroll-area
      v-if="scrollable"
      ref="scrollAreaRef"
      :thumb-style="thumbStyle"
      :visible="false"
      style="height: 100%"
      :content-active-style="contentActiveStyle"
      @scroll="handleScroll"
    >
      <slot></slot>
    </q-scroll-area>

    <!-- 非滚动区域 -->
    <slot v-else></slot>

    <!-- 回到顶部按钮 -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <q-btn
          color="primary"
          fab
          padding="10px"
          v-show="showToTopBtn"
          icon="expand_less"
          @click="scrollToTop"
        />
      </transition>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
/**
 * 带有滚动位置记忆功能的页面基础布局组件，主要功能包括：
 * 1.支持滚动区域和固定布局两种模式
 * 2.滚动到一定位置显示"回到顶部"按钮
 * 3.使用 SessionStorage 记忆页面滚动位置
 * */
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";
import { QScrollArea, SessionStorage } from "quasar";
import { useRoute } from "vue-router";

defineOptions({ name: "BaseContent" });

// ====================== 类型定义 ======================
interface ScrollInfo {
  horizontalContainerSize: number;
  horizontalPercentage: number;
  horizontalPosition: number;
  horizontalSize: number;
  verticalContainerSize: number;
  verticalPercentage: number;
  verticalPosition: number;
  verticalSize: number;
}

interface ScrollPosition {
  top: number;
  left: number;
}

// ====================== 组件 Props ======================
interface Props {
  /** 滚动内容激活时的样式 */
  contentActiveStyle?: string;
  /** 是否启用滚动区域 */
  scrollable?: boolean;
  /** 是否启用内边距 */
  padding?: boolean;
}

withDefaults(defineProps<Props>(), {
  contentActiveStyle: "",
  scrollable: false,
  padding: false,
});

// ====================== 响应式数据 ======================
const route = useRoute();
const scrollAreaRef = ref<QScrollArea | null>(null);
const currentPagePath = ref<string>("");
const showToTopBtn = ref<boolean>(false);

// ====================== 样式配置 ======================
/** 滚动条滑块样式 */
const thumbStyle = {
  right: "2px",
  borderRadius: "3px",
  width: "7px",
};

// ====================== 滚动相关方法 ======================

/**
 * 滚动到指定位置
 * @param position - 目标位置
 * @param duration - 动画持续时间（毫秒），默认为 0（无动画）
 */
const scrollToPosition = (position: number, duration: number = 0) => {
  scrollAreaRef.value?.setScrollPosition("vertical", position, duration);
};

/**
 * 获取当前滚动位置
 * @returns 当前滚动位置
 */
const getCurrentScrollPosition = (): ScrollPosition | undefined => {
  return scrollAreaRef.value?.getScrollPosition();
};

/**
 * 处理滚动事件
 * @param info - 滚动信息
 */
const handleScroll = (info: ScrollInfo) => {
  // 当垂直滚动超过 10% 时显示回到顶部按钮
  showToTopBtn.value = info.verticalPercentage >= 0.1;
};

/**
 * 滚动到顶部
 */
const scrollToTop = () => {
  scrollToPosition(0, 300);
};

/**
 * 保存滚动位置到 SessionStorage
 */
const saveScrollPosition = () => {
  const position = getCurrentScrollPosition();
  if (position && currentPagePath.value) {
    SessionStorage.set(currentPagePath.value, position);
  }
};

/**
 * 从 SessionStorage 恢复滚动位置
 */
const restoreScrollPosition = () => {
  const savedPosition: ScrollPosition | null = SessionStorage.getItem(
    route.fullPath
  );
  if (savedPosition) {
    // 延迟恢复，确保 DOM 已渲染
    setTimeout(() => {
      scrollToPosition(savedPosition.top);
    }, 0);
  }
};

/**
 * 清除当前页面的滚动位置缓存
 */
const clearScrollPosition = () => {
  if (currentPagePath.value) {
    SessionStorage.remove(currentPagePath.value);
  }
};

// ====================== 生命周期钩子 ======================

onMounted(() => {
  // 记录当前页面路径
  currentPagePath.value = route.fullPath;

  // 恢复滚动位置（首次加载）
  restoreScrollPosition();
});

onUnmounted(() => {
  // 组件卸载时清除缓存
  clearScrollPosition();
});

onActivated(() => {
  // 组件激活时恢复滚动位置（keep-alive 切换回来）
  restoreScrollPosition();
});

onDeactivated(() => {
  // 组件失活时保存滚动位置（keep-alive 切换出去）
  saveScrollPosition();
});
</script>

<style lang="scss" scoped>
</style>
