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

// 高级查询字段配置
interface AdvancedSearchField {
  field: keyof Book | 'tags' | 'category'
  label: string
  placeholder: string
  exactMatch: boolean
  value: string
  enabled: boolean
  type: 'input' | 'select' | 'tags'
}

// 响应式数据
const defaultCover = 'https://via.placeholder.com/150x200/78909C/FFFFFF?text=No+Cover'
const searchQuery = ref<string>('')
const currentPage = ref<number>(1)
const itemsPerPage = ref<number>(5)
const books = ref<Book[]>([])
const selectedBook = ref<Book | null>(null)
const showDetailDialog = ref<boolean>(false)
const showAdvancedSearchPanel = ref<boolean>(false)

// 从书籍数据中提取所有分类
const extractCategories = (books: Book[]): string[] => {
  const categories = new Set<string>()
  books.forEach(book => {
    if (book.category) {
      categories.add(book.category)
    }
  })
  return Array.from(categories).sort()
}

// 分类选项（初始为空，加载数据后更新）
const categoryOptions = ref<string[]>([])

// 高级查询字段配置
const advancedSearchFields = ref<AdvancedSearchField[]>([
  { field: 'title', label: '标题', placeholder: '请输入书名...', exactMatch: false, value: '', enabled: false, type: 'input' },
  { field: 'subtitle', label: '副标题', placeholder: '请输入副标题...', exactMatch: false, value: '', enabled: false, type: 'input' },
  { field: 'author', label: '作者', placeholder: '请输入作者名...', exactMatch: false, value: '', enabled: false, type: 'input' },
  { field: 'publisher', label: '出版社', placeholder: '请输入出版社...', exactMatch: false, value: '', enabled: false, type: 'input' },
  { field: 'category', label: '分类', placeholder: '请选择分类...', exactMatch: true, value: '', enabled: false, type: 'select' },
  { field: 'tags', label: '标签', placeholder: '请输入标签，多个用逗号分隔...', exactMatch: false, value: '', enabled: false, type: 'tags' },
  { field: 'description', label: '描述', placeholder: '请输入描述关键词...', exactMatch: false, value: '', enabled: false, type: 'input' }
])

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

// 检查是否启用了高级查询
const hasAdvancedSearchEnabled = computed(() => {
  return advancedSearchFields.value.some(field => field.enabled && field.value.trim() !== '')
})

// 计算属性
const filteredBooks = computed(() => {
  // 如果没有搜索条件，返回所有书籍
  if (!searchQuery.value.trim() && !hasAdvancedSearchEnabled.value) {
    return books.value
  }

  let result = books.value

  // 应用基础搜索
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(book =>
      book.title.toLowerCase().includes(query) ||
      (book.subtitle && book.subtitle.toLowerCase().includes(query)) ||
      book.author.toLowerCase().includes(query) ||
      book.publisher.toLowerCase().includes(query) ||
      (book.tags && book.tags.some(tag => tag.toLowerCase().includes(query))) ||
      (book.category && book.category.toLowerCase().includes(query))
    )
  }

  // 应用高级查询
  if (hasAdvancedSearchEnabled.value) {
    result = result.filter(book => {
      // 检查所有启用且有值的高级查询字段
      for (const fieldConfig of advancedSearchFields.value) {
        if (fieldConfig.enabled && fieldConfig.value.trim()) {
          const fieldValue = fieldConfig.value.trim()
          const bookFieldValue = getBookFieldValue(book, fieldConfig.field)

          if (bookFieldValue === undefined || bookFieldValue === null || bookFieldValue === '') {
            return false // 如果书籍没有这个字段，不匹配
          }

          const bookValue = String(bookFieldValue)

          if (fieldConfig.exactMatch) {
            // 精确匹配
            if (fieldConfig.field === 'tags') {
              // 对于标签，检查是否完全匹配其中一个标签
              if (!book.tags || !book.tags.some(tag => tag === fieldValue)) {
                return false
              }
            } else if (bookValue !== fieldValue) {
              return false
            }
          } else {
            // 模糊匹配（分类字段在select模式下不允许模糊匹配）
            if (fieldConfig.field === 'category' && fieldConfig.type === 'select') {
              // 分类下拉框使用精确匹配
              if (bookValue !== fieldValue) {
                return false
              }
            } else if (fieldConfig.field === 'tags') {
              // 对于标签，检查是否包含查询内容（支持逗号分隔多个标签）
              const searchTags = fieldValue.toLowerCase().split(',').map(tag => tag.trim()).filter(tag => tag)
              if (!book.tags || !searchTags.some(searchTag =>
                book.tags!.some(tag => tag.toLowerCase().includes(searchTag))
              )) {
                return false
              }
            } else if (!bookValue.toLowerCase().includes(fieldValue.toLowerCase())) {
              return false
            }
          }
        }
      }
      return true
    })
  }

  return result
})

// 获取书籍字段值
const getBookFieldValue = (book: Book, field: string): any => {
  if (field === 'tags') {
    return book.tags ? book.tags.join(', ') : ''
  }
  return (book as any)[field]
}

const totalBooks = computed(() => filteredBooks.value.length)
const totalPages = computed(() => Math.ceil(totalBooks.value / itemsPerPage.value))

const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredBooks.value.slice(start, end)
})

// 计算当前显示的记录范围
const currentRecordRange = computed(() => {
  if (totalBooks.value === 0) return '0-0'

  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(currentPage.value * itemsPerPage.value, totalBooks.value)
  return `${start}-${end}`
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
    // 从加载的书籍数据中提取分类
    categoryOptions.value = extractCategories(books.value)
  }, 300)
}

const handleSearch = () => {
  currentPage.value = 1
}

const resetSearch = () => {
  searchQuery.value = ''
  resetAdvancedSearch()
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

// 高级查询相关方法
const toggleAdvancedSearchPanel = () => {
  showAdvancedSearchPanel.value = !showAdvancedSearchPanel.value
}

const handlerSearch = () => {
  currentPage.value = 1
  $q.notify({
    message: '共查询到*个记录',
    color: 'positive',
    icon: 'check_circle',
    position: 'top',
    timeout: 1500
  })
}

const resetAdvancedSearch = () => {
  advancedSearchFields.value.forEach(field => {
    field.value = ''
    field.enabled = false
    field.exactMatch = field.field === 'category' // 分类默认使用精确匹配
  })
  currentPage.value = 1
  $q.notify({
    message: '高级查询已重置',
    color: 'info',
    icon: 'refresh',
    position: 'top-right',
    timeout: 1500
  })
}

const toggleAdvancedField = (field: AdvancedSearchField) => {
  field.enabled = !field.enabled
  if (!field.enabled) {
    field.value = ''
  }
}

const toggleExactMatch = (field: AdvancedSearchField) => {
  // 分类字段使用下拉框时，不显示精确匹配切换（固定为精确匹配）
  if (field.field !== 'category' || field.type !== 'select') {
    field.exactMatch = !field.exactMatch
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
    <!-- 页面标题 -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <h2 class="text-h4 text-weight-bold text-primary q-mb-md">Search Books...</h2>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="row q-mb-md">
      <div class="col-12">
        <div class="row items-center">
          <div class="col-md-8 col-lg-6">
            <q-input
              v-model="searchQuery"
              placeholder="快速搜索书名、作者、出版社..."
              outlined
              dense
              clearable
              class="search-input"
              @update:model-value="handleSearch"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-md-4 col-lg-6 q-gutter-sm q-md-mt-0 q-pl-md-md">
            <q-btn
              label="查询"
              color="primary"
              @click="handlerSearch"
              unelevated
            />

            <q-btn
              :color="showAdvancedSearchPanel ? 'primary' : 'secondary'"
              :icon="showAdvancedSearchPanel ? 'expand_less' : 'tune'"
              :label="showAdvancedSearchPanel ? '快捷查询' : '高级查询'"
              @click="toggleAdvancedSearchPanel"
              unelevated
            />
            <!-- 清空高级查询条件   -->
            <q-btn
              v-if="showAdvancedSearchPanel"
              label="重置"
              color="grey"
              @click="resetAdvancedSearch"
              unelevated
            />
          </div>


        </div>
      </div>
    </div>

    <!-- 高级查询面板 -->
    <q-slide-transition>
      <div v-show="showAdvancedSearchPanel" class="q-mb-lg">
        <q-card bordered class="q-pa-md advanced-search-panel">
          <q-card-section>
            <div class="q-gutter-y-md">
              <!-- 每个查询字段 -->
              <div v-for="field in advancedSearchFields" :key="field.field" class="row items-center q-gutter-sm">
                <div style="width: 100px;">
                  <q-checkbox
                    v-model="field.enabled"
                    :label="field.label"
                    dense
                  />
                </div>

                <div class="col">
                  <!-- 输入框类型 -->
                  <q-input
                    v-if="field.type === 'input'"
                    v-model="field.value"
                    :placeholder="field.placeholder"
                    outlined
                    dense
                    :disable="!field.enabled"
                    class="q-ml-sm"
                  />

                  <!-- 下拉选择类型（分类） -->
                  <q-select
                    v-else-if="field.type === 'select'"
                    v-model="field.value"
                    :options="categoryOptions"
                    :placeholder="field.placeholder"
                    outlined
                    dense
                    :disable="!field.enabled"
                    class="q-ml-sm"
                    emit-value
                    map-options
                    clearable
                  >
                    <template v-slot:prepend>
                      <q-icon name="category" />
                    </template>
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>{{ scope.opt }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-badge color="secondary" rounded>
                            {{ books.filter(b => b.category === scope.opt).length }}
                          </q-badge>
                        </q-item-section>
                      </q-item>
                    </template>
                    <template v-slot:selected>
                      <div v-if="field.value" class="ellipsis">
                        {{ field.value }}
                        <q-badge color="secondary" rounded class="q-ml-xs">
                          {{ books.filter(b => b.category === field.value).length }}
                        </q-badge>
                      </div>
                      <div v-else class="text-grey">
                        {{ field.placeholder }}
                      </div>
                    </template>
                  </q-select>

                  <!-- 标签类型 -->
                  <q-input
                    v-else-if="field.type === 'tags'"
                    v-model="field.value"
                    :placeholder="field.placeholder"
                    outlined
                    dense
                    :disable="!field.enabled"
                    class="q-ml-sm"
                  >
                    <template v-slot:prepend>
                      <q-icon name="local_offer" />
                    </template>
                  </q-input>
                </div>

                <!-- 精确/模糊匹配切换 -->
                <div v-if="field.type !== 'select' || field.field !== 'category'">
                  <q-toggle
                    v-model="field.exactMatch"
                    :label="field.exactMatch ? '精确' : '模糊'"
                    :disable="!field.enabled"
                    color="primary"
                    size="sm"
                    @update:model-value="toggleExactMatch(field)"
                  />
                </div>
                <div v-else style="width: 80px;"></div> <!-- 占位保持对齐 -->
              </div>
            </div>

            <div class="text-caption text-grey-7 q-mt-md">
              提示：
              <ul>
                <li>精确匹配需要完全一致，模糊匹配只需要包含关键词即可</li>
                <li>分类字段使用下拉选择，固定为精确匹配</li>
                <li>标签字段支持多个标签，用逗号分隔</li>
              </ul>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-slide-transition>

    <!-- 查询状态显示 -->
    <div v-if="hasAdvancedSearchEnabled && !showAdvancedSearchPanel" class="q-mb-md">
      <div class="row items-center q-gutter-sm">
        <span class="text-caption text-grey-7">高级查询条件：</span>
        <q-chip
          v-for="field in advancedSearchFields.filter(f => f.enabled && f.value.trim())"
          :key="field.field"
          dense
          removable
          @remove="field.enabled = false"
          :color="field.type === 'select' ? 'secondary' : 'primary'"
          text-color="white"
        >
          <template v-if="field.type === 'select'">
            <q-icon name="category" class="q-mr-xs" />
          </template>
          {{ field.label }}: {{ field.value }}
          <q-tooltip>
            {{ field.exactMatch ? '精确匹配' : '模糊匹配' }} {{ field.type === 'select' ? '(下拉选择)' : '' }}
          </q-tooltip>
        </q-chip>
        <q-btn
          size="sm"
          color="grey"
          icon="close"
          @click="resetAdvancedSearch"
          flat
          dense
        />
      </div>
    </div>

    <!-- 书籍列表 -->
    <q-list bordered separator class="rounded-borders q-mb-lg">
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
        <p class="text-grey-7 q-mt-sm" v-if="hasAdvancedSearchEnabled">
          请尝试调整高级查询条件或使用其他关键词
        </p>
        <p class="text-grey-7 q-mt-sm" v-else>
          请尝试其他搜索关键词
        </p>
        <q-btn
          color="primary"
          label="重置搜索"
          @click="resetSearch"
          class="q-mt-md"
          outline
        />
      </div>
    </q-list>

    <!-- 分页控件和统计信息 -->
    <div class="row justify-between items-center q-mb-xl" v-if="totalPages > 1">
      <!-- 左侧：记录统计 -->
      <div class="col-12 col-md-auto q-mb-md q-md-mb-0">
        <div class="text-body2 text-grey-7">
          <q-icon name="menu_book" size="16px" class="q-mr-sm" />
          第 <span class="text-primary text-weight-bold">{{ currentRecordRange }}</span> 本，
          共 <span class="text-primary text-weight-bold">{{ totalBooks }}</span> 本
        </div>
      </div>

      <!-- 中间：分页控件 -->
      <div class="col-12 col-md-auto q-mb-md q-md-mb-0">
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
      </div>

      <!-- 右侧：每页显示数量选择 -->
      <div class="col-12 col-md-auto">
        <div class="row items-center justify-end">
          <span class="text-body2 text-grey-7 q-mr-sm">每页显示:</span>
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
    </div>

    <!-- 当只有一页或没有数据时的统计信息 -->
    <div class="row justify-start items-center q-mb-xl" v-if="totalPages <= 1 && totalBooks > 0">
      <div class="col-12">
        <div class="text-body2 text-grey-7">
          <q-icon name="menu_book" size="16px" class="q-mr-sm" />
          共 <span class="text-primary text-weight-bold">{{ totalBooks }}</span> 本书
          <q-badge v-if="hasAdvancedSearchEnabled" color="secondary" class="q-ml-sm">
            高级查询
          </q-badge>
        </div>
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

/* 高级查询面板样式 */
.advanced-search-panel {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--q-primary);
}

/* 分类下拉框样式 */
.q-select__dropdown .q-badge {
  font-size: 0.7em;
  padding: 2px 6px;
}

/* 响应式调整 */
@media (min-width: 768px) {
  .q-pl-md-md {
    padding-left: 16px;
  }

  .q-md-full-width-auto {
    width: auto !important;
  }

  .q-md-mb-0 {
    margin-bottom: 0 !important;
  }
}

@media (max-width: 767px) {
  .q-mt-md {
    margin-top: 16px;
  }

  .q-md-mt-0 {
    margin-top: 0;
  }

  .q-mb-md {
    margin-bottom: 16px;
  }

  .search-input {
    min-width: 100% !important;
  }

  .q-item-section--side {
    min-width: 100px;
  }

  /* 高级查询面板在移动端调整 */
  .advanced-search-panel .row.items-center {
    flex-direction: column;
    align-items: flex-start;
  }

  .advanced-search-panel .row.items-center > div:first-child {
    width: 100%;
    margin-bottom: 8px;
  }

  .advanced-search-panel .row.items-center > .col {
    width: 100%;
  }

  .advanced-search-panel .row.items-center > div:last-child {
    align-self: flex-end;
  }

  .advanced-search-panel .q-card-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .advanced-search-panel .q-card-actions .q-btn {
    margin-bottom: 8px;
    width: 100%;
  }

  /* 分页区域在移动端调整 */
  .row.justify-between.items-center > div {
    width: 100%;
    text-align: center;
    margin-bottom: 16px;
  }

  .row.justify-between.items-center .q-pagination {
    justify-content: center;
  }

  .row.justify-between.items-center .row.items-center.justify-end {
    justify-content: center !important;
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

  .row.items-center.q-gutter-sm {
    flex-wrap: wrap;
  }
}
</style>
