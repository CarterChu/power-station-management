<template>
  <div class="fj-batch-list-page">
    <div class="fj-main-card">
      <!-- 统计卡片区 -->
      <div class="fj-stats-row">
        <div
          v-for="card in statCards"
          :key="String(card.key)"
          class="fj-stat-card"
          :class="{ active: activeStatKey === card.key }"
          @click="selectStatCard(card.key)"
        >
          <div class="fj-stat-label">{{ card.label }}</div>
          <div class="fj-stat-count" :class="`fj-count--${card.key}`">{{ card.count }}</div>
        </div>
      </div>
      <AnfeProTable
        ref="tableRef"
        table-key="fj-batch-list"
        :columns="columns"
        :filters="filters"
        :config="tableConfig"
        :page-size="10"
        :table-props="{ scroll: { x: 1600 } }"
      >
        <template #operationRight>
          <a-space>
            <a-button type="primary" @click="handleCreate">新增飞检</a-button>
            <a-button @click="handleExport">导出</a-button>
          </a-space>
        </template>

        <!-- 飞检类型 -->
        <template #typeSlot="{ row }">
          <a-tag :color="row.type === 'daily' ? 'blue' : 'purple'" style="margin:0">
            {{ row.type === 'daily' ? '日常飞检' : '专项飞检' }}
          </a-tag>
        </template>

        <!-- 批次状态 -->
        <template #statusSlot="{ row }">
          <a-tag :color="BATCH_STATUS_COLOR[row.status]" style="margin:0">{{ BATCH_STATUS_LABEL[row.status] ?? row.status }}</a-tag>
        </template>

        <!-- 通过比例 -->
        <template #passRateSlot="{ row }">
          <template v-if="row.status === 'draft'">
            <span style="color:#bfbfbf">—</span>
          </template>
          <template v-else>
            <div class="fj-pass-rate">
              <span class="fj-pass-rate-num" :class="{ 'is-low': row.passRate < 70 }">
                {{ row.passCount }}/{{ row.stationCount }}
              </span>
              <span class="fj-pass-rate-pct" :class="{ 'is-low': row.passRate < 70 }">
                {{ row.passRate != null ? row.passRate + '%' : '—' }}
              </span>
            </div>
          </template>
        </template>

        <!-- 批次单号 -->
        <template #batchNoSlot="{ row }">
          <span class="fj-batch-no-link" @click="handleDetail(row)">{{ row.batchNo }}</span>
        </template>

        <!-- 逾期天数 -->
        <template #overdueDaysSlot="{ row }">
          <template v-if="['draft', 'done', 'deleted'].includes(row.status) || calcOverdueDays(row.checkDate) <= 0">
            <span style="color:#bfbfbf">—</span>
          </template>
          <template v-else>
            <span style="color:#ff4d4f;font-weight:500">{{ calcOverdueDays(row.checkDate) }} 天</span>
          </template>
        </template>

        <!-- 行操作 -->
        <template #actionSlot="{ row }">
          <a-space :size="0">
            <a-button type="link" size="small" @click="handleDetail(row)">详情</a-button>
            <a-button
              v-if="['draft', 'pending'].includes(row.status)"
              type="link" size="small"
              @click="handleEdit(row)"
            >编辑</a-button>
            <a-button v-if="row.status !== 'deleted'" type="link" size="small" @click="handleExportRow(row)">导出</a-button>
            <a-popconfirm
              v-if="row.status === 'draft'"
              title="确认删除该草稿？删除后不可恢复。"
              ok-text="删除"
              cancel-text="取消"
              ok-type="danger"
              @confirm="handleDelete(row)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </AnfeProTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AnfeProTable } from '@anfe/vue-pro-components'
import { message } from 'ant-design-vue'
import { MOCK_FJ_BATCHES } from '../mock/fj-data'

const props = defineProps<{
  pendingNewBatch?: any
}>()

const emit = defineEmits<{
  navigate: [target: string, payload?: any]
  batchAdded: []
}>()

// ── 状态 ────────────────────────────────────────────────────────────────────
const tableRef = ref<any>(null)
const activeStatKey = ref<string | null>(null)

const BATCH_STATUS_LABEL: Record<string, string> = {
  draft: '草稿', pending: '待检查', checking: '检查中', done: '已验收', deleted: '已删除',
}
const BATCH_STATUS_COLOR: Record<string, string> = {
  draft: 'default', pending: 'warning', checking: 'processing', done: 'success', deleted: 'error',
}

// ── 统计卡片 ─────────────────────────────────────────────────────────────────
const statCards = computed(() => [
  { key: null, label: '全部', count: MOCK_BATCHES.value.length },
  { key: 'draft', label: '草稿', count: MOCK_BATCHES.value.filter(b => b.status === 'draft').length },
  { key: 'pending', label: '待检查', count: MOCK_BATCHES.value.filter(b => b.status === 'pending').length },
  { key: 'checking', label: '检查中', count: MOCK_BATCHES.value.filter(b => b.status === 'checking').length },
  { key: 'done', label: '已验收', count: MOCK_BATCHES.value.filter(b => b.status === 'done').length },
  { key: 'deleted', label: '已删除', count: MOCK_BATCHES.value.filter(b => b.status === 'deleted').length },
])

// ── 表格列 ────────────────────────────────────────────────────────────────
const columns: any[] = [
  { title: '批次单号', key: 'batchNo', width: 180, fixed: 'left' as const, component: 'custom', slotName: 'batchNoSlot' },
  { title: '飞检类型', key: 'type', width: 110, component: 'custom', slotName: 'typeSlot' },
  { title: '飞检名称', dataIndex: 'name', key: 'name', width: 160, ellipsis: true, customRender: ({ text }: any) => text || '—' },
  { title: '小组负责人', dataIndex: 'leader', key: 'leader', width: 110 },
  { title: '飞检日期', dataIndex: 'checkDate', key: 'checkDate', width: 130 },
  { title: '电站数', dataIndex: 'stationCount', key: 'stationCount', width: 90 },
  { title: '通过比例', key: 'passRate', width: 130, component: 'custom', slotName: 'passRateSlot' },
  { title: '状态', key: 'status', width: 110, component: 'custom', slotName: 'statusSlot' },
  { title: '逾期天数', key: 'overdueDays', width: 100, component: 'custom', slotName: 'overdueDaysSlot' },
  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', fixed: 'right' as const, width: 200, component: 'custom', slotName: 'actionSlot' },
]

// ── 筛选项 ────────────────────────────────────────────────────────────────
const filters = [
  { label: '批次单号', key: 'batchNo', component: 'input', placeholder: '请输入批次单号' },
  { label: '飞检类型', key: 'type', component: 'select', placeholder: '请选择', options: [
    { label: '日常飞检', value: 'daily' },
    { label: '专项飞检', value: 'special' },
  ]},
  { label: '飞检日期', key: 'checkDateRange', component: 'rangePicker', placeholder: ['开始日期', '结束日期'] },
  { label: '批次状态', key: 'status', component: 'select', placeholder: '请选择',
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: '草稿',   value: 'draft' },
      { label: '待检查', value: 'pending' },
      { label: '检查中', value: 'checking' },
      { label: '已验收', value: 'done' },
      { label: '已删除', value: 'deleted' },
    ]},
  { label: '小组负责人', key: 'leader', component: 'input', placeholder: '请输入负责人姓名' },
  { label: '创建人', key: 'createdBy', component: 'input', placeholder: '请输入创建人姓名' },
]

// ── 请求配置 ──────────────────────────────────────────────────────────────
const tableConfig = {
  rowKey: 'id',
  searchOnLoad: true,
  request: async (params: Record<string, any>) => {
    const { params: fp = {}, pageIndex, pageRows } = params
    await new Promise(r => setTimeout(r, 200))
    let list = [...MOCK_BATCHES.value]
    if (activeStatKey.value) list = list.filter(b => b.status === activeStatKey.value)
    if (fp.batchNo) list = list.filter(b => b.batchNo.includes(fp.batchNo))
    if (fp.type) list = list.filter(b => b.type === fp.type)
    if (fp.status?.length) list = list.filter(b => fp.status.includes(b.status))
    if (fp.leader) list = list.filter(b => b.leader.includes(fp.leader))
    if (fp.createdBy) list = list.filter(b => b.createdBy.includes(fp.createdBy))
    const total = list.length
    list = list.slice(((pageIndex ?? 1) - 1) * (pageRows ?? 10), (pageIndex ?? 1) * (pageRows ?? 10))
    return { data: list, count: total }
  },
}

// ── 工具函数 ──────────────────────────────────────────────────────────────
function calcOverdueDays(checkDate: string): number {
  const diff = Math.floor((Date.now() - new Date(checkDate).getTime()) / 86400000)
  return diff
}

// ── 操作 ──────────────────────────────────────────────────────────────────
function selectStatCard(key: string | null) {
  activeStatKey.value = key
  tableRef.value?.setDefaultValue('status', key ? [key] : [])
  tableRef.value?.onSearch(1)
}

function handleCreate() {
  emit('navigate', 'fj-batch-edit', { mode: 'create' })
}

function handleEdit(row: any) {
  emit('navigate', 'fj-batch-edit', { mode: 'edit', row })
}

function handleDetail(row: any) {
  emit('navigate', 'fj-batch-detail', { row })
}

function handleExport() {
  message.info('导出功能接入后生效')
}

function handleExportRow(_row: any) {
  message.info('导出功能接入后生效')
}

function handleDelete(row: any) {
  const idx = MOCK_BATCHES.value.findIndex(b => b.id === row.id)
  if (idx !== -1) MOCK_BATCHES.value[idx].status = 'deleted'
  tableRef.value?.onSearch(1)
  message.success('已删除')
}

// ── Mock 数据（从共享文件引入）────────────────────────────────────────────
const MOCK_BATCHES = ref([...MOCK_FJ_BATCHES])

watch(() => props.pendingNewBatch, (batch) => {
  if (batch) {
    MOCK_BATCHES.value.unshift(batch)
    tableRef.value?.onSearch(1)
    emit('batchAdded')
  }
}, { immediate: true })
</script>

<style scoped>
.fj-batch-list-page { padding: 16px; }

/* 统计卡片 */
.fj-stats-row { display: flex; gap: 10px; padding: 20px 20px 12px; }
.fj-stat-card {
  flex: 1; background: #fff; border: 1px solid #f0f0f0; border-radius: 8px;
  padding: 12px 16px; cursor: pointer; transition: border-color 0.15s;
}
.fj-stat-card:hover { border-color: #3060FF; }
.fj-stat-card.active { border-color: #3060FF; background: #EEF2FF; }
.fj-stat-label { font-size: 13px; color: #8c8c8c; margin-bottom: 4px; }
.fj-stat-card.active .fj-stat-label { color: #3060FF; }
.fj-stat-count { font-size: 22px; font-weight: 700; color: #262626; line-height: 1.2; }
.fj-stat-card.active .fj-stat-count { color: #3060FF; }
.fj-count--draft { color: #8c8c8c; }
.fj-count--pending { color: #fa8c16; }
.fj-count--checking { color: #3060FF; }
.fj-count--done { color: #52c41a; }
.fj-count--deleted { color: #ff4d4f; }

/* 主卡片 */
.fj-main-card { background: #fff; border-radius: 8px; overflow: hidden; }
.fj-main-card :deep(.anfe-pro-table) { background: transparent !important; border-radius: 0 !important; box-shadow: none !important; }

/* 批次号链接 */
.fj-batch-no-link { color: #3060FF; cursor: pointer; }
.fj-batch-no-link:hover { text-decoration: underline; }


/* 通过比例 */
.fj-pass-rate { display: flex; flex-direction: column; gap: 1px; }
.fj-pass-rate-num { font-size: 14px; color: #262626; font-weight: 500; }
.fj-pass-rate-pct { font-size: 12px; color: #52c41a; }
.fj-pass-rate-num.is-low { color: #ff4d4f; }
.fj-pass-rate-pct.is-low { color: #ff4d4f; }
</style>
