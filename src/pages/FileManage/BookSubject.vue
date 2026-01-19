<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table
        title="Manage Subjects"
        :rows="subjects"
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
          <!-- 添加顶级学科按钮 -->
          <q-btn
            @click="addSubject()"
            flat
            size="lg"
            color="primary"
            icon="add_circle"
            class="q-mr-xs q-pa-none"
          >
            <q-tooltip>Add Top Level Subject</q-tooltip>
          </q-btn>

          <!-- 刷新按钮 -->
          <q-btn
            @click="loadSubjects"
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
            placeholder="Search subjects..."
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

        <!-- 学科名称列：显示层级缩进 -->
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center">
              <!-- 缩进根据层级级别 -->
              <div
                v-for="n in props.row.level - 1"
                :key="n"
                class="q-mr-sm"
                style="display: inline-block; width: 20px; border-left: 1px dashed #ccc; height: 20px;"
              ></div>

              <!-- 学科英文名 -->
              <div class="text-weight-medium">{{ props.row.name }}</div>

              <!-- 学科中文名（如果有） -->
              <div v-if="props.row.name_cn" class="text-grey-7 q-ml-sm">
                ({{ props.row.name_cn }})
              </div>
            </div>
          </q-td>
        </template>

        <!-- 学科级别列：显示为标签 -->
        <template v-slot:body-cell-level="props">
          <q-td :props="props">
            <q-chip
              :color="getLevelColor(props.row.level)"
              text-color="white"
              dense
              class="q-px-md"
              square
            >
              Level {{ props.row.level }}
            </q-chip>
          </q-td>
        </template>

        <!-- 上级学科列：显示上级学科名称 -->
        <template v-slot:body-cell-superior="props">
          <q-td :props="props">
            <span v-if="props.row.superior_id">
              {{ getSubjectName(props.row.superior_id) }}
            </span>
            <span v-else class="text-grey-6">Top Level</span>
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
                @click="viewSubject(props.row)"
              >
                <q-tooltip>Show Details</q-tooltip>
              </q-btn>

              <!-- 添加子学科按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="green"
                icon="add"
                @click="addChildSubject(props.row)"
              >
                <q-tooltip>Add Child Subject</q-tooltip>
              </q-btn>

              <!-- 编辑按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="edit"
                @click="editSubject(props.row)"
              >
                <q-tooltip>Edit Subject</q-tooltip>
              </q-btn>

              <!-- 删除按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="red"
                icon="delete"
                @click="deleteSubject(props.row)"
              >
                <q-tooltip>Delete Subject</q-tooltip>
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
                <div class="text-h6">{{ props.row.name }}</div>
                <div v-if="props.row.name_cn" class="text-subtitle2 text-grey">
                  {{ props.row.name_cn }}
                </div>
              </q-card-section>

              <q-separator />

              <!-- 卡片内容区域 -->
              <q-card-section class="q-pt-none">
                <div class="text-caption text-grey-8">
                  <!-- 上级学科信息 -->
                  <div v-if="props.row.superior_id">
                    <strong>Parent:</strong> {{ getSubjectName(props.row.superior_id) }}
                  </div>
                  <!-- 别名信息 -->
                  <div v-if="props.row.aliases">
                    <strong>Aliases:</strong> {{ truncateText(props.row.aliases, 40) }}
                  </div>
                  <!-- 创建时间 -->
                  <div v-if="props.row.create_time">
                    <strong>Created:</strong> {{ formatDate(props.row.create_time) }}
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
                  @click="viewSubject(props.row)"
                >
                  <q-tooltip>Show Details</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="green"
                  icon="add"
                  @click="addChildSubject(props.row)"
                >
                  <q-tooltip>Add Child</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="edit"
                  @click="editSubject(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="red"
                  icon="delete"
                  @click="deleteSubject(props.row)"
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
            <q-icon name="folder_off" size="2em" />
            <span>No subjects found.</span>
            <q-btn
              flat
              color="primary"
              label="Add First Subject"
              @click="addSubject"
            />
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- 添加/编辑学科对话框 -->
    <q-dialog v-model="showSubjectDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '50vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ isEditing ? 'Edit Subject' : 'Add Subject' }}
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
          <q-form class="q-gutter-md" @submit="saveSubject">
            <q-list>
              <!-- 学科英文名（必填） -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">English Name *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSubject.name"
                    :rules="[val => !!val || 'English name is required']"
                    placeholder="e.g., Computer Science"
                  />
                </q-item-section>
              </q-item>

              <!-- 学科中文名 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Chinese Name</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSubject.name_cn"
                    placeholder="e.g., 计算机科学"
                  />
                </q-item-section>
              </q-item>

              <!-- 上级学科选择 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Parent Subject</q-item-label>
                  <q-select
                    dense
                    outlined
                    v-model="currentSubject.superior_id"
                    :options="availableParents"
                    option-label="displayName"
                    option-value="id"
                    emit-value
                    map-options
                    clearable
                    :disable="!!isAddingChild"
                    placeholder="Select parent subject (optional)"
                  >
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>{{ scope.opt.displayName }}</q-item-label>
                          <q-item-label caption>
                            Level {{ scope.opt.level }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                  <q-banner v-if="isAddingChild" dense class="bg-blue-1 q-mt-sm">
                    Adding child subject for: {{ parentSubjectName }}
                  </q-banner>
                </q-item-section>
              </q-item>

              <!-- 别名 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Aliases</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSubject.aliases"
                    placeholder="e.g., CS, CompSci"
                  />
                </q-item-section>
              </q-item>

              <!-- 级别 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Level</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSubject.level"
                    type="number"
                    min="1"
                    max="10"
                    :rules="[
                      val => val >= 1 && val <= 10 || 'Level must be between 1 and 10'
                    ]"
                  />
                  <div class="text-caption text-grey q-mt-xs">
                    Level will be auto-calculated based on parent selection
                  </div>
                </q-item-section>
              </q-item>

              <!-- 简介 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Introduction</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSubject.intro"
                    type="textarea"
                    autogrow
                    placeholder="Subject introduction..."
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

    <!-- 查看学科详情对话框 -->
    <q-dialog v-model="showViewDialog">
      <q-card class="q-pa-md" :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '60vw'} : {'width': '100%'}">
        <div class="row full-width">
          <!-- 右侧详情信息区域 -->
          <div class="q-ml-md q-gutter-md">
            <div class="row">
              <span class="text-weight-bold">English Name:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentSubject.name }}</span>
            </div>
            <div v-if="currentSubject.name_cn" class="row">
              <span class="text-weight-bold">Chinese Name:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentSubject.name_cn }}</span>
            </div>
            <div v-if="currentSubject.aliases" class="row">
              <span class="text-weight-bold">Aliases:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentSubject.aliases }}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">Level:</span>
              <span class="text-grey-8 q-ml-sm">
                <q-chip :color="getLevelColor(currentSubject.level)" text-color="white" dense size="sm">
                  Level {{ currentSubject.level }}
                </q-chip>
              </span>
            </div>
            <div class="row">
              <span class="text-weight-bold">Parent Subject:</span>
              <span class="text-grey-8 q-ml-sm">
                {{ currentSubject.superior_id ? getSubjectName(currentSubject.superior_id) : 'Top Level' }}
              </span>
            </div>
            <div v-if="currentSubject.intro" class="row">
              <span class="text-weight-bold">Introduction:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentSubject.intro }}</span>
            </div>
            <div v-if="currentSubject.create_time" class="row">
              <span class="text-weight-bold">Created:</span>
              <span class="text-grey-8 q-ml-sm"> {{ formatDate(currentSubject.create_time) }}</span>
            </div>
            <div v-if="currentSubject.update_time" class="row">
              <span class="text-weight-bold">Updated:</span>
              <span class="text-grey-8 q-ml-sm"> {{ formatDate(currentSubject.update_time) }}</span>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';

// 学科接口定义：对应数据库表结构
interface Subject {
  id?: number;                   // 学科编号
  name: string;                  // 学科英文名
  name_cn?: string;             // 学科中文名
  aliases?: string;             // 别名
  superior_id?: number | null;  // 上一级学科编号
  level: number;                // 学科级别
  intro?: string;               // 学科简介
  create_time?: string;         // 创建时间
  update_time?: string;         // 修改时间
}

// 用于上级学科选择的选项接口
interface ParentOption {
  id: number;
  displayName: string;
  level: number;
}

const $q = useQuasar();          // Quasar工具函数

// 响应式状态管理
const viewToggle = ref(false);    // 视图切换状态
const filter = ref('');           // 搜索过滤器
const mode = ref<'list' | 'grid'>('list'); // 显示模式：列表或网格
const loading = ref(false);       // 加载状态
const pagination = ref({
  rowsPerPage: 20,               // 每页显示行数
});

// 学科数据
const subjects = ref<Subject[]>([
  {
    id: 1,
    name: 'Computer Science',
    name_cn: '计算机科学',
    aliases: 'CS, CompSci',
    superior_id: null,
    level: 1,
    intro: 'The study of computers and computational systems',
    create_time: '2023-01-15T10:30:00Z',
    update_time: '2023-06-20T14:45:00Z'
  },
  {
    id: 2,
    name: 'Artificial Intelligence',
    name_cn: '人工智能',
    aliases: 'AI',
    superior_id: 1,
    level: 2,
    intro: 'Development of intelligent machines and software',
    create_time: '2023-02-10T09:15:00Z',
    update_time: '2023-07-12T11:20:00Z'
  },
  {
    id: 3,
    name: 'Machine Learning',
    name_cn: '机器学习',
    aliases: 'ML',
    superior_id: 2,
    level: 3,
    intro: 'Study of algorithms that improve automatically through experience',
    create_time: '2023-03-05T13:45:00Z',
    update_time: '2023-08-15T16:30:00Z'
  },
  {
    id: 4,
    name: 'Mathematics',
    name_cn: '数学',
    aliases: 'Math',
    superior_id: null,
    level: 1,
    intro: 'The abstract science of number, quantity, and space',
    create_time: '2023-01-20T08:00:00Z',
    update_time: '2023-06-25T10:15:00Z'
  },
  {
    id: 5,
    name: 'Physics',
    name_cn: '物理学',
    aliases: 'Phys',
    superior_id: null,
    level: 1,
    intro: 'The branch of science concerned with the nature and properties of matter and energy',
    create_time: '2023-02-15T11:30:00Z',
    update_time: '2023-07-20T14:20:00Z'
  },
  {
    id: 6,
    name: 'Algorithms',
    name_cn: '算法',
    superior_id: 1,
    level: 2,
    intro: 'Study of step-by-step procedures for calculations',
    create_time: '2023-03-10T09:45:00Z',
    update_time: '2023-08-18T12:30:00Z'
  },
  {
    id: 7,
    name: 'Deep Learning',
    name_cn: '深度学习',
    aliases: 'DL',
    superior_id: 3,
    level: 4,
    intro: 'Branch of machine learning based on artificial neural networks',
    create_time: '2023-04-05T14:20:00Z',
    update_time: '2023-09-12T16:45:00Z'
  },
]);

// 表格列定义
const columns = ref([
  {
    name: 'name',
    required: true,
    label: 'Subject Name',
    align: 'left',
    field: 'name',
    sortable: true,
  },
  {
    name: 'level',
    align: 'center',
    label: 'Level',
    field: 'level',
    sortable: true,
  },
  {
    name: 'superior',
    align: 'left',
    label: 'Parent Subject',
    field: 'superior_id',
    sortable: true,
  },
  {
    name: 'aliases',
    align: 'left',
    label: 'Aliases',
    field: 'aliases',
    sortable: true,
  },
  {
    name: 'create_time',
    align: 'left',
    label: 'Created',
    field: 'create_time',
    sortable: true,
    format: (val: string) => formatDate(val), // 格式化日期显示
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
const showSubjectDialog = ref(false);   // 添加/编辑对话框显示状态
const showViewDialog = ref(false);      // 查看对话框显示状态
const isEditing = ref(false);           // 当前是否处于编辑模式
const isAddingChild = ref<number | null>(null); // 添加子学科时，存储父学科ID
const parentSubjectName = ref('');      // 父学科名称（用于显示）

// 当前操作的学科数据
const currentSubject = ref<Subject>({
  name: '',
  name_cn: '',
  aliases: '',
  superior_id: null,
  level: 1,
  intro: '',
});

// 计算属性：可用的上级学科选项（排除当前编辑的学科及其子学科）
const availableParents = computed(() => {
  const options: ParentOption[] = [];

  // 添加"无"选项（顶级学科）
  options.push({
    id: 0,
    displayName: '-- Top Level (No Parent) --',
    level: 0
  });

  // 添加所有现有学科作为选项（排除当前编辑的学科）
  subjects.value.forEach(subject => {
    // 如果是编辑模式，排除当前学科本身
    if (isEditing.value && currentSubject.value.id === subject.id) {
      return;
    }

    // 如果是添加子学科模式，排除当前父学科的子学科（避免循环引用）
    if (isAddingChild.value && isDescendant(subject.id, isAddingChild.value)) {
      return;
    }

    // 构建显示名称（包含层级缩进）
    const indent = '  '.repeat(subject.level - 1);
    const displayName = `${indent}${subject.name}${subject.name_cn ? ` (${subject.name_cn})` : ''}`;

    options.push({
      id: subject.id!,
      displayName,
      level: subject.level
    });
  });

  return options;
});

// 辅助函数

/**
 * 检查一个学科是否是另一个学科的后代
 * @param subjectId 待检查的学科ID
 * @param potentialAncestorId 潜在祖先学科ID
 * @returns 如果是后代返回true
 */
const isDescendant = (subjectId: number, potentialAncestorId: number): boolean => {
  const subject = subjects.value.find(s => s.id === subjectId);
  if (!subject || !subject.superior_id) return false;

  if (subject.superior_id === potentialAncestorId) return true;

  return isDescendant(subject.superior_id, potentialAncestorId);
};

/**
 * 根据学科ID获取学科名称
 * @param subjectId 学科ID
 * @returns 学科名称
 */
const getSubjectName = (subjectId: number): string => {
  const subject = subjects.value.find(s => s.id === subjectId);
  if (!subject) return 'Unknown Subject';

  return subject.name_cn ? `${subject.name} (${subject.name_cn})` : subject.name;
};

/**
 * 根据级别获取颜色
 * @param level 学科级别
 * @returns 颜色名称
 */
const getLevelColor = (level: number): string => {
  const colors = ['primary', 'secondary', 'positive', 'warning', 'negative'];
  return colors[Math.min(level - 1, colors.length - 1)] || 'grey';
};

/**
 * 截断文本，超过指定长度显示...
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
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
 * 加载学科数据（模拟API调用）
 */
const loadSubjects = () => {
  loading.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 这里可以替换为实际的API调用
    console.log('Subjects loaded');
    loading.value = false;
  }, 500);
};

// 主要方法

/**
 * 打开添加顶级学科对话框
 */
const addSubject = () => {
  currentSubject.value = {
    name: '',
    name_cn: '',
    aliases: '',
    superior_id: null,
    level: 1,
    intro: '',
  };
  isEditing.value = false;
  isAddingChild.value = null;
  parentSubjectName.value = '';
  showSubjectDialog.value = true;
};

/**
 * 打开添加子学科对话框
 * @param parentSubject 父学科对象
 */
const addChildSubject = (parentSubject: Subject) => {
  currentSubject.value = {
    name: '',
    name_cn: '',
    aliases: '',
    superior_id: parentSubject.id!,
    level: parentSubject.level + 1,
    intro: '',
  };
  isEditing.value = false;
  isAddingChild.value = parentSubject.id!;
  parentSubjectName.value = parentSubject.name_cn ?
    `${parentSubject.name} (${parentSubject.name_cn})` : parentSubject.name;
  showSubjectDialog.value = true;
};

/**
 * 打开编辑学科对话框
 * @param subject 要编辑的学科对象
 */
const editSubject = (subject: Subject) => {
  currentSubject.value = { ...subject };
  isEditing.value = true;
  isAddingChild.value = null;
  parentSubjectName.value = '';
  showSubjectDialog.value = true;
};

/**
 * 打开查看学科详情对话框
 * @param subject 要查看的学科对象
 */
const viewSubject = (subject: Subject) => {
  currentSubject.value = { ...subject };
  showViewDialog.value = true;
};

/**
 * 保存学科信息（添加或更新）
 */
const saveSubject = () => {
  // 验证必填字段
  if (!currentSubject.value.name) {
    $q.notify({
      color: 'negative',
      message: 'Subject English name is required'
    });
    return;
  }

  // 验证级别范围
  if (currentSubject.value.level < 1 || currentSubject.value.level > 10) {
    $q.notify({
      color: 'negative',
      message: 'Level must be between 1 and 10'
    });
    return;
  }

  // 处理上级学科ID（如果是0，表示顶级学科）
  if (currentSubject.value.superior_id === 0) {
    currentSubject.value.superior_id = null;
  }

  if (isEditing.value) {
    // 更新现有学科
    const index = subjects.value.findIndex(s => s.id === currentSubject.value.id);
    if (index !== -1) {
      const now = new Date().toISOString();
      subjects.value[index] = {
        ...currentSubject.value,
        update_time: now
      };
    }
    $q.notify({
      color: 'positive',
      message: 'Subject updated successfully'
    });
  } else {
    // 添加新学科
    const newId = subjects.value.length > 0
      ? Math.max(...subjects.value.map(s => s.id || 0)) + 1
      : 1;
    const now = new Date().toISOString();
    currentSubject.value.id = newId;
    currentSubject.value.create_time = now;
    currentSubject.value.update_time = now;
    subjects.value.push({ ...currentSubject.value });
    $q.notify({
      color: 'positive',
      message: 'Subject added successfully'
    });
  }

  showSubjectDialog.value = false; // 关闭对话框
};

/**
 * 删除学科（带确认对话框）
 * @param subjectItem 要删除的学科对象
 */
const deleteSubject = (subjectItem: Subject) => {
  // 检查是否有子学科
  const hasChildren = subjects.value.some(s => s.superior_id === subjectItem.id);

  if (hasChildren) {
    $q.dialog({
      title: 'Cannot Delete Subject',
      message: `This subject has child subjects. Please delete or reassign the child subjects first.`,
      cancel: false,
      persistent: true,
      ok: {
        label: 'OK',
        color: 'primary'
      }
    });
    return;
  }

  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${subjectItem.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    subjects.value = subjects.value.filter(s => s.id !== subjectItem.id);
    $q.notify({
      color: 'positive',
      message: 'Subject deleted successfully'
    });
  });
};

// 组件挂载时加载数据
onMounted(() => {
  loadSubjects();
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
</style>
