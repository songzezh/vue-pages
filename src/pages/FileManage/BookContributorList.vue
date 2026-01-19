<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table
        title="Manage Creators"
        :rows="personages"
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
          <!-- 添加新创作者按钮 -->
          <q-btn
            @click="addPersonage()"
            flat
            size="lg"
            color="primary"
            icon="add_circle"
            class="q-mr-xs q-pa-none"
          >
            <q-tooltip>Add New Creator</q-tooltip>
          </q-btn>

          <!-- 刷新按钮 -->
          <q-btn
            @click="loadPersonages"
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
            placeholder="Search creators..."
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

        <!-- 姓名列 -->
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center">
              <q-avatar size="40px" class="q-mr-sm">
                <img
                  v-if="props.row.avatar_url"
                  :src="props.row.avatar_url"
                  :alt="props.row.name"
                />
                <q-icon
                  v-else
                  name="person"
                  size="30px"
                  color="grey-6"
                />
              </q-avatar>
              <div>
                <div class="text-weight-medium cursor-pointer" @click="viewPersonage(props.row)">
                  {{ props.row.name }}
                </div>
                <div v-if="props.row.affiliation" class="text-caption text-grey-7">
                  {{ props.row.affiliation }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- 性别列 -->
        <template v-slot:body-cell-gender="props">
          <q-td :props="props">
            <q-icon
              v-if="props.row.gender"
              :name="props.row.gender === 'F' ? 'female_icon' : 'male_icon'"
              :color="getGenderColor(props.row.gender)"
            />
            <span v-else class="text-grey-6">Unknown</span>
          </q-td>
        </template>

        <!-- 国籍列 -->
        <template v-slot:body-cell-nationality="props">
          <q-td :props="props">
            <q-chip
              v-if="props.row.nationality"
              color="blue-grey"
              text-color="white"
              dense
              class="q-px-md"
              square
            >
              {{ props.row.nationality }}
            </q-chip>
            <span v-else class="text-grey-6">N/A</span>
          </q-td>
        </template>

        <!-- 模块列 -->
        <template v-slot:body-cell-module="props">
          <q-td :props="props">
            <q-chip
              v-if="props.row.module"
              color="teal"
              text-color="white"
              dense
              class="q-px-md"
              square
            >
              {{ props.row.module }}
            </q-chip>
            <span v-else class="text-grey-6">N/A</span>
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
                @click="viewPersonage(props.row)"
              >
                <q-tooltip>View Details</q-tooltip>
              </q-btn>

              <!-- 个人主页按钮 -->
              <q-btn
                v-if="props.row.homepage"
                dense
                outline
                size="sm"
                color="green"
                icon="language"
                @click="openHomepage(props.row.homepage)"
              >
                <q-tooltip>Visit Homepage</q-tooltip>
              </q-btn>

              <!-- 编辑按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="edit"
                @click="editPersonage(props.row)"
              >
                <q-tooltip>Edit Creator</q-tooltip>
              </q-btn>

              <!-- 删除按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="red"
                icon="delete"
                @click="deletePersonage(props.row)"
              >
                <q-tooltip>Delete Creator</q-tooltip>
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
              <q-card-section>
                <q-list dense>
                  <q-item clickable @click="viewPersonage(props.row)">
                    <q-item-section avatar>
                      <q-avatar>
                        <img
                          v-if="props.row.avatar_url"
                          :src="props.row.avatar_url"
                          :alt="props.row.name"
                        />
                        <q-icon
                          v-else
                          name="person"
                          size="40px"
                          color="grey-6"
                        />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        {{ props.row.name }}
                      </q-item-label>
                      <q-item-label
                        v-if="props.row.affiliation"
                        caption
                        lines="2">
                        {{ props.row.affiliation }}'
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-icon
                        v-if="props.row.gender"
                        :name="props.row.gender === 'F' ? 'female_icon' : 'male_icon'"
                        :color="getGenderColor(props.row.gender)"
                      />
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-label>
                      <q-chip
                        v-if="props.row.nationality"
                        color="blue-grey"
                        text-color="white"
                        dense
                        size="sm"
                        class="q-ml-xs"
                      >
                        {{ props.row.nationality }}
                      </q-chip>
                      <q-chip
                        v-if="props.row.module"
                        color="teal"
                        text-color="white"
                        dense
                        size="sm"
                        class="q-ml-xs"
                      >
                        {{ props.row.module }}
                      </q-chip>
                    </q-item-label>
                  </q-item>
                </q-list>
              </q-card-section>

              <q-separator />

              <!-- 卡片内容区域 -->
              <q-card-section class="q-pt-none">
                <div class="text-caption text-grey-8">
                  <!-- 作品统计 -->
                  <div class="q-mb-xs">
                    <strong>Contributions:</strong>
                    <div class="q-ml-sm">
                      <span v-if="getBookCountByRole(props.row.id, 'AUTHOR') > 0">
                        <q-chip size="xs" color="primary" text-color="white">
                          {{ getBookCountByRole(props.row.id, 'AUTHOR') }} Author
                        </q-chip>
                      </span>
                      <span v-if="getBookCountByRole(props.row.id, 'TRANSLATOR') > 0" class="q-ml-xs">
                        <q-chip size="xs" color="secondary" text-color="white">
                          {{ getBookCountByRole(props.row.id, 'TRANSLATOR') }} Translator
                        </q-chip>
                      </span>
                      <span v-if="getBookCountByRole(props.row.id, 'EDITOR') > 0" class="q-ml-xs">
                        <q-chip size="xs" color="positive" text-color="white">
                          {{ getBookCountByRole(props.row.id, 'EDITOR') }} Editor
                        </q-chip>
                      </span>
                    </div>
                  </div>

                  <!-- 个人主页 -->
                  <div v-if="props.row.homepage">
                    <strong>Homepage:</strong>
                    <a
                      :href="props.row.homepage"
                      target="_blank"
                      class="text-primary"
                      @click.stop
                    >
                      {{ formatUrl(props.row.homepage) }}
                    </a>
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
                  @click="viewPersonage(props.row)"
                >
                  <q-tooltip>View Details</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.homepage"
                  flat
                  dense
                  size="sm"
                  color="green"
                  icon="language"
                  @click="openHomepage(props.row.homepage)"
                >
                  <q-tooltip>Visit Homepage</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="edit"
                  @click="editPersonage(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="red"
                  icon="delete"
                  @click="deletePersonage(props.row)"
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
            <q-icon name="people" size="2em" />
            <span>No creators found.</span>
            <q-btn
              flat
              color="primary"
              label="Add First Creator"
              @click="addPersonage"
            />
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- 添加/编辑创作者对话框 -->
    <q-dialog v-model="showPersonageDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '50vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ isEditing ? 'Edit Creator' : 'Add Creator' }}
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
          <q-form class="q-gutter-md" @submit="savePersonage">
            <q-list>
              <!-- 姓名（必填） -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Name *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPersonage.name"
                    :rules="[val => !!val || 'Name is required']"
                    placeholder="e.g., John Doe"
                  />
                </q-item-section>
              </q-item>

              <!-- 头像URL -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Avatar URL</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPersonage.avatar_url"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <div class="text-caption text-grey q-mt-xs">
                    Preview:
                    <q-avatar size="60px" class="q-ml-sm">
                      <img
                        v-if="currentPersonage.avatar_url"
                        :src="currentPersonage.avatar_url"
                        :alt="currentPersonage.name"
                      />
                      <q-icon
                        v-else
                        name="person"
                        size="40px"
                        color="grey-6"
                      />
                    </q-avatar>
                  </div>
                </q-item-section>
              </q-item>

              <!-- 性别选择 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Gender</q-item-label>
                  <q-select
                    dense
                    outlined
                    v-model="currentPersonage.gender"
                    :options="genderOptions"
                    map-options
                    emit-value
                    clearable
                    placeholder="Select gender"
                  />
                </q-item-section>
              </q-item>

              <!-- 国籍 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Nationality</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPersonage.nationality"
                    placeholder="e.g., American"
                  />
                </q-item-section>
              </q-item>

              <!-- 所属机构 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Affiliation</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPersonage.affiliation"
                    placeholder="e.g., Harvard University"
                  />
                </q-item-section>
              </q-item>

              <!-- 个人主页 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Homepage</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPersonage.homepage"
                    type="url"
                    placeholder="https://example.com"
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
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

// 接口定义
interface Personage {
  id?: number;                    // 人物ID
  name: string;                   // 姓名
  avatar_url?: string;           // 头像URL
  gender?: string | null;        // 性别: M, F, null或其他
  nationality?: string;          // 国籍
  affiliation?: string;          // 所属机构
  homepage?: string;             // 个人主页
  module?: string;               // 添加此人物信息的模块
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
}

interface RelBookContributor {
  book_id: number;
  person_id: number;
  role_type: 'AUTHOR' | 'TRANSLATOR' | 'EDITOR';
}

const $q = useQuasar();
const router = useRouter();

// 响应式状态管理
const viewToggle = ref(false);
const filter = ref('');
const mode = ref<'list' | 'grid'>('list');
const loading = ref(false);
const pagination = ref({
  rowsPerPage: 20,
});

// 性别选项
const genderOptions = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Other/Unknown', value: 'O' }
];

// 模拟数据 - 创作者（人物）
const personages = ref<Personage[]>([
  {
    id: 1,
    name: 'Robert C. Martin',
    avatar_url: 'https://via.placeholder.com/150/007bff/ffffff?text=RC',
    gender: 'M',
    nationality: 'American',
    affiliation: 'Uncle Bob Consulting',
    homepage: 'https://cleancoder.com',
    module: 'Book'
  },
  {
    id: 2,
    name: 'Martin Fowler',
    avatar_url: 'https://via.placeholder.com/150/28a745/ffffff?text=MF',
    gender: 'M',
    nationality: 'British',
    affiliation: 'ThoughtWorks',
    homepage: 'https://martinfowler.com',
    module: 'Book'
  },
  {
    id: 3,
    name: 'Erich Gamma',
    avatar_url: 'https://via.placeholder.com/150/ffc107/000000?text=EG',
    gender: 'M',
    nationality: 'Swiss',
    affiliation: 'Microsoft',
    homepage: null,
    module: 'Book'
  },
  {
    id: 4,
    name: 'Richard Helm',
    avatar_url: null,
    gender: 'M',
    nationality: 'Australian',
    affiliation: 'IBM',
    homepage: null,
    module: 'Book'
  },
  {
    id: 5,
    name: 'Ralph Johnson',
    avatar_url: 'https://via.placeholder.com/150/17a2b8/ffffff?text=RJ',
    gender: 'M',
    nationality: 'American',
    affiliation: 'University of Illinois',
    homepage: 'https://cs.illinois.edu',
    module: 'Book'
  },
  {
    id: 6,
    name: 'John Vlissides',
    avatar_url: null,
    gender: 'M',
    nationality: 'American',
    affiliation: 'IBM',
    homepage: null,
    module: 'Book'
  },
  {
    id: 7,
    name: 'Mary Poppendieck',
    avatar_url: 'https://via.placeholder.com/150/e83e8c/ffffff?text=MP',
    gender: 'F',
    nationality: 'American',
    affiliation: 'Poppendieck LLC',
    homepage: 'http://www.poppendieck.com',
    module: 'Book'
  },
  {
    id: 8,
    name: 'Tom DeMarco',
    avatar_url: 'https://via.placeholder.com/150/6f42c1/ffffff?text=TD',
    gender: 'M',
    nationality: 'American',
    affiliation: 'Atlantic Systems Guild',
    homepage: null,
    module: 'Book'
  },
  {
    id: 9,
    name: 'Timothy Lister',
    avatar_url: null,
    gender: 'M',
    nationality: 'American',
    affiliation: 'Atlantic Systems Guild',
    homepage: null,
    module: 'Book'
  },
  {
    id: 10,
    name: 'Jane Smith',
    avatar_url: 'https://via.placeholder.com/150/20c997/ffffff?text=JS',
    gender: 'F',
    nationality: 'Canadian',
    affiliation: 'University of Toronto',
    homepage: 'https://utoronto.ca',
    module: 'Research'
  },
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
    title: 'Refactoring',
    subtitle: 'Improving the Design of Existing Code',
    lib_class_code: 'QA76.76',
    copyright: '© 2018 Martin Fowler',
    description: 'A guide to refactoring techniques for improving code design.',
    create_time: '2023-05-15T11:40:00Z',
    update_time: '2023-10-10T13:55:00Z'
  },
  {
    id: 5,
    title: 'Peopleware',
    subtitle: 'Productive Projects and Teams',
    lib_class_code: 'HD66',
    copyright: '© 2013 Tom DeMarco, Timothy Lister',
    description: 'A book about project management and organizational behavior in software development.',
    create_time: '2023-04-12T08:20:00Z',
    update_time: '2023-09-18T15:35:00Z'
  },
]);

// 模拟数据 - 图书贡献者关联
const relBookContributors = ref<RelBookContributor[]>([
  { book_id: 1, person_id: 1, role_type: 'AUTHOR' },
  { book_id: 2, person_id: 1, role_type: 'AUTHOR' },
  { book_id: 3, person_id: 3, role_type: 'AUTHOR' },
  { book_id: 3, person_id: 4, role_type: 'AUTHOR' },
  { book_id: 3, person_id: 5, role_type: 'AUTHOR' },
  { book_id: 3, person_id: 6, role_type: 'AUTHOR' },
  { book_id: 4, person_id: 2, role_type: 'AUTHOR' },
  { book_id: 5, person_id: 8, role_type: 'AUTHOR' },
  { book_id: 5, person_id: 9, role_type: 'AUTHOR' },
  { book_id: 1, person_id: 10, role_type: 'TRANSLATOR' },
  { book_id: 2, person_id: 7, role_type: 'EDITOR' },
]);

// 表格列定义
const columns = ref([
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left',
    field: 'name',
    sortable: true,
  },
  {
    name: 'gender',
    align: 'center',
    label: 'Gender',
    field: 'gender',
    sortable: true,
  },
  {
    name: 'nationality',
    align: 'center',
    label: 'Nationality',
    field: 'nationality',
    sortable: true,
  },
  {
    name: 'affiliation',
    align: 'left',
    label: 'Affiliation',
    field: 'affiliation',
    sortable: true,
  },
  {
    name: 'contributions',
    align: 'center',
    label: 'Contributions',
    field: 'id',
    sortable: false,
    format: (val: number) => getTotalBookCount(val),
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
const showPersonageDialog = ref(false);
const isEditing = ref(false);
const currentPersonage = ref<Personage>({
  name: '',
  avatar_url: '',
  gender: null,
  nationality: '',
  affiliation: '',
  homepage: '',
  module: '',
});

// 辅助函数

/**
 * 获取性别显示标签
 */
const getGenderLabel = (gender: string | null | undefined): string => {
  if (!gender) return 'Unknown';
  switch (gender.toUpperCase()) {
    case 'M': return 'F';
    case 'F': return 'Female';
    default: return 'Other';
  }
};

/**
 * 获取性别对应的颜色
 */
const getGenderColor = (gender: string | null | undefined): string => {
  if (!gender) return 'grey';
  switch (gender.toUpperCase()) {
    case 'M': return 'blue';
    case 'F': return 'pink';
    default: return 'teal';
  }
};

/**
 * 格式化URL显示（移除协议部分）
 */
const formatUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

/**
 * 获取创作者参与的作品总数
 */
const getTotalBookCount = (personId: number): number => {
  return relBookContributors.value.filter(rel => rel.person_id === personId).length;
};

/**
 * 获取创作者按角色分类的作品数量
 */
const getBookCountByRole = (personId: number, roleType: 'AUTHOR' | 'TRANSLATOR' | 'EDITOR'): number => {
  return relBookContributors.value.filter(rel =>
    rel.person_id === personId && rel.role_type === roleType
  ).length;
};

/**
 * 获取创作者参与的作品列表
 */
const getBooksByPerson = (personId: number): Array<{book: Book, role: string}> => {
  const contributions = relBookContributors.value.filter(rel => rel.person_id === personId);

  return contributions.map(rel => {
    const book = books.value.find(b => b.id === rel.book_id);
    return {
      book: book!,
      role: rel.role_type
    };
  }).filter(item => item.book);
};

/**
 * 按角色分组获取创作者的作品
 */
const getBooksGroupedByRole = (personId: number) => {
  const contributions = relBookContributors.value.filter(rel => rel.person_id === personId);

  const grouped = {
    AUTHOR: [] as Book[],
    TRANSLATOR: [] as Book[],
    EDITOR: [] as Book[]
  };

  contributions.forEach(rel => {
    const book = books.value.find(b => b.id === rel.book_id);
    if (book) {
      grouped[rel.role_type].push(book);
    }
  });

  return grouped;
};

/**
 * 加载创作者数据
 */
const loadPersonages = () => {
  loading.value = true;

  // 模拟API延迟
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

/**
 * 打开个人主页
 */
const openHomepage = (url: string) => {
  if (url) {
    window.open(url, '_blank');
  }
};

// 主要方法

/**
 * 打开添加创作者对话框
 */
const addPersonage = () => {
  currentPersonage.value = {
    name: '',
    avatar_url: '',
    gender: null,
    nationality: '',
    affiliation: '',
    homepage: '',
    module: '',
  };
  isEditing.value = false;
  showPersonageDialog.value = true;
};

/**
 * 打开编辑创作者对话框
 */
const editPersonage = (personage: Personage) => {
  currentPersonage.value = { ...personage };
  isEditing.value = true;
  showPersonageDialog.value = true;
};

/**
 * 查看创作者详情
 */
const viewPersonage = (personage: Personage) => {
  console.log(personage)
  // 导航到创作者详情页面
  // router.push(`/personages/${personage.id}`);
  $q.dialog({
    title: "Mock",
    message: `Mock for route to personage detail".`,
    ok: {
      label: 'OK',
      color: 'primary'
    }
  });
};

/**
 * 保存创作者信息（添加或更新）
 */
const savePersonage = () => {
  // 验证必填字段
  if (!currentPersonage.value.name) {
    $q.notify({
      color: 'negative',
      message: 'Name is required'
    });
    return;
  }

  if (isEditing.value) {
    // 更新现有创作者
    const index = personages.value.findIndex(p => p.id === currentPersonage.value.id);
    if (index !== -1) {
      personages.value[index] = { ...currentPersonage.value };
    }
    $q.notify({
      color: 'positive',
      message: 'Creator updated successfully'
    });
  } else {
    // 添加新创作者
    const newId = personages.value.length > 0
      ? Math.max(...personages.value.map(p => p.id || 0)) + 1
      : 1;
    currentPersonage.value.id = newId;
    personages.value.push({ ...currentPersonage.value });
    $q.notify({
      color: 'positive',
      message: 'Creator added successfully'
    });
  }

  showPersonageDialog.value = false;
};

/**
 * 删除创作者（带确认对话框）
 */
const deletePersonage = (personageItem: Personage) => {
  // 检查是否有关联的图书
  const hasContributions = relBookContributors.value.some(rel => rel.person_id === personageItem.id);

  if (hasContributions) {
    $q.dialog({
      title: 'Cannot Delete Creator',
      message: `This creator has contributions to books. All associated contributions will be removed. Do you want to proceed?`,
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
      // 删除创作者和关联关系
      personages.value = personages.value.filter(p => p.id !== personageItem.id);
      relBookContributors.value = relBookContributors.value.filter(rel => rel.person_id !== personageItem.id);

      $q.notify({
        color: 'positive',
        message: 'Creator deleted successfully'
      });
    });
  } else {
    $q.dialog({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${personageItem.name}"?`,
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
      personages.value = personages.value.filter(p => p.id !== personageItem.id);

      $q.notify({
        color: 'positive',
        message: 'Creator deleted successfully'
      });
    });
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadPersonages();
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

/* 头像样式 */
.q-avatar img {
  object-fit: cover;
}
</style>
