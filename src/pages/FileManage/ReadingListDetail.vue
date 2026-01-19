<template>
  <q-page class="q-pa-md">
    <!-- 加载状态 -->
    <div v-if="loading" class="full-width row flex-center q-pa-xl">
      <q-spinner-gears size="50px" color="primary" />
      <div class="q-ml-md">Loading reading list...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="full-width row flex-center q-pa-xl">
      <q-icon name="error" size="50px" color="negative" />
      <div class="q-ml-md">{{ error }}</div>
      <q-btn class="q-ml-md" color="primary" label="Back to Lists" @click="goBackToList" />
    </div>

    <!-- 书单内容 -->
    <div v-else-if="currentReadingList">
      <!-- 书单头部信息 -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-h4">{{ currentReadingList.title }}</div>
              <div class="text-subtitle1 text-grey-7 q-mt-sm">
                <div v-if="currentReadingList.source">
                  <q-icon name="link" size="1em" class="q-mr-xs" />
                  Source:
                  <a
                    v-if="currentReadingList.source_url"
                    :href="ensureUrlProtocol(currentReadingList.source_url)"
                    target="_blank"
                    class="text-primary"
                    @click.stop
                  >
                    {{ currentReadingList.source }}
                  </a>
                  <span v-else>{{ currentReadingList.source }}</span>
                </div>
              </div>
            </div>
            <div class="col-auto">
              <q-chip
                v-if="currentReadingList.creator_id"
                color="primary"
                text-color="white"
                icon="person"
              >
                {{ getUserName(currentReadingList.creator_id) }}
              </q-chip>
              <q-chip
                color="teal"
                text-color="white"
                icon="menu_book"
              >
                {{ currentBooks.length }} Books
              </q-chip>
              <q-btn
                round
                flat
                color="primary"
                icon="arrow_back"
                class="q-ml-sm"
                @click="goBackToList"
              >
                <q-tooltip>Back to Lists</q-tooltip>
              </q-btn>
            </div>
          </div>

          <div class="row q-mt-md">
            <div class="col-12">
              <div class="text-caption text-grey-7">
                <q-icon name="schedule" size="1em" class="q-mr-xs" />
                Created: {{ formatDate(currentReadingList.create_time) }}
                <span class="q-mx-sm">•</span>
                <q-icon name="update" size="1em" class="q-mr-xs" />
                Updated: {{ formatDate(currentReadingList.update_time) }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            color="primary"
            icon="edit"
            label="Edit List"
            @click="editReadingList"
          />
          <q-btn
            flat
            color="green"
            icon="add"
            label="Add Books"
            @click="showAddBookDialog = true"
          />
          <q-btn
            flat
            color="red"
            icon="delete"
            label="Delete List"
            @click="deleteReadingList"
          />
        </q-card-actions>
      </q-card>

      <!-- 书单中的图书列表 -->
      <q-card>
        <q-toolbar>
          <q-toolbar-title>
            <q-icon name="menu_book" class="q-mr-sm" />
            Books in this List ({{ currentBooks.length }})
          </q-toolbar-title>
          <q-space />
          <q-btn
            flat
            round
            dense
            icon="refresh"
            @click="refreshBookList"
          >
            <q-tooltip>Refresh</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="sort"
            @click="toggleSortOrder"
          >
            <q-tooltip>{{ sortAscending ? 'Sort Descending' : 'Sort Ascending' }}</q-tooltip>
          </q-btn>
        </q-toolbar>

        <q-table
          :rows="sortedBooks"
          :columns="bookColumns"
          row-key="id"
          :loading="booksLoading"
          :pagination="pagination"
          @row-click="onRowClick"
        >
          <!-- 自定义列渲染 -->
          <template v-slot:body-cell-sort_order="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-btn
                  round
                  dense
                  flat
                  size="sm"
                  icon="arrow_upward"
                  color="grey-7"
                  @click.stop="moveBookUp(props.row)"
                  :disable="props.rowIndex === 0"
                >
                  <q-tooltip>Move Up</q-tooltip>
                </q-btn>
                <q-input
                  v-model="props.row.sort_order"
                  type="number"
                  dense
                  outlined
                  style="width: 70px; margin: 0 5px;"
                  @update:model-value="updateSortOrder(props.row)"
                />
                <q-btn
                  round
                  dense
                  flat
                  size="sm"
                  icon="arrow_downward"
                  color="grey-7"
                  @click.stop="moveBookDown(props.row)"
                  :disable="props.rowIndex === sortedBooks.length - 1"
                >
                  <q-tooltip>Move Down</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-title="props">
            <q-td :props="props">
              <div class="text-weight-medium cursor-pointer" @click.stop="viewBook(props.row)">
                {{ props.row.title }}
              </div>
              <div v-if="props.row.subtitle" class="text-caption text-grey-7">
                {{ props.row.subtitle }}
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="q-gutter-xs">
                <q-btn
                  dense
                  outline
                  size="sm"
                  color="primary"
                  icon="visibility"
                  @click.stop="viewBook(props.row)"
                >
                  <q-tooltip>View Book</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  outline
                  size="sm"
                  color="red"
                  icon="remove"
                  @click.stop="removeBookFromList(props.row)"
                >
                  <q-tooltip>Remove from List</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <!-- 空数据提示 -->
          <template v-slot:no-data>
            <div class="full-width row flex-center q-gutter-sm q-pa-lg">
              <q-icon name="library_books" size="3em" color="grey-5" />
              <div class="text-center">
                <div class="text-h6 text-grey-6">No books in this list yet</div>
                <div class="text-caption text-grey-7 q-mt-sm">
                  Start by adding books to create your reading list
                </div>
                <q-btn
                  class="q-mt-md"
                  color="primary"
                  icon="add"
                  label="Add Books"
                  @click="showAddBookDialog = true"
                />
              </div>
            </div>
          </template>

          <!-- 底部统计信息 -->
          <template v-slot:bottom>
            <div class="full-width row justify-between items-center q-pa-sm">
              <div class="text-caption text-grey-7">
                {{ currentBooks.length }} book(s) in this list
              </div>
              <div class="text-caption text-grey-7">
                Click on a book title to view details
              </div>
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- 添加图书到书单对话框 -->
    <q-dialog v-model="showAddBookDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '800px', 'max-width': '80vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            Add Books to "{{ currentReadingList?.title }}"
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

        <q-card-section>
          <!-- 搜索和筛选 -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-8">
              <q-input
                v-model="bookSearch"
                dense
                outlined
                placeholder="Search books by title, subtitle, or description..."
                clearable
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="selectedLibraryClass"
                dense
                outlined
                :options="libraryClassOptions"
                label="Filter by Library Class"
                clearable
              />
            </div>
          </div>

          <!-- 可用图书列表 -->
          <div class="text-subtitle1 q-mb-sm">
            Available Books ({{ filteredAvailableBooks.length }})
          </div>

          <q-table
            :rows="filteredAvailableBooks"
            :columns="availableBookColumns"
            row-key="id"
            :filter="bookSearch"
            :pagination="availableBookPagination"
            selection="multiple"
            v-model:selected="selectedBooks"
          >
            <template v-slot:header-selection="scope">
              <q-checkbox v-model="scope.selected" />
            </template>

            <template v-slot:body-selection="scope">
              <q-checkbox :model-value="scope.selected" @update:model-value="scope.selected = $event" />
            </template>

            <template v-slot:body-cell-title="scope">
              <q-td :props="scope">
                <div class="text-weight-medium">{{ scope.row.title }}</div>
                <div v-if="scope.row.subtitle" class="text-caption text-grey-7">
                  {{ scope.row.subtitle }}
                </div>
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center q-gutter-sm q-pa-lg">
                <q-icon name="search_off" size="3em" color="grey-5" />
                <div class="text-center">
                  <div class="text-h6 text-grey-6">No books found</div>
                  <div class="text-caption text-grey-7 q-mt-sm">
                    Try adjusting your search or filters
                  </div>
                </div>
              </div>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            label="Cancel"
            color="grey-8"
            v-close-popup
          />
          <q-btn
            flat
            label="Add Selected Books"
            color="primary"
            @click="addSelectedBooks"
            :disabled="selectedBooks.length === 0"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 编辑书单对话框 -->
    <q-dialog v-model="showEditDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '50vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            Edit Reading List
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
                    v-model="editForm.title"
                    :rules="[val => !!val || 'List title is required']"
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
                    v-model="editForm.creator_id"
                    :options="users"
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    clearable
                  />
                </q-item-section>
              </q-item>

              <!-- 来源 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Source</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="editForm.source"
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
                    v-model="editForm.source_url"
                    type="url"
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="q-px-md q-pt-sm">
              <q-btn class="full-width" label="Save Changes" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 图书详情对话框 -->
    <q-dialog v-model="showBookDetailDialog" persistent>
      <q-card v-if="selectedBook" :style="$q.platform.is.desktop ? {'width': '700px', 'max-width': '80vw'} : {}">
        <q-card-section class="row items-center">
          <div class="text-h5 col">{{ selectedBook.title }}</div>
          <q-btn
            round
            flat
            dense
            icon="close"
            class="float-right"
            color="grey-8"
            v-close-popup
          ></q-btn>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none scroll" style="max-height: 60vh; overflow-y: auto;">
          <div class="row q-col-gutter-md">
            <div class="col-12" v-if="selectedBook.subtitle">
              <div class="text-subtitle1 text-grey-7">
                {{ selectedBook.subtitle }}
              </div>
            </div>

            <div class="col-12">
              <div class="text-weight-bold q-mb-xs">Description:</div>
              <div class="q-mt-xs" style="white-space: pre-line;">
                {{ selectedBook.description || 'No description available' }}
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="text-weight-bold q-mb-xs">Library Class Code:</div>
              <div class="q-mt-xs">
                <q-chip v-if="selectedBook.lib_class_code" color="secondary" text-color="white" dense>
                  {{ selectedBook.lib_class_code }}
                </q-chip>
                <span v-else>N/A</span>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="text-weight-bold q-mb-xs">Copyright:</div>
              <div class="q-mt-xs">{{ selectedBook.copyright || 'N/A' }}</div>
            </div>

            <div v-if="selectedBook.create_time" class="col-12 col-md-6">
              <div class="text-weight-bold q-mb-xs">Created:</div>
              <div class="q-mt-xs">
                <q-icon name="schedule" size="1em" class="q-mr-xs" />
                {{ formatDateTime(selectedBook.create_time) }}
              </div>
            </div>

            <div v-if="selectedBook.update_time" class="col-12 col-md-6">
              <div class="text-weight-bold q-mb-xs">Updated:</div>
              <div class="q-mt-xs">
                <q-icon name="update" size="1em" class="q-mr-xs" />
                {{ formatDateTime(selectedBook.update_time) }}
              </div>
            </div>

            <!-- 在书单中的信息 -->
            <div class="col-12" v-if="selectedBook.sort_order !== undefined">
              <div class="text-weight-bold q-mb-xs">In this list:</div>
              <div class="q-mt-xs">
                <q-chip color="teal" text-color="white" dense>
                  Sort Order: {{ selectedBook.sort_order }}
                </q-chip>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
          <q-btn
            flat
            label="Remove from List"
            color="red"
            @click="removeCurrentBookFromList"
            v-if="selectedBook.id"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';

// 接口定义
interface ReadingList {
  id?: number;
  title: string;
  creator_id?: number | null;
  source?: string;
  source_url?: string;
  create_time?: string;
  update_time?: string;
}

interface Book {
  id?: number;
  title: string;
  subtitle?: string;
  lib_class_code?: string;
  copyright?: string;
  description?: string;
  create_time?: string;
  update_time?: string;
  sort_order?: number;
}

interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

interface RelBookList {
  list_id: number;
  book_id: number;
  sort_order: number;
}

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

// 响应式状态
const loading = ref(true);
const booksLoading = ref(false);
const error = ref<string | null>(null);
const showAddBookDialog = ref(false);
const showEditDialog = ref(false);
const showBookDetailDialog = ref(false);
const bookSearch = ref('');
const selectedLibraryClass = ref<string | null>(null);
const sortAscending = ref(true);

// 分页设置
const pagination = ref({
  rowsPerPage: 10,
  page: 1,
});
const availableBookPagination = ref({
  rowsPerPage: 10,
  page: 1,
});

// 当前书单ID（从路由参数获取）
const listId = computed(() => {
  const id = route.params.id;
  if (Array.isArray(id)) {
    return parseInt(id[0] || '0');
  }
  return parseInt(id || '0');
});

// 模拟数据 - 用户
const users = ref<User[]>([
  { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
  { id: 2, name: 'John Smith', email: 'john@example.com', role: 'Editor' },
  { id: 3, name: 'Jane Doe', email: 'jane@example.com', role: 'Viewer' },
  { id: 4, name: 'Robert Johnson', email: 'robert@example.com', role: 'Editor' },
]);

// 模拟数据 - 图书
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
    lib_class_code: 'QA76.9',
    copyright: '© 2009 Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    description: 'A comprehensive textbook covering the modern algorithms used in computer science.',
    create_time: '2023-03-12T08:20:00Z',
    update_time: '2023-08-18T15:35:00Z'
  },
  {
    id: 5,
    title: 'Structure and Interpretation of Computer Programs',
    lib_class_code: 'QA76.6',
    copyright: '© 1996 Harold Abelson, Gerald Jay Sussman, Julie Sussman',
    description: 'A classic textbook that uses the Scheme programming language to teach fundamental concepts of computer programming.',
    create_time: '2023-02-28T11:55:00Z',
    update_time: '2023-08-05T09:40:00Z'
  },
  {
    id: 6,
    title: 'The Mythical Man-Month',
    subtitle: 'Essays on Software Engineering',
    lib_class_code: 'QA76.76',
    copyright: '© 1995 Frederick P. Brooks Jr.',
    description: 'A collection of essays on software engineering and project management.',
    create_time: '2023-04-10T13:25:00Z',
    update_time: '2023-09-22T17:50:00Z'
  },
  {
    id: 7,
    title: 'Code Complete',
    subtitle: 'A Practical Handbook of Software Construction',
    lib_class_code: 'QA76.76',
    copyright: '© 2004 Steve McConnell',
    description: 'A comprehensive guide to software construction and development.',
    create_time: '2023-03-28T10:15:00Z',
    update_time: '2023-09-05T14:30:00Z'
  },
  {
    id: 8,
    title: 'Refactoring',
    subtitle: 'Improving the Design of Existing Code',
    lib_class_code: 'QA76.76',
    copyright: '© 2018 Martin Fowler',
    description: 'A guide to refactoring techniques for improving code design.',
    create_time: '2023-05-15T11:40:00Z',
    update_time: '2023-10-10T13:55:00Z'
  },
]);

// 模拟数据 - 书单
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
]);

// 模拟数据 - 书单图书关联
const relBookLists = ref<RelBookList[]>([
  { list_id: 1, book_id: 4, sort_order: 1 },
  { list_id: 1, book_id: 5, sort_order: 2 },
  { list_id: 1, book_id: 1, sort_order: 3 },
  { list_id: 2, book_id: 2, sort_order: 1 },
  { list_id: 2, book_id: 3, sort_order: 2 },
  { list_id: 3, book_id: 6, sort_order: 1 },
  { list_id: 3, book_id: 7, sort_order: 2 },
  { list_id: 3, book_id: 8, sort_order: 3 },
]);

// 当前书单
const currentReadingList = ref<ReadingList | null>(null);

// 当前书单中的图书
const currentBooks = computed(() => {
  if (!currentReadingList.value?.id) return [];

  const bookIds = relBookLists.value
    .filter(rel => rel.list_id === currentReadingList.value!.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(rel => rel.book_id);

  return books.value
    .filter(book => bookIds.includes(book.id!))
    .map(book => {
      const rel = relBookLists.value.find(r =>
        r.list_id === currentReadingList.value!.id && r.book_id === book.id
      );
      return {
        ...book,
        sort_order: rel?.sort_order || 0
      };
    })
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
});

// 排序后的图书
const sortedBooks = computed(() => {
  return [...currentBooks.value].sort((a, b) => {
    if (sortAscending.value) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    } else {
      return (b.sort_order || 0) - (a.sort_order || 0);
    }
  });
});

// 可用的图书（不在当前书单中的图书）
const availableBooks = computed(() => {
  if (!currentReadingList.value?.id) return [];
  const currentBookIds = currentBooks.value.map(book => book.id);
  return books.value.filter(book => !currentBookIds.includes(book.id));
});

// 过滤后的可用图书
const filteredAvailableBooks = computed(() => {
  let filtered = availableBooks.value;

  if (bookSearch.value) {
    const searchLower = bookSearch.value.toLowerCase();
    filtered = filtered.filter(book =>
      book.title.toLowerCase().includes(searchLower) ||
      (book.subtitle && book.subtitle.toLowerCase().includes(searchLower)) ||
      (book.description && book.description.toLowerCase().includes(searchLower))
    );
  }

  if (selectedLibraryClass.value) {
    filtered = filtered.filter(book =>
      book.lib_class_code === selectedLibraryClass.value
    );
  }

  return filtered;
});

// 图书馆分类选项
const libraryClassOptions = computed(() => {
  const classes = new Set<string>();
  availableBooks.value.forEach(book => {
    if (book.lib_class_code) {
      classes.add(book.lib_class_code);
    }
  });
  return Array.from(classes).sort();
});

// 选中的图书（用于添加到书单）
const selectedBooks = ref<Book[]>([]);

// 当前选中的图书（用于查看详情）
const selectedBook = ref<Book | null>(null);

// 编辑表单
const editForm = ref<ReadingList>({
  title: '',
  creator_id: null,
  source: '',
  source_url: '',
});

// 表格列定义
const bookColumns = [
  {
    name: 'title',
    label: 'Book Title',
    field: 'title',
    align: 'left',
    sortable: true,
  },
  {
    name: 'lib_class_code',
    label: 'Class Code',
    field: 'lib_class_code',
    align: 'center',
    sortable: true,
    style: 'width: 120px;'
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'right',
    style: 'width: 150px;'
  },
  {
    name: 'sort_order',
    label: 'Order',
    field: 'sort_order',
    align: 'center',
    sortable: true,
    style: 'width: 180px;'
  }
];

const availableBookColumns = [
  {
    name: 'title',
    label: 'Book Title',
    field: 'title',
    align: 'left',
    sortable: true,
  },
  {
    name: 'subtitle',
    label: 'Subtitle',
    field: 'subtitle',
    align: 'left',
    sortable: true,
  },
  {
    name: 'lib_class_code',
    label: 'Class Code',
    field: 'lib_class_code',
    align: 'center',
    sortable: true,
    style: 'width: 120px;'
  }
];

// 辅助函数

/**
 * 确保URL有正确的协议
 */
const ensureUrlProtocol = (url: string): string => {
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
};

/**
 * 根据用户ID获取用户名
 */
const getUserName = (userId: number): string => {
  const user = users.value.find(u => u.id === userId);
  return user ? user.name : 'Unknown User';
};

/**
 * 格式化日期显示
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * 格式化日期时间显示
 */
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

/**
 * 加载书单数据
 */
const loadReadingList = () => {
  if (!listId.value || listId.value === 0) {
    error.value = 'Invalid reading list ID';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  // 模拟API调用延迟
  setTimeout(() => {
    try {
      const list = readingLists.value.find(rl => rl.id === listId.value);

      if (!list) {
        error.value = `Reading list with ID ${listId.value} not found`;
        currentReadingList.value = null;
      } else {
        currentReadingList.value = { ...list };
        editForm.value = { ...list };
      }
    } catch (err) {
      error.value = 'Failed to load reading list';
      console.error('Error loading reading list:', err);
    } finally {
      loading.value = false;
    }
  }, 500);
};

/**
 * 加载图书数据
 */
const loadBooks = () => {
  booksLoading.value = true;

  // 模拟API调用
  setTimeout(() => {
    booksLoading.value = false;
  }, 300);
};

/**
 * 刷新书单中的图书列表
 */
const refreshBookList = () => {
  loadBooks();
  $q.notify({
    type: 'info',
    message: 'Book list refreshed',
    timeout: 1000
  });
};

/**
 * 更新图书排序
 */
const updateSortOrder = (book: Book) => {
  if (!currentReadingList.value?.id || !book.id) return;

  const index = relBookLists.value.findIndex(
    rel => rel.list_id === currentReadingList.value!.id && rel.book_id === book.id
  );

  if (index !== -1) {
    relBookLists.value[index].sort_order = book.sort_order || 0;

    $q.notify({
      type: 'positive',
      message: 'Sort order updated',
      timeout: 1000
    });
  }
};

/**
 * 将图书向上移动
 */
const moveBookUp = (book: Book) => {
  if (!currentReadingList.value?.id || !book.id) return;

  const currentRel = relBookLists.value.find(
    rel => rel.list_id === currentReadingList.value!.id && rel.book_id === book.id
  );

  if (!currentRel) return;

  const prevRel = relBookLists.value
    .filter(rel => rel.list_id === currentReadingList.value!.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .find(rel => rel.sort_order < currentRel.sort_order);

  if (prevRel) {
    // 交换排序序号
    const tempOrder = currentRel.sort_order;
    currentRel.sort_order = prevRel.sort_order;
    prevRel.sort_order = tempOrder;

    // 刷新显示
    refreshBookList();

    $q.notify({
      type: 'positive',
      message: 'Book moved up',
      timeout: 1000
    });
  }
};

/**
 * 将图书向下移动
 */
const moveBookDown = (book: Book) => {
  if (!currentReadingList.value?.id || !book.id) return;

  const currentRel = relBookLists.value.find(
    rel => rel.list_id === currentReadingList.value!.id && rel.book_id === book.id
  );

  if (!currentRel) return;

  const nextRel = relBookLists.value
    .filter(rel => rel.list_id === currentReadingList.value!.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .find(rel => rel.sort_order > currentRel.sort_order);

  if (nextRel) {
    // 交换排序序号
    const tempOrder = currentRel.sort_order;
    currentRel.sort_order = nextRel.sort_order;
    nextRel.sort_order = tempOrder;

    // 刷新显示
    refreshBookList();

    $q.notify({
      type: 'positive',
      message: 'Book moved down',
      timeout: 1000
    });
  }
};

/**
 * 切换排序顺序
 */
const toggleSortOrder = () => {
  sortAscending.value = !sortAscending.value;
  $q.notify({
    type: 'info',
    message: `Sorted ${sortAscending.value ? 'ascending' : 'descending'}`,
    timeout: 1000
  });
};

/**
 * 查看图书详情
 */
const viewBook = (book: Book) => {
  selectedBook.value = book;
  showBookDetailDialog.value = true;
};

/**
 * 从书单中移除图书
 */
const removeBookFromList = (book: Book) => {
  if (!currentReadingList.value?.id || !book.id) return;

  $q.dialog({
    title: 'Remove Book',
    message: `Are you sure you want to remove "${book.title}" from this reading list?`,
    ok: {
      label: 'Remove',
      color: 'red'
    },
    cancel: {
      label: 'Cancel',
      color: 'grey-8',
      flat: true
    },
    persistent: true
  }).onOk(() => {
    const index = relBookLists.value.findIndex(
      rel => rel.list_id === currentReadingList.value!.id && rel.book_id === book.id
    );

    if (index !== -1) {
      relBookLists.value.splice(index, 1);

      // 重新排序剩余图书
      const remainingRels = relBookLists.value
        .filter(rel => rel.list_id === currentReadingList.value!.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      // 重新分配排序序号
      remainingRels.forEach((rel, idx) => {
        rel.sort_order = idx + 1;
      });

      $q.notify({
        type: 'positive',
        message: 'Book removed from list',
        timeout: 2000
      });
    }
  });
};

/**
 * 从书单中移除当前查看的图书
 */
const removeCurrentBookFromList = () => {
  if (selectedBook.value) {
    removeBookFromList(selectedBook.value);
    showBookDetailDialog.value = false;
    selectedBook.value = null;
  }
};

/**
 * 添加选中的图书到书单
 */
const addSelectedBooks = () => {
  if (!currentReadingList.value?.id) return;

  let nextSortOrder = currentBooks.value.length > 0
    ? Math.max(...currentBooks.value.map(b => b.sort_order || 0)) + 1
    : 1;

  const addedCount = selectedBooks.value.length;

  selectedBooks.value.forEach(book => {
    if (book.id) {
      relBookLists.value.push({
        list_id: currentReadingList.value!.id!,
        book_id: book.id,
        sort_order: nextSortOrder++
      });
    }
  });

  selectedBooks.value = [];
  showAddBookDialog.value = false;

  $q.notify({
    type: 'positive',
    message: `${addedCount} book(s) added to the list`,
    timeout: 2000
  });
};

/**
 * 打开编辑书单对话框
 */
const editReadingList = () => {
  if (currentReadingList.value) {
    editForm.value = { ...currentReadingList.value };
    showEditDialog.value = true;
  }
};

/**
 * 保存书单编辑
 */
const saveReadingList = () => {
  if (!editForm.value.title) {
    $q.notify({
      type: 'negative',
      message: 'Reading list title is required'
    });
    return;
  }

  if (!currentReadingList.value) return;

  // 在实际应用中，这里应该调用API更新书单
  // 更新书单信息
  const now = new Date().toISOString();
  currentReadingList.value = {
    ...editForm.value,
    update_time: now
  };

  // 更新模拟数据
  const index = readingLists.value.findIndex(rl => rl.id === listId.value);
  if (index !== -1) {
    readingLists.value[index] = { ...currentReadingList.value };
  }

  showEditDialog.value = false;

  $q.notify({
    type: 'positive',
    message: 'Reading list updated successfully',
    timeout: 2000
  });
};

/**
 * 删除书单
 */
const deleteReadingList = () => {
  if (!currentReadingList.value) return;

  $q.dialog({
    title: 'Delete Reading List',
    message: `Are you sure you want to delete "${currentReadingList.value.title}"? This action cannot be undone and all books will be removed from this list.`,
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
    // 在实际应用中，这里应该调用API删除书单

    // 从模拟数据中删除书单
    const listIndex = readingLists.value.findIndex(rl => rl.id === listId.value);
    if (listIndex !== -1) {
      readingLists.value.splice(listIndex, 1);
    }

    // 删除关联关系
    const relIndex = relBookLists.value.findIndex(rel => rel.list_id === listId.value);
    if (relIndex !== -1) {
      relBookLists.value = relBookLists.value.filter(rel => rel.list_id !== listId.value);
    }

    // 导航回书单列表页面
    router.push('/file/book/reading');

    $q.notify({
      type: 'positive',
      message: 'Reading list deleted successfully',
      timeout: 3000
    });
  });
};

/**
 * 返回书单列表页面
 */
const goBackToList = () => {
  router.push('/file/book/reading');
};

/**
 * 行点击事件
 */
const onRowClick = (evt: any, row: Book) => {
  viewBook(row);
};

// 监听路由参数变化
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadReadingList();
      loadBooks();
    }
  }
);

// 组件挂载时加载数据
onMounted(() => {
  loadReadingList();
  loadBooks();
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

/* 表格行悬停效果 */
.q-table tbody tr:hover {
  cursor: pointer;
  background-color: rgba(25, 118, 210, 0.04);
}

/* 可点击文本样式 */
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  text-decoration: underline;
  color: #1976D2;
}

/* 卡片阴影效果 */
.q-card {
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}
</style>
