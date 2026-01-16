<script lang="ts" setup>
/**
 * 书籍的图书馆分类法表格
 * */
import { ref, computed, onMounted } from "vue";
import PageContent from "@/components/Common/PageContent.vue";
import { useQuasar } from 'quasar';

// 定义组件名称
defineOptions({ name: "BookLibClass" });

const $q = useQuasar();

// 定义图书分类数据类型接口
interface BookLibClass {
  code: string;               // 分类号
  name: string;               // 分类名称
  parent_code: string | null; // 父分类号
  level: number;              // 节点层级
  path: string;               // 节点路径
  description: string | null; // 分类描述
  create_time: string;        // 创建时间
  update_time: string;        // 更新时间
}

// 表格分页配置
const pagination = ref({
  sortBy: 'code',             // 默认按分类号排序
  descending: false,          // 升序排列
  page: 1,                    // 当前页码
  rowsPerPage: 20             // 每页显示行数，可根据需要调整
});

// 计算总页数
const pagesNumber = computed(() => {
  return Math.ceil(rows.value.length / pagination.value.rowsPerPage);
});

// 搜索过滤条件
const filter = ref<string>("");

// 选中的行数据
const selectedRows = ref<BookLibClass[]>([]);

// 表格列定义，对应 lib_class 表的字段
const columns = ref([
  {
    name: 'code',
    required: true,
    label: '分类号',
    align: 'left',
    field: (row: BookLibClass) => row.code,
    sortable: true,
    headerClasses: 'bg-grey-3'
  },
  {
    name: 'name',
    required: true,
    label: '分类名称',
    align: 'left',
    field: (row: BookLibClass) => row.name,
    sortable: true
  },
  {
    name: 'parent_code',
    label: '父分类号',
    align: 'center',
    field: (row: BookLibClass) => row.parent_code || '无',
    sortable: true
  },
  {
    name: 'level',
    label: '层级',
    align: 'center',
    field: (row: BookLibClass) => row.level,
    sortable: true
  },
  {
    name: 'path',
    label: '节点路径',
    align: 'left',
    field: (row: BookLibClass) => row.path,
    sortable: true
  },
  {
    name: 'description',
    label: '分类描述',
    align: 'left',
    field: (row: BookLibClass) => row.description
  },
  {
    name: 'create_time',
    label: '创建时间',
    align: 'center',
    field: (row: BookLibClass) => formatDate(row.create_time),
    sortable: true
  },
  {
    name: 'update_time',
    label: '更新时间',
    align: 'center',
    field: (row: BookLibClass) => formatDate(row.update_time),
    sortable: true
  },
  {
    name: 'actions',
    label: '操作',
    align: 'center',
    field: '', // 操作列不需要field
    sortable: false
  }
]);

// 表格数据
const rows = ref<BookLibClass[]>([]);

/**
 * 模拟数据生成函数 - 实际项目中应从API获取
 */
const generateMockData = (): BookLibClass[] => {
  const mockData: BookLibClass[] = [];
  const now = new Date().toISOString();

  // 生成一级分类
  const topLevelCategories = ['A', 'B', 'C', 'D', 'E'];
  topLevelCategories.forEach((prefix, index) => {
    const code = `${prefix}${String(index + 1).padStart(2, '0')}`;
    mockData.push({
      code,
      name: `图书分类${prefix}`,
      parent_code: null,
      level: 1,
      path: code,
      description: `这是${prefix}类图书的分类描述`,
      create_time: now,
      update_time: now
    });

    // 为每个一级分类生成二级分类
    for (let j = 1; j <= 3; j++) {
      const subCode = `${code}.${String(j).padStart(2, '0')}`;
      mockData.push({
        code: subCode,
        name: `${code}子分类${j}`,
        parent_code: code,
        level: 2,
        path: `${code},${subCode}`,
        description: `这是${code}的第${j}个子分类`,
        create_time: now,
        update_time: now
      });

      // 为部分二级分类生成三级分类
      if (j === 1) {
        const thirdCode = `${subCode}.01`;
        mockData.push({
          code: thirdCode,
          name: `${subCode}子分类01`,
          parent_code: subCode,
          level: 3,
          path: `${code},${subCode},${thirdCode}`,
          description: `这是${subCode}的子分类`,
          create_time: now,
          update_time: now
        });
      }
    }
  });

  return mockData;
};

/**
 * 日期格式化函数
 * @param dateString ISO格式日期字符串
 * @returns 格式化后的日期字符串
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
};

/**
 * 根据层级获取颜色标签
 * @param level 分类层级
 * @returns 颜色名称
 */
const getLevelColor = (level: number): string => {
  switch (level) {
    case 1: return 'blue';
    case 2: return 'green';
    case 3: return 'orange';
    case 4: return 'red';
    default: return 'grey';
  }
};

/**
 * 截断文本，超出指定长度显示省略号
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 处理后的文本
 */
const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * 编辑行数据
 * @param row 行数据
 */
const editRow = (row: BookLibClass): void => {
  console.log('编辑行:', row);
  // 这里应该打开编辑对话框或跳转到编辑页面
  $q.notify({
    message: `编辑分类: ${row.name}`,
    color: 'info',
    position: 'top'
  });
};

/**
 * 删除单行数据
 * @param row 行数据
 */
const deleteRow = (row: BookLibClass): void => {
  $q.dialog({
    title: '确认删除',
    message: `确定要删除分类 "${row.name}" 吗？`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    // 实际项目中应该调用API删除
    const index = rows.value.findIndex(item => item.code === row.code);
    if (index !== -1) {
      rows.value.splice(index, 1);
      $q.notify({
        message: `分类 "${row.name}" 已删除`,
        color: 'positive',
        position: 'top'
      });
    }
  });
};

/**
 * 删除选中的多行数据
 */
const deleteSelectedRows = (): void => {
  if (selectedRows.value.length === 0) return;

  $q.dialog({
    title: '确认删除',
    message: `确定要删除选中的 ${selectedRows.value.length} 个分类吗？`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    // 实际项目中应该调用API批量删除
    const selectedCodes = selectedRows.value.map(row => row.code);
    rows.value = rows.value.filter(row => !selectedCodes.includes(row.code));
    selectedRows.value = [];
    $q.notify({
      message: `已删除 ${selectedCodes.length} 个分类`,
      color: 'positive',
      position: 'top'
    });
  });
};

// 组件挂载时加载数据
onMounted(() => {
  // 模拟API调用获取数据
  setTimeout(() => {
    rows.value = generateMockData();
  }, 500);
});
</script>

<template>
  <page-content class="q-pa-sm">
    <!-- 图书分类管理表格 -->
    <q-table
      selection="multiple"
      v-model:selected="selectedRows"
      :dense="$q.screen.lt.md"
      separator="cell"
      flat
      bordered
      :rows="rows"
      :filter="filter"
      :columns="columns"
      row-key="code"
      style="height: 500px"
      virtual-scroll
      v-model:pagination="pagination"
    >
    <!-- 顶部工具栏 -->
    <template v-slot:top>
      <q-btn color="primary" label="新增分类" />
      <q-btn
        class="q-ml-sm"
        color="primary"
        label="删除选中"
        :disabled="!selectedRows.length"
        @click="deleteSelectedRows"
      />
      <q-space />
      <!-- 搜索框 -->
      <q-input
        dense
        outlined
        debounce="300"
        v-model="filter"
        placeholder="搜索分类..."
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>

    <!-- 底部分页 -->
    <template v-slot:bottom>
      <div class="full-width row justify-center">
        <q-pagination
          v-model="pagination.page"
          :max="pagesNumber"
          direction-links
          boundary-numbers
        />
      </div>
    </template>

    <!-- 自定义单元格模板示例：分类描述 -->
    <template v-slot:body-cell-description="props">
      <q-td :props="props">
        <!-- 如果描述为空，显示占位符 -->
        <span v-if="!props.value || props.value.trim() === ''">
            暂无描述
          </span>
        <span v-else :title="props.value">
            {{ truncateText(props.value, 30) }}
          </span>
      </q-td>
    </template>

    <!-- 自定义单元格模板示例：分类层级 -->
    <template v-slot:body-cell-level="props">
      <q-td :props="props">
        <!-- 根据层级显示不同的标签 -->
        <q-badge :color="getLevelColor(props.value)" :label="`层级 ${props.value}`" />
      </q-td>
    </template>

    <!-- 自定义单元格模板示例：操作列 -->
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn
          flat
          dense
          color="primary"
          icon="edit"
          @click="editRow(props.row)"
        />
        <q-btn
          flat
          dense
          color="negative"
          icon="delete"
          class="q-ml-sm"
          @click="deleteRow(props.row)"
        />
      </q-td>
    </template>
    </q-table>

  </page-content>
</template>

<style scoped>

</style>
