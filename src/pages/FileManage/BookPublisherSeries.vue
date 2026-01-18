<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table
        title="Manage Series"
        :rows="series"
        :hide-header="mode === 'grid'"
        :columns="columns"
        row-key="id"
        :grid="mode === 'grid'"
        :filter="filter"
        v-model:pagination="pagination"
      >
        <!-- 列表布局的表头 -->
        <template v-slot:top-right="props">
          <!-- 添加新丛书按钮 -->
          <q-btn
            @click="addSeries()"
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

        <!-- 出版社列：显示为彩色标签 -->
        <template v-slot:body-cell-publisher="props">
          <q-td :props="props">
            <q-chip
              color="teal"
              text-color="white"
              dense
              class="q-px-md"
              square
            >
              {{ getPublisherName(props.row.publisher) }}
            </q-chip>
          </q-td>
        </template>

        <!-- ISSN列：格式化显示印刷版和电子版ISSN号 -->
        <template v-slot:body-cell-issn="props">
          <q-td :props="props">
            <div v-if="props.row.issn || props.row.e_issn">
              <div v-if="props.row.issn">
                <strong>ISSN:</strong> {{ formatISSN(props.row.issn) }}
              </div>
              <div v-if="props.row.e_issn">
                <strong>e-ISSN:</strong> {{ formatISSN(props.row.e_issn) }}
              </div>
            </div>
            <span v-else class="text-grey-6">N/A</span>
          </q-td>
        </template>

        <!-- 操作列：包含查看、网站访问、编辑、删除按钮 -->
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
                @click="viewSeries(props.row)"
              >
                <q-tooltip> Show Details </q-tooltip>
              </q-btn>

              <!-- 访问网站按钮（仅在网站存在时显示） -->
              <q-btn
                v-if="props.row.website"
                dense
                outline
                size="sm"
                color="green"
                icon="language"
                @click="openWebsite(props.row.website)"
              >
                <q-tooltip> Visit Website </q-tooltip>
              </q-btn>

              <!-- 编辑按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="edit"
                @click="editSeries(props.row)"
              >
                <q-tooltip> Edit Record </q-tooltip>
              </q-btn>

              <!-- 删除按钮 -->
              <q-btn
                dense
                outline
                size="sm"
                color="red"
                icon="delete"
                @click="deleteSeries(props.row)"
              >
                <q-tooltip> Delete Record </q-tooltip>
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
                <div class="text-h6">{{ props.row.title }}</div>
                <div class="text-subtitle2 text-grey">
                  {{ getPublisherName(props.row.publisher) }}
                </div>
              </q-card-section>

              <q-separator />

              <!-- 卡片内容区域：显示丛书详细信息 -->
              <q-card-section class="q-pt-none">
                <div class="text-caption text-grey-8">
                  <!-- 编辑者信息 -->
                  <div v-if="props.row.editors">
                    <strong>Editors:</strong> {{ truncateText(props.row.editors, 40) }}
                  </div>
                  <!-- ISSN号信息 -->
                  <div v-if="props.row.issn || props.row.e_issn">
                    <div v-if="props.row.issn">
                      <strong>ISSN:</strong> {{ formatISSN(props.row.issn) }}
                    </div>
                    <div v-if="props.row.e_issn">
                      <strong>e-ISSN:</strong> {{ formatISSN(props.row.e_issn) }}
                    </div>
                  </div>
                  <!-- 描述信息（截断显示） -->
                  <div v-if="props.row.description">
                    <strong>Description:</strong> {{ truncateText(props.row.description, 60) }}
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
                <!-- 与列表布局相同的操作按钮 -->
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="visibility"
                  @click="viewSeries(props.row)"
                >
                  <q-tooltip> Show Details </q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.website"
                  flat
                  dense
                  size="sm"
                  color="green"
                  icon="language"
                  @click="openWebsite(props.row.website)"
                >
                  <q-tooltip> Visit Website </q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="edit"
                  @click="editSeries(props.row)"
                >
                  <q-tooltip> Edit Record </q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="red"
                  icon="delete"
                  @click="deleteSeries(props.row)"
                >
                  <q-tooltip> Delete Record </q-tooltip>
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- 添加/编辑丛书对话框 -->
    <q-dialog v-model="showSeriesDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '50vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ isEditing ? 'Edit Series' : 'Add Series' }}
            <!-- 关闭按钮 -->
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
          <q-form class="q-gutter-md" @submit="saveSeries">
            <q-list>
              <!-- 丛书标题输入框（必填） -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Series Title *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSeries.title"
                    :rules="[val => !!val || 'Title is required']"
                  />
                </q-item-section>
              </q-item>
              <!-- 出版社选择框（必填） -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Publisher *</q-item-label>
                  <q-select
                    dense
                    outlined
                    v-model="currentSeries.publisher"
                    :options="publishers"
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    :rules="[val => !!val || 'Publisher is required']"
                  />
                </q-item-section>
              </q-item>
              <!-- 网站输入框 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Website</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSeries.website"
                    type="url"
                    placeholder="https://example.com"
                  />
                </q-item-section>
              </q-item>
              <!-- 编辑者输入框 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Editors</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSeries.editors"
                    placeholder="e.g., John Smith, Jane Doe"
                  />
                </q-item-section>
              </q-item>
              <!-- 印刷版ISSN输入框（带格式掩码） -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">ISSN (Print)</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSeries.issn"
                    mask="####-####"
                    placeholder="XXXX-XXXX"
                  />
                </q-item-section>
              </q-item>
              <!-- 电子版ISSN输入框（带格式掩码） -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">e-ISSN (Electronic)</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSeries.e_issn"
                    mask="####-####"
                    placeholder="XXXX-XXXX"
                  />
                </q-item-section>
              </q-item>
              <!-- 描述文本域 -->
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Description</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentSeries.description"
                    type="textarea"
                    autogrow
                    placeholder="Series description..."
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <!-- 保存按钮 -->
            <div class="q-px-md q-pt-sm">
              <q-btn class="full-width" label="Save" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 查看丛书详情对话框 -->
    <q-dialog v-model="showViewDialog">
      <q-card class="q-pa-md" :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '60vw'} : {'width': '100%'}">
        <div class="row full-width">
          <!-- 左侧头像区域 -->
          <div class="full-height self-center q-mr-md" :style="$q.platform.is.mobile ? {'width': '100%', 'text-align': 'center', 'margin-bottom': '20%'} : {}">
            <q-avatar :size="$q.platform.is.desktop ? '150px' : '200px'">
              <img src="https://cdn.quasar.dev/img/avatar.png" />
            </q-avatar>
          </div>

          <q-separator :vertical="$q.platform.is.desktop" />

          <!-- 右侧详情信息区域 -->
          <div class="q-ml-md q-gutter-md">
            <div class="row">
              <span class="text-weight-bold">Series Title:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentSeries.title }}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">Publisher:</span>
              <span class="text-grey-8 q-ml-sm"> {{ getPublisherName(currentSeries.publisher) }}</span>
            </div>
            <div v-if="currentSeries.website" class="row">
              <span class="text-weight-bold">Website:</span>
              <a :href="currentSeries.website" target="_blank" class="text-primary q-ml-sm">{{ currentSeries.website }}</a>
            </div>
            <div v-if="currentSeries.editors" class="row">
              <span class="text-weight-bold">Editors:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentSeries.editors }}</span>
            </div>
            <div v-if="currentSeries.issn" class="row">
              <span class="text-weight-bold">ISSN (Print):</span>
              <span class="text-grey-8 q-ml-sm"> {{ formatISSN(currentSeries.issn) }}</span>
            </div>
            <div v-if="currentSeries.e_issn" class="row">
              <span class="text-weight-bold">e-ISSN (Electronic):</span>
              <span class="text-grey-8 q-ml-sm"> {{ formatISSN(currentSeries.e_issn) }}</span>
            </div>
            <div v-if="currentSeries.description" class="row">
              <span class="text-weight-bold">Description:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentSeries.description }}</span>
            </div>
            <div v-if="currentSeries.create_time" class="row">
              <span class="text-weight-bold">Created:</span>
              <span class="text-grey-8 q-ml-sm"> {{ formatDate(currentSeries.create_time) }}</span>
            </div>
            <div v-if="currentSeries.update_time" class="row">
              <span class="text-weight-bold">Updated:</span>
              <span class="text-grey-8 q-ml-sm"> {{ formatDate(currentSeries.update_time) }}</span>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

// 丛书接口定义：对应数据库表结构
interface Series {
  id?: number;                   // 丛书ID
  title: string;                 // 丛书名称
  publisher: number;             // 出版社ID
  website?: string;              // 丛书网站地址
  editors?: string;              // 丛书编辑者
  e_issn?: string;              // 电子版ISSN
  issn?: string;                // 印刷版ISSN
  description?: string;          // 丛书描述
  create_time?: string;          // 创建时间
  update_time?: string;          // 更新时间
}

// 出版社接口定义：用于下拉选择
interface Publisher {
  id: number;                    // 出版社ID
  name: string;                  // 出版社名称
  website?: string;              // 出版社网站
  country?: string;              // 所在国家
  city?: string;                 // 所在城市
}

const $q = useQuasar();          // Quasar工具函数

// 响应式状态管理
const viewToggle = ref(false);    // 视图切换状态
const filter = ref('');           // 搜索过滤器
const mode = ref<'list' | 'grid'>('list'); // 显示模式：列表或网格
const pagination = ref({
  rowsPerPage: 10,               // 每页显示行数
});

// 出版社数据（模拟数据，实际应用中应从API获取）
const publishers = ref<Publisher[]>([
  { id: 1, name: 'Penguin Random House', country: 'USA', city: 'New York' },
  { id: 2, name: 'HarperCollins', country: 'USA', city: 'New York' },
  { id: 3, name: 'Springer Nature', country: 'Germany', city: 'Berlin' },
  { id: 4, name: 'Oxford University Press', country: 'UK', city: 'Oxford' },
  { id: 5, name: 'Cambridge University Press', country: 'UK', city: 'Cambridge' },
  { id: 6, name: 'Elsevier', country: 'Netherlands', city: 'Amsterdam' },
  { id: 7, name: 'Wiley', country: 'USA', city: 'Hoboken' },
]);

// 丛书数据（模拟数据）
const series = ref<Series[]>([
  {
    id: 1,
    title: 'Lecture Notes in Computer Science',
    publisher: 3,
    website: 'https://link.springer.com/bookseries/558',
    editors: 'Springer Editorial Team',
    issn: '0302-9743',
    e_issn: '1611-3349',
    description: 'A series of computer science books and proceedings published by Springer',
    create_time: '2023-01-15T10:30:00Z',
    update_time: '2023-06-20T14:45:00Z'
  },
  {
    id: 2,
    title: 'Cambridge Studies in Advanced Mathematics',
    publisher: 5,
    website: 'https://www.cambridge.org/core/series/cambridge-studies-in-advanced-mathematics/',
    editors: 'Various',
    issn: '0950-6324',
    description: 'A series of advanced mathematics monographs',
    create_time: '2023-02-10T09:15:00Z',
    update_time: '2023-07-12T11:20:00Z'
  },
  {
    id: 3,
    title: 'Oxford Handbooks Online',
    publisher: 4,
    website: 'https://www.oxfordhandbooks.com',
    editors: 'Oxford University Press Editorial Board',
    e_issn: '978-0-19',
    description: 'Comprehensive collection of review articles across various disciplines',
    create_time: '2023-03-05T13:45:00Z',
    update_time: '2023-08-15T16:30:00Z'
  },
  {
    id: 4,
    title: 'Methods in Molecular Biology',
    publisher: 3,
    website: 'https://link.springer.com/bookseries/7651',
    editors: 'John M. Walker',
    issn: '1064-3745',
    e_issn: '1940-6029',
    description: 'Series focusing on laboratory protocols and methods in molecular biology',
    create_time: '2023-04-20T08:00:00Z',
    update_time: '2023-09-10T10:15:00Z'
  },
  {
    id: 5,
    title: 'Harper Perennial Modern Classics',
    publisher: 2,
    editors: 'Various',
    description: 'Classic literature reprints with modern introductions and annotations',
    create_time: '2023-05-12T11:30:00Z',
    update_time: '2023-10-05T14:20:00Z'
  }
]);

// 表格列定义
const columns = ref([
  {
    name: 'title',
    required: true,
    label: 'Series Title',
    align: 'left',
    field: 'title',
    sortable: true,
  },
  {
    name: 'publisher',
    align: 'left',
    label: 'Publisher',
    field: 'publisher',
    sortable: true,
  },
  {
    name: 'issn',
    align: 'left',
    label: 'ISSN',
    field: 'issn',
    sortable: true,
  },
  {
    name: 'editors',
    align: 'left',
    label: 'Editors',
    field: 'editors',
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
    align: 'left',
    label: 'Action',
    field: 'action',
    sortable: false
  }
]);

// 对话框状态管理
const showSeriesDialog = ref(false);   // 添加/编辑对话框显示状态
const showViewDialog = ref(false);     // 查看对话框显示状态
const isEditing = ref(false);          // 当前是否处于编辑模式
const currentSeries = ref<Series>({    // 当前操作的丛书数据
  title: '',
  publisher: 0,
  website: '',
  editors: '',
  e_issn: '',
  issn: '',
  description: '',
});

// 辅助函数

/**
 * 根据出版社ID获取出版社名称
 * @param publisherId 出版社ID
 * @returns 出版社名称
 */
const getPublisherName = (publisherId: number): string => {
  const publisher = publishers.value.find(p => p.id === publisherId);
  return publisher ? publisher.name : 'Unknown Publisher';
};

/**
 * 确保URL有正确的协议前缀
 * @param url 原始URL
 * @returns 完整的URL
 */
const ensureUrlProtocol = (url: string): string => {
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
};

/**
 * 格式化URL显示（移除协议部分）
 * @param url 原始URL
 * @returns 格式化后的URL
 */
const formatUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

/**
 * 格式化ISSN号（XXXX-XXXX格式）
 * @param issn 原始ISSN号
 * @returns 格式化后的ISSN号
 */
const formatISSN = (issn: string): string => {
  if (!issn) return '';
  // 移除非数字和X字符
  const clean = issn.replace(/[^\dX]/g, '');
  if (clean.length !== 8) return issn;
  return `${clean.substring(0, 4)}-${clean.substring(4)}`;
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

// 主要方法

/**
 * 打开添加丛书对话框
 */
const addSeries = () => {
  currentSeries.value = {
    title: '',
    publisher: 0,
    website: '',
    editors: '',
    e_issn: '',
    issn: '',
    description: '',
  };
  isEditing.value = false;
  showSeriesDialog.value = true;
};

/**
 * 打开编辑丛书对话框
 * @param series 要编辑的丛书对象
 */
const editSeries = (series: Series) => {
  currentSeries.value = { ...series };
  isEditing.value = true;
  showSeriesDialog.value = true;
};

/**
 * 打开查看丛书详情对话框
 * @param series 要查看的丛书对象
 */
const viewSeries = (series: Series) => {
  currentSeries.value = { ...series };
  showViewDialog.value = true;
};

/**
 * 在新窗口打开丛书网站
 * @param url 网站URL
 */
const openWebsite = (url: string) => {
  if (url) {
    window.open(ensureUrlProtocol(url), '_blank');
  }
};

/**
 * 保存丛书信息（添加或更新）
 */
const saveSeries = () => {
  // 验证必填字段
  if (!currentSeries.value.title) {
    $q.notify({
      color: 'negative',
      message: 'Series title is required'
    });
    return;
  }

  if (!currentSeries.value.publisher) {
    $q.notify({
      color: 'negative',
      message: 'Publisher is required'
    });
    return;
  }

  // 格式化ISSN号
  if (currentSeries.value.issn) {
    currentSeries.value.issn = formatISSN(currentSeries.value.issn);
  }
  if (currentSeries.value.e_issn) {
    currentSeries.value.e_issn = formatISSN(currentSeries.value.e_issn);
  }

  if (isEditing.value) {
    // 更新现有丛书
    const index = series.value.findIndex(s => s.id === currentSeries.value.id);
    if (index !== -1) {
      series.value[index] = {
        ...currentSeries.value,
        update_time: new Date().toISOString() // 更新修改时间
      };
    }
    $q.notify({
      color: 'positive',
      message: 'Series updated successfully'
    });
  } else {
    // 添加新丛书
    const newId = series.value.length > 0
      ? Math.max(...series.value.map(s => s.id || 0)) + 1
      : 1;
    const now = new Date().toISOString();
    currentSeries.value.id = newId;
    currentSeries.value.create_time = now;
    currentSeries.value.update_time = now;
    series.value.push({ ...currentSeries.value });
    $q.notify({
      color: 'positive',
      message: 'Series added successfully'
    });
  }

  showSeriesDialog.value = false; // 关闭对话框
};

/**
 * 删除丛书（带确认对话框）
 * @param seriesItem 要删除的丛书对象
 */
const deleteSeries = (seriesItem: Series) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${seriesItem.title}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    series.value = series.value.filter(s => s.id !== seriesItem.id);
    $q.notify({
      color: 'positive',
      message: 'Series deleted successfully'
    });
  });
};
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
