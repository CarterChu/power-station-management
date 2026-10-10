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
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">批次单号</div>
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
          <div v-if="batch.type === 'special'" class="info-item">
            <div class="info-label">飞检名称</div>
            <div class="info-value">{{ batch.name || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">小组负责人</div>
            <div class="info-value">{{ batch.leader }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">飞检日期</div>
            <div class="info-value">{{ batch.checkDate }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">是否随机</div>
            <div class="info-value">{{ batch.random ? `是（${batch.sampleRate}%）` : '否' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ batch.createdAt }}</div>
          </div>
          <div v-if="batch.remark" class="info-item info-item--span2">
            <div class="info-label">备注</div>
            <div class="info-value">{{ batch.remark }}</div>
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
          :scroll="{ x: 1200 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sheetNo'">
              <span class="sheet-no-link" @click="handleSheetDetail(record)">{{ record.sheetNo }}</span>
            </template>
            <template v-if="column.key === 'checkStatus'">
              <span class="fj-status-dot-wrap">
                <span class="fj-status-dot" :class="`fj-dot--${record.checkStatus}`"></span>
                {{ CHECK_STATUS_LABEL[record.checkStatus] ?? record.checkStatus }}
              </span>
            </template>
            <template v-if="column.key === 'rectifyStatus'">
              <span v-if="record.checkStatus === 'pending'" style="color:#bfbfbf">—</span>
              <a-tag v-else-if="record.rectifyStatus === 'none'" color="default" style="margin:0">无缺陷</a-tag>
              <a-tag v-else-if="record.rectifyStatus === 'rectifying'" color="warning" style="margin:0">整改中</a-tag>
              <a-tag v-else-if="record.rectifyStatus === 'done'" color="success" style="margin:0">整改完成</a-tag>
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
              <a-space :size="0">
                <a-button
                  v-if="record.checkStatus === 'pending'"
                  type="link" size="small"
                  @click="handleStartCheck(record)"
                >开始飞检</a-button>
                <a-button type="link" size="small" @click="handleSheetDetail(record)">查看飞检单</a-button>
              </a-space>
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

const props = defineProps<{
  initRow?: any
}>()

const emit = defineEmits<{
  back: []
  navigate: [target: string, payload?: any]
}>()

const STATUS_LABEL: Record<string, string> = { draft: '草稿', pending: '待检查', checking: '检查中', done: '已验收' }
const statusColor: Record<string, string> = { draft: 'default', pending: 'warning', checking: 'processing', done: 'success' }
const CHECK_STATUS_LABEL: Record<string, string> = { pending: '待检查', passed: '通过', failed: '不通过' }

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
const sheetStats = computed(() => {
  const all = sheets.value
  const passed = all.filter(s => s.checkStatus === 'passed').length
  const failed = all.filter(s => s.checkStatus === 'failed').length
  const pending = all.filter(s => s.checkStatus === 'pending').length
  const rate = all.length > 0 ? Math.round(passed / all.length * 100) : null
  return { total: all.length, passed, failed, pending, rate }
})

// ── 表格列 ────────────────────────────────────────────────────────────────
const sheetColumns = [
  { title: '飞检单号', key: 'sheetNo', dataIndex: 'sheetNo', width: 170, fixed: 'left' as const },
  { title: '电站编号', dataIndex: 'stationNo', key: 'stationNo', width: 160, ellipsis: true },
  { title: '业主', dataIndex: 'owner', key: 'owner', width: 100 },
  { title: '代理商', dataIndex: 'agent', key: 'agent', width: 160, ellipsis: true },
  { title: '飞检工程师', dataIndex: 'engineer', key: 'engineer', width: 110 },
  { title: '缺陷统计', key: 'defects', width: 160 },
  { title: '检查状态', key: 'checkStatus', width: 110 },
  { title: '整改状态', key: 'rectifyStatus', width: 110 },
  { title: '操作', key: 'action', fixed: 'right' as const, width: 120 },
]

function handleSheetDetail(row: any) {
  sheetDetailRow.value = row
  sheetDetailVisible.value = true
}

function handleEdit() {
  emit('navigate', 'fj-batch-edit', { mode: 'edit', row: batch.value })
}

function handleExport() {
  message.info('导出功能接入后生效')
}

// ── Mock 数据 ────────────────────────────────────────────────────────────
const MOCK_BATCH_DETAIL = {
  id: 'b01', batchNo: 'FJB-2026-001', type: 'daily', name: '',
  leader: '王建国', checkDate: '2026-09-10', random: true, sampleRate: 30,
  stationCount: 12, passCount: 10, failCount: 2, pendingCount: 0, passRate: 83,
  status: 'done', autoGenerated: true, createdAt: '2026-09-01 09:12', remark: '季度例行飞检',
}

const MOCK_SHEETS = [
  { id: 'fj001', batchId: 'b01', sheetNo: 'FJD-2026-001001', stationNo: 'FJZ-2025-001001', owner: '张三', agent: '杭州阳光新能源', engineer: '赵飞', crCount: 0, maCount: 1, miCount: 2, checkStatus: 'failed', rectifyStatus: 'done' },
  { id: 'fj002', batchId: 'b01', sheetNo: 'FJD-2026-001002', stationNo: 'FJZ-2025-001003', owner: '王五', agent: '苏州工业光伏', engineer: '刘海', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'passed', rectifyStatus: 'none' },
  { id: 'fj003', batchId: 'b01', sheetNo: 'FJD-2026-001003', stationNo: 'FJZ-2025-001004', owner: '赵六', agent: '合肥绿色能源', engineer: '黄磊', crCount: 1, maCount: 0, miCount: 1, checkStatus: 'failed', rectifyStatus: 'rectifying' },
  { id: 'fj004', batchId: 'b01', sheetNo: 'FJD-2026-001004', stationNo: 'FJZ-2025-001006', owner: '周八', agent: '南京太阳能科技', engineer: '赵飞', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'passed', rectifyStatus: 'none' },
  { id: 'fj005', batchId: 'b01', sheetNo: 'FJD-2026-001005', stationNo: 'FJZ-2025-001007', owner: '吴九', agent: '杭州阳光新能源', engineer: '周斌', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'passed', rectifyStatus: 'none' },
  { id: 'fj006', batchId: 'b03', sheetNo: 'FJD-2026-003001', stationNo: 'FJZ-2025-001008', owner: '郑十', agent: '芜湖清洁能源', engineer: '吴杰', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'pending', rectifyStatus: 'none' },
  { id: 'fj007', batchId: 'b03', sheetNo: 'FJD-2026-003002', stationNo: 'FJZ-2025-001009', owner: '冯一', agent: '宁波绿能电力', engineer: '刘海', crCount: 0, maCount: 2, miCount: 0, checkStatus: 'failed', rectifyStatus: 'rectifying' },
  { id: 'fj008', batchId: 'b04', sheetNo: 'FJD-2026-004001', stationNo: 'FJZ-2025-001010', owner: '陈二', agent: '苏州工业光伏', engineer: '赵飞', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'pending', rectifyStatus: 'none' },
]
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
.info-label { font-size: 14px; color: rgba(0,0,0,0.45); line-height: 22px; padding-bottom: 8px; white-space: nowrap; }
.info-value { font-size: 14px; color: #262626; }

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

.fj-status-dot-wrap { display: inline-flex; align-items: center; gap: 6px; }
.fj-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.fj-dot--pending { background: #fa8c16; }
.fj-dot--passed { background: #52c41a; }
.fj-dot--failed { background: #ff4d4f; }

.defect-badge {
  display: inline-block; font-size: 11px; font-weight: 600;
  padding: 1px 5px; border-radius: 3px; margin-right: 4px;
}
.defect-badge.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge.mi { background: rgba(250,219,20,0.15); color: #d48806; }
</style>
