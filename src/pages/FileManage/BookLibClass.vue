<script lang="ts" setup>
/**
 * 书籍的图书馆分类法表格
 * */
import { ref, computed, onMounted, watch } from "vue";
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

// 查询条件接口
interface QueryCondition {
  code: string | null;
  name: string | null;
  parent_code: string | null;
  level: number | null;
  path: string | null;
}

// 表格分页配置
const pagination = ref({
  sortBy: 'code',             // 默认按分类号排序
  descending: false,          // 升序排列
  page: 1,                    // 当前页码
  rowsPerPage: 20             // 每页显示行数，可根据需要调整
});

// 搜索过滤条件
const filter = ref<string>("");

// 选中的行数据
const selectedRows = ref<BookLibClass[]>([]);

// 查询条件
const queryCondition = ref<QueryCondition>({
  code: null,
  name: null,
  parent_code: null,
  level: null,
  path: null
});

// 是否显示高级查询面板
const showAdvancedQuery = ref(false);

// 是否启用多选模式，默认关闭（即单选模式）
const enableMultipleSelection = ref(false);

// 表格数据
const rows = ref<BookLibClass[]>([]);
// 原始数据（用于重置和筛选）
const originalRows = ref<BookLibClass[]>([]);

// 计算分类号下拉框选项
const codeOptions = computed(() => {
  const options: Array<{ value: string; label: string }> = [];
  const seen = new Set<string>();

  originalRows.value.forEach(item => {
    if (!seen.has(item.code)) {
      seen.add(item.code);
      options.push({
        value: item.code,
        label: `${item.code} - ${item.name}`
      });
    }
  });

  // 按分类号排序
  return options.sort((a, b) => a.value.localeCompare(b.value));
});

// 计算父分类号下拉框选项
const parentCodeOptions = computed(() => {
  const options: Array<{ value: string | null; label: string }> = [
    { value: null, label: '所有分类' }
  ];
  const seen = new Set<string>();

  originalRows.value.forEach(item => {
    if (item.parent_code && !seen.has(item.parent_code)) {
      seen.add(item.parent_code);
      // 查找父分类名称
      const parent = originalRows.value.find(row => row.code === item.parent_code);
      const label = parent ? `${item.parent_code} - ${parent.name}` : item.parent_code;
      options.push({
        value: item.parent_code,
        label
      });
    }
  });

  // 按分类号排序
  return options.sort((a, b) => {
    if (a.value === null) return -1;
    if (b.value === null) return 1;
    return a.value.localeCompare(b.value);
  });
});

// 计算总页数
const pagesNumber = computed(() => {
  return Math.ceil(filteredRows.value.length / pagination.value.rowsPerPage);
});

// 计算当前页数据
const paginatedRows = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const end = start + pagination.value.rowsPerPage;
  return filteredRows.value.slice(start, end);
});

// 应用查询条件过滤数据
const filteredRows = computed(() => {
  if (!queryCondition.value.code &&
    !queryCondition.value.name &&
    !queryCondition.value.parent_code &&
    !queryCondition.value.level &&
    !queryCondition.value.path) {
    return originalRows.value;
  }

  return originalRows.value.filter(row => {
    // 按分类号查询
    if (queryCondition.value.code && row.code !== queryCondition.value.code) {
      return false;
    }

    // 按名称查询（模糊匹配）
    if (queryCondition.value.name && !row.name.includes(queryCondition.value.name)) {
      return false;
    }

    // 按父分类号查询
    if (queryCondition.value.parent_code !== null) {
      if (queryCondition.value.parent_code === '' && row.parent_code !== null) {
        return false;
      }
      if (queryCondition.value.parent_code !== '' && row.parent_code !== queryCondition.value.parent_code) {
        return false;
      }
    }

    // 按层级查询
    if (queryCondition.value.level !== null && row.level !== queryCondition.value.level) {
      return false;
    }

    // 按路径查询（模糊匹配）
    return !(queryCondition.value.path && !row.path.includes(queryCondition.value.path));


  });
});

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
 * 处理行选择事件
 */
const handleRowSelection = () => {
  // 如果是单选模式，确保只选中一行
  if (!enableMultipleSelection.value && selectedRows.value.length > 1) {
    // 只保留最后选择的一行（最新选择的）
    selectedRows.value = [selectedRows.value[selectedRows.value.length - 1]];
  }
};

/**
 * 处理多选模式切换
 */
const handleMultipleSelectionToggle = (value: boolean) => {
  // 如果关闭多选模式（切换到单选）且当前选中了多行，只保留第一行
  if (!value && selectedRows.value.length > 1) {
    selectedRows.value = [selectedRows.value[0]];
    $q.notify({
      message: '已切换到单选模式，只保留第一个选中项',
      color: 'info',
      position: 'top',
      timeout: 1500
    });
  }

  // 如果开启多选模式，显示提示
  if (value) {
    $q.notify({
      message: '已启用多选模式',
      color: 'positive',
      position: 'top',
      timeout: 1500
    });
  }
};

/**
 * 执行查询
 */
const executeQuery = () => {
  // 重置到第一页
  pagination.value.page = 1;
  // 查询条件变化会自动触发 filteredRows 重新计算
  $q.notify({
    message: '查询完成',
    color: 'info',
    position: 'top',
    timeout: 1000
  });
};

/**
 * 重置查询条件
 */
const resetQuery = () => {
  queryCondition.value = {
    code: null,
    name: null,
    parent_code: null,
    level: null,
    path: null
  };
  pagination.value.page = 1;
  $q.notify({
    message: '查询条件已重置',
    color: 'info',
    position: 'top',
    timeout: 1000
  });
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
    const data = generateMockData();
    rows.value = data;
    originalRows.value = [...data];
  }, 500);
});

// 监听查询条件变化，自动执行查询（或者可以改为手动点击查询按钮）
watch(queryCondition, () => {
  // 可以在这里添加防抖逻辑
  executeQuery();
}, { deep: true });

// 监听多选模式变化
watch(enableMultipleSelection, handleMultipleSelectionToggle);
</script>

<template>
  <page-content class="q-pa-sm">
    <!-- 图书分类管理表格 -->
    <q-table
      class="sticky-table"
      :selection="enableMultipleSelection ? 'multiple' : 'single'"
      v-model:selected="selectedRows"
      @update:selected="handleRowSelection"
      :dense="$q.screen.lt.md"
      separator="cell"
      flat
      bordered
      :rows="paginatedRows"
      :filter="filter"
      :columns="columns"
      row-key="code"
      style="height: 600px"
      virtual-scroll
      v-model:pagination="pagination"
    >
      <!-- 顶部工具栏 -->
      <template v-slot:top>
        <div class="full-width">
          <!-- 第一行：操作按钮和搜索框 -->
          <div class="row items-center q-mb-md">
            <div class="col-auto">
              <q-btn color="primary" label="新增分类" />
              <q-btn
                class="q-ml-sm"
                :color="showAdvancedQuery ? 'secondary' : 'primary'"
                :label="showAdvancedQuery ? '收起查询' : '高级查询'"
                @click="showAdvancedQuery = !showAdvancedQuery"
                icon="filter_list"
              />

              <!-- 多选模式切换 -->
              <q-btn
                class="q-ml-sm"
                :color="enableMultipleSelection ? 'secondary' : 'grey-7'"
                :icon="enableMultipleSelection ? 'check_box' : 'check_box_outline_blank'"
                label="多选"
                @click="enableMultipleSelection = !enableMultipleSelection"
              />

              <q-btn
                v-if="enableMultipleSelection"
                class="q-ml-sm"
                color="primary"
                label="删除选中"
                :disabled="!selectedRows.length"
                @click="deleteSelectedRows"
              />

              <!-- 已选中数量提示 -->
              <q-badge
                v-if="selectedRows.length > 0"
                class="q-ml-sm"
                color="primary"
                :label="`已选中 ${selectedRows.length} 项`"
              />
            </div>
            <q-space />
            <!-- 搜索框 -->
            <q-input
              dense
              outlined
              debounce="300"
              v-model="filter"
              placeholder="搜索分类..."
              class="col-3"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- 第二行：高级查询面板 -->
          <q-slide-transition>
            <div v-if="showAdvancedQuery" class="q-pa-md bg-grey-2 rounded-borders q-mb-md">
              <q-form @submit.prevent="executeQuery" class="row q-col-gutter-md">
                <!-- 分类号查询 -->
                <div class="col-12 col-sm-6 col-md-4">
                  <q-select
                    outlined
                    dense
                    v-model="queryCondition.code"
                    :options="codeOptions"
                    label="分类号"
                    clearable
                    map-options
                    emit-value
                    option-value="value"
                    option-label="label"
                    placeholder="选择分类号"
                  />
                </div>

                <!-- 分类名称查询 -->
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    outlined
                    dense
                    v-model="queryCondition.name"
                    label="分类名称"
                    placeholder="输入分类名称"
                    clearable
                  />
                </div>

                <!-- 父分类号查询 -->
                <div class="col-12 col-sm-6 col-md-4">
                  <q-select
                    outlined
                    dense
                    v-model="queryCondition.parent_code"
                    :options="parentCodeOptions"
                    label="父分类号"
                    clearable
                    map-options
                    emit-value
                    option-value="value"
                    option-label="label"
                    placeholder="选择父分类号"
                  />
                </div>

                <!-- 层级查询 -->
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    outlined
                    dense
                    v-model="queryCondition.level"
                    label="层级"
                    placeholder="输入层级"
                    type="number"
                    min="1"
                    max="10"
                    clearable
                  />
                </div>

                <!-- 路径查询 -->
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    outlined
                    dense
                    v-model="queryCondition.path"
                    label="节点路径"
                    placeholder="输入节点路径"
                    clearable
                  />
                </div>

                <!-- 操作按钮 -->
                <div class="col-12 col-sm-6 col-md-4 row items-center">
                  <q-btn
                    color="primary"
                    label="查询"
                    type="submit"
                    class="q-mr-sm"
                  />
                  <q-btn
                    color="secondary"
                    label="重置"
                    @click="resetQuery"
                    outline
                  />
                </div>
              </q-form>
            </div>
          </q-slide-transition>
        </div>
      </template>

      <!-- 底部分页 -->
      <template v-slot:bottom>
        <div class="full-width row justify-between items-center">
          <div class="q-pa-sm text-caption text-grey">
            显示 {{ Math.min((pagination.page - 1) * pagination.rowsPerPage + 1, filteredRows.length) }}
            到 {{ Math.min(pagination.page * pagination.rowsPerPage, filteredRows.length) }}
            条，共 {{ filteredRows.length }} 条记录
            <span v-if="selectedRows.length > 0" class="q-ml-sm">
            （已选中 {{ selectedRows.length }} 项）
          </span>
          </div>
          <q-pagination
            v-model="pagination.page"
            :max="pagesNumber"
            direction-links
            boundary-numbers
          />
        </div>
      </template>

      <!--  单选多选按钮 -->
      <template v-slot:header-selection="scope">
        <q-toggle v-model="scope.selected" />
      </template>

      <template v-slot:body-selection="scope">
        <q-toggle v-model="scope.selected" />
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

<style lang="sass" scoped>
</style>
