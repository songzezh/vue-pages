<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table
        title="人物管理"
        :rows="data"
        :hide-header="mode === 'grid'"
        :columns="columns"
        row-key="id"
        :grid="mode == 'grid'"
        :filter="filter"
        v-model:pagination="pagination"
      >
        <template v-slot:top-right="props">
          <!-- 添加按钮 -->
          <q-btn
            @click="addPersonage()"
            flat
            size="lg"
            color="primary"
            icon="add_circle"
            class="q-mr-xs q-pa-none"
          >
            <q-tooltip>添加人物</q-tooltip>
          </q-btn>

          <!-- 搜索框 -->
          <q-input
            dense
            borderless
            v-model="filter"
            placeholder="搜索"
            class="custom-border bg-grey-3 q-pl-sm"
            style="border-radius: 10px"
          >
            <template v-slot:append>
              <q-icon class="q-pr-sm" color="grey-8" name="search" />
            </template>
          </q-input>

          <!-- 全屏切换 -->
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
                props.inFullscreen ? "退出全屏" : "切换全屏"
              }}
            </q-tooltip>
          </q-btn>

          <!-- 视图切换 -->
          <q-toggle
            v-model="viewToggle"
            @click="
              mode = mode === 'grid' ? 'list' : 'grid';
              separator = mode === 'grid' ? 'none' : 'horizontal';"
            v-if="!props.inFullscreen"
          >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup
            >{{ mode === "grid" ? "列表视图" : "网格视图" }}
            </q-tooltip>
          </q-toggle>

          <!-- 导出按钮 -->
          <q-btn
            color="primary"
            icon-right="archive"
            label="导出CSV"
            no-caps
            @click="exportTable"
            class="q-ml-sm"
          />
        </template>

        <!-- 性别显示列 -->
        <template v-slot:body-cell-gender="props">
          <q-td :props="props">
            <q-icon
              :color="getGenderColor(props.row.gender)"
              :name="props.row.gender === 'F' ? 'female' : 'male'"/>
          </q-td>
        </template>

        <!-- 操作列 -->
        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-sm">
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="edit"
                @click="editRow(props.row)"
              >
                <q-tooltip>编辑</q-tooltip>
              </q-btn>
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="visibility"
                @click="openModal(props.row)"
              >
                <q-tooltip>查看详情</q-tooltip>
              </q-btn>
              <q-btn
                dense
                outline
                size="sm"
                color="red"
                icon="delete"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>删除</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <!-- 网格视图 -->
        <template v-slot:item="props" v-if="mode === 'grid'">
          <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3">
            <q-card class="text-center">
              <q-card-section>
                <!-- 头像 -->
                <q-avatar size="80px" class="q-mb-sm">
                  <img
                    v-if="props.row.avatar_url"
                    :src="props.row.avatar_url"
                    :alt="props.row.name"
                  />
                  <q-icon
                    v-else
                    :name="getGenderIcon(props.row.gender)"
                    size="xl"
                    :color="getGenderColor(props.row.gender)"
                  />
                </q-avatar>

                <!-- 姓名 -->
                <div class="text-h6">{{ props.row.name }}</div>

                <!-- 基本信息 -->
                <div class="q-mt-sm text-caption">
                  <div>
                    <q-icon name="flag" size="xs" />
                    {{ props.row.nationality || '未知国籍' }}
                  </div>
                  <div>
                    <q-icon name="business" size="xs" />
                    {{ truncateText(props.row.affiliation, 20) || '未知机构' }}
                  </div>
                  <div>
                    <q-icon name="category" size="xs" />
                    模块: {{ props.row.module || '未知' }}
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-actions align="center">
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="visibility"
                  @click="openModal(props.row)"
                />
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="edit"
                  @click="editRow(props.row)"
                />
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="red"
                  icon="delete"
                  @click="confirmDelete(props.row)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- 添加/编辑对话框 -->
    <q-dialog v-model="addEditPersonage" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '500px', 'max-width': '50vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ addFlag ? '添加人物' : '编辑人物' }}
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
              <!-- 头像URL -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">头像URL</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="personage.avatar_url"
                    placeholder="可选，请输入图片链接"
                  />
                </q-item-section>
              </q-item>

              <!-- 姓名 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">姓名 *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="personage.name"
                    :rules="[val => !!val || '姓名不能为空']"
                    lazy-rules
                  />
                </q-item-section>
              </q-item>

              <!-- 性别 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">性别</q-item-label>
                  <q-select
                    dense
                    outlined
                    v-model="personage.gender"
                    :options="genderOptions"
                    emit-value
                    map-options
                    placeholder="请选择性别"
                  />
                </q-item-section>
              </q-item>

              <!-- 国籍 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">国籍</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="personage.nationality"
                    placeholder="请输入国籍"
                  />
                </q-item-section>
              </q-item>

              <!-- 所属机构 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">所属机构</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="personage.affiliation"
                    placeholder="请输入所属机构"
                  />
                </q-item-section>
              </q-item>

              <!-- 个人主页 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">个人主页</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="personage.homepage"
                    placeholder="请输入个人主页URL"
                  />
                </q-item-section>
              </q-item>

              <!-- 模块 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">模块</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="personage.module"
                    placeholder="请输入模块名称"
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="q-px-md q-pt-sm">
              <q-btn
                class="full-width"
                label="保存"
                type="submit"
                color="primary"
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 查看详情对话框 -->
    <q-dialog v-model="viewPersonage">
      <q-card
        class="q-pa-md"
        :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '60vw'} : {'width': '100%'}"
      >
        <div class="row full-width">
          <!-- 左侧头像区域 -->
          <div
            class="full-height self-center q-mr-md"
            :style="$q.platform.is.mobile ? {'width': '100%', 'text-align': 'center', 'margin-bottom': '20px'} : {}"
          >
            <q-avatar :size="$q.platform.is.desktop ? '150px' : '120px'">
              <img
                v-if="selectedPersonage.avatar_url"
                :src="selectedPersonage.avatar_url"
                :alt="selectedPersonage.name"
              />
              <q-icon
                v-else
                :name="getGenderIcon(selectedPersonage.gender)"
                size="xl"
                :color="getGenderColor(selectedPersonage.gender)"
              />
            </q-avatar>
          </div>

          <q-separator :vertical="$q.platform.is.desktop" />

          <!-- 右侧信息区域 -->
          <div class="q-ml-md q-gutter-md" :style="$q.platform.is.mobile ? {'width': '100%'} : {}">
            <div class="row">
              <span class="text-weight-bold">姓名:</span>
              <span class="text-grey-8 q-ml-sm"> {{selectedPersonage.name}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">性别:</span>
              <span class="text-grey-8 q-ml-sm">
                <q-icon
                  :color="getGenderColor(selectedPersonage.gender)"
                  :name="selectedPersonage.gender === 'F' ? 'female' : 'male'"/>
              </span>
            </div>
            <div class="row">
              <span class="text-weight-bold">国籍:</span>
              <span class="text-grey-8 q-ml-sm"> {{selectedPersonage.nationality || '未知'}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">所属机构:</span>
              <span class="text-grey-8 q-ml-sm"> {{selectedPersonage.affiliation || '未知'}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">个人主页:</span>
              <span class="text-grey-8 q-ml-sm">
                <a
                  v-if="selectedPersonage.homepage"
                  :href="selectedPersonage.homepage"
                  target="_blank"
                  class="text-primary"
                >
                  {{ selectedPersonage.homepage }}
                </a>
                <span v-else>无</span>
              </span>
            </div>
            <div class="row">
              <span class="text-weight-bold">模块:</span>
              <span class="text-grey-8 q-ml-sm">
                <q-chip v-if="selectedPersonage.module" color="info" text-color="white" dense>
                  {{selectedPersonage.module}}
                </q-chip>
                <span v-else>未知</span>
              </span>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>

    <!-- 删除确认对话框 -->
    <q-dialog v-model="showDeleteConfirm">
      <q-card>
        <q-card-section>
          <div class="text-h6">确认删除</div>
        </q-card-section>

        <q-card-section>
          确定要删除人物 "{{ selectedPersonage.name }}" 吗？此操作不可恢复。
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" v-close-popup />
          <q-btn flat label="确定删除" color="negative" @click="deleteRow" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { exportFile, useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';

interface Personage {
  id: number;
  name: string;
  avatar_url: string | null;
  gender: 'M' | 'F' | null;
  nationality: string | null;
  affiliation: string | null;
  homepage: string | null;
  module: string | null;
}

interface MusicContributor {
  id: number;
  music_id: number;
  personage_id: number;
  role: string;
}

interface TableColumn {
  name: string;
  required?: boolean;
  label: string;
  align: 'left' | 'right' | 'center';
  field: string;
  sortable: boolean;
  format?: (val: any) => string;
}

const $q = useQuasar();

// 响应式数据
const viewToggle = ref(false);
const filter = ref('');
const mode = ref<'list' | 'grid'>('list');
const separator = ref('horizontal');
const addEditPersonage = ref(false);
const viewPersonage = ref(false);
const addFlag = ref(true);
const saving = ref(false);
const showDeleteConfirm = ref(false);

// 人物数据
const personage = reactive<Partial<Personage>>({});
const selectedPersonage = reactive<Personage>({
  id: 0,
  name: '',
  avatar_url: null,
  gender: null,
  nationality: null,
  affiliation: null,
  homepage: null,
  module: null
});

// 性别选项
const genderOptions = [
  { label: '男', value: 'M' },
  { label: '女', value: 'F' },
  { label: '未知', value: null }
];

// 表格列定义
const columns = ref<TableColumn[]>([
  {
    name: 'name',
    required: true,
    label: '姓名',
    align: 'left',
    field: 'name',
    sortable: true,
  },
  {
    name: 'gender',
    align: 'center',
    label: '性别',
    field: 'gender',
    sortable: true,
    format: (val: string | null) => {
      if (val === 'M') return '男';
      if (val === 'F') return '女';
      return '未知';
    }
  },
  {
    name: 'nationality',
    align: 'left',
    label: '国籍',
    field: 'nationality',
    sortable: true,
  },
  {
    name: 'affiliation',
    align: 'left',
    label: '所属机构',
    field: 'affiliation',
    sortable: true,
  },
  {
    name: 'homepage',
    align: 'left',
    label: '个人主页',
    field: 'homepage',
    sortable: true,
  },
  {
    name: 'module',
    align: 'left',
    label: '模块',
    field: 'module',
    sortable: true,
  },
  {
    name: 'action',
    align: 'center',
    label: '操作',
    field: 'action',
    sortable: false
  }
]);

// 模拟数据 - 符合personage表结构
const data = ref<Personage[]>([
  {
    id: 1,
    name: '周杰伦',
    avatar_url: 'https://cdn.quasar.dev/img/avatar1.jpg',
    gender: 'M',
    nationality: '中国',
    affiliation: '杰威尔音乐有限公司',
    homepage: 'https://jaychou.com',
    module: '华语流行'
  },
  {
    id: 2,
    name: 'Taylor Swift',
    avatar_url: 'https://cdn.quasar.dev/img/avatar2.jpg',
    gender: 'F',
    nationality: '美国',
    affiliation: 'Republic Records',
    homepage: 'https://taylorswift.com',
    module: '欧美流行'
  },
  {
    id: 3,
    name: '久石让',
    avatar_url: null,
    gender: 'M',
    nationality: '日本',
    affiliation: '日本音乐学院',
    homepage: 'https://hisaishijo.jp',
    module: '电影配乐'
  },
  {
    id: 4,
    name: 'Adele',
    avatar_url: null,
    gender: 'F',
    nationality: '英国',
    affiliation: 'Columbia Records',
    homepage: 'https://adele.com',
    module: '灵魂乐'
  },
  {
    id: 5,
    name: 'Hans Zimmer',
    avatar_url: null,
    gender: 'M',
    nationality: '德国',
    affiliation: 'Remote Control Productions',
    homepage: 'https://hanszimmer.com',
    module: '电影配乐'
  },
  {
    id: 6,
    name: '林俊杰',
    avatar_url: null,
    gender: 'M',
    nationality: '新加坡',
    affiliation: '华纳音乐',
    homepage: 'https://jjlin.com',
    module: '华语流行'
  },
  {
    id: 7,
    name: 'Beyoncé',
    avatar_url: null,
    gender: 'F',
    nationality: '美国',
    affiliation: 'Parkwood Entertainment',
    homepage: 'https://beyonce.com',
    module: 'R&B'
  },
  {
    id: 8,
    name: '坂本龙一',
    avatar_url: null,
    gender: 'M',
    nationality: '日本',
    affiliation: '独立音乐人',
    homepage: 'https://ryuichisakamoto.com',
    module: '实验音乐'
  },
  {
    id: 9,
    name: '王菲',
    avatar_url: null,
    gender: 'F',
    nationality: '中国',
    affiliation: 'Cinepoly Records',
    homepage: null,
    module: '华语流行'
  },
  {
    id: 10,
    name: 'Bruno Mars',
    avatar_url: null,
    gender: 'M',
    nationality: '美国',
    affiliation: 'Atlantic Records',
    homepage: 'https://brunomars.com',
    module: '流行乐'
  },
  {
    id: 11,
    name: '邓紫棋',
    avatar_url: null,
    gender: 'F',
    nationality: '中国',
    affiliation: '蜂鸟音乐',
    homepage: 'https://gem0816.com',
    module: '华语流行'
  },
  {
    id: 12,
    name: 'Ed Sheeran',
    avatar_url: null,
    gender: 'M',
    nationality: '英国',
    affiliation: 'Asylum Records',
    homepage: 'https://edsheeran.com',
    module: '流行乐'
  }
]);

// 分页配置
const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: data.value.length
});

// 获取性别文本
const getGenderText = (gender: string | null): string => {
  if (gender === 'M') return '男';
  if (gender === 'F') return '女';
  return '未知';
};

// 获取性别颜色
const getGenderColor = (gender: string | null): string => {
  if (gender === 'M') return 'blue';
  if (gender === 'F') return 'pink';
  return 'grey';
};

// 获取性别图标
const getGenderIcon = (gender: string | null): string => {
  if (gender === 'M') return 'male';
  if (gender === 'F') return 'female';
  return 'person';
};

// 截断文本
const truncateText = (text: string | null, length: number): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// 打开查看对话框
const openModal = (row: Personage) => {
  Object.assign(selectedPersonage, row);
  viewPersonage.value = true;
};

// 添加人物
const addPersonage = () => {
  Object.assign(personage, {
    id: 0,
    name: '',
    avatar_url: null,
    gender: null,
    nationality: null,
    affiliation: null,
    homepage: null,
    module: null
  });
  addFlag.value = true;
  addEditPersonage.value = true;
};

// 编辑人物
const editRow = (row: Personage) => {
  Object.assign(personage, row);
  addFlag.value = false;
  addEditPersonage.value = true;
};

// 保存人物
const savePersonage = () => {
  saving.value = true;

  // 模拟保存延迟
  setTimeout(() => {
    if (addFlag.value) {
      // 添加新人物
      const newId = data.value.length > 0 ? Math.max(...data.value.map(p => p.id)) + 1 : 1;
      const newPersonage: Personage = {
        id: newId,
        name: personage.name || '',
        avatar_url: personage.avatar_url || null,
        gender: personage.gender || null,
        nationality: personage.nationality || null,
        affiliation: personage.affiliation || null,
        homepage: personage.homepage || null,
        module: personage.module || null
      };
      data.value.unshift(newPersonage);

      $q.notify({
        type: 'positive',
        message: '人物添加成功',
        position: 'top'
      });
    } else {
      // 更新人物
      const index = data.value.findIndex(p => p.id === personage.id);
      if (index !== -1) {
        data.value[index] = { ...personage as Personage };

        $q.notify({
          type: 'positive',
          message: '人物更新成功',
          position: 'top'
        });
      }
    }

    saving.value = false;
    addEditPersonage.value = false;
  }, 500);
};

// 确认删除
const confirmDelete = (row: Personage) => {
  Object.assign(selectedPersonage, row);
  showDeleteConfirm.value = true;
};

// 执行删除
const deleteRow = () => {
  const index = data.value.findIndex(p => p.id === selectedPersonage.id);
  if (index !== -1) {
    data.value.splice(index, 1);

    $q.notify({
      type: 'positive',
      message: '人物删除成功',
      position: 'top'
    });
  }
  showDeleteConfirm.value = false;
};

// CSV导出函数
const wrapCsvValue = (val: any, formatFn?: (val: any) => string) => {
  let formatted = formatFn !== undefined ? formatFn(val) : val;
  formatted = formatted === undefined || formatted === null ? '' : String(formatted);
  formatted = formatted.split('"').join('""');
  return `"${formatted}"`;
};

// 导出表格
const exportTable = () => {
  const content = [columns.value.map(col => wrapCsvValue(col.label))]
    .concat(
      data.value.map(row =>
        columns.value
          .map(col => {
            if (col.field === 'action') return '';

            if (col.format) {
              return wrapCsvValue(row[col.field as keyof Personage], col.format);
            }

            return wrapCsvValue(
              row[col.field as keyof Personage]
            );
          })
          .join(',')
      )
    )
    .join('\r\n');

  const status = exportFile('人物管理.csv', content, 'text/csv');

  if (status !== true) {
    $q.notify({
      type: 'negative',
      message: '浏览器拒绝文件下载...',
      color: 'negative',
      icon: 'warning',
    });
  }
};

// 初始化
onMounted(() => {
  pagination.value.rowsNumber = data.value.length;
});
</script>

<style scoped>
.custom-border {
  border-radius: 5px;
}

.q-table th {
  font-weight: 600;
}

.q-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.q-card {
  border-radius: 8px;
}

.q-avatar img {
  object-fit: cover;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
