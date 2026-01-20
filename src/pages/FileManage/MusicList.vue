<template>
  <page-content>
    <q-card>
      <q-table
        title="Manage Music"
        :rows="musicData"
        :hide-header="mode === 'grid'"
        :columns="columns"
        row-key="id"
        :grid="mode == 'grid'"
        :filter="filter"
        v-model:pagination="pagination"
      >
        <template v-slot:top-right="props">
          <q-btn
            @click="addMusic()"
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
            placeholder="Search"
            class="bg-grey-3 q-pl-sm"
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
            >{{
                props.inFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"
              }}
            </q-tooltip>
          </q-btn>

          <q-toggle
            v-model="viewToggle"
            @click="mode = mode === 'grid' ? 'list' : 'grid';"
            v-if="!props.inFullscreen"
          >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup
            >{{ mode === "grid" ? "List View" : "Grid View" }}
            </q-tooltip>
          </q-toggle>

          <q-btn
            color="primary"
            icon-right="archive"
            label="Export to csv"
            no-caps
            @click="exportTable"
          />
        </template>

        <template v-slot:body-cell-duration="props">
          <q-td :props="props">
            {{ formatDuration(props.row.duration) }}
          </q-td>
        </template>

        <template v-slot:body-cell-introduction="props">
          <q-td :props="props">
            <div style="max-width: 200px">
              {{ truncateText(props.row.introduction, 50) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-sm">
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="edit"
                @click="editMusic(props.row)"
              />
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="visibility"
                @click="viewMusic(props.row)"
              />
              <q-btn
                dense
                outline
                size="sm"
                color="red"
                icon="delete"
                @click="confirmDeleteMusic(props.row.id)"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Add/Edit Music Dialog -->
    <q-dialog v-model="addEditMusicDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? {'width': '600px', 'max-width': '70vw'} : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ isAddMode ? 'Add New Music' : 'Edit Music' }}
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
          <q-form class="q-gutter-md" @submit="saveMusic">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Title *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentMusic.title"
                    :rules="[val => !!val || 'Title is required']"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Alias</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentMusic.alias"
                    placeholder="Optional alternative name"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Duration (seconds) *</q-item-label>
                  <q-input
                    dense
                    outlined
                    type="number"
                    v-model="currentMusic.duration"
                    :rules="[val => val > 0 || 'Duration must be positive']"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Genre ID</q-item-label>
                  <q-input
                    dense
                    outlined
                    type="number"
                    v-model="currentMusic.genre_id"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Release Date</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentMusic.release_date"
                    mask="date"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy
                          ref="releaseDateProxy"
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date
                            v-model="currentMusic.release_date"
                          />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Album ID</q-item-label>
                  <q-input
                    dense
                    outlined
                    type="number"
                    v-model="currentMusic.album_id"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Publisher</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentMusic.publisher"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Introduction</q-item-label>
                  <q-input
                    dense
                    outlined
                    type="textarea"
                    v-model="currentMusic.introduction"
                    autogrow
                  />
                </q-item-section>
              </q-item>
            </q-list>
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

    <!-- View Music Dialog -->
    <q-dialog v-model="viewMusicDialog">
      <q-card class="q-pa-md" :style="$q.platform.is.desktop ? {'width': '700px', 'max-width': '70vw'} : {'width': '100%'}">
        <div class="row full-width">
          <div class="full-height self-center q-mr-md" :style="$q.platform.is.mobile ? {'width': '100%', 'text-align': 'center', 'margin-bottom': '20px'} : {}">
            <q-avatar :size="$q.platform.is.desktop ? '150px' : '200px'">
              <img src="https://cdn.quasar.dev/img/music-avatar.png" />
            </q-avatar>
          </div>

          <q-separator :vertical="$q.platform.is.desktop" />

          <div class="q-ml-md q-gutter-md col">
            <div class="row q-mb-sm">
              <span class="text-h6">{{selectedMusic.title}}</span>
              <q-chip v-if="selectedMusic.alias" size="sm" color="grey" class="q-ml-md">
                Alias: {{selectedMusic.alias}}
              </q-chip>
            </div>
            <div class="row">
              <span class="text-weight-bold">Duration:</span>
              <span class="text-grey-8 q-ml-sm"> {{formatDuration(selectedMusic.duration)}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">Release Date:</span>
              <span class="text-grey-8 q-ml-sm"> {{selectedMusic.release_date || 'N/A'}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">Genre ID:</span>
              <span class="text-grey-8 q-ml-sm"> {{selectedMusic.genre_id || 'N/A'}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">Album ID:</span>
              <span class="text-grey-8 q-ml-sm"> {{selectedMusic.album_id || 'N/A'}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">Publisher:</span>
              <span class="text-grey-8 q-ml-sm"> {{selectedMusic.publisher || 'N/A'}}</span>
            </div>
            <div class="row">
              <span class="text-weight-bold">Introduction:</span>
            </div>
            <div class="row q-mt-sm">
              <span class="text-grey-8">{{selectedMusic.introduction || 'No introduction available'}}</span>
            </div>
            <div class="row q-mt-md">
              <span class="text-caption text-grey-6">
                Created: {{formatDateTime(selectedMusic.create_time)}} |
                Updated: {{formatDateTime(selectedMusic.update_time)}}
              </span>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="deleteConfirmDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Delete</div>
        </q-card-section>
        <q-card-section>
          Are you sure you want to delete this music item?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Delete" color="red" @click="deleteMusic" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </page-content>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { exportFile, useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';
import PageContent from "@/components/Common/PageContent.vue";

interface Music {
  id: number;
  title: string;
  alias: string | null;
  duration: number;
  genre_id: number | null;
  release_date: string | null;
  album_id: number | null;
  publisher: string | null;
  introduction: string | null;
  create_time: string;
  update_time: string;
}

interface MusicForm {
  title: string;
  alias: string | null;
  duration: number;
  genre_id: number | null;
  release_date: string | null;
  album_id: number | null;
  publisher: string | null;
  introduction: string | null;
}

// Quasar instance
const $q = useQuasar();

// Reactive state
const viewToggle = ref(false);
const filter = ref('');
const mode = ref<'list' | 'grid'>('list');
const addEditMusicDialog = ref(false);
const viewMusicDialog = ref(false);
const deleteConfirmDialog = ref(false);
const isAddMode = ref(true);
const musicData = ref<Music[]>([]);
const currentMusic = ref<MusicForm>({
  title: '',
  alias: null,
  duration: 0,
  genre_id: null,
  release_date: null,
  album_id: null,
  publisher: null,
  introduction: null,
});
const selectedMusic = ref<Music>({} as Music);
const musicIdToDelete = ref<number | null>(null);

// Pagination
const pagination = ref({
  rowsPerPage: 10,
});

// Table columns
const columns: QTableProps['columns'] = [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field: 'id',
    sortable: true,
  },
  {
    name: 'title',
    align: 'left',
    label: 'Title',
    field: 'title',
    sortable: true,
  },
  {
    name: 'alias',
    align: 'left',
    label: 'Alias',
    field: 'alias',
    sortable: true,
  },
  {
    name: 'duration',
    align: 'left',
    label: 'Duration',
    field: 'duration',
    sortable: true,
  },
  {
    name: 'release_date',
    align: 'left',
    label: 'Release Date',
    field: 'release_date',
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
    name: 'action',
    align: 'left',
    label: 'Actions',
    field: 'action',
    sortable: false,
  },
];

// Initialize with sample data
const initializeData = () => {
  musicData.value = [
    {
      id: 1,
      title: "Bohemian Rhapsody",
      alias: "波西米亚狂想曲",
      duration: 354,
      genre_id: 1,
      release_date: "1975-10-31",
      album_id: 1,
      publisher: "EMI",
      introduction: "A classic rock opera song by the British rock band Queen.",
      create_time: "2023-01-01 10:00:00",
      update_time: "2023-01-01 10:00:00",
    },
    {
      id: 2,
      title: "Shape of You",
      alias: "你的形状",
      duration: 233,
      genre_id: 2,
      release_date: "2017-01-06",
      album_id: 2,
      publisher: "Asylum Records",
      introduction: "A song by English singer-songwriter Ed Sheeran.",
      create_time: "2023-01-02 11:00:00",
      update_time: "2023-01-02 11:00:00",
    },
    {
      id: 3,
      title: "Blinding Lights",
      alias: "炫目灯光",
      duration: 200,
      genre_id: 3,
      release_date: "2019-11-29",
      album_id: 3,
      publisher: "XO Records",
      introduction: "A song by Canadian singer the Weeknd.",
      create_time: "2023-01-03 12:00:00",
      update_time: "2023-01-03 12:00:00",
    },
    {
      id: 4,
      title: "Take Five",
      alias: "休息五分钟",
      duration: 324,
      genre_id: 4,
      release_date: "1959-09-21",
      album_id: 4,
      publisher: "Columbia Records",
      introduction: "A jazz composition by Paul Desmond.",
      create_time: "2023-01-04 13:00:00",
      update_time: "2023-01-04 13:00:00",
    },
    {
      id: 5,
      title: "Hallelujah",
      alias: "哈利路亚",
      duration: 272,
      genre_id: 5,
      release_date: "1984-12-07",
      album_id: 5,
      publisher: "Columbia Records",
      introduction: "A song written by Canadian singer Leonard Cohen.",
      create_time: "2023-01-05 14:00:00",
      update_time: "2023-01-05 14:00:00",
    },
    {
      id: 6,
      title: "Yesterday",
      alias: "昨天",
      duration: 125,
      genre_id: 6,
      release_date: "1965-09-13",
      album_id: 6,
      publisher: "Parlophone",
      introduction: "A song by the English rock band the Beatles.",
      create_time: "2023-01-06 15:00:00",
      update_time: "2023-01-06 15:00:00",
    },
  ];
};

// Utility functions
const formatDuration = (seconds: number): string => {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const truncateText = (text: string | null, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const formatDateTime = (dateTime: string): string => {
  if (!dateTime) return 'N/A';
  return new Date(dateTime).toLocaleString();
};

const wrapCsvValue = (val: any, formatFn?: Function) => {
  let formatted = formatFn !== void 0 ? formatFn(val) : val;
  formatted = formatted === void 0 || formatted === null ? "" : String(formatted);
  formatted = formatted.split('"').join('""');
  return `"${formatted}"`;
};

// CRUD Operations
const addMusic = () => {
  currentMusic.value = {
    title: '',
    alias: null,
    duration: 0,
    genre_id: null,
    release_date: null,
    album_id: null,
    publisher: null,
    introduction: null,
  };
  isAddMode.value = true;
  addEditMusicDialog.value = true;
};

const editMusic = (music: Music) => {
  currentMusic.value = {
    title: music.title,
    alias: music.alias,
    duration: music.duration,
    genre_id: music.genre_id,
    release_date: music.release_date,
    album_id: music.album_id,
    publisher: music.publisher,
    introduction: music.introduction,
  };
  isAddMode.value = false;
  addEditMusicDialog.value = true;
};

const viewMusic = (music: Music) => {
  selectedMusic.value = { ...music };
  viewMusicDialog.value = true;
};

const confirmDeleteMusic = (id: number) => {
  musicIdToDelete.value = id;
  deleteConfirmDialog.value = true;
};

const saveMusic = () => {
  if (!currentMusic.value.title) {
    $q.notify({
      message: 'Title is required',
      color: 'negative',
      icon: 'warning',
    });
    return;
  }

  if (isAddMode.value) {
    // Add new music
    const newId = Math.max(...musicData.value.map(m => m.id), 0) + 1;
    const newMusic: Music = {
      id: newId,
      ...currentMusic.value,
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    };
    musicData.value.push(newMusic);
    $q.notify({
      message: 'Music added successfully',
      color: 'positive',
      icon: 'check',
    });
  } else {
    // Update existing music (simulated - in real app would be API call)
    $q.notify({
      message: 'Music updated successfully',
      color: 'positive',
      icon: 'check',
    });
  }

  addEditMusicDialog.value = false;
};

const deleteMusic = () => {
  if (musicIdToDelete.value) {
    const index = musicData.value.findIndex(m => m.id === musicIdToDelete.value);
    if (index !== -1) {
      musicData.value.splice(index, 1);
      $q.notify({
        message: 'Music deleted successfully',
        color: 'positive',
        icon: 'check',
      });
    }
  }
  deleteConfirmDialog.value = false;
  musicIdToDelete.value = null;
};

const exportTable = () => {
  // naive encoding to csv format
  const content = [columns.map((col) => wrapCsvValue(col.label))]
    .concat(
      musicData.value.map((row) =>
        columns
          .map((col) =>
            wrapCsvValue(
              typeof col.field === "function"
                ? col.field(row)
                : row[col.field as keyof Music],
              col.format
            )
          )
          .join(",")
      )
    )
    .join("\r\n");

  const status = exportFile("music-management.csv", content, "text/csv");

  if (status !== true) {
    $q.notify({
      message: "Browser denied file download...",
      color: "negative",
      icon: "warning",
    });
  }
};

// Lifecycle
onMounted(() => {
  initializeData();
});
</script>

<style scoped>
</style>
