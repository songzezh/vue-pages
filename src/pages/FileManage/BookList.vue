<script setup lang="ts">

import PageContent from "@/components/Common/PageContent.vue";
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar();

// 定义书籍类型接口
interface Book {
  id: number
  title: string
  subtitle?: string
  author: string
  publisher: string
  publishYear?: number
  isbn?: string
  category?: string
  tags?: string[]
  description?: string
  cover?: string
  isFavorite: boolean
}

// 响应式数据
const defaultCover = 'https://via.placeholder.com/150x200/78909C/FFFFFF?text=No+Cover'
const searchQuery = ref<string>('')
const currentPage = ref<number>(1)
const itemsPerPage = ref<number>(5)
const books = ref<Book[]>([])
const selectedBook = ref<Book | null>(null)
const showDetailDialog = ref<boolean>(false)

// 常量
const pageSizeOptions = [
  { label: '3本', value: 3 },
  { label: '5本', value: 5 },
  { label: '10本', value: 10 },
  { label: '20本', value: 20 }
]

// 模拟书籍数据
const mockBooks: Book[] = [
  {
    id: 1,
    title: 'Vue.js设计与实现',
    subtitle: '深入浅出Vue.js',
    author: '霍春阳',
    publisher: '人民邮电出版社',
    publishYear: 2022,
    isbn: '9787115585624',
    category: '前端开发',
    tags: ['Vue', '前端框架', 'JavaScript'],
    description: '本书基于Vue.js 3，从规范出发，以源码为基础，并结合大量直观的配图，循序渐进地讲解Vue.js中各个功能模块的实现，细致剖析框架设计原理。',
    cover: 'https://via.placeholder.com/150x200/42b983/FFFFFF?text=Vue.js',
    isFavorite: true
  },
  {
    id: 2,
    title: 'JavaScript高级程序设计',
    subtitle: '第4版',
    author: '马特·弗里斯比',
    publisher: '人民邮电出版社',
    publishYear: 2020,
    isbn: '9787115545383',
    category: '编程语言',
    tags: ['JavaScript', '编程', 'Web开发'],
    description: '本书是JavaScript经典图书的新版。第4版涵盖ECMAScript 2019，全面、深入地介绍了JavaScript开发者必须掌握的前端开发技术，涉及JavaScript的基础特性和高级特性。',
    cover: '',
    isFavorite: false
  },
  {
    id: 3,
    title: '深入理解计算机系统',
    subtitle: '原书第3版',
    author: 'Randal E. Bryant, David R. O\'Hallaron',
    publisher: '机械工业出版社',
    publishYear: 2016,
    isbn: '9787111544937',
    category: '计算机科学',
    tags: ['计算机系统', 'CSAPP', '底层原理'],
    description: '本书从程序员的视角详细阐述计算机系统的本质概念，并展示这些概念如何实实在在地影响应用程序的正确性、性能和实用性。',
    cover: 'https://via.placeholder.com/150x200/1565C0/FFFFFF?text=CSAPP',
    isFavorite: true
  },
  {
    id: 4,
    title: '代码整洁之道',
    subtitle: '程序员的职业素养',
    author: '罗伯特·C·马丁',
    publisher: '人民邮电出版社',
    publishYear: 2016,
    category: '软件工程',
    tags: ['代码规范', '编程实践', '软件工程'],
    description: '本书作者给出了一系列行之有效的整洁代码操作实践，这些实践在本书中体现为一条条规则，并辅以来自现实项目的正、反两面的范例。',
    cover: 'https://via.placeholder.com/150x200/E91E63/FFFFFF?text=Clean+Code',
    isFavorite: false
  },
  {
    id: 5,
    title: '算法导论',
    subtitle: '原书第3版',
    author: '托马斯·科尔曼, 查尔斯·雷瑟尔森 等',
    publisher: '机械工业出版社',
    publishYear: 2012,
    category: '算法',
    tags: ['算法', '数据结构', '计算机科学'],
    description: '本书全面论述了算法的内容，从一定深度上涵盖了算法的诸多方面，同时其讲授和分析方法又兼顾了各个层次读者的接受能力。',
    cover: '',
    isFavorite: false
  },
  {
    id: 6,
    title: 'React设计原理',
    author: '卡颂',
    publisher: '电子工业出版社',
    publishYear: 2023,
    category: '前端开发',
    tags: ['React', '前端框架', 'JavaScript'],
    description: '本书从源码层面剖析了React的设计理念和实现原理，帮助读者深入理解React的工作机制。',
    cover: 'https://via.placeholder.com/150x200/61DAFB/000000?text=React',
    isFavorite: false
  },
  {
    id: 7,
    title: 'Node.js设计模式',
    subtitle: '第3版',
    author: '马里奥·卡希安, 卢西亚诺·马莫罗',
    publisher: '机械工业出版社',
    publishYear: 2020,
    category: '后端开发',
    tags: ['Node.js', 'JavaScript', '设计模式'],
    description: '本书通过大量示例，介绍了Node.js的异步编程、流、设计模式、模块系统等核心概念。',
    cover: 'https://via.placeholder.com/150x200/339933/FFFFFF?text=Node.js',
    isFavorite: false
  },
  {
    id: 8,
    title: '数据库系统概念',
    subtitle: '原书第7版',
    author: '亚伯拉罕·西尔伯沙茨, 亨利·F·科思 等',
    publisher: '机械工业出版社',
    publishYear: 2021,
    category: '数据库',
    tags: ['数据库', 'SQL', '数据管理'],
    description: '本书是数据库系统方面的经典教材之一，其内容由浅入深，既包含数据库系统基本概念，又反映数据库技术新进展。',
    cover: '',
    isFavorite: false
  }
]

// 计算属性
const filteredBooks = computed(() => {
  if (!searchQuery.value.trim()) {
    return books.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return books.value.filter(book =>
    book.title.toLowerCase().includes(query) ||
    (book.subtitle && book.subtitle.toLowerCase().includes(query)) ||
    book.author.toLowerCase().includes(query) ||
    book.publisher.toLowerCase().includes(query) ||
    (book.tags && book.tags.some(tag => tag.toLowerCase().includes(query))) ||
    (book.category && book.category.toLowerCase().includes(query))
  )
})

const totalBooks = computed(() => filteredBooks.value.length)
const totalPages = computed(() => Math.ceil(totalBooks.value / itemsPerPage.value))

const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredBooks.value.slice(start, end)
})

// 生命周期钩子
onMounted(() => {
  loadBooks()
})

// 方法
const loadBooks = () => {
  // 模拟API调用
  setTimeout(() => {
    books.value = mockBooks
  }, 300)
}

const handleSearch = () => {
  currentPage.value = 1
}

const resetSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const viewBookDetail = (book: Book) => {
  selectedBook.value = { ...book }
  showDetailDialog.value = true
}

const toggleFavorite = (bookId: number) => {
  const bookIndex = books.value.findIndex(book => book.id === bookId)
  if (bookIndex !== -1) {
    books.value[bookIndex]!.isFavorite = !books.value[bookIndex]!.isFavorite

    // 更新选中的书籍（如果正在查看详情）
    if (selectedBook.value && selectedBook.value.id === bookId) {
      selectedBook.value.isFavorite = books.value[bookIndex]!.isFavorite
    }

    // 显示通知
    const message = books.value[bookIndex]!.isFavorite ? '已添加到收藏' : '已从收藏移除'
      $q.notify({
      message,
      color: books.value[bookIndex]!.isFavorite ? 'positive' : 'warning',
      icon: books.value[bookIndex]!.isFavorite ? 'star' : 'star_border',
      position: 'top-right',
      timeout: 1500
    })
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // 可以在这里添加滚动到顶部的逻辑
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (size: number) => {
  itemsPerPage.value = size
  currentPage.value = 1
}

const handleBorrow = () => {
  if (selectedBook.value) {
    $q.notify({
      message: `已申请借阅《${selectedBook.value.title}》`,
      color: 'positive',
      icon: 'check_circle',
      position: 'top-right',
      timeout: 2000
    })
    showDetailDialog.value = false
  }
}

// 监听器
watch(searchQuery, () => {
  currentPage.value = 1
})

// 暴露给模板的内容
defineExpose({
  searchQuery,
  currentPage,
  itemsPerPage,
  books,
  selectedBook,
  showDetailDialog,
  filteredBooks,
  totalBooks,
  totalPages,
  paginatedBooks
})
</script>

<template>
  <page-content class="q-pa-sm">
    <!-- 页面标题和搜索栏 -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <h2 class="text-h4 text-weight-bold text-primary q-mb-none">Search Books...</h2>
      </div>
      <div class="col-auto">
        <q-input
                v-model="searchQuery"
                placeholder="Search by title, author or publisher..."
                outlined
                dense
                clearable
                class="search-input"
                style="min-width: 300px;"
                @update:model-value="handleSearch"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>
    <!-- 书籍列表 -->
    <q-list bordered separator class="rounded-borders q-mb-lg">
      <q-item-label header class="text-h6 bg-grey-2">
        <div class="row items-center justify-between">
          <div>
            书籍列表
            <q-badge color="primary" class="q-ml-sm">
              共 {{ totalBooks }} 本书
            </q-badge>
          </div>
          <div class="text-body2 text-grey-7">
            第 {{ currentPage }} 页，共 {{ totalPages }} 页
          </div>
        </div>
      </q-item-label>

      <!-- 书籍项目 -->
      <q-item
        v-for="book in paginatedBooks"
        :key="book.id"
        class="q-py-md"
        clickable
        v-ripple
        @click="viewBookDetail(book)"
      >
        <!-- 书籍封面 -->
        <q-item-section avatar>
          <q-avatar size="80px" class="shadow-2">
            <q-img
              :src="book.cover || defaultCover"
              :alt="book.title"
              spinner-color="primary"
              class="rounded-borders"
              style="height: 100%;"
            >
              <!-- 无封面时的默认内容 -->
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">
                  <q-icon name="menu_book" size="40px" />
                </div>
              </template>
            </q-img>
          </q-avatar>
        </q-item-section>

        <!-- 书籍信息 -->
        <q-item-section>
          <q-item-label class="text-h6 text-weight-bold">
            {{ book.title }}
            <q-badge v-if="book.category" color="secondary" class="q-ml-sm">
              {{ book.category }}
            </q-badge>
          </q-item-label>

          <q-item-label v-if="book.subtitle" caption class="text-body1 text-grey-8 q-mt-xs">
            {{ book.subtitle }}
          </q-item-label>

          <q-item-label class="text-body2 q-mt-sm">
            <div class="row items-center q-gutter-sm">
              <div class="row items-center">
                <q-icon name="person" size="16px" class="q-mr-xs" color="grey-6" />
                <span>{{ book.author }}</span>
              </div>
              <q-separator vertical inset />
              <div class="row items-center">
                <q-icon name="business" size="16px" class="q-mr-xs" color="grey-6" />
                <span>{{ book.publisher }}</span>
              </div>
              <q-separator vertical inset v-if="book.publishYear" />
              <div class="row items-center" v-if="book.publishYear">
                <q-icon name="calendar_month" size="16px" class="q-mr-xs" color="grey-6" />
                <span>{{ book.publishYear }}年</span>
              </div>
            </div>
          </q-item-label>

          <q-item-label v-if="book.description" caption lines="2" class="q-mt-sm">
            {{ book.description }}
          </q-item-label>

          <!-- 标签 -->
          <div class="q-mt-sm">
            <q-badge
              v-for="tag in book.tags"
              :key="tag"
              outline
              color="primary"
              class="q-mr-xs q-mb-xs"
            >
              {{ tag }}
            </q-badge>
          </div>
        </q-item-section>

        <!-- 操作按钮 -->
        <q-item-section side top @click.stop>
          <div class="column q-gutter-xs">
            <q-btn
              color="primary"
              label="查看详情"
              icon="visibility"
              @click="viewBookDetail(book)"
              class="q-px-md"
              unelevated
            />
            <q-btn
              :color="book.isFavorite ? 'warning' : 'grey-7'"
              :label="book.isFavorite ? '已收藏' : '收藏'"
              :icon="book.isFavorite ? 'star' : 'star_border'"
              @click="toggleFavorite(book.id)"
              flat
              dense
              class="q-px-sm"
            />
          </div>
        </q-item-section>
      </q-item>

      <!-- 空状态 -->
      <div v-if="filteredBooks.length === 0" class="column items-center q-pa-xl">
        <q-icon name="search_off" size="60px" color="grey-4" />
        <div class="text-h6 q-mt-md text-grey-6">未找到相关书籍</div>
        <p class="text-grey-7 q-mt-sm">请尝试其他搜索关键词</p>
        <q-btn
          color="primary"
          label="重置搜索"
          @click="resetSearch"
          class="q-mt-md"
          outline
        />
      </div>
    </q-list>

    <!-- 分页控件 -->
    <div class="row justify-center q-mb-xl" v-if="totalPages > 1">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="6"
        direction-links
        boundary-links
        color="primary"
        active-color="secondary"
        active-text-color="white"
        @update:model-value="handlePageChange"
      />

      <!-- 每页显示数量选择 -->
      <div class="row items-center q-ml-md">
        <span class="q-mr-sm text-grey-7">每页显示:</span>
        <q-select
          v-model="itemsPerPage"
          :options="pageSizeOptions"
          dense
          outlined
          style="width: 80px;"
          emit-value
          map-options
          @update:model-value="handlePageSizeChange"
        />
      </div>
    </div>
  </page-content>
</template>

<style scoped>
.search-input {
  border-radius: 24px;
}

.q-item:hover {
  background-color: #f9f9f9;
  transition: background-color 0.3s;
}

.q-img {
  transition: transform 0.3s;
}

.q-img:hover {
  transform: scale(1.05);
}

.q-badge {
  font-size: 0.75em;
}

.q-pagination {
  border-radius: 8px;
  padding: 8px;
  background-color: #f5f5f5;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-input {
    min-width: 100% !important;
    margin-top: 10px;
  }

  .q-item-section--side {
    min-width: 100px;
  }
}

@media (max-width: 600px) {
  .q-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .q-item-section--avatar {
    margin-bottom: 16px;
  }

  .q-item-section--side {
    align-self: flex-end;
    margin-top: 16px;
  }
}
</style>
