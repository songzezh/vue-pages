<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table
        title="Manage Publishers"
        :rows="publishers"
        :hide-header="mode === 'grid'"
        :columns="columns"
        row-key="id"
        :grid="mode === 'grid'"
        :filter="filter"
        v-model:pagination="pagination"
      >
        <!-- 列表布局的表头 -->
        <template v-slot:top-right="props">
          <q-btn
            @click="addPublisher()"
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
              >{{ props.inFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen' }}
            </q-tooltip>
          </q-btn>

          <q-toggle
            v-model="viewToggle"
            @click="mode = mode === 'grid' ? 'list' : 'grid'"
            v-if="!props.inFullscreen"
          >
            <q-tooltip :disable="$q.platform.is.mobile" v-close-popup
              >{{ mode === 'grid' ? 'List View' : 'Grid View' }}
            </q-tooltip>
          </q-toggle>
        </template>

        <!-- 列表布局下的列渲染 -->
        <template v-slot:body-cell-country="props">
          <q-td :props="props">
            <q-chip
              v-if="props.row.country"
              color="secondary"
              text-color="white"
              dense
              class="q-px-md"
              square
              style="width: 85px"
            >
              {{ props.row.country }}
            </q-chip>
          </q-td>
        </template>

        <!-- 列表布局下的操作列 -->
        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <div class="q-gutter-sm">
              <q-btn
                v-if="props.row.website"
                dense
                outline
                size="sm"
                color="green"
                icon="language"
                @click="openWebsite(props.row.website)"
                :disable="!props.row.website"
              >
                <q-tooltip> Visit Website </q-tooltip>
              </q-btn>
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="visibility"
                @click="viewPublisher(props.row)"
              >
                <q-tooltip> Show Detail </q-tooltip>
              </q-btn>
              <q-btn
                dense
                outline
                size="sm"
                color="primary"
                icon="edit"
                @click="editPublisher(props.row)"
              >
                <q-tooltip> Edit Record </q-tooltip>
              </q-btn>
              <q-btn
                dense
                outline
                size="sm"
                color="red"
                icon="delete"
                @click="deletePublisher(props.row)"
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
              <q-card-section>
                <div class="row no-wrap items-center">
                  <div class="col">
                    <div class="text-h6">{{ props.row.name }}</div>
                    <div class="text-subtitle2 text-grey">
                      {{ props.row.city }}, {{ props.row.country }}
                    </div>
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="q-pt-none">
                <div class="text-caption text-grey-8">
                  <div><strong>Genres:</strong></div>
                  <div>{{ props.row.genres || 'N/A' }}</div>
                  <div v-if="props.row.address">
                    <strong>Address:</strong>
                  </div>
                  <div v-if="props.row.address">
                    {{ truncateText(props.row.address, 50) }}
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-actions align="right" class="q-pa-md">
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
                  icon="visibility"
                  @click="viewPublisher(props.row)"
                >
                  <q-tooltip> Show Details </q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="edit"
                  @click="editPublisher(props.row)"
                >
                  <q-tooltip> Edit Record </q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="red"
                  icon="delete"
                  @click="deletePublisher(props.row)"
                >
                  <q-tooltip> Delete Record </q-tooltip>
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Add/Edit Publisher Dialog -->
    <q-dialog v-model="showPublisherDialog" :maximized="$q.platform.is.mobile">
      <q-card :style="$q.platform.is.desktop ? { width: '600px', 'max-width': '60vw' } : {}">
        <q-card-section>
          <div class="text-h6 q-px-md">
            {{ isEditing ? 'Edit Publisher' : 'Add Publisher' }}
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
          <q-form class="q-gutter-md" @submit="savePublisher">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Publisher Name *</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPublisher.name"
                    :rules="[(val) => !!val || 'Name is required']"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Website</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPublisher.website"
                    type="url"
                    placeholder="https://example.com"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Country</q-item-label>
                  <q-input dense outlined v-model="currentPublisher.country" />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">City</q-item-label>
                  <q-input dense outlined v-model="currentPublisher.city" />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Address</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPublisher.address"
                    type="textarea"
                    autogrow
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Introduction</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPublisher.intro"
                    type="textarea"
                    autogrow
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Main Genres</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPublisher.genres"
                    placeholder="e.g., Fiction, Science, Technology"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label class="q-pb-xs">Remark</q-item-label>
                  <q-input
                    dense
                    outlined
                    v-model="currentPublisher.remark"
                    type="textarea"
                    autogrow
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="q-px-md q-pt-sm">
              <q-btn class="full-width" label="Save" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- View Publisher Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card
        class="q-pa-md"
        :style="
          $q.platform.is.desktop ? { width: '600px', 'max-width': '60vw' } : { width: '100%' }
        "
      >
        <div class="row full-width">
          <div
            class="full-height self-center q-mr-md"
            :style="
              $q.platform.is.mobile
                ? { width: '100%', 'text-align': 'center', 'margin-bottom': '20%' }
                : {}
            "
          >
            <q-avatar :size="$q.platform.is.desktop ? '150px' : '200px'">
              <img src="https://cdn.quasar.dev/img/avatar.png" alt="Publisher" />
            </q-avatar>
          </div>

          <q-separator :vertical="$q.platform.is.desktop" />

          <div class="q-ml-md q-gutter-md">
            <div class="row">
              <span class="text-weight-bold">Publisher Name:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentPublisher.name }}</span>
            </div>
            <div v-if="currentPublisher.website" class="row">
              <span class="text-weight-bold">Website:</span>
              <a :href="currentPublisher.website" target="_blank" class="text-primary q-ml-sm">{{
                currentPublisher.website
              }}</a>
            </div>
            <div v-if="currentPublisher.country" class="row">
              <span class="text-weight-bold">Country:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentPublisher.country }}</span>
            </div>
            <div v-if="currentPublisher.city" class="row">
              <span class="text-weight-bold">City:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentPublisher.city }}</span>
            </div>
            <div v-if="currentPublisher.address" class="row">
              <span class="text-weight-bold">Address:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentPublisher.address }}</span>
            </div>
            <div v-if="currentPublisher.intro" class="row">
              <span class="text-weight-bold">Introduction:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentPublisher.intro }}</span>
            </div>
            <div v-if="currentPublisher.genres" class="row">
              <span class="text-weight-bold">Main Genres:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentPublisher.genres }}</span>
            </div>
            <div v-if="currentPublisher.remark" class="row">
              <span class="text-weight-bold">Remark:</span>
              <span class="text-grey-8 q-ml-sm"> {{ currentPublisher.remark }}</span>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { exportFile, useQuasar } from 'quasar'

interface Publisher {
  id?: number
  name: string
  website?: string
  country?: string
  city?: string
  address?: string
  intro?: string
  genres?: string
  remark?: string
}

const $q = useQuasar()

// Reactive state
const viewToggle = ref(false)
const filter = ref('')
const mode = ref<'list' | 'grid'>('grid')
const pagination = ref({
  rowsPerPage: 10,
})

// Publisher data
const publishers = ref<Publisher[]>([
  {
    id: 1,
    name: 'Penguin Random House',
    website: 'https://www.penguinrandomhouse.com',
    country: 'USA',
    city: 'New York',
    address: '1745 Broadway, New York, NY 10019',
    intro: 'One of the largest trade book publishers in the world',
    genres: "Fiction, Non-fiction, Children's books",
    remark: 'Founded in 2013 through merger',
  },
  {
    id: 2,
    name: 'HarperCollins',
    website: 'https://www.harpercollins.com',
    country: 'USA',
    city: 'New York',
    address: '195 Broadway, New York, NY 10007',
    intro: 'Global publishing company with focus on consumer publishing',
    genres: 'Fiction, Non-fiction, Educational',
    remark: 'Founded in 1817',
  },
  {
    id: 3,
    name: 'Springer Nature',
    website: 'https://www.springernature.com',
    country: 'Germany',
    city: 'Berlin',
    address: 'Heidelberger Platz 3, 14197 Berlin',
    intro: 'Academic publishing company specializing in science',
    genres: 'Scientific journals, Academic books',
    remark: 'Merger of Springer Science+Business Media and Nature Publishing Group',
  },
  {
    id: 4,
    name: 'Oxford University Press',
    website: 'https://global.oup.com',
    country: 'UK',
    city: 'Oxford',
    address: 'Great Clarendon Street, Oxford OX2 6DP',
    intro: 'University press of the University of Oxford',
    genres: 'Academic, Educational, Reference',
    remark: 'Largest university press in the world',
  },
  {
    id: 5,
    name: 'Cambridge University Press',
    website: 'https://www.cambridge.org',
    country: 'UK',
    city: 'Cambridge',
    address: 'University Printing House, Shaftesbury Road, Cambridge CB2 8BS',
    intro: 'University press of the University of Cambridge',
    genres: 'Academic, Educational, ELT',
    remark: 'Oldest university press in the world',
  },
])

// Table columns (removed website column)
const columns = ref([
  {
    name: 'name',
    required: true,
    label: 'Publisher Name',
    align: 'left',
    field: 'name',
    sortable: true,
  },
  {
    name: 'country',
    align: 'left',
    label: 'Country',
    field: 'country',
    sortable: true,
  },
  {
    name: 'city',
    align: 'left',
    label: 'City',
    field: 'city',
    sortable: true,
  },
  {
    name: 'genres',
    align: 'left',
    label: 'Main Genres',
    field: 'genres',
    sortable: true,
  },
  {
    name: 'action',
    align: 'left',
    label: 'Action',
    field: 'action',
    sortable: false,
  },
])

// Dialog state
const showPublisherDialog = ref(false)
const showViewDialog = ref(false)
const isEditing = ref(false)
const currentPublisher = ref<Publisher>({
  name: '',
  website: '',
  country: '',
  city: '',
  address: '',
  intro: '',
  genres: '',
  remark: '',
})

// 辅助函数
const ensureUrlProtocol = (url: string): string => {
  if (!url) return ''
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url
  }
  return url
}

const formatUrl = (url: string): string => {
  if (!url) return ''
  // 移除协议部分，只显示域名
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Methods
const addPublisher = () => {
  currentPublisher.value = {
    name: '',
    website: '',
    country: '',
    city: '',
    address: '',
    intro: '',
    genres: '',
    remark: '',
  }
  isEditing.value = false
  showPublisherDialog.value = true
}

const editPublisher = (publisher: Publisher) => {
  currentPublisher.value = { ...publisher }
  isEditing.value = true
  showPublisherDialog.value = true
}

const viewPublisher = (publisher: Publisher) => {
  currentPublisher.value = { ...publisher }
  showViewDialog.value = true
}

const openWebsite = (url: string) => {
  if (url) {
    window.open(ensureUrlProtocol(url), '_blank')
  }
}

const savePublisher = () => {
  if (!currentPublisher.value.name) {
    $q.notify({
      color: 'negative',
      message: 'Publisher name is required',
    })
    return
  }

  if (isEditing.value) {
    // Update existing publisher
    const index = publishers.value.findIndex((p) => p.id === currentPublisher.value.id)
    if (index !== -1) {
      publishers.value[index] = { ...currentPublisher.value }
    }
    $q.notify({
      color: 'positive',
      message: 'Publisher updated successfully',
    })
  } else {
    // Add new publisher
    currentPublisher.value.id =
      publishers.value.length > 0 ? Math.max(...publishers.value.map((p) => p.id || 0)) + 1 : 1
    publishers.value.push({ ...currentPublisher.value })
    $q.notify({
      color: 'positive',
      message: 'Publisher added successfully',
    })
  }

  showPublisherDialog.value = false
}

const deletePublisher = (publisher: Publisher) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete ${publisher.name}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    publishers.value = publishers.value.filter((p) => p.id !== publisher.id)
    $q.notify({
      color: 'positive',
      message: 'Publisher deleted successfully',
    })
  })
}

const wrapCsvValue = (val: any, formatFn?: (val: any) => any) => {
  let formatted = formatFn !== undefined ? formatFn(val) : val
  formatted = formatted === undefined || formatted === null ? '' : String(formatted)
  formatted = formatted.split('"').join('""')
  return `"${formatted}"`
}

const exportTable = () => {
  const content = [columns.value.map((col) => wrapCsvValue(col.label))]
    .concat(
      publishers.value.map((row) =>
        columns.value
          .map((col) =>
            wrapCsvValue(
              typeof col.field === 'function' ? col.field(row) : row[col.field as keyof Publisher],
              (col as any).format,
            ),
          )
          .join(','),
      ),
    )
    .join('\r\n')

  const status = exportFile('publisher-management.csv', content, 'text/csv')

  if (status !== true) {
    $q.notify({
      message: 'Browser denied file download...',
      color: 'negative',
      icon: 'warning',
    })
  }
}
</script>

<style scoped>

.grid-style-transition {
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.grid-style-transition:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

</style>
