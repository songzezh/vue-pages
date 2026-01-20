<template>
  <page-content>
    <q-card>
      <!-- 标题和操作按钮区域 -->
      <q-card-section class="q-pb-md">
        <div class="row items-center">
          <div class="col">
            <div class="text-h6">Music Genres</div>
            <div class="text-caption text-grey-7">
              A music genre is a classification system that classifies music into different styles. It’s the art of incorporating instrumental and vocal tones in a structured manner that gives the music its distinctive character.
            </div>
            <div class="text-caption text-grey-7">
              As a result, all artistic compositions that belong to the same music genre share some similarities in form or style.
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- 搜索和过滤区域 -->
      <q-card-section class="q-pt-none">
        <div class="row q-gutter-md items-center">
          <!-- 搜索框 -->
          <div class="col-grow">
            <q-input
              dense
              outlined
              v-model="searchText"
              placeholder="Search by name..."
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- 过滤选项 -->
          <div class="col-auto">
            <q-select
              dense
              outlined
              v-model="selectedSuperior"
              :options="superiorOptions"
              label="Filter by genre"
              clearable
              style="min-width: 150px"
            />
          </div>

          <!-- 重置按钮 -->
          <div class="col-auto">
            <q-btn
              flat
              color="grey"
              icon="refresh"
              @click="resetFilters"
            />
          </div>

          <div class="col-auto">
            <q-btn
              @click="openAddDialog"
              flat
              size="lg"
              color="primary"
              icon="add_circle"
              class="q-mr-xs q-pa-none"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- 流派表格 -->
      <q-table
        :rows="filteredGenres"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        @request="onPaginationChange"
        flat
        bordered
      >
        <!-- 表格顶部插槽（可自定义） -->
        <template v-slot:top>
          <div class="text-subtitle1 text-weight-medium">
            流派列表 ({{ filteredGenres.length }})
          </div>
          <q-space />
        </template>

        <!-- 父流派列自定义显示 -->
        <template v-slot:body-cell-superior="props">
          <q-td :props="props">
            <div v-if="props.row.superiorName" class="q-pl-xs">
              <q-chip size="sm" color="secondary" text-color="white">
                {{ props.row.superiorName }}
              </q-chip>
            </div>
            <div v-else class="text-grey-7 q-pl-xs">无</div>
          </q-td>
        </template>

        <!-- 操作列 -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <!-- 查看按钮 -->
            <q-btn
              flat
              dense
              size="sm"
              color="info"
              icon="visibility"
              @click="viewGenre(props.row)"
            >
              <q-tooltip>查看详情</q-tooltip>
            </q-btn>

            <!-- 编辑按钮 -->
            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              icon="edit"
              @click="editGenre(props.row)"
            >
              <q-tooltip>编辑流派</q-tooltip>
            </q-btn>

            <!-- 删除按钮 -->
            <q-btn
              flat
              dense
              size="sm"
              color="negative"
              icon="delete"
              @click="confirmDeleteGenre(props.row)"
            >
              <q-tooltip>删除流派</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <!-- 空状态 -->
        <template v-slot:no-data>
          <div class="full-width row flex-center text-grey-8 q-py-lg">
            <q-icon name="music_note" size="2em" class="q-mr-sm" />
            暂无流派数据
            <q-btn
              flat
              color="primary"
              label="添加第一个流派"
              @click="openAddDialog"
              class="q-ml-md"
            />
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- 添加/编辑流派对话框 -->
    <q-dialog v-model="showGenreDialog" persistent>
      <q-card style="min-width: 500px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">
            {{ dialogMode === 'add' ? '添加音乐流派' : '编辑音乐流派' }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveGenre" class="q-gutter-md">
            <!-- 流派名称 -->
            <div>
              <q-input
                v-model="genreForm.name"
                label="流派名称 *"
                outlined
                dense
                :rules="[
                  val => !!val || '请输入流派名称',
                  val => val.length <= 64 || '名称不能超过64个字符'
                ]"
                maxlength="64"
                hint="例如：Rock, Pop, Jazz"
              />
            </div>

            <!-- 中文名称 -->
            <div>
              <q-input
                v-model="genreForm.name_cn"
                label="中文名称"
                outlined
                dense
                :rules="[
                  val => !val || val.length <= 64 || '中文名称不能超过64个字符'
                ]"
                maxlength="64"
                hint="例如：摇滚、流行、爵士"
              />
            </div>

            <!-- 父流派选择 -->
            <div>
              <q-select
                v-model="genreForm.superior_id"
                :options="parentGenreOptions"
                label="父流派"
                outlined
                dense
                clearable
                map-options
                emit-value
                option-value="id"
                option-label="name"
                hint="选择父级流派，留空表示顶级流派"
                :loading="loadingParentOptions"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      无可用父流派
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- 简介 -->
            <div>
              <q-input
                v-model="genreForm.intro"
                label="简介"
                outlined
                dense
                type="textarea"
                autogrow
                hint="请输入流派简介"
                :rules="[
                  val => !val || val.length <= 500 || '简介不能超过500个字符'
                ]"
                maxlength="500"
              />
            </div>

            <!-- 表单操作按钮 -->
            <div class="row q-mt-lg q-gutter-sm justify-end">
              <q-btn
                flat
                label="取消"
                color="grey"
                v-close-popup
                @click="resetForm"
              />
              <q-btn
                type="submit"
                :label="dialogMode === 'add' ? '添加' : '保存'"
                color="primary"
                :loading="submitting"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 查看流派详情对话框 -->
    <q-dialog v-model="showDetailDialog">
      <q-card style="min-width: 500px; max-width: 700px">
        <q-card-section>
          <div class="text-h6">流派详情</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-gutter-md">
            <!-- 基本信息 -->
            <div class="row items-center q-mb-sm">
              <div class="col-3 text-grey-7">流派名称:</div>
              <div class="col-9 text-h6">{{ selectedGenre.name }}</div>
            </div>

            <div class="row items-center q-mb-sm" v-if="selectedGenre.name_cn">
              <div class="col-3 text-grey-7">中文名称:</div>
              <div class="col-9">{{ selectedGenre.name_cn }}</div>
            </div>

            <div class="row items-center q-mb-sm">
              <div class="col-3 text-grey-7">流派编号:</div>
              <div class="col-9">{{ selectedGenre.id }}</div>
            </div>

            <div class="row items-center q-mb-sm">
              <div class="col-3 text-grey-7">父流派:</div>
              <div class="col-9">
                <span v-if="selectedGenre.superiorName">
                  <q-chip size="sm" color="secondary" text-color="white">
                    {{ selectedGenre.superiorName }}
                  </q-chip>
                </span>
                <span v-else class="text-grey-7">无</span>
              </div>
            </div>

            <!-- 简介 -->
            <div class="row q-mb-sm" v-if="selectedGenre.intro">
              <div class="col-3 text-grey-7">简介:</div>
              <div class="col-9">
                {{ selectedGenre.intro }}
              </div>
            </div>

            <!-- 时间信息 -->
            <q-separator class="q-my-md" />

            <div class="row items-center q-mb-sm">
              <div class="col-3 text-grey-7">创建时间:</div>
              <div class="col-9">{{ formatDateTime(selectedGenre.create_time) }}</div>
            </div>

            <div class="row items-center">
              <div class="col-3 text-grey-7">更新时间:</div>
              <div class="col-9">{{ formatDateTime(selectedGenre.update_time) }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="关闭" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </page-content>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';
import PageContent from "@/components/Common/PageContent.vue";

// ==============================================
// 接口定义
// ==============================================

/**
 * 音乐流派数据接口
 */
interface MusicGenre {
  id: number;                   // 流派编号
  name: string;                 // 类型名称
  name_cn?: string | null;      // 中文名称
  superior_id?: number | null;  // 父类型编号
  intro?: string | null;        // 简介
  create_time: string;          // 创建时间
  update_time: string;          // 修改时间

  // 扩展字段（用于显示）
  superiorName?: string;        // 父流派名称
  hasChildren?: boolean;        // 是否有子流派
}

/**
 * 流派表单数据接口
 */
interface GenreForm {
  name: string;                 // 类型名称
  name_cn?: string | null;      // 中文名称
  superior_id?: number | null;  // 父类型编号
  intro?: string | null;        // 简介
}

// ==============================================
// Quasar工具
// ==============================================
const $q = useQuasar();

// ==============================================
// 响应式状态
// ==============================================

/** 流派数据列表 */
const genres = ref<MusicGenre[]>([]);

/** 加载状态 */
const loading = ref(false);

/** 表单提交状态 */
const submitting = ref(false);

/** 搜索文本 */
const searchText = ref('');

/** 选中的父流派筛选 */
const selectedSuperior = ref<number | null>(null);

/** 显示流派对话框 */
const showGenreDialog = ref(false);

/** 显示详情对话框 */
const showDetailDialog = ref(false);

/** 对话框模式：'add' 或 'edit' */
const dialogMode = ref<'add' | 'edit'>('add');

/** 选中的流派 */
const selectedGenre = ref<MusicGenre>({} as MusicGenre);

/** 流派表单数据 */
const genreForm = ref<GenreForm>({
  name: '',
  name_cn: null,
  superior_id: null,
  intro: null
});

/** 加载父流派选项状态 */
const loadingParentOptions = ref(false);

// ==============================================
// 表格配置
// ==============================================

/** 表格列定义 */
const columns: QTableProps['columns'] = [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field: 'id',
    sortable: true,
    style: 'width: 80px'
  },
  {
    name: 'name',
    required: true,
    label: '流派名称',
    align: 'left',
    field: 'name',
    sortable: true
  },
  {
    name: 'name_cn',
    label: '中文名称',
    align: 'left',
    field: 'name_cn',
    sortable: true
  },
  {
    name: 'superior',
    label: '父流派',
    align: 'left',
    field: (row: MusicGenre) => row.superiorName,
    sortable: true
  },
  {
    name: 'create_time',
    label: '创建时间',
    align: 'left',
    field: 'create_time',
    sortable: true,
    format: (val: string) => formatDateTime(val)
  },
  {
    name: 'update_time',
    label: '更新时间',
    align: 'left',
    field: 'update_time',
    sortable: true,
    format: (val: string) => formatDateTime(val)
  },
  {
    name: 'actions',
    label: '操作',
    align: 'center',
    field: 'actions',
    sortable: false,
    style: 'width: 150px'
  }
];

/** 分页配置 */
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'id',
  descending: false
});

// ==============================================
// 计算属性
// ==============================================

/** 父流派选项（用于筛选） */
const superiorOptions = computed(() => {
  const options = [
    { label: '顶级流派', value: null }
  ];

  // 获取所有顶级流派
  const topGenres = genres.value.filter(genre => !genre.superior_id);
  topGenres.forEach(genre => {
    options.push({
      label: genre.name,
      value: genre.id
    });
  });

  return options;
});

/** 父流派选项（用于表单选择） */
const parentGenreOptions = computed(() => {
  // 在编辑模式下，排除自身及其子流派
  let availableGenres = genres.value;

  if (dialogMode.value === 'edit' && selectedGenre.value.id) {
    // 获取当前编辑流派的子流派ID列表
    const childIds = getChildGenreIds(selectedGenre.value.id);
    // 排除自身及其子流派
    availableGenres = genres.value.filter(genre =>
      genre.id !== selectedGenre.value.id && !childIds.includes(genre.id)
    );
  }

  return availableGenres.map(genre => ({
    id: genre.id,
    name: genre.name + (genre.name_cn ? ` (${genre.name_cn})` : '')
  }));
});

/** 过滤后的流派数据 */
const filteredGenres = computed(() => {
  let result = [...genres.value];

  // 根据搜索文本过滤
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase();
    result = result.filter(genre =>
      genre.name.toLowerCase().includes(searchLower) ||
      (genre.name_cn && genre.name_cn.toLowerCase().includes(searchLower)) ||
      (genre.intro && genre.intro.toLowerCase().includes(searchLower))
    );
  }

  // 根据父流派筛选
  if (selectedSuperior.value !== null) {
    if (selectedSuperior.value === undefined) {
      // 筛选顶级流派
      result = result.filter(genre => !genre.superior_id);
    } else {
      // 筛选特定父流派的子流派
      result = result.filter(genre => genre.superior_id === selectedSuperior.value);
    }
  }

  // 更新分页总行数
  pagination.value.rowsNumber = result.length;

  // 应用分页
  const startIndex = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const endIndex = startIndex + pagination.value.rowsPerPage;

  return result.slice(startIndex, endIndex);
});

// ==============================================
// 工具函数
// ==============================================

/**
 * 格式化日期时间
 * @param dateTime - 日期时间字符串
 * @returns 格式化后的日期时间
 */
const formatDateTime = (dateTime: string): string => {
  if (!dateTime) return '';

  try {
    const date = new Date(dateTime);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateTime;
  }
};

/**
 * 获取流派的所有子流派ID
 * @param genreId - 流派ID
 * @returns 子流派ID列表
 */
const getChildGenreIds = (genreId: number): number[] => {
  const childIds: number[] = [];

  const findChildren = (parentId: number) => {
    const children = genres.value.filter(genre => genre.superior_id === parentId);
    children.forEach(child => {
      childIds.push(child.id);
      findChildren(child.id);
    });
  };

  findChildren(genreId);
  return childIds;
};

// ==============================================
// 业务方法
// ==============================================

/**
 * 初始化流派数据（模拟数据）
 */
const initializeGenres = () => {
  loading.value = true;

  // 模拟API调用延迟
  setTimeout(() => {
    // 模拟数据
    genres.value = [
      {
        id: 1,
        name: 'Rock',
        name_cn: '摇滚',
        superior_id: null,
        intro: '摇滚乐是一种音乐类型，起源于1940年代末期的美国，1950年代早期开始流行，迅速风靡全球。',
        create_time: '2023-01-15 10:30:00',
        update_time: '2023-06-20 14:25:00'
      },
      {
        id: 2,
        name: 'Pop',
        name_cn: '流行',
        superior_id: null,
        intro: '流行音乐是一种大众音乐类型，起源于1950年代的美国，以其易于记忆的旋律和广泛的吸引力而闻名。',
        create_time: '2023-01-16 11:15:00',
        update_time: '2023-05-10 09:40:00'
      },
      {
        id: 3,
        name: 'Jazz',
        name_cn: '爵士',
        superior_id: null,
        intro: '爵士乐是一种音乐流派，起源于19世纪末20世纪初的美国南部城市新奥尔良，以其复杂的和声和即兴演奏为特点。',
        create_time: '2023-02-05 14:20:00',
        update_time: '2023-08-15 16:30:00'
      },
      {
        id: 4,
        name: 'Classical',
        name_cn: '古典',
        superior_id: null,
        intro: '古典音乐是指根植于西方音乐传统（包括宗教音乐和世俗音乐）的艺术音乐，涵盖了从11世纪至今的广泛时期。',
        create_time: '2023-02-10 09:05:00',
        update_time: '2023-07-22 11:10:00'
      },
      {
        id: 5,
        name: 'Heavy Metal',
        name_cn: '重金属',
        superior_id: 1,
        superiorName: 'Rock',
        intro: '重金属音乐是摇滚乐的一个子流派，起源于1960年代末和1970年代初，主要在英国和美国。',
        create_time: '2023-03-01 13:45:00',
        update_time: '2023-09-05 10:20:00'
      },
      {
        id: 6,
        name: 'Punk Rock',
        name_cn: '朋克摇滚',
        superior_id: 1,
        superiorName: 'Rock',
        intro: '朋克摇滚是摇滚乐的一个子流派，出现于1970年代中期，以其快速、硬朗的歌曲、反建制态度和DIY伦理而闻名。',
        create_time: '2023-03-12 15:30:00',
        update_time: '2023-08-30 14:15:00'
      },
      {
        id: 7,
        name: 'Synth-pop',
        name_cn: '合成器流行',
        superior_id: 2,
        superiorName: 'Pop',
        intro: '合成器流行是流行音乐的一个子流派，最早在1970年代末和1980年代初兴起，以合成器作为主要乐器。',
        create_time: '2023-04-05 10:10:00',
        update_time: '2023-10-12 08:45:00'
      },
      {
        id: 8,
        name: 'K-pop',
        name_cn: '韩国流行',
        superior_id: 2,
        superiorName: 'Pop',
        intro: 'K-pop是源自韩国的流行音乐类型，形式多样，融合了多种音乐风格，通常与精心编排的舞蹈和视觉效果相结合。',
        create_time: '2023-04-20 16:25:00',
        update_time: '2023-11-01 13:30:00'
      },
      {
        id: 9,
        name: 'Bebop',
        name_cn: '比波普',
        superior_id: 3,
        superiorName: 'Jazz',
        intro: '比波普是爵士乐的一种风格，出现于1940年代早期，以其快速的节奏、复杂的和声和即兴演奏为特点。',
        create_time: '2023-05-08 11:40:00',
        update_time: '2023-09-18 09:55:00'
      },
      {
        id: 10,
        name: 'Smooth Jazz',
        name_cn: '平滑爵士',
        superior_id: 3,
        superiorName: 'Jazz',
        intro: '平滑爵士是爵士乐的一个子流派，融合了爵士乐、R&B和流行音乐的元素，以其轻松、悦耳的旋律为特点。',
        create_time: '2023-05-15 14:15:00',
        update_time: '2023-10-25 11:20:00'
      }
    ];

    // 为每个流派添加父流派名称
    genres.value.forEach(genre => {
      if (genre.superior_id) {
        const parent = genres.value.find(g => g.id === genre.superior_id);
        if (parent) {
          genre.superiorName = parent.name;
        }
      }
    });

    loading.value = false;
    pagination.value.rowsNumber = genres.value.length;
  }, 800);
};

/**
 * 打开添加流派对话框
 */
const openAddDialog = () => {
  resetForm();
  dialogMode.value = 'add';
  showGenreDialog.value = true;
};

/**
 * 编辑流派
 * @param genre - 要编辑的流派
 */
const editGenre = (genre: MusicGenre) => {
  selectedGenre.value = { ...genre };
  genreForm.value = {
    name: genre.name,
    name_cn: genre.name_cn || null,
    superior_id: genre.superior_id || null,
    intro: genre.intro || null
  };
  dialogMode.value = 'edit';
  showGenreDialog.value = true;
};

/**
 * 查看流派详情
 * @param genre - 要查看的流派
 */
const viewGenre = (genre: MusicGenre) => {
  selectedGenre.value = { ...genre };
  showDetailDialog.value = true;
};

/**
 * 保存流派（添加或更新）
 */
const saveGenre = async () => {
  submitting.value = true;

  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 800));

    if (dialogMode.value === 'add') {
      // 添加新流派
      const newId = genres.value.length > 0
        ? Math.max(...genres.value.map(g => g.id)) + 1
        : 1;

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const newGenre: MusicGenre = {
        id: newId,
        name: genreForm.value.name,
        name_cn: genreForm.value.name_cn || null,
        superior_id: genreForm.value.superior_id || null,
        intro: genreForm.value.intro || null,
        create_time: now,
        update_time: now
      };

      // 添加父流派名称
      if (newGenre.superior_id) {
        const parent = genres.value.find(g => g.id === newGenre.superior_id);
        if (parent) {
          newGenre.superiorName = parent.name;
        }
      }

      genres.value.unshift(newGenre);

      $q.notify({
        type: 'positive',
        message: '流派添加成功',
        position: 'top'
      });
    } else {
      // 更新现有流派
      const index = genres.value.findIndex(g => g.id === selectedGenre.value.id);
      if (index !== -1) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const updatedGenre: MusicGenre = {
          ...genres.value[index],
          name: genreForm.value.name,
          name_cn: genreForm.value.name_cn || null,
          superior_id: genreForm.value.superior_id || null,
          intro: genreForm.value.intro || null,
          update_time: now
        };

        // 更新父流派名称
        if (updatedGenre.superior_id) {
          const parent = genres.value.find(g => g.id === updatedGenre.superior_id);
          updatedGenre.superiorName = parent?.name;
        } else {
          updatedGenre.superiorName = undefined;
        }

        genres.value[index] = updatedGenre;

        $q.notify({
          type: 'positive',
          message: '流派更新成功',
          position: 'top'
        });
      }
    }

    // 关闭对话框并重置表单
    showGenreDialog.value = false;
    resetForm();

  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '操作失败，请重试',
      position: 'top'
    });
  } finally {
    submitting.value = false;
  }
};

/**
 * 确认删除流派
 * @param genre - 要删除的流派
 */
const confirmDeleteGenre = (genre: MusicGenre) => {
  $q.dialog({
    title: '确认删除',
    message: `确定要删除流派 "${genre.name}" 吗？`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    deleteGenre(genre);
  });
};

/**
 * 删除流派
 * @param genre - 要删除的流派
 */
const deleteGenre = async (genre: MusicGenre) => {
  loading.value = true;

  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 检查是否有子流派
    const hasChildren = genres.value.some(g => g.superior_id === genre.id);
    if (hasChildren) {
      $q.notify({
        type: 'warning',
        message: '该流派存在子流派，无法删除',
        position: 'top'
      });
      return;
    }

    // 删除流派
    const index = genres.value.findIndex(g => g.id === genre.id);
    if (index !== -1) {
      genres.value.splice(index, 1);

      $q.notify({
        type: 'positive',
        message: '流派删除成功',
        position: 'top'
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '删除失败，请重试',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  genreForm.value = {
    name: '',
    name_cn: null,
    superior_id: null,
    intro: null
  };
  selectedGenre.value = {} as MusicGenre;
};

/**
 * 重置筛选条件
 */
const resetFilters = () => {
  searchText.value = '';
  selectedSuperior.value = null;
};

/**
 * 分页变化处理
 * @param props - 分页属性
 */
const onPaginationChange = (props: {
  page: number;
  rowsPerPage: number;
  sortBy: string;
  descending: boolean;
}) => {
  pagination.value.page = props.page;
  pagination.value.rowsPerPage = props.rowsPerPage;
  pagination.value.sortBy = props.sortBy;
  pagination.value.descending = props.descending;

  // 这里可以触发API调用获取新数据
  // 目前使用本地数据，所以直接更新过滤结果
};

// ==============================================
// 生命周期钩子
// ==============================================

/**
 * 组件挂载后初始化数据
 */
onMounted(() => {
  initializeGenres();
});
</script>

<style scoped>
</style>
