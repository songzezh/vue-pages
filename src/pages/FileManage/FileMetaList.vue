<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table
        title="File Meta"
        :rows="data"
        :hide-header="mode === 'grid'"
        :columns="columns"
        row-key="id"
        :grid="mode == 'grid'"
        :filter="filter"
        v-model:pagination="pagination"
      >
        <template v-slot:top-right="props">
          <!-- 新增按钮 -->
          <q-btn
            @click="addFile"
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
            placeholder="搜索文件名"
            class="bg-grey-3 q-pl-sm"
            style="border-radius: 10px"
          >
            <template v-slot:append>
              <q-icon class="q-pr-sm" color="grey-8" name="search" />
            </template>
          </q-input>

          <!-- 全屏按钮 -->
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
              {{ props.inFullscreen ? "退出全屏" : "全屏显示" }}
            </q-tooltip>
          </q-btn>

          <!-- 视图切换 -->
          <q-toggle
            v-model="viewToggle"
            @click="toggleViewMode"
            v-if="!props.inFullscreen"
          >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup>
              {{ mode === "grid" ? "列表视图" : "网格视图" }}
            </q-tooltip>
          </q-toggle>

          <!-- 导出CSV按钮 -->
          <q-btn
            color="primary"
            icon-right="archive"
            label="导出CSV"
            no-caps
            @click="exportTable"
            class="q-ml-sm"
          />
        </template>

        <!-- 文件大小格式化显示 -->
        <template v-slot:body-cell-size="props">
          <q-td :props="props">
            {{ formatFileSize(props.row.size) }}
          </q-td>
        </template>

        <!-- 操作列 -->
        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-sm">
              <q-btn dense outline size="sm" color="primary" icon="edit"
                     @click="editFile(props.row)" />
              <q-btn dense outline size="sm" color="primary" icon="visibility"
                     @click="viewFile(props.row)" />
              <q-btn dense outline size="sm" color="red" icon="delete"
                     @click="confirmDelete(props.row)" />
            </div>
          </q-td>
        </template>

        <!-- 网格视图模板 -->
        <template v-slot:item="props" v-if="mode === 'grid'">
          <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3">
            <q-card>
              <q-card-section>
                <div class="text-h6">{{ props.row.filename }}</div>
                <div class="text-caption text-grey">
                  <div>扩展名: {{ props.row.extname || '无' }}</div>
                  <div>大小: {{ formatFileSize(props.row.size) }}</div>
                  <div>创建时间: {{ formatDate(props.row.create_time) }}</div>
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat dense icon="visibility" color="primary"
                       @click="viewFile(props.row)" />
                <q-btn flat dense icon="edit" color="primary"
                       @click="editFile(props.row)" />
                <q-btn flat dense icon="delete" color="red"
                       @click="confirmDelete(props.row)" />
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- 新增/编辑对话框 -->
    <q-dialog v-model="showFileDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '500px', 'max-width': '50vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ isEditMode ? '编辑文件信息' : '新增文件' }}
            <q-btn
              round
              flat
              dense
              icon="close"
              class="float-right"
              color="grey-8"
              v-close-popup
            />
          </div>
        </q-card-section>

        <q-separator class="q-px-md" inset />

        <q-card-section class="q-pt-md">
          <q-form class="q-gutter-md" @submit="saveFile">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">文件名</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentFile.filename"
                    :rules="[val => !!val || '文件名不能为空']"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">文件扩展名</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentFile.extname"
                    placeholder="如：.txt, .jpg, .pdf"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">文件大小(字节)</q-item-label>
                  <q-input
                    dense
                    outlined
                    type="number"
                    v-model.number="currentFile.size"
                    :rules="[val => val >= 0 || '文件大小不能为负数']"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">存储路径</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentFile.storage_path"
                    :rules="[val => !!val || '存储路径不能为空']"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <div class="q-px-md q-pt-sm">
              <q-btn class="full-width" label="保存" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 查看详情对话框 -->
    <q-dialog v-model="showViewDialog">
      <q-card class="q-pa-md" :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '60vw'} : {'width': '100%'}">
        <div class="row full-width">
          <!-- 文件图标 -->
          <div class="full-height self-center q-mr-md"
               :style="$q.platform.is.mobile ? {'width': '100%', 'text-align': 'center', 'margin-bottom': '20px'} : {}">
            <q-avatar :size="$q.platform.is.desktop ? '100px' : '120px'">
              <q-icon :name="getFileIcon(currentFile.extname)" size="60px" color="primary" />
            </q-avatar>
          </div>

          <q-separator :vertical="$q.platform.is.desktop" />

          <!-- 文件详情 -->
          <div class="q-ml-md q-gutter-md" :style="$q.platform.is.mobile ? {'width': '100%'} : {}">
            <div class="row">
              <span class="text-weight-bold">文件名:</span>
              <span class="text-grey-8 q-ml-sm"> {{currentFile.filename}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">扩展名:</span>
              <span class="text-grey-8 q-ml-sm"> {{currentFile.extname || '无'}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">文件大小:</span>
              <span class="text-grey-8 q-ml-sm"> {{formatFileSize(currentFile.size)}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">存储路径:</span>
              <span class="text-grey-8 q-ml-sm"> {{currentFile.storage_path}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">创建时间:</span>
              <span class="text-grey-8 q-ml-sm"> {{formatDate(currentFile.create_time)}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">更新时间:</span>
              <span class="text-grey-8 q-ml-sm"> {{formatDate(currentFile.update_time)}}</span>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>

    <!-- 删除确认对话框 -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">确认删除</div>
        </q-card-section>

        <q-card-section>
          确定要删除文件 "{{ currentFile.filename }}" 吗？此操作不可恢复。
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="确定删除" color="red" @click="deleteFile" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportFile, useQuasar } from 'quasar';

// 文件类型接口
interface FileItem {
  id?: number;
  filename: string;
  extname: string | null;
  size: number;
  storage_path: string;
  create_time?: string;
  update_time?: string;
}

// Quasar工具
const $q = useQuasar();

// 表格列定义
const columns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'filename',
    label: '文件名',
    field: 'filename',
    align: 'left',
    sortable: true,
  },
  {
    name: 'extname',
    label: '扩展名',
    field: 'extname',
    align: 'left',
    sortable: true,
  },
  {
    name: 'size',
    label: '文件大小',
    field: 'size',
    align: 'left',
    sortable: true,
  },
  {
    name: 'storage_path',
    label: '存储路径',
    field: 'storage_path',
    align: 'left',
    sortable: true,
  },
  {
    name: 'create_time',
    label: '创建时间',
    field: 'create_time',
    align: 'left',
    sortable: true,
  },
  {
    name: 'update_time',
    label: '更新时间',
    field: 'update_time',
    align: 'left',
    sortable: true,
  },
  {
    name: 'action',
    label: '操作',
    field: 'action',
    align: 'center',
  },
];

// 响应式数据
const data = ref<FileItem[]>([
  {
    id: 1,
    filename: '报告文档',
    extname: '.pdf',
    size: 2048576,
    storage_path: '/uploads/documents',
    create_time: '2024-01-15 10:30:00',
    update_time: '2024-01-15 10:30:00',
  },
  {
    id: 2,
    filename: '产品图片',
    extname: '.jpg',
    size: 5242880,
    storage_path: '/uploads/images',
    create_time: '2024-01-16 14:20:00',
    update_time: '2024-01-16 14:20:00',
  },
  {
    id: 3,
    filename: '数据备份',
    extname: '.zip',
    size: 1073741824,
    storage_path: '/backups',
    create_time: '2024-01-17 09:15:00',
    update_time: '2024-01-17 09:15:00',
  },
  {
    id: 4,
    filename: '配置文件',
    extname: '.json',
    size: 10240,
    storage_path: '/config',
    create_time: '2024-01-18 16:45:00',
    update_time: '2024-01-18 16:45:00',
  },
]);

const filter = ref('');
const mode = ref<'list' | 'grid'>('list');
const viewToggle = ref(false);
const pagination = ref({
  rowsPerPage: 10,
});

const showFileDialog = ref(false);
const showViewDialog = ref(false);
const showDeleteDialog = ref(false);
const isEditMode = ref(false);
const currentFile = ref<FileItem>({
  filename: '',
  extname: '',
  size: 0,
  storage_path: '',
});

// 根据扩展名获取文件图标
const getFileIcon = (extname: string | null): string => {
  if (!extname) return 'insert_drive_file';

  const ext = extname.toLowerCase();
  if (['.pdf'].includes(ext)) return 'picture_as_pdf';
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) return 'image';
  if (['.doc', '.docx'].includes(ext)) return 'description';
  if (['.xls', '.xlsx'].includes(ext)) return 'table_chart';
  if (['.zip', '.rar', '.7z'].includes(ext)) return 'folder_zip';
  if (['.mp3', '.wav', '.flac'].includes(ext)) return 'audiotrack';
  if (['.mp4', '.avi', '.mov'].includes(ext)) return 'videocam';
  return 'insert_drive_file';
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 切换视图模式
const toggleViewMode = () => {
  mode.value = mode.value === 'grid' ? 'list' : 'grid';
};

// 新增文件
const addFile = () => {
  isEditMode.value = false;
  currentFile.value = {
    filename: '',
    extname: '',
    size: 0,
    storage_path: '',
  };
  showFileDialog.value = true;
};

// 编辑文件
const editFile = (file: FileItem) => {
  isEditMode.value = true;
  currentFile.value = { ...file };
  showFileDialog.value = true;
};

// 查看文件详情
const viewFile = (file: FileItem) => {
  currentFile.value = { ...file };
  showViewDialog.value = true;
};

// 保存文件（新增/编辑）
const saveFile = () => {
  if (isEditMode.value) {
    // 更新现有文件
    const index = data.value.findIndex(item => item.id === currentFile.value.id);
    if (index !== -1) {
      data.value[index] = {
        ...currentFile.value,
        update_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
    }
  } else {
    // 新增文件
    const newFile: FileItem = {
      id: data.value.length + 1,
      ...currentFile.value,
      create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      update_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    data.value.unshift(newFile);
  }

  showFileDialog.value = false;
  $q.notify({
    type: 'positive',
    message: isEditMode.value ? '文件信息已更新' : '文件已添加',
  });
};

// 确认删除
const confirmDelete = (file: FileItem) => {
  currentFile.value = { ...file };
  showDeleteDialog.value = true;
};

// 删除文件
const deleteFile = () => {
  const index = data.value.findIndex(item => item.id === currentFile.value.id);
  if (index !== -1) {
    data.value.splice(index, 1);
    $q.notify({
      type: 'positive',
      message: '文件已删除',
    });
  }
  showDeleteDialog.value = false;
};

// CSV导出相关函数
const wrapCsvValue = (val: any, formatFn?: Function): string => {
  let formatted = formatFn !== void 0 ? formatFn(val) : val;
  formatted = formatted === void 0 || formatted === null ? '' : String(formatted);
  formatted = formatted.split('"').join('""');
  return `"${formatted}"`;
};

const exportTable = () => {
  const content = [columns.map(col => wrapCsvValue(col.label))]
    .concat(
      data.value.map(row =>
        columns
          .map(col => {
            let value = row[col.field as keyof FileItem];
            // 特殊处理文件大小
            if (col.field === 'size') {
              value = formatFileSize(Number(value));
            }
            // 特殊处理日期
            if (col.field === 'create_time' || col.field === 'update_time') {
              value = formatDate(value as string);
            }
            return wrapCsvValue(value);
          })
          .join(',')
      )
    )
    .join('\r\n');

  const status = exportFile('file-management.csv', content, 'text/csv');

  if (status !== true) {
    $q.notify({
      message: '浏览器拒绝文件下载...',
      color: 'negative',
      icon: 'warning',
    });
  }
};
</script>

<style scoped>
</style>
