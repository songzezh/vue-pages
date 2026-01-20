<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table
        title="歌单管理"
        :rows="playlists"
        :hide-header="mode === 'grid'"
        :columns="columns"
        row-key="id"
        :grid="mode == 'grid'"
        :filter="filter"
        v-model:pagination="pagination"
      >
        <template v-slot:top-right="props">
          <q-btn
            @click="handleAddPlaylist"
            flat
            size="lg"
            color="primary"
            icon="add_circle"
            class="q-mr-xs q-pa-none"
          />

          <q-input
            dense
            borderless
            v-model="filter"
            placeholder="搜索歌单..."
            class="custom-border bg-grey-3 q-pl-sm"
            style="border-radius: 10px"
          >
            <template v-slot:append>
              <q-icon class="q-pr-sm" color="grey-8" name="search" />
            </template>
          </q-input>

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
            >{{ props.inFullscreen ? "退出全屏" : "切换全屏" }}
            </q-tooltip>
          </q-btn>

          <q-toggle
            v-model="viewToggle"
            @click="
              mode = mode === 'grid' ? 'list' : 'grid';
              separator = mode === 'grid' ? 'none' : 'horizontal';
            "
            v-if="!props.inFullscreen"
          >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup
            >{{ mode === "grid" ? "列表视图" : "网格视图" }}
            </q-tooltip>
          </q-toggle>

          <q-btn
            color="primary"
            icon-right="archive"
            label="导出CSV"
            no-caps
            @click="exportTable"
            class="q-ml-sm"
          />
        </template>

        <!-- 自定义歌单描述单元格 -->
        <template v-slot:body-cell-description="props">
          <q-td :props="props">
            <div class="text-truncate" style="max-width: 200px">
              {{ props.row.description || '暂无描述' }}
            </div>
          </q-td>
        </template>

        <!-- 自定义音乐数量单元格 -->
        <template v-slot:body-cell-musicCount="props">
          <q-td :props="props">
            <q-badge color="primary">
              {{ props.row.musicCount }} 首
            </q-badge>
          </q-td>
        </template>

        <!-- 自定义创建者单元格 -->
        <template v-slot:body-cell-creator="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <q-avatar size="24px">
                <img src="https://cdn.quasar.dev/img/avatar.png" />
              </q-avatar>
              <span>用户 {{ props.row.creator_id }}</span>
            </div>
          </q-td>
        </template>

        <!-- 自定义操作单元格 -->
        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-sm">
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="edit"
                @click="handleEditPlaylist(props.row)"
              />
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="visibility"
                @click="handleViewPlaylist(props.row)"
              />
              <q-btn
                dense
                outline
                size="sm"
                color="red"
                icon="delete"
                @click="handleDeletePlaylist(props.row)"
              />
              <q-btn
                dense
                outline
                size="sm"
                color="green"
                icon="queue_music"
                @click="handleManageMusic(props.row)"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- 添加/编辑歌单对话框 -->
    <q-dialog v-model="showPlaylistDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? { 'width': '500px', 'max-width': '50vw' } : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ isEditMode ? '编辑歌单' : '创建歌单' }}
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
          <q-form class="q-gutter-md" @submit="handleSavePlaylist">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">歌单名称 *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPlaylist.name"
                    :rules="[(val: string) => !!val || '歌单名称不能为空']"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">创建者ID *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPlaylist.creator_id"
                    type="number"
                    :rules="[(val: string) => !!val || '创建者ID不能为空']"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">歌单描述</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPlaylist.description"
                    type="textarea"
                    autogrow
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="q-px-md q-pt-sm">
              <q-btn
                class="full-width"
                :label="isEditMode ? '更新' : '保存'"
                type="submit"
                color="primary"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 查看歌单详情对话框 -->
    <q-dialog v-model="showViewDialog">
      <q-card class="q-pa-md" :style="$q.platform.is.desktop ? { 'width': '600px', 'max-width': '60vw' } : { 'width': '100%' }">
        <div class="row full-width">
          <div
            class="full-height self-center q-mr-md"
            :style="$q.platform.is.mobile ? { 'width': '100%', 'text-align': 'center', 'margin-bottom': '20%' } : {}"
          >
            <q-avatar :size="$q.platform.is.desktop ? '150px' : '200px'">
              <img src="https://cdn.quasar.dev/img/avatar.png" />
            </q-avatar>
          </div>

          <q-separator :vertical="$q.platform.is.desktop" />

          <div class="q-ml-md q-gutter-md">
            <div class="row">
              <span class="text-weight-bold">歌单名称:</span>
              <span class="text-grey-8 q-ml-sm"> {{ selectedPlaylist.name }}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">创建者ID:</span>
              <span class="text-grey-8 q-ml-sm"> {{ selectedPlaylist.creator_id }}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">歌曲数量:</span>
              <span class="text-grey-8 q-ml-sm"> {{ selectedPlaylist.musicCount || 0 }} 首</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">创建时间:</span>
              <span class="text-grey-8 q-ml-sm"> {{ formatDate(selectedPlaylist.create_time) }}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">更新时间:</span>
              <span class="text-grey-8 q-ml-sm"> {{ formatDate(selectedPlaylist.update_time) }}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">歌单描述:</span>
              <span class="text-grey-8 q-ml-sm"> {{ selectedPlaylist.description || '暂无描述' }}</span>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>

    <!-- 管理歌曲对话框 -->
    <q-dialog v-model="showMusicDialog" full-width>
      <q-card class="q-pa-md">
        <q-card-section>
          <div class="text-h6">管理歌曲 - {{ selectedPlaylist.name }}</div>
        </q-card-section>
        <q-card-section>
          <div class="q-gutter-md">
            <div class="row items-center">
              <q-input
                v-model="musicFilter"
                placeholder="搜索歌曲..."
                dense
                outlined
                class="col-grow"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
              <q-btn
                color="primary"
                icon="add"
                label="添加歌曲"
                @click="handleAddMusic"
                class="q-ml-md"
              />
            </div>

            <q-table
              :rows="playlistMusics"
              :columns="musicColumns"
              row-key="id"
              :filter="musicFilter"
              :pagination="{ rowsPerPage: 10 }"
            >
              <template v-slot:body-cell-action="props">
                <q-td :props="props">
                  <q-btn
                    dense
                    outline
                    size="sm"
                    color="red"
                    icon="remove"
                    @click="handleRemoveMusic(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { exportFile, useQuasar } from 'quasar';

// 类型定义
interface Playlist {
  id: number;
  name: string;
  creator_id: number;
  description?: string;
  create_time: string;
  update_time: string;
  musicCount?: number;
}

interface Music {
  id: number;
  title: string;
  alias?: string;
  duration: number;
  genre_id?: number;
  release_date?: string;
  album_id?: number;
  publisher?: string;
  introduction?: string;
}

interface PlaylistMusic {
  id: number;
  playlist_id: number;
  music_id: number;
  add_time: string;
  sort_order: number;
  music?: Music;
}

const $q = useQuasar();

// 响应式数据
const viewToggle = ref(false);
const filter = ref('');
const mode = ref('list');
const showPlaylistDialog = ref(false);
const showViewDialog = ref(false);
const showMusicDialog = ref(false);
const isEditMode = ref(false);
const musicFilter = ref('');

// 当前操作的数据
const currentPlaylist = ref<Playlist>({
  id: 0,
  name: '',
  creator_id: 0,
  description: '',
  create_time: '',
  update_time: '',
});

const selectedPlaylist = ref<Playlist>({
  id: 0,
  name: '',
  creator_id: 0,
  description: '',
  create_time: '',
  update_time: '',
});

// 模拟数据
const playlists = ref<Playlist[]>([
  {
    id: 1,
    name: '我的最爱',
    creator_id: 101,
    description: '我最喜欢的歌曲集合',
    create_time: '2023-10-01 09:00:00',
    update_time: '2023-10-15 14:30:00',
    musicCount: 15,
  },
  {
    id: 2,
    name: '工作学习',
    creator_id: 101,
    description: '适合工作和学习的纯音乐',
    create_time: '2023-09-15 10:30:00',
    update_time: '2023-10-10 16:45:00',
    musicCount: 25,
  },
  {
    id: 3,
    name: '运动健身',
    creator_id: 102,
    description: '运动时听的动感音乐',
    create_time: '2023-08-20 14:00:00',
    update_time: '2023-10-05 11:20:00',
    musicCount: 18,
  },
  {
    id: 4,
    name: '怀旧经典',
    creator_id: 103,
    description: '经典老歌回忆',
    create_time: '2023-07-10 08:45:00',
    update_time: '2023-09-28 19:15:00',
    musicCount: 32,
  },
  {
    id: 5,
    name: '旅行歌单',
    creator_id: 101,
    description: '旅行路上听的歌',
    create_time: '2023-10-05 16:20:00',
    update_time: '2023-10-12 10:10:00',
    musicCount: 12,
  },
]);

const playlistMusics = ref<PlaylistMusic[]>([
  {
    id: 1,
    playlist_id: 1,
    music_id: 101,
    add_time: '2023-10-02 10:00:00',
    sort_order: 1,
    music: {
      id: 101,
      title: '歌曲示例1',
      duration: 240,
      release_date: '2023-01-01',
    },
  },
  {
    id: 2,
    playlist_id: 1,
    music_id: 102,
    add_time: '2023-10-03 14:30:00',
    sort_order: 2,
    music: {
      id: 102,
      title: '歌曲示例2',
      duration: 210,
      release_date: '2023-02-15',
    },
  },
]);

const availableMusics = ref<Music[]>([
  { id: 101, title: '歌曲示例1', duration: 240 },
  { id: 102, title: '歌曲示例2', duration: 210 },
  { id: 103, title: '歌曲示例3', duration: 195 },
  { id: 104, title: '歌曲示例4', duration: 260 },
]);

// 表格列定义
const columns = ref([
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field: 'id',
    sortable: true,
  },
  {
    name: 'name',
    required: true,
    label: '歌单名称',
    align: 'left',
    field: 'name',
    sortable: true,
  },
  {
    name: 'creator',
    label: '创建者',
    align: 'left',
    field: 'creator_id',
    sortable: true,
  },
  {
    name: 'description',
    label: '描述',
    align: 'left',
    field: 'description',
    sortable: true,
  },
  {
    name: 'musicCount',
    label: '歌曲数量',
    align: 'left',
    field: 'musicCount',
    sortable: true,
  },
  {
    name: 'create_time',
    label: '创建时间',
    align: 'left',
    field: 'create_time',
    sortable: true,
    format: (val: string) => formatDate(val),
  },
  {
    name: 'update_time',
    label: '更新时间',
    align: 'left',
    field: 'update_time',
    sortable: true,
    format: (val: string) => formatDate(val),
  },
  {
    name: 'action',
    label: '操作',
    align: 'center',
    field: 'action',
  },
]);

const musicColumns = ref([
  {
    name: 'title',
    label: '歌曲标题',
    align: 'left',
    field: (row: PlaylistMusic) => row.music?.title,
    sortable: true,
  },
  {
    name: 'duration',
    label: '时长',
    align: 'left',
    field: (row: PlaylistMusic) => formatDuration(row.music?.duration || 0),
  },
  {
    name: 'add_time',
    label: '添加时间',
    align: 'left',
    field: 'add_time',
    format: (val: string) => formatDate(val),
  },
  {
    name: 'sort_order',
    label: '排序',
    align: 'left',
    field: 'sort_order',
  },
  {
    name: 'action',
    label: '操作',
    align: 'center',
    field: 'action',
  },
]);

const pagination = ref({
  rowsPerPage: 10,
});

// 工具函数
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 操作方法
const handleAddPlaylist = () => {
  isEditMode.value = false;
  currentPlaylist.value = {
    id: 0,
    name: '',
    creator_id: 0,
    description: '',
    create_time: '',
    update_time: '',
  };
  showPlaylistDialog.value = true;
};

const handleEditPlaylist = (playlist: Playlist) => {
  isEditMode.value = true;
  currentPlaylist.value = { ...playlist };
  showPlaylistDialog.value = true;
};

const handleViewPlaylist = (playlist: Playlist) => {
  selectedPlaylist.value = { ...playlist };
  showViewDialog.value = true;
};

const handleDeletePlaylist = (playlist: Playlist) => {
  $q.dialog({
    title: '确认删除',
    message: `确定要删除歌单 "${playlist.name}" 吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    const index = playlists.value.findIndex(p => p.id === playlist.id);
    if (index > -1) {
      playlists.value.splice(index, 1);
      $q.notify({
        type: 'positive',
        message: '歌单删除成功',
      });
    }
  });
};

const handleManageMusic = (playlist: Playlist) => {
  selectedPlaylist.value = { ...playlist };
  // 这里应该从API获取该歌单的歌曲列表
  showMusicDialog.value = true;
};

const handleSavePlaylist = () => {
  if (isEditMode.value) {
    // 更新歌单
    const index = playlists.value.findIndex(p => p.id === currentPlaylist.value.id);
    if (index > -1) {
      playlists.value[index] = {
        ...currentPlaylist.value,
        update_time: new Date().toISOString(),
      };
    }
  } else {
    // 添加新歌单
    const newId = Math.max(...playlists.value.map(p => p.id)) + 1;
    const newPlaylist: Playlist = {
      ...currentPlaylist.value,
      id: newId,
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
      musicCount: 0,
    };
    playlists.value.push(newPlaylist);
  }

  showPlaylistDialog.value = false;
  $q.notify({
    type: 'positive',
    message: isEditMode.value ? '歌单更新成功' : '歌单创建成功',
  });
};

const handleAddMusic = () => {
  // 这里应该打开添加歌曲的对话框
  $q.notify({
    type: 'info',
    message: '添加歌曲功能开发中...',
  });
};

const handleRemoveMusic = (playlistMusic: PlaylistMusic) => {
  $q.dialog({
    title: '确认移除',
    message: `确定要从歌单中移除这首歌曲吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    const index = playlistMusics.value.findIndex(pm => pm.id === playlistMusic.id);
    if (index > -1) {
      playlistMusics.value.splice(index, 1);
      $q.notify({
        type: 'positive',
        message: '歌曲移除成功',
      });
    }
  });
};

const exportTable = () => {
  const content = [columns.value.map(col => col.label).join(',')]
    .concat(
      playlists.value.map(row =>
        columns.value
          .map(col => {
            const value = col.field
              ? typeof col.field === 'function'
                ? col.field(row)
                : row[col.field as keyof Playlist]
              : '';
            return `"${String(value || '')}"`;
          })
          .join(',')
      )
    )
    .join('\r\n');

  const status = exportFile('playlist-management.csv', content, 'text/csv');

  if (status !== true) {
    $q.notify({
      type: 'negative',
      message: '浏览器拒绝文件下载...',
    });
  }
};
</script>

<style scoped>
.custom-border {
  border-radius: 5px;
}
</style>
