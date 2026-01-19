<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table
        title="Reading Lists"
        :rows="readingLists"
        :hide-header="mode === 'grid'"
        :columns="columns"
        row-key="id"
        :grid="mode === 'grid'"
        :filter="filter"
        v-model:pagination="pagination"
        :loading="loading"
      >
        <!-- 列表布局的表头 -->
        <template v-slot:top-right="props">
          <!-- 添加新书单按钮 -->
          <q-btn
            @click="addReadingList()"
            flat
            size="lg"
            color="primary"
            icon="add_circle"
            class="q-mr-xs q-pa-none"
          >
            <q-tooltip>Add New Reading List</q-tooltip>
          </q-btn>

          <!-- 刷新按钮 -->
          <q-btn
            @click="loadReadingLists"
            flat
            size="lg"
            color="secondary"
            icon="refresh"
            class="q-mr-xs q-pa-none"
            :loading="loading"
          >
            <q-tooltip>Refresh</q-tooltip>
          </q-btn>

          <!-- 搜索框 -->
          <q-input
            dense
            borderless
            v-model="filter"
            placeholder="Search reading lists..."
            class="bg-grey-3 q-pl-sm"
            style="border-radius: 10px"
          >
            <template v-slot:append>
              <q-icon class="q-pr-sm" color="grey-8" name="search" />
            </template>
          </q-input>

          <!-- 全屏切换按钮（仅列表模式显示） -->
          <q-btn
            flat
            round
            dense
            class="q-ml-xs"
            :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
            @click="props.toggleFullscreen"
            v-if="mode === 'list'"
          >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup
            >{{
                props.inFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"
              }}
            </q-tooltip>
          </q-btn>

          <!-- 视图模式切换（列表/网格） -->
          <q-toggle
            v-model="viewToggle"
            @click="mode = mode === 'grid' ? 'list' : 'grid';"
            v-if="!props.inFullscreen"
          >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup
            >{{ mode === "grid" ? "List View" : "Grid View" }}
            </q-tooltip>
          </q-toggle>
        </template>

        <!-- 列表布局下的列渲染 -->

        <!-- 书单名称列 -->
        <template v-slot:body-cell-title="props">
          <q-td :props="props">
            <div class="text-weight-medium cursor-pointer" @click="viewReadingList(props.row)">
              {{ props.row.title }}
            </div>
          </q-td>
        </template>

        <!-- 创建者列 -->
        <template v-slot:body-cell-creator="props">
          <q-td :props="props">
            <span
              v-if="props.row.creator_id"
            >
              {{ getUserName(props.row.creator_id) }}
            </span>
            <span v-else class="text-grey-6">Unknown</span>
          </q-td>
        </template>

        <!-- 创建时间列 -->
        <template v-slot:body-cell-create_time="props">
          <q-td :props="props">
            <div>{{ formatDate(props.row.create_time) }}</div>
            <div class="text-caption text-grey-7">
              Updated: {{ formatDate(props.row.update_time) }}
            </div>
          </q-td>
        </template>

        <!-- 操作列 -->
        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-sm">
              <!-- 查看详情按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="visibility"
                @click="viewReadingList(props.row)"
              >
                <q-tooltip>View Details</q-tooltip>
              </q-btn>

              <!-- 编辑按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="edit"
                @click="editReadingList(props.row)"
              >
                <q-tooltip>Edit Reading List</q-tooltip>
              </q-btn>

              <!-- 删除按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="red"
                icon="delete"
                @click="deleteReadingList(props.row)"
              >
                <q-tooltip>Delete Reading List</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <!-- Grid 布局的卡片视图 -->
        <template v-slot:item="props">
          <div
            class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition"
            :style="props.selected ? 'transform: scale(0.95);' : ''"
          >
            <q-card>
              <!-- 卡片标题区域 -->
              <q-card-section class="cursor-pointer" @click="viewReadingList(props.row)">
                <div class="text-h6">{{ props.row.title }}</div>
                <div class="q-mt-sm">
                  <q-chip
                    v-if="props.row.creator_id"
                    color="primary"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    {{ getUserName(props.row.creator_id) }}
                  </q-chip>
                  <q-chip
                    color="teal"
                    text-color="white"
                    dense
                    size="sm"
                    class="q-ml-xs"
                  >
                    {{ getBookCount(props.row.id) }} Books
                  </q-chip>
                </div>
              </q-card-section>

              <q-separator />

              <!-- 卡片内容区域 -->
              <q-card-section class="q-pt-none">
                <div class="text-caption text-grey-8">
                  <!-- 来源URL -->
                  <div v-if="props.row.source_url">
                    <strong>Source: </strong>
                    <a
                      :href="props.row.source_url"
                      target="_blank"
                      class="text-primary"
                      @click.stop
                    >
                      {{ props.row.source }}
                    </a>
                  </div>
                  <!-- 创建时间 -->
                  <div v-if="props.row.create_time">
                    <strong>Created:</strong> {{ formatDate(props.row.create_time) }}
                  </div>
                  <!-- 更新时间 -->
                  <div v-if="props.row.update_time">
                    <strong>Updated:</strong> {{ formatDate(props.row.update_time) }}
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <!-- 卡片操作按钮区域 -->
              <q-card-actions align="right" class="q-pa-md">
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="visibility"
                  @click="viewReadingList(props.row)"
                >
                  <q-tooltip>View Details</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="edit"
                  @click="editReadingList(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="red"
                  icon="delete"
                  @click="deleteReadingList(props.row)"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </template>

        <!-- 空数据提示 -->
        <template v-slot:no-data>
          <div class="full-width row flex-center q-gutter-sm">
            <q-icon name="library_books" size="2em" />
            <span>No reading lists found.</span>
            <q-btn
              flat
              color="primary"
              label="Create First List"
              @click="addReadingList"
            />
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- 添加/编辑书单对话框 -->
    <q-dialog v-model="showReadingListDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '50vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ isEditing ? 'Edit Reading List' : 'Add Reading List' }}
            <q-btn
              round
              flat
              dense
              icon="close"
              class="float-right"
              color="grey-8"
              v-close-popup
            ></q-btn>
          </div>
        </q-card-section>
        <q-separator class="q-px-md" inset></q-separator>
        <q-card-section class="q-pt-md">
          <q-form class="q-gutter-md" @submit="saveReadingList">
            <q-list>
              <!-- 书单名称（必填） -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">List Title *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentReadingList.title"
                    :rules="[val => !!val || 'List title is required']"
                    placeholder="e.g., Computer Science Essentials"
                  />
                </q-item-section>
              </q-item>

              <!-- 创建者选择 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Creator</q-item-label>
                  <q-select
                    dense
                    outlined
                    v-model="currentReadingList.creator_id"
                    :options="users"
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    clearable
                    placeholder="Select creator (optional)"
                  >
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>{{ scope.opt.name }}</q-item-label>
                          <q-item-label caption v-if="scope.opt.email">
                            {{ scope.opt.email }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </q-item-section>
              </q-item>

              <!-- 来源 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Source</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentReadingList.source"
                    placeholder="e.g., University Recommended List"
                  />
                </q-item-section>
              </q-item>

              <!-- 来源URL -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Source URL</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentReadingList.source_url"
                    type="url"
                    placeholder="https://example.com/recommended-books"
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="q-px-md q-pt-sm">
              <q-btn class="full-width" label="Save" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

// 书单接口定义
interface ReadingList {
  id?: number;                    // 书单ID
  title: string;                  // 书单名称
  creator_id?: number | null;     // 创建者ID
  source?: string;                // 来源
  source_url?: string;            // 来源URL
  create_time?: string;           // 创建时间
  update_time?: string;           // 更新时间
}

// 图书接口定义
interface Book {
  id?: number;                    // 图书ID
  title: string;                  // 书名
  subtitle?: string;              // 副标题
  lib_class_code?: string;        // 图书馆分类号
  copyright?: string;             // 版权信息
  description?: string;           // 内容简介
  create_time?: string;           // 创建时间
  update_time?: string;           // 更新时间
}

// 书单-图书关联接口
interface RelBookList {
  list_id: number;                // 书单ID
  book_id: number;                // 图书ID
  sort_order: number;             // 排序序号
}

// 用户接口定义（模拟）
interface User {
  id: number;                     // 用户ID
  name: string;                   // 用户名
  email?: string;                 // 邮箱
  role?: string;                  // 角色
}

const $q = useQuasar();          // Quasar工具函数
const router = useRouter();      // 路由

// 响应式状态管理
const viewToggle = ref(false);    // 视图切换状态
const filter = ref('');           // 搜索过滤器
const mode = ref<'list' | 'grid'>('list'); // 显示模式：列表或网格
const loading = ref(false);       // 加载状态
const pagination = ref({
  rowsPerPage: 20,               // 每页显示行数
});

// 模拟数据 - 用户（实际应用中应从API获取）
const users = ref<User[]>([
  { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
  { id: 2, name: 'John Smith', email: 'john@example.com', role: 'Editor' },
  { id: 3, name: 'Jane Doe', email: 'jane@example.com', role: 'Viewer' },
  { id: 4, name: 'Robert Johnson', email: 'robert@example.com', role: 'Editor' },
  { id: 5, name: 'Emily Davis', email: 'emily@example.com', role: 'Viewer' },
]);

// 模拟数据 - 图书（实际应用中应从API获取）
const books = ref<Book[]>([
  {
    id: 1,
    title: 'Clean Code',
    subtitle: 'A Handbook of Agile Software Craftsmanship',
    lib_class_code: 'QA76.76',
    copyright: '© 2008 Robert C. Martin',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
    create_time: '2023-01-10T09:15:00Z',
    update_time: '2023-06-15T11:20:00Z'
  },
  {
    id: 2,
    title: 'The Pragmatic Programmer',
    subtitle: 'Your Journey to Mastery',
    lib_class_code: 'QA76.73',
    copyright: '© 2019 David Thomas, Andrew Hunt',
    description: 'A classic book about software development and career advice for programmers.',
    create_time: '2023-02-05T14:30:00Z',
    update_time: '2023-07-20T16:45:00Z'
  },
  {
    id: 3,
    title: 'Design Patterns',
    subtitle: 'Elements of Reusable Object-Oriented Software',
    lib_class_code: 'QA76.64',
    copyright: '© 1994 Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    description: 'The classic book on software design patterns.',
    create_time: '2023-01-20T10:45:00Z',
    update_time: '2023-06-25T13:10:00Z'
  },
  {
    id: 4,
    title: 'Introduction to Algorithms',
    subtitle: null,
    lib_class_code: 'QA76.9',
    copyright: '© 2009 Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    description: 'A comprehensive textbook covering the modern algorithms used in computer science.',
    create_time: '2023-03-12T08:20:00Z',
    update_time: '2023-08-18T15:35:00Z'
  },
  {
    id: 5,
    title: 'Structure and Interpretation of Computer Programs',
    subtitle: null,
    lib_class_code: 'QA76.6',
    copyright: '© 1996 Harold Abelson, Gerald Jay Sussman, Julie Sussman',
    description: 'A classic textbook that uses the Scheme programming language to teach fundamental concepts of computer programming.',
    create_time: '2023-02-28T11:55:00Z',
    update_time: '2023-08-05T09:40:00Z'
  },
]);

// 模拟数据 - 书单（实际应用中应从API获取）
const readingLists = ref<ReadingList[]>([
  {
    id: 1,
    title: 'Computer Science Fundamentals',
    creator_id: 2,
    source: 'MIT OpenCourseWare',
    source_url: 'https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/',
    create_time: '2023-01-15T10:30:00Z',
    update_time: '2023-06-20T14:45:00Z'
  },
  {
    id: 2,
    title: 'Software Engineering Best Practices',
    creator_id: 1,
    source: 'ACM Recommended Reading',
    source_url: 'https://learning.acm.org/',
    create_time: '2023-02-10T09:15:00Z',
    update_time: '2023-07-12T11:20:00Z'
  },
  {
    id: 3,
    title: 'Machine Learning Essentials',
    creator_id: 4,
    source: 'Stanford CS229',
    source_url: 'https://cs229.stanford.edu/',
    create_time: '2023-03-05T13:45:00Z',
    update_time: '2023-08-15T16:30:00Z'
  },
  {
    id: 4,
    title: 'Web Development Reading List',
    creator_id: 3,
    source: 'Mozilla Developer Network',
    source_url: 'https://developer.mozilla.org/en-US/docs/Learn',
    create_time: '2023-04-20T08:00:00Z',
    update_time: '2023-09-10T10:15:00Z'
  },
  {
    id: 5,
    title: 'Data Structures and Algorithms',
    creator_id: 2,
    source: 'UC Berkeley CS61B',
    source_url: 'https://inst.eecs.berkeley.edu/~cs61b/',
    create_time: '2023-05-12T11:30:00Z',
    update_time: '2023-10-05T14:20:00Z'
  },
]);

// 模拟数据 - 书单-图书关联（实际应用中应从API获取）
const relBookLists = ref<RelBookList[]>([
  { list_id: 1, book_id: 4, sort_order: 1 },
  { list_id: 1, book_id: 5, sort_order: 2 },
  { list_id: 2, book_id: 1, sort_order: 1 },
  { list_id: 2, book_id: 2, sort_order: 2 },
  { list_id: 2, book_id: 3, sort_order: 3 },
  { list_id: 3, book_id: 4, sort_order: 1 },
  { list_id: 4, book_id: 1, sort_order: 1 },
  { list_id: 4, book_id: 2, sort_order: 2 },
  { list_id: 5, book_id: 4, sort_order: 1 },
  { list_id: 5, book_id: 1, sort_order: 2 },
]);

// 表格列定义
const columns = ref([
  {
    name: 'title',
    required: true,
    label: 'Reading List',
    align: 'left',
    field: 'title',
    sortable: true,
  },
  {
    name: 'creator',
    align: 'left',
    label: 'Creator',
    field: 'creator_id',
    sortable: true,
  },
  {
    name: 'source',
    align: 'left',
    label: 'Source',
    field: 'source',
    sortable: true,
  },
  {
    name: 'book_count',
    align: 'center',
    label: 'Books',
    field: 'id',
    sortable: true,
    format: (val: number) => getBookCount(val),
  },
  {
    name: 'create_time',
    align: 'left',
    label: 'Created',
    field: 'create_time',
    sortable: true,
    format: (val: string) => formatDate(val),
  },
  {
    name: 'action',
    align: 'right',
    label: 'Actions',
    field: 'action',
    sortable: false
  }
]);

// 对话框状态管理
const showReadingListDialog = ref(false);   // 添加/编辑对话框显示状态
const isEditing = ref(false);               // 当前是否处于编辑模式

// 当前操作的书单数据
const currentReadingList = ref<ReadingList>({
  title: '',
  creator_id: null,
  source: '',
  source_url: '',
});

// 辅助函数

/**
 * 根据用户ID获取用户名
 * @param userId 用户ID
 * @returns 用户名
 */
const getUserName = (userId: number): string => {
  const user = users.value.find(u => u.id === userId);
  return user ? user.name : 'Unknown User';
};

/**
 * 获取书单中的图书数量
 * @param listId 书单ID
 * @returns 图书数量
 */
const getBookCount = (listId: number): number => {
  return relBookLists.value.filter(rel => rel.list_id === listId).length;
};

/**
 * 获取书单中的图书列表
 * @param listId 书单ID
 * @returns 图书列表（按排序序号排序）
 */
const getBooksInList = (listId: number): Book[] => {
  const bookIds = relBookLists.value
    .filter(rel => rel.list_id === listId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(rel => rel.book_id);

  return books.value.filter(book => bookIds.includes(book.id!));
};

/**
 * 格式化URL显示（移除协议部分）
 * @param url 原始URL
 * @returns 格式化后的URL
 */
const formatUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

/**
 * 格式化日期显示
 * @param dateString 日期字符串
 * @returns 格式化后的日期
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * 加载书单数据（模拟API调用）
 */
const loadReadingLists = () => {
  loading.value = true;

  // 模拟API延迟
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

// 主要方法

/**
 * 打开添加书单对话框
 */
const addReadingList = () => {
  currentReadingList.value = {
    title: '',
    creator_id: null,
    source: '',
    source_url: '',
  };
  isEditing.value = false;
  showReadingListDialog.value = true;
};

/**
 * 打开编辑书单对话框
 * @param readingList 要编辑的书单对象
 */
const editReadingList = (readingList: ReadingList) => {
  currentReadingList.value = { ...readingList };
  isEditing.value = true;
  showReadingListDialog.value = true;
};

/**
 * 查看书单详情（导航到详情页面）
 * @param readingList 要查看的书单对象
 */
const viewReadingList = (readingList: ReadingList) => {
  // 在实际应用中，这里应该导航到书单详情页面
  // router.push(`/url/${readingList.id}`);

  // 先使用对话框模拟详情按钮
  $q.dialog({
    title: readingList.title,
    message: `This would navigate to the detail page for "${readingList.title}".`,
    ok: {
      label: 'OK',
      color: 'primary'
    }
  });
};

/**
 * 保存书单信息（添加或更新）
 */
const saveReadingList = () => {
  // 验证必填字段
  if (!currentReadingList.value.title) {
    $q.notify({
      color: 'negative',
      message: 'Reading list title is required'
    });
    return;
  }

  if (isEditing.value) {
    // 更新现有书单
    const index = readingLists.value.findIndex(rl => rl.id === currentReadingList.value.id);
    if (index !== -1) {
      const now = new Date().toISOString();
      readingLists.value[index] = {
        ...currentReadingList.value,
        update_time: now
      };
    }
    $q.notify({
      color: 'positive',
      message: 'Reading list updated successfully'
    });
  } else {
    // 添加新书单
    const newId = readingLists.value.length > 0
      ? Math.max(...readingLists.value.map(rl => rl.id || 0)) + 1
      : 1;
    const now = new Date().toISOString();
    currentReadingList.value.id = newId;
    currentReadingList.value.create_time = now;
    currentReadingList.value.update_time = now;
    readingLists.value.push({ ...currentReadingList.value });
    $q.notify({
      color: 'positive',
      message: 'Reading list added successfully'
    });
  }

  showReadingListDialog.value = false; // 关闭对话框
};

/**
 * 删除书单（带确认对话框）
 * @param readingListItem 要删除的书单对象
 */
const deleteReadingList = (readingListItem: ReadingList) => {
  // 检查是否有关联的图书
  const hasBooks = relBookLists.value.some(rel => rel.list_id === readingListItem.id);

  if (hasBooks) {
    $q.dialog({
      title: 'Cannot Delete Reading List',
      message: `This reading list contains books. All associated books will be removed from the list. Do you want to proceed?`,
      ok: {
        label: 'Delete',
        color: 'red'
      },
      cancel: {
        label: 'Cancel',
        color: 'grey-8',
        flat: true
      },
      persistent: true
    }).onOk(() => {
      // 删除书单和关联关系
      readingLists.value = readingLists.value.filter(rl => rl.id !== readingListItem.id);
      relBookLists.value = relBookLists.value.filter(rel => rel.list_id !== readingListItem.id);

      $q.notify({
        color: 'positive',
        message: 'Reading list deleted successfully'
      });
    });
  } else {
    $q.dialog({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${readingListItem.title}"?`,
      ok: {
        label: 'Delete',
        color: 'red'
      },
      cancel: {
        label: 'Cancel',
        color: 'grey-8',
        flat: true
      },
      persistent: true
    }).onOk(() => {
      readingLists.value = readingLists.value.filter(rl => rl.id !== readingListItem.id);

      $q.notify({
        color: 'positive',
        message: 'Reading list deleted successfully'
      });
    });
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadReadingLists();
});
</script>

<style scoped>
/* 网格布局过渡动画 */
.grid-style-transition {
  transition: transform 0.3s, box-shadow 0.3s;
}

/* 网格卡片悬停效果 */
.grid-style-transition:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 可点击文本样式 */
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  text-decoration: underline;
  color: #1976D2;
}
</style>
