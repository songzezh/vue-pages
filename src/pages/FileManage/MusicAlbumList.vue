<template>
  <page-content>
    <q-card>
      <q-table
        title="Manage Albums"
        :rows="data"
        :hide-header="mode === 'grid'"
        :columns="columns"
        row-key="id"
        :grid="mode === 'grid'"
        :filter="filter"
        v-model:pagination="pagination"
      >
        <template v-slot:top-right="props">
          <!-- 添加专辑按钮 -->
          <q-btn
            @click="addAlbum"
            flat
            size="lg"
            color="primary"
            icon="add_circle"
            class="q-mr-xs q-pa-none"
          />

          <!-- 搜索框 -->
          <q-input
            dense
            borderless
            v-model="filter"
            placeholder="Search"
            class="bg-grey-3 q-pl-sm"
            style="border-radius: 10px"
          >
            <template v-slot:append>
              <q-icon class="q-pr-sm" color="grey-8" name="search" />
            </template>
          </q-input>

          <!-- 全屏切换按钮（仅列表视图显示） -->
          <q-btn
            flat
            round
            dense
            class="q-ml-xs"
            :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
            @click="props.toggleFullscreen"
            v-if="mode === 'list'"
          >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup>
              {{ props.inFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen" }}
            </q-tooltip>
          </q-btn>

          <!-- 视图切换（列表/网格） -->
          <q-toggle
            v-model="viewToggle"
            @click="
              mode = mode === 'grid' ? 'list' : 'grid';
              separator = mode === 'grid' ? 'none' : 'horizontal';
            "
            v-if="!props.inFullscreen"
          >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup>
              {{ mode === 'grid' ? "List View" : "Grid View" }}
            </q-tooltip>
          </q-toggle>

          <!-- 导出CSV按钮 -->
          <q-btn
            color="primary"
            icon-right="archive"
            label="Export to CSV"
            no-caps
            @click="exportTable"
          />
        </template>

        <!-- 网格视图模板 -->
        <template v-slot:item="props">
          <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition">
            <q-card class="my-card" flat bordered>
              <!-- 专辑封面 -->
              <q-img
                :src="props.row.coverUrl || 'https://cdn.quasar.dev/img/parallax2.jpg'"
                :ratio="1"
              >
                <!-- 封面底部标题 -->
                <div class="absolute-bottom text-subtitle2 text-center">
                  {{ props.row.title }}
                </div>
              </q-img>

              <!-- 专辑详情列表 -->
              <q-list dense>
                <!-- 发行日期 -->
                <q-item>
                  <q-item-section avatar>
                    <q-icon color="primary" name="calendar_today" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Release Date</q-item-label>
                    <q-item-label>{{ props.row.releaseDate || 'Not set' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <!-- 更新时间 -->
                <q-item>
                  <q-item-section avatar>
                    <q-icon color="orange" name="access_time" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Updated</q-item-label>
                    <q-item-label>{{ formatDate(props.row.updateTime) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <!-- 操作按钮区域 -->
              <q-card-actions align="right" class="q-px-md q-pb-md">
                <!-- 查看、编辑和删除按钮组 -->
                <q-btn-group flat right>
                  <q-btn
                    flat
                    dense
                    color="primary"
                    icon="visibility"
                    size="sm"
                    @click="viewAlbum(props.row)"
                    class="full-width"
                  >
                    <q-tooltip>View Details</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    color="primary"
                    icon="edit"
                    size="sm"
                    @click="editAlbum(props.row)"
                  >
                    <q-tooltip>Edit</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    color="red"
                    icon="delete"
                    size="sm"
                    @click="deleteAlbum(props.row)"
                  >
                    <q-tooltip>Delete</q-tooltip>
                  </q-btn>
                </q-btn-group>
              </q-card-actions>
            </q-card>
          </div>
        </template>

        <!-- 列表视图：封面列模板 -->
        <template v-slot:body-cell-cover="props">
          <q-td :props="props">
            <q-avatar v-if="props.row.coverUrl" size="50px">
              <img :src="props.row.coverUrl" :alt="props.row.title" />
            </q-avatar>
            <q-icon v-else name="image" size="50px" color="grey" />
          </q-td>
        </template>

        <!-- 列表视图：操作列模板 -->
        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-sm">
              <q-btn dense outline size="sm" color="primary" icon="edit" @click="editAlbum(props.row)" />
              <q-btn dense outline size="sm" color="primary" icon="visibility" @click="viewAlbum(props.row)" />
              <q-btn dense outline size="sm" color="red" icon="delete" @click="deleteAlbum(props.row)" />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- 添加/编辑专辑对话框 -->
    <q-dialog v-model="showAddEditDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '60vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ isEditMode ? 'Edit Album' : 'Add Album' }}
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
          <!-- 专辑表单 -->
          <q-form class="q-gutter-md" @submit="saveAlbum">
            <q-list>
              <!-- 专辑标题 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Album Title *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="albumForm.title"
                    :rules="[val => !!val || 'Title is required']"
                  />
                </q-item-section>
              </q-item>

              <!-- 发行日期 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Release Date</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="albumForm.releaseDate"
                    mask="date"
                  >
                    <template v-slot:append>
                      <!-- 日期选择器 -->
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                          <q-date v-model="albumForm.releaseDate" />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </q-item-section>
              </q-item>

              <!-- 封面ID -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Cover ID</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="albumForm.coverId"
                    type="number"
                    min="0"
                  />
                </q-item-section>
              </q-item>

              <!-- 封面预览URL -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Cover Preview URL</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="albumForm.coverUrl"
                    placeholder="Optional: Direct image URL for preview"
                  />
                </q-item-section>
              </q-item>

              <!-- 专辑描述 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Description</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="albumForm.description"
                    type="textarea"
                    autogrow
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <!-- 保存按钮 -->
            <div class="q-px-md q-pt-sm">
              <q-btn
                class="full-width"
                label="Save"
                type="submit"
                color="primary"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 查看专辑详情对话框 -->
    <q-dialog v-model="showViewDialog">
      <q-card class="q-pa-md" :style="$q.platform.is.desktop ? {'width': '700px', 'max-width': '70vw'} : {'width': '100%'}">
        <div class="row full-width">
          <!-- 封面区域 -->
          <div class="full-height self-center q-mr-md" :style="$q.platform.is.mobile ? {'width': '100%', 'text-align': 'center', 'margin-bottom': '20px'} : {}">
            <q-avatar :size="$q.platform.is.desktop ? '200px' : '150px'">
              <img v-if="selectedAlbum.coverUrl" :src="selectedAlbum.coverUrl" :alt="selectedAlbum.title" />
              <q-icon v-else name="image" size="200px" color="grey" />
            </q-avatar>
          </div>

          <q-separator :vertical="$q.platform.is.desktop" />

          <!-- 详情信息区域 -->
          <div class="q-ml-md q-gutter-md" style="flex: 1">
            <div class="row items-center">
              <span class="text-h6 text-weight-bold">{{ selectedAlbum.title }}</span>
            </div>

            <div class="row">
              <span class="text-weight-bold">ID:</span>
              <span class="text-grey-8 q-ml-sm">{{ selectedAlbum.id }}</span>
            </div>

            <div class="row">
              <span class="text-weight-bold">Cover ID:</span>
              <span class="text-grey-8 q-ml-sm">{{ selectedAlbum.coverId || 'Not set' }}</span>
            </div>

            <div class="row">
              <span class="text-weight-bold">Release Date:</span>
              <span class="text-grey-8 q-ml-sm">{{ selectedAlbum.releaseDate || 'Not set' }}</span>
            </div>

            <div class="row">
              <span class="text-weight-bold">Create Time:</span>
              <span class="text-grey-8 q-ml-sm">{{ selectedAlbum.createTime }}</span>
            </div>

            <div class="row">
              <span class="text-weight-bold">Update Time:</span>
              <span class="text-grey-8 q-ml-sm">{{ selectedAlbum.updateTime }}</span>
            </div>

            <div class="row">
              <span class="text-weight-bold">Description:</span>
            </div>
            <div class="row q-mt-xs">
              <span class="text-grey-8">{{ selectedAlbum.description || 'No description' }}</span>
            </div>
          </div>
        </div>

        <!-- 对话框操作按钮 -->
        <q-card-actions align="right" class="q-mt-md">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </page-content>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { exportFile, useQuasar } from 'quasar';
import PageContent from "@/components/Common/PageContent.vue";

// ==============================================
// 接口定义
// ==============================================

/**
 * 专辑数据接口
 */
interface Album {
  id: number;               // 专辑ID
  title: string;            // 专辑标题
  coverId?: number;         // 封面文件ID（可选）
  coverUrl?: string;        // 封面预览URL（可选）
  releaseDate?: string;     // 发行日期（可选）
  description?: string;     // 专辑简介（可选）
  createTime: string;       // 创建时间
  updateTime: string;       // 更新时间
}

/**
 * 专辑表单数据接口
 */
interface AlbumForm {
  title: string;            // 专辑标题
  coverId?: number;         // 封面文件ID（可选）
  coverUrl?: string;        // 封面预览URL（可选）
  releaseDate?: string;     // 发行日期（可选）
  description?: string;     // 专辑简介（可选）
}

// ==============================================
// Quasar工具
// ==============================================
const $q = useQuasar();

// ==============================================
// 响应式状态
// ==============================================

/** 视图切换控制（网格/列表） */
const viewToggle = ref(false);

/** 搜索过滤条件 */
const filter = ref('');

/** 当前视图模式：'list' 或 'grid' */
const mode = ref<'list' | 'grid'>('grid');

/** 表格分隔符 */
const separator = ref<'horizontal' | 'none'>('horizontal');

/** 控制添加/编辑对话框显示 */
const showAddEditDialog = ref(false);

/** 控制查看对话框显示 */
const showViewDialog = ref(false);

/** 标识当前是否为编辑模式 */
const isEditMode = ref(false);

/** 当前选中的专辑 */
const selectedAlbum = ref<Album>({} as Album);

// ==============================================
// 表单数据
// ==============================================

/** 专辑表单数据 */
const albumForm = ref<AlbumForm>({
  title: '',
  coverId: undefined,
  coverUrl: '',
  releaseDate: '',
  description: ''
});

// ==============================================
// 表格数据
// ==============================================

/** 专辑数据列表 */
const data = ref<Album[]>([
  {
    id: 1,
    title: 'Greatest Hits',
    coverId: 1,
    coverUrl: 'https://picsum.photos/400/400?random=1',
    releaseDate: '2023-05-15',
    description: 'A collection of the best tracks from the artist',
    createTime: '2023-01-01 10:00:00',
    updateTime: '2023-06-01 14:30:00'
  },
  {
    id: 2,
    title: 'Summer Vibes',
    coverId: 2,
    coverUrl: 'https://picsum.photos/400/400?random=2',
    releaseDate: '2023-06-20',
    description: 'Perfect tunes for your summer adventures',
    createTime: '2023-02-15 09:15:00',
    updateTime: '2023-07-01 16:45:00'
  },
  {
    id: 3,
    title: 'Midnight Dreams',
    coverId: 3,
    coverUrl: 'https://picsum.photos/400/400?random=3',
    releaseDate: '2023-03-10',
    description: 'Ambient and chill music for late nights',
    createTime: '2023-01-20 14:20:00',
    updateTime: '2023-04-05 11:10:00'
  },
  {
    id: 4,
    title: 'Rock Legends',
    releaseDate: '2023-08-05',
    description: 'Classic rock anthems from legendary bands',
    createTime: '2023-03-10 08:45:00',
    updateTime: '2023-08-01 13:25:00'
  },
  {
    id: 5,
    title: 'Acoustic Sessions',
    coverId: 5,
    coverUrl: 'https://picsum.photos/400/400?random=4',
    releaseDate: '2023-04-25',
    description: 'Raw and intimate acoustic performances',
    createTime: '2023-02-28 16:30:00',
    updateTime: '2023-05-15 10:20:00'
  },
  {
    id: 6,
    title: 'Electronic Dreams',
    coverId: 6,
    coverUrl: 'https://picsum.photos/400/400?random=5',
    releaseDate: '2023-09-10',
    description: 'Modern electronic music for the digital age',
    createTime: '2023-06-10 11:45:00',
    updateTime: '2023-09-15 09:20:00'
  }
]);

// ==============================================
// 表格列定义
// ==============================================

/** 表格列配置 */
const columns = ref([
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field: (row: Album) => row.id,
    sortable: true
  },
  {
    name: 'cover',
    align: 'left',
    label: 'Cover',
    field: 'coverUrl',
    sortable: false
  },
  {
    name: 'title',
    required: true,
    label: 'Title',
    align: 'left',
    field: 'title',
    sortable: true
  },
  {
    name: 'releaseDate',
    align: 'left',
    label: 'Release Date',
    field: 'releaseDate',
    sortable: true
  },
  {
    name: 'createTime',
    align: 'left',
    label: 'Create Time',
    field: 'createTime',
    sortable: true
  },
  {
    name: 'updateTime',
    align: 'left',
    label: 'Update Time',
    field: 'updateTime',
    sortable: true
  },
  {
    name: 'action',
    align: 'left',
    label: 'Actions',
    field: 'action',
    sortable: false
  }
]);

// ==============================================
// 分页配置
// ==============================================

/** 表格分页配置 */
const pagination = ref({
  rowsPerPage: 10,     // 每页显示行数
  sortBy: 'id',        // 默认排序字段
  descending: false    // 默认排序方向（升序）
});

// ==============================================
// 工具函数
// ==============================================

/**
 * 格式化日期字符串
 * @param dateString - 日期字符串
 * @returns 格式化后的日期字符串
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// ==============================================
// 业务方法
// ==============================================

/**
 * 打开添加专辑对话框
 */
const addAlbum = () => {
  resetForm();
  isEditMode.value = false;
  showAddEditDialog.value = true;
};

/**
 * 打开编辑专辑对话框
 * @param album - 要编辑的专辑对象
 */
const editAlbum = (album: Album) => {
  selectedAlbum.value = { ...album };
  albumForm.value = {
    title: album.title,
    coverId: album.coverId,
    coverUrl: album.coverUrl || '',
    releaseDate: album.releaseDate || '',
    description: album.description || ''
  };
  isEditMode.value = true;
  showAddEditDialog.value = true;
};

/**
 * 打开查看专辑详情对话框
 * @param album - 要查看的专辑对象
 */
const viewAlbum = (album: Album) => {
  selectedAlbum.value = { ...album };
  showViewDialog.value = true;
};

/**
 * 保存专辑（添加或更新）
 */
const saveAlbum = () => {
  // 验证必填字段
  if (!albumForm.value.title) {
    $q.notify({
      type: 'negative',
      message: 'Please enter album title'
    });
    return;
  }

  if (isEditMode.value && selectedAlbum.value.id) {
    // 更新现有专辑
    const index = data.value.findIndex(a => a.id === selectedAlbum.value.id);
    if (index !== -1) {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      data.value[index] = {
        ...data.value[index],
        title: albumForm.value.title,
        coverId: albumForm.value.coverId,
        coverUrl: albumForm.value.coverUrl,
        releaseDate: albumForm.value.releaseDate,
        description: albumForm.value.description,
        updateTime: now
      };
    }
    $q.notify({
      type: 'positive',
      message: 'Album updated successfully'
    });
  } else {
    // 添加新专辑
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const newId = data.value.length > 0 ? Math.max(...data.value.map(a => a.id)) + 1 : 1;
    const newAlbum: Album = {
      id: newId,
      title: albumForm.value.title,
      coverId: albumForm.value.coverId,
      coverUrl: albumForm.value.coverUrl,
      releaseDate: albumForm.value.releaseDate,
      description: albumForm.value.description,
      createTime: now,
      updateTime: now
    };
    data.value.push(newAlbum);
    $q.notify({
      type: 'positive',
      message: 'Album added successfully'
    });
  }

  // 关闭对话框并重置表单
  showAddEditDialog.value = false;
  resetForm();
};

/**
 * 删除专辑
 * @param album - 要删除的专辑对象
 */
const deleteAlbum = (album: Album) => {
  // 显示确认对话框
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete album "${album.title}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    // 从数据列表中移除专辑
    const index = data.value.findIndex(a => a.id === album.id);
    if (index !== -1) {
      data.value.splice(index, 1);
      $q.notify({
        type: 'positive',
        message: 'Album deleted successfully'
      });
    }
  });
};

/**
 * 重置表单数据
 */
const resetForm = () => {
  albumForm.value = {
    title: '',
    coverId: undefined,
    coverUrl: '',
    releaseDate: '',
    description: ''
  };
  selectedAlbum.value = {} as Album;
};

// ==============================================
// CSV导出相关函数
// ==============================================

/**
 * 包装CSV值，处理特殊字符
 * @param val - 原始值
 * @param formatFn - 格式化函数（可选）
 * @returns 包装后的CSV值
 */
function wrapCsvValue(val: any, formatFn?: Function): string {
  let formatted = formatFn !== void 0 ? formatFn(val) : val;
  formatted = formatted === void 0 || formatted === null ? '' : String(formatted);
  formatted = formatted.split('"').join('""');
  return `"${formatted}"`;
}

/**
 * 导出表格数据为CSV文件
 */
const exportTable = () => {
  // 构建CSV内容
  const content = [columns.value.map(col => wrapCsvValue(col.label))]
    .concat(
      data.value.map(row =>
        columns.value
          .map(col =>
            wrapCsvValue(
              typeof col.field === 'function'
                ? col.field(row)
                : row[col.field as keyof Album],
              (col as any).format
            )
          )
          .join(',')
      )
    )
    .join('\r\n');

  // 导出文件
  const status = exportFile('album-management.csv', content, 'text/csv');
  if (status !== true) {
    $q.notify({
      type: 'negative',
      message: 'Browser denied file download...',
      icon: 'warning'
    });
  }
};

// ==============================================
// 生命周期钩子
// ==============================================

/**
 * 组件挂载后的初始化操作
 */
onMounted(() => {
  // 按ID降序排序，显示最新的专辑在前
  data.value.sort((a, b) => b.id - a.id);
});
</script>

<style scoped>
/* 头像图片样式 */
.q-avatar img {
  object-fit: cover;
}

/* ==============================================
   网格视图样式
   ============================================== */

/* 网格项过渡动画 */
.grid-style-transition {
  transition: transform .3s;
}

/* 鼠标悬停效果 */
.grid-style-transition:hover {
  transform: translateY(-5px);
}

/* 卡片基础样式 */
.my-card {
  border-radius: 10px;
  transition: all 0.3s ease;
  height: 100%;
}

/* 卡片悬停阴影 */
.my-card:hover {
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
</style>
