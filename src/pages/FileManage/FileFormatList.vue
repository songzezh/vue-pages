<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table
        title="文件格式管理"
        :rows="data"
        :columns="columns"
        row-key="id"
        :filter="filter"
        v-model:pagination="pagination"
        :loading="loading"
      >
        <template v-slot:top-right>
          <!-- 新增按钮 -->
          <q-btn
            @click="addFormat"
            color="primary"
            icon="add"
            label="新增格式"
            class="q-mr-sm"
          />

          <!-- 搜索框 -->
          <q-input
            dense
            outlined
            v-model="filter"
            placeholder="搜索扩展名或格式"
            style="min-width: 300px"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <!-- 格式类型标签显示 -->
        <template v-slot:body-cell-format="props">
          <q-td :props="props">
            <q-badge
              :color="getFormatColor(props.row.format)"
              :label="getFormatLabel(props.row.format)"
              class="q-px-sm"
            />
          </q-td>
        </template>

        <!-- 操作列 -->
        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <q-btn
                dense
                size="sm"
                color="primary"
                icon="edit"
                @click="editFormat(props.row)"
              />
              <q-btn
                dense
                size="sm"
                color="red"
                icon="delete"
                @click="confirmDelete(props.row)"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- 新增/编辑对话框 -->
    <q-dialog v-model="showFormatDialog">
      <q-card style="width: 400px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">
            {{ isEditMode ? "编辑文件格式" : "新增文件格式" }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveFormat">
            <div class="q-gutter-md">
              <!-- 文件扩展名 -->
              <q-input
                label="文件扩展名"
                v-model="currentFormat.extname"
                placeholder="如：.pdf, .jpg, .mp4"
                :rules="[
                  (val) => !!val || '扩展名不能为空',
                  (val) =>
                    /^\.[a-zA-Z0-9]+$/.test(val) ||
                    '扩展名必须以点开头且只包含字母数字',
                ]"
                outlined
                dense
                @update:model-value="onExtnameChange"
              />

              <!-- 格式类型 -->
              <q-select
                label="格式类型"
                v-model="currentFormat.format"
                :options="formatOptions"
                emit-value
                map-options
                :rules="[(val) => !!val || '请选择格式类型']"
                outlined
                dense
              />
            </div>

            <div class="q-pt-lg">
              <q-btn label="取消" color="grey" v-close-popup class="q-mr-sm" />
              <q-btn label="保存" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 删除确认对话框 -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">确认删除</div>
        </q-card-section>

        <q-card-section>
          确定要删除文件格式 "{{ currentFormat.extname }} ({{ getFormatLabel(currentFormat.format) }})" 吗？
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" v-close-popup />
          <q-btn flat label="确定删除" color="red" @click="deleteFormat" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'

// 文件格式接口
interface FileFormat {
  id?: number
  extname: string
  format: string
  create_time?: string
  update_time?: string
}

// Quasar工具
const $q = useQuasar()

// 格式类型选项
const formatOptions = [
  { label: '文档', value: 'DOCUMENT' },
  { label: '图片', value: 'IMAGE' },
  { label: '视频', value: 'VIDEO' },
  { label: '音频', value: 'AUDIO' },
  { label: '压缩包', value: 'ARCHIVE' },
  { label: '代码', value: 'CODE' },
  { label: '数据', value: 'DATA' },
  { label: '可执行文件', value: 'EXECUTABLE' },
  { label: '字体', value: 'FONT' },
  { label: '其他', value: 'OTHER' },
]

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
    name: 'extname',
    label: '文件扩展名',
    field: 'extname',
    align: 'left',
    sortable: true,
  },
  {
    name: 'format',
    label: '格式类型',
    field: 'format',
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
]

// 响应式数据
const data = ref<FileFormat[]>([])
const loading = ref(false)
const filter = ref('')
const pagination = ref({
  rowsPerPage: 10,
})

const showFormatDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditMode = ref(false)
const currentFormat = ref<FileFormat>({
  extname: '',
  format: 'OTHER',
})

// 根据格式值获取标签
const getFormatLabel = (formatValue: string): string => {
  const option = formatOptions.find(opt => opt.value === formatValue)
  return option ? option.label : formatValue
}

// 根据格式类型获取颜色
const getFormatColor = (format: string): string => {
  switch (format) {
    case 'DOCUMENT':
      return 'blue'
    case 'IMAGE':
      return 'green'
    case 'VIDEO':
      return 'red'
    case 'AUDIO':
      return 'orange'
    case 'ARCHIVE':
      return 'purple'
    case 'CODE':
      return 'indigo'
    case 'DATA':
      return 'teal'
    case 'EXECUTABLE':
      return 'brown'
    case 'FONT':
      return 'deep-orange'
    default:
      return 'grey'
  }
}


// 扩展名输入变化处理
const onExtnameChange = (val: string) => {
  if (val && !val.startsWith('.')) {
    currentFormat.value.extname = '.' + val
  } else {
    currentFormat.value.extname = val
  }
}

// 新增格式
const addFormat = () => {
  isEditMode.value = false
  currentFormat.value = {
    extname: '',
    format: 'OTHER',
  }
  showFormatDialog.value = true
}

// 编辑格式
const editFormat = (format: FileFormat) => {
  isEditMode.value = true
  currentFormat.value = { ...format }
  showFormatDialog.value = true
}

// 保存格式（新增/编辑）
const saveFormat = () => {
  // 确保扩展名小写存储
  const formatToSave = {
    ...currentFormat.value,
    extname: currentFormat.value.extname.toLowerCase(),
  }

  // 检查唯一性约束
  const exists = data.value.some(item =>
    item.extname.toLowerCase() === formatToSave.extname.toLowerCase() &&
    item.format === formatToSave.format &&
    item.id !== formatToSave.id
  )

  if (exists) {
    $q.notify({
      type: 'negative',
      message: '该扩展名和格式组合已存在',
    })
    return
  }

  if (isEditMode.value) {
    // 更新现有格式
    const index = data.value.findIndex((item) => item.id === formatToSave.id)
    if (index !== -1) {
      data.value[index] = {
        ...formatToSave,
        update_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
    }
  } else {
    // 新增格式
    const newFormat: FileFormat = {
      id: data.value.length > 0 ? Math.max(...data.value.map(d => d.id || 0)) + 1 : 1,
      ...formatToSave,
      create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      update_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    data.value.unshift(newFormat)
  }

  showFormatDialog.value = false
  $q.notify({
    type: 'positive',
    message: isEditMode.value ? '文件格式已更新' : '文件格式已添加',
  })
}

// 确认删除
const confirmDelete = (format: FileFormat) => {
  currentFormat.value = { ...format }
  showDeleteDialog.value = true
}

// 删除格式
const deleteFormat = () => {
  const index = data.value.findIndex((item) => item.id === currentFormat.value.id)
  if (index !== -1) {
    data.value.splice(index, 1)
    $q.notify({
      type: 'positive',
      message: '文件格式已删除',
    })
  }
  showDeleteDialog.value = false
}

// 模拟加载数据
const loadData = () => {
  loading.value = true
  // 模拟API调用延迟
  setTimeout(() => {
    data.value = [
      {
        id: 1,
        extname: '.pdf',
        format: 'DOCUMENT',
        create_time: '2024-01-15 10:30:00',
        update_time: '2024-01-15 10:30:00',
      },
      {
        id: 2,
        extname: '.jpg',
        format: 'IMAGE',
        create_time: '2024-01-16 14:20:00',
        update_time: '2024-01-16 14:20:00',
      },
      {
        id: 3,
        extname: '.png',
        format: 'IMAGE',
        create_time: '2024-01-16 15:30:00',
        update_time: '2024-01-16 15:30:00',
      },
      {
        id: 4,
        extname: '.mp4',
        format: 'VIDEO',
        create_time: '2024-01-17 09:15:00',
        update_time: '2024-01-17 09:15:00',
      },
      {
        id: 5,
        extname: '.mp3',
        format: 'AUDIO',
        create_time: '2024-01-18 16:45:00',
        update_time: '2024-01-18 16:45:00',
      },
      {
        id: 6,
        extname: '.zip',
        format: 'ARCHIVE',
        create_time: '2024-01-19 11:20:00',
        update_time: '2024-01-19 11:20:00',
      },
      {
        id: 7,
        extname: '.js',
        format: 'CODE',
        create_time: '2024-01-20 13:10:00',
        update_time: '2024-01-20 13:10:00',
      },
      {
        id: 8,
        extname: '.json',
        format: 'DATA',
        create_time: '2024-01-21 15:30:00',
        update_time: '2024-01-21 15:30:00',
      },
      {
        id: 9,
        extname: '.exe',
        format: 'EXECUTABLE',
        create_time: '2024-01-22 08:45:00',
        update_time: '2024-01-22 08:45:00',
      },
      {
        id: 10,
        extname: '.ttf',
        format: 'FONT',
        create_time: '2024-01-23 17:00:00',
        update_time: '2024-01-23 17:00:00',
      },
    ]
    loading.value = false
  }, 300)
}

// 页面加载时获取数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>
