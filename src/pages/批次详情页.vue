<template>
  <div class="batch-detail-page">
    <div class="batch-detail-header">
      <a-button type="text" @click="emit('back')">
        <template #icon><LeftOutlined /></template>
      </a-button>
      <span class="batch-detail-title">批次详情</span>
      <a-tag :color="statusColor[batch.status]" style="margin:0">{{ STATUS_LABEL[batch.status] }}</a-tag>
      <div style="flex:1"></div>
      <a-button v-if="['draft','pending'].includes(batch.status)" @click="handleEdit">编辑批次</a-button>
      <a-button @click="handleExport">导出</a-button>
    </div>

    <div class="batch-detail-body">
      <div class="detail-meta-card">
        <div class="card-section-title" style="margin-bottom:16px">基本信息</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">飞检批次单号</div>
            <div class="info-value">{{ batch.batchNo }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">飞检类型</div>
            <div class="info-value">
              <a-tag :color="batch.type === 'daily' ? 'blue' : 'purple'" style="margin:0">
                {{ batch.type === 'daily' ? '日常飞检' : '专项飞检' }}
              </a-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">飞检名称</div>
            <div class="info-value">{{ batch.name || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">飞检日期</div>
            <div class="info-value">{{ batch.checkDate }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">小组负责人</div>
            <div class="info-value">{{ batch.leader }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">是否随机</div>
            <div class="info-value">{{ batch.random ? `是（${batch.sampleRate}%）` : '否' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">状态</div>
            <div class="info-value">
              <a-tag :color="statusColor[batch.status]" style="margin:0">{{ STATUS_LABEL[batch.status] }}</a-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">逾期数量</div>
            <div class="info-value">
              <template v-if="['draft', 'done', 'deleted'].includes(batch.status)">—</template>
              <span v-else-if="overdueCount > 0" style="color:#ff4d4f;font-weight:500">{{ overdueCount }}</span>
              <span v-else>0</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">创建人</div>
            <div class="info-value">{{ batch.createdBy || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ batch.createdAt }}</div>
          </div>
          <div class="info-item info-item--span2">
            <div class="info-label">验收备注</div>
            <div class="info-value">{{ batch.remark || '—' }}</div>
          </div>
        </div>
      </div>

      <!-- 飞检单子列表（含统计卡片） -->
      <div class="sheet-list-card">
        <div class="sheet-list-header">
          <span class="card-section-title">飞检单列表</span>
        </div>
        <!-- 统计卡片行 -->
        <div class="bstat-row">
          <div class="bstat-card" :class="{ active: sheetFilter === null }" @click="sheetFilter = null">
            <div class="bstat-num">{{ sheetStats.total }}</div>
            <div class="bstat-label">抽检电站数</div>
          </div>
          <div class="bstat-card" :class="{ active: sheetFilter === 'passed' }" @click="sheetFilter = sheetFilter === 'passed' ? null : 'passed'">
            <div class="bstat-num pass">{{ sheetStats.passed }}</div>
            <div class="bstat-label">验收通过<span v-if="sheetStats.rate != null" class="bstat-rate"><span class="bstat-dot">·</span>通过率 {{ sheetStats.rate }}%</span></div>
          </div>
          <div class="bstat-card" :class="{ active: sheetFilter === 'failed' }" @click="sheetFilter = sheetFilter === 'failed' ? null : 'failed'">
            <div class="bstat-num fail">{{ sheetStats.failed }}</div>
            <div class="bstat-label">验收不通过</div>
          </div>
          <div class="bstat-card" :class="{ active: sheetFilter === 'pending' }" @click="sheetFilter = sheetFilter === 'pending' ? null : 'pending'">
            <div class="bstat-num pending">{{ sheetStats.pending }}</div>
            <div class="bstat-label">待检查</div>
          </div>
        </div>
        <a-table
          :columns="sheetColumns"
          :data-source="filteredSheets"
          size="small"
          row-key="id"
          :pagination="{ pageSize: 10, size: 'small' }"
          :scroll="{ x: 2000 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sheetNo'">
              <span class="sheet-no-link" @click="handleSheetDetail(record)">{{ record.sheetNo }}</span>
            </template>
            <template v-if="column.key === 'checkStatus'">
              <a-tag :color="CHECK_STATUS_COLOR[record.checkStatus]" style="margin:0">{{ CHECK_STATUS_LABEL[record.checkStatus] ?? record.checkStatus }}</a-tag>
            </template>
            <template v-if="column.key === 'rectifyStatus'">
              <span v-if="record.checkStatus === 'pending'" style="color:#bfbfbf">—</span>
              <a-tag v-else-if="record.rectifyStatus === 'none'" color="default" style="margin:0">无缺陷</a-tag>
              <a-tag v-else-if="record.rectifyStatus === 'pending'" color="warning" style="margin:0">待整改</a-tag>
              <a-tag v-else-if="record.rectifyStatus === 'reviewing'" color="processing" style="margin:0">待复验</a-tag>
              <a-tag v-else-if="record.rectifyStatus === 'passed'" color="success" style="margin:0">整改通过</a-tag>
            </template>
            <template v-if="column.key === 'defects'">
              <span v-if="record.checkStatus === 'pending'" style="color:#bfbfbf">—</span>
              <span v-else>
                <span class="defect-badge cr">CR {{ record.crCount }}</span>
                <span class="defect-badge ma">MA {{ record.maCount }}</span>
                <span class="defect-badge mi">MI {{ record.miCount }}</span>
              </span>
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="handleSheetDetail(record)">查看飞检单</a-button>
            </template>
          </template>
        </a-table>
      </div>
    </div>
  <!-- 飞检单详情 Drawer -->
  <a-drawer
    v-model:open="sheetDetailVisible"
    width="860"
    :body-style="{ padding: '16px 20px' }"
    destroy-on-close
  >
    <template v-if="sheetDetailRow" #title>
      <span style="margin-right:10px">飞检详情 · {{ sheetDetailRow.sheetNo }}</span>
      <a-tag v-if="sheetDetailRow.checkStatus === 'pending'" color="default" style="margin:0">待检查</a-tag>
      <a-tag v-else-if="sheetDetailRow.checkStatus === 'passed'" color="success" style="margin:0">通过</a-tag>
      <a-tag v-else color="error" style="margin:0">不通过</a-tag>
    </template>
    <FjSheetDetailPC v-if="sheetDetailRow" :init-row="sheetDetailRow" />
  </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FjSheetDetailPC from './飞检单详情页-PC.vue'
import { LeftOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { MOCK_FJ_BATCHES, MOCK_FJ_SHEETS } from '../mock/fj-data'

const props = defineProps<{
  initRow?: any
}>()

const emit = defineEmits<{
  back: []
  navigate: [target: string, payload?: any]
}>()

const STATUS_LABEL: Record<string, string> = { draft: '草稿', pending: '待检查', checking: '检查中', done: '已验收', deleted: '已删除' }
const statusColor: Record<string, string> = { draft: 'default', pending: 'warning', checking: 'processing', done: 'success', deleted: 'error' }
const CHECK_STATUS_LABEL: Record<string, string> = { pending: '待检查', passed: '通过', failed: '不通过' }
const CHECK_STATUS_COLOR: Record<string, string> = { pending: 'warning', passed: 'success', failed: 'error' }

// 从 props 取批次数据，或用 mock
const batch = computed(() => props.initRow ?? MOCK_BATCH_DETAIL)

// 飞检单列表（根据 batch id 过滤）
const sheets = computed(() => MOCK_SHEETS.filter(s => s.batchId === batch.value.id))
const sheetFilter = ref<string | null>(null)
const sheetDetailVisible = ref(false)
const sheetDetailRow = ref<any>(null)
const filteredSheets = computed(() =>
  sheetFilter.value ? sheets.value.filter(s => s.checkStatus === sheetFilter.value) : sheets.value
)
const overdueCount = computed(() => {
  if (['draft', 'done', 'deleted'].includes(batch.value.status)) return 0
  const checkDate = batch.value.checkDate
  if (!checkDate) return 0
  const days = Math.floor((Date.now() - new Date(checkDate).getTime()) / 86400000)
  return days > 0 ? sheets.value.filter(s => s.checkStatus === 'pending').length : 0
})

const sheetStats = computed(() => {
  const b = batch.value
  const total = b.stationCount ?? 0
  const passed = b.passCount ?? 0
  const failed = b.failCount ?? 0
  const pending = b.pendingCount ?? 0
  const rate = b.passRate ?? (total > 0 ? Math.round(passed / total * 100) : null)
  return { total, passed, failed, pending, rate }
})

// ── 表格列 ────────────────────────────────────────────────────────────────
const sheetColumns = [
  { title: '飞检单号',   dataIndex: 'sheetNo',    key: 'sheetNo',    width: 170, fixed: 'left' as const, ellipsis: true },
  { title: '电站编号',   dataIndex: 'stationNo',  key: 'stationNo',  width: 160, ellipsis: true },
  { title: '业主',       dataIndex: 'owner',      key: 'owner',      width: 100 },
  { title: '装机容量',   dataIndex: 'capacity',   key: 'capacity',   width: 110 },
  { title: '电站类型',   dataIndex: 'stationType', key: 'stationType', width: 100 },
  { title: '电站地址',   dataIndex: 'address',    key: 'address',    width: 180, ellipsis: true },
  { title: '一级代理商', dataIndex: 'firstAgent', key: 'firstAgent', width: 160, ellipsis: true },
  { title: '代理商',     dataIndex: 'agent',      key: 'agent',      width: 170, ellipsis: true },
  { title: '飞检工程师', dataIndex: 'engineer',   key: 'engineer',   width: 110 },
  { title: '飞检日期',   dataIndex: 'checkDate',  key: 'checkDate',  width: 130 },
  { title: '缺陷统计',   key: 'defects',          width: 180 },
  { title: '检查状态',   key: 'checkStatus',      width: 110 },
  { title: '整改状态',   key: 'rectifyStatus',    width: 110 },
  { title: '操作',       key: 'action',           fixed: 'right' as const, width: 120 },
]

function handleSheetDetail(row: any) {
  sheetDetailRow.value = { ...row, batchNo: batch.value.batchNo }
  sheetDetailVisible.value = true
}

function handleEdit() {
  emit('navigate', 'fj-batch-edit', { mode: 'edit', row: batch.value })
}

function handleExport() {
  message.info('导出功能接入后生效')
}

// ── Mock 数据（从共享文件引入）────────────────────────────────────────────
const MOCK_BATCH_DETAIL = MOCK_FJ_BATCHES[0]
const MOCK_SHEETS = MOCK_FJ_SHEETS
</script>

<style scoped>
.batch-detail-page { display: flex; flex-direction: column; height: calc(100vh - 82px); overflow: hidden; }



.batch-detail-header {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px;
  background: #fff; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.batch-detail-title { font-size: 15px; font-weight: 600; color: #262626; }

.batch-detail-body {
  flex: 1; overflow-y: auto; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 12px;
}

.detail-meta-card {
  background: #fff; border-radius: 8px; padding: 18px 20px;
}
.info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 0; }
.info-item--span2 { grid-column: span 2; }
.info-item--span3 { grid-column: span 3; }
.info-label { font-size: 14px; color: rgba(0,0,0,0.45); line-height: 22px; padding-bottom: 8px; white-space: nowrap; }
.info-value { font-size: 14px; color: #262626; }
.fj-pass-rate { display: flex; align-items: baseline; gap: 6px; }
.fj-pass-rate-num { font-size: 14px; color: #262626; font-weight: 500; }
.fj-pass-rate-pct { font-size: 13px; color: #52c41a; }
.fj-pass-rate-num.is-low { color: #ff4d4f; }
.fj-pass-rate-pct.is-low { color: #ff4d4f; }

/* 统计卡片行（在飞检单列表卡片内） */
.bstat-row { display: flex; gap: 10px; padding: 0 0 20px; }
.bstat-card {
  flex: 1; border: 1px solid #f0f0f0; border-radius: 8px;
  padding: 12px 16px; cursor: pointer; transition: border-color 0.15s;
}
.bstat-card:hover { border-color: #3060FF; }
.bstat-card.active { border-color: #3060FF; background: #EEF2FF; }
.bstat-num { font-size: 22px; font-weight: 700; color: #262626; line-height: 1.2; }
.bstat-rate { font-size: 13px; font-weight: 400; color: inherit; margin-left: 4px; }
.bstat-dot { margin: 0 4px; }
.bstat-num.pass { color: #52c41a; }
.bstat-num.fail { color: #ff4d4f; }
.bstat-num.pending { color: #fa8c16; }
.bstat-card.active .bstat-num { color: #3060FF; }
.bstat-label { font-size: 13px; color: #8c8c8c; margin-top: 4px; }
.bstat-card.active .bstat-label { color: #3060FF; }

/* 飞检单列表 */
.sheet-list-card { background: #fff; border-radius: 8px; padding: 16px 20px 0; }
.sheet-list-card :deep(.ant-table-tbody > tr > td) { height: 56px; padding-top: 0; padding-bottom: 0; }
.sheet-list-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.card-section-title { font-size: 16px; font-weight: 600; color: #262626; }
.sheet-no-link { color: #3060FF; cursor: pointer; }
.sheet-no-link:hover { text-decoration: underline; }



.defect-badge {
  display: inline-block; font-size: 11px; font-weight: 600;
  padding: 1px 5px; border-radius: 3px; margin-right: 4px;
}
.defect-badge.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge.mi { background: rgba(250,219,20,0.15); color: #d48806; }
</style>
