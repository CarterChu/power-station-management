<template>
  <div class="reconcile-summary-page">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-label">本期应结金额（万元）</div>
        <div class="stat-value">{{ stats.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</div>
        <div class="stat-sub">较上期 <span class="up">↑ 12.3%</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">代理商数量</div>
        <div class="stat-value">{{ stats.agentCount }}</div>
        <div class="stat-sub">本结算周期</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">账单总条数</div>
        <div class="stat-value">{{ stats.billCount.toLocaleString() }}</div>
        <div class="stat-sub">已核对 <span class="ok">{{ stats.checkedCount.toLocaleString() }}</span> 条</div>
      </div>
      <div class="stat-card warn">
        <div class="stat-label">异常账单数量</div>
        <div class="stat-value warn-val">{{ stats.anomalyCount }}</div>
        <div class="stat-sub">需人工核对</div>
      </div>
    </div>

    <!-- 异常提示 -->
    <div v-if="hasAnomalies" class="anomaly-banner">
      <ExclamationCircleOutlined class="banner-icon" />
      <span>本周期存在 <strong>{{ stats.anomalyCount }}</strong> 条异常账单，请及时处理。</span>
      <a-button size="small" type="link" @click="filterAnomalies">仅看异常</a-button>
      <a-button size="small" type="link" @click="clearFilter" style="color:rgba(0,0,0,0.45)">清除筛选</a-button>
    </div>

    <!-- 主卡 -->
    <div class="slist-main-card">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <a-select v-model:value="filterPeriod" style="width:160px" placeholder="结算周期">
            <a-select-option value="">全部周期</a-select-option>
            <a-select-option value="2026-09">2026年9月</a-select-option>
            <a-select-option value="2026-08">2026年8月</a-select-option>
            <a-select-option value="2026-07">2026年7月</a-select-option>
          </a-select>
          <a-select v-model:value="filterBrand" style="width:120px" placeholder="全部品牌">
            <a-select-option value="">全部品牌</a-select-option>
            <a-select-option value="安能">安能</a-select-option>
            <a-select-option value="光伏星">光伏星</a-select-option>
          </a-select>
          <a-input
            v-model:value="filterAgent"
            placeholder="代理商名称/编码"
            style="width:200px"
            allow-clear
          />
          <!-- 分组维度 -->
          <span class="dim-label">汇总维度</span>
          <div class="seg-ctrl">
            <span
              v-for="d in DIM_OPTIONS"
              :key="d.value"
              class="seg-ctrl-item"
              :class="{ 'is-active': activeDim === d.value }"
              @click="activeDim = d.value"
            >{{ d.label }}</span>
          </div>
          <a-button type="primary" @click="doQuery">查询</a-button>
        </div>
        <div class="toolbar-right">
          <a-button @click="handleExport">
            <template #icon><DownloadOutlined /></template>
            导出
          </a-button>
        </div>
      </div>

      <!-- 表格 -->
      <a-table
        :data-source="displayRows"
        :columns="tableColumns"
        :pagination="false"
        :scroll="{ x: 1100 }"
        row-key="id"
        size="middle"
        :loading="loading"
        :row-class-name="rowClass"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'agent'">
            <div class="agent-cell">
              <span class="agent-avatar" :style="{ background: record.color }">{{ record.agentName[0] }}</span>
              <div class="agent-info">
                <div class="agent-name">{{ record.agentName }}</div>
                <div class="agent-code">{{ record.agentCode }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span class="amount-val">{{ record.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</span>
          </template>
          <template v-else-if="column.key === 'anomaly'">
            <a-tag v-if="record.anomalyCount > 0" color="error">{{ record.anomalyCount }} 条异常</a-tag>
            <span v-else class="text-muted">—</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-badge :status="statusColor(record.status)" :text="record.status" />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handleViewDetail(record)">查看明细</a-button>
          </template>
        </template>
        <template #summary>
          <a-table-summary-row>
            <a-table-summary-cell :index="0" :col-span="3">
              <strong>合计（{{ filteredRows.length }} 家代理商）</strong>
            </a-table-summary-cell>
            <a-table-summary-cell :index="3">
              <strong>{{ totalBillCount.toLocaleString() }}</strong>
            </a-table-summary-cell>
            <a-table-summary-cell :index="4">
              <strong class="amount-val">{{ totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</strong>
            </a-table-summary-cell>
            <a-table-summary-cell :index="5">
              <strong>{{ totalDeduct.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</strong>
            </a-table-summary-cell>
            <a-table-summary-cell :index="6">
              <strong class="amount-val">{{ totalNetAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</strong>
            </a-table-summary-cell>
            <a-table-summary-cell :index="7" :col-span="3"></a-table-summary-cell>
          </a-table-summary-row>
        </template>
      </a-table>
      <div class="table-footer">
        <a-pagination
          v-model:current="page"
          v-model:page-size="pageSize"
          :total="filteredRows.length"
          :page-size-options="['10','20','50']"
          show-size-changer show-quick-jumper
          :show-total="t => `共 ${t} 条`"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { DownloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'

const filterPeriod = ref('2026-09')
const filterBrand = ref('')
const filterAgent = ref('')
const activeDim = ref('agent')
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const showAnomaly = ref(false)

const DIM_OPTIONS = [
  { label: '代理商', value: 'agent' },
  { label: '品牌', value: 'brand' },
  { label: '分公司', value: 'region' },
]

const tableColumns = [
  { title: '代理商', key: 'agent', fixed: 'left', width: 220 },
  { title: '品牌', dataIndex: 'brand', key: 'brand', width: 90 },
  { title: '分公司', dataIndex: 'region', key: 'region', width: 110 },
  { title: '账单条数', dataIndex: 'billCount', key: 'billCount', width: 100, align: 'right' },
  { title: '应结金额（万元）', key: 'amount', width: 160, align: 'right' },
  { title: '抵扣合计（万元）', dataIndex: 'deductTotal', key: 'deductTotal', width: 150, align: 'right' },
  { title: '实结金额（万元）', key: 'netAmount', dataIndex: 'netAmount', width: 160, align: 'right' },
  { title: '异常账单', key: 'anomaly', width: 120, align: 'center' },
  { title: '结算状态', key: 'status', width: 130 },
  { title: '操作', key: 'action', fixed: 'right', width: 90 },
]

interface ReconcileRow {
  id: number; agentName: string; agentCode: string; brand: string; region: string; color: string
  billCount: number; amount: number; deductTotal: number; netAmount: number
  anomalyCount: number; status: string
}

const MOCK_DATA: ReconcileRow[] = [
  { id: 1, agentName: '华东新能源科技有限公司', agentCode: 'DL20240001', brand: '安能', region: '华东分公司', color: '#1677ff', billCount: 2341, amount: 183.50, deductTotal: 21.60, netAmount: 161.90, anomalyCount: 3, status: '已开票' },
  { id: 2, agentName: '阳光光伏服务有限公司', agentCode: 'DL20240023', brand: '光伏星', region: '华南分公司', color: '#fa8c16', billCount: 1876, amount: 156.20, deductTotal: 18.40, netAmount: 137.80, anomalyCount: 0, status: '结算中' },
  { id: 3, agentName: '北方绿能电力有限公司', agentCode: 'DL20240046', brand: '安能', region: '华北分公司', color: '#13c2c2', billCount: 1540, amount: 124.80, deductTotal: 14.20, netAmount: 110.60, anomalyCount: 7, status: '待审核' },
  { id: 4, agentName: '江南新能科技发展有限公司', agentCode: 'DL20240087', brand: '安能', region: '华东分公司', color: '#722ed1', billCount: 2105, amount: 198.60, deductTotal: 23.10, netAmount: 175.50, anomalyCount: 0, status: '已完成' },
  { id: 5, agentName: '西部光能发展有限公司', agentCode: 'DL20240112', brand: '光伏星', region: '西南分公司', color: '#eb2f96', billCount: 987, amount: 89.30, deductTotal: 11.20, netAmount: 78.10, anomalyCount: 2, status: '结算中' },
  { id: 6, agentName: '绿色新能源技术有限公司', agentCode: 'DL20240134', brand: '安能', region: '华中分公司', color: '#52c41a', billCount: 1632, amount: 142.90, deductTotal: 16.80, netAmount: 126.10, anomalyCount: 0, status: '已开票' },
  { id: 7, agentName: '中原清洁电力有限公司', agentCode: 'DL20240156', brand: '光伏星', region: '华中分公司', color: '#faad14', billCount: 843, amount: 76.40, deductTotal: 8.90, netAmount: 67.50, anomalyCount: 5, status: '待审核' },
]

const stats = computed(() => ({
  totalAmount: MOCK_DATA.reduce((s, r) => s + r.amount, 0),
  agentCount: MOCK_DATA.length,
  billCount: MOCK_DATA.reduce((s, r) => s + r.billCount, 0),
  checkedCount: MOCK_DATA.reduce((s, r) => s + Math.floor(r.billCount * 0.95), 0),
  anomalyCount: MOCK_DATA.reduce((s, r) => s + r.anomalyCount, 0),
}))

const hasAnomalies = computed(() => stats.value.anomalyCount > 0)

const filteredRows = computed(() => {
  return MOCK_DATA.filter(row => {
    if (filterBrand.value && row.brand !== filterBrand.value) return false
    if (filterAgent.value && !row.agentName.includes(filterAgent.value) && !row.agentCode.includes(filterAgent.value)) return false
    if (showAnomaly.value && row.anomalyCount === 0) return false
    return true
  })
})

const displayRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const totalBillCount = computed(() => filteredRows.value.reduce((s, r) => s + r.billCount, 0))
const totalAmount = computed(() => filteredRows.value.reduce((s, r) => s + r.amount, 0))
const totalDeduct = computed(() => filteredRows.value.reduce((s, r) => s + r.deductTotal, 0))
const totalNetAmount = computed(() => filteredRows.value.reduce((s, r) => s + r.netAmount, 0))

function doQuery() { page.value = 1 }
function handleExport() { message.info('导出功能待接入') }
function filterAnomalies() { showAnomaly.value = true }
function clearFilter() { showAnomaly.value = false }
function handleViewDetail(row: ReconcileRow) {
  message.info(`查看 ${row.agentName} 的账单明细`)
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    '已完成': 'success', '已开票': 'processing', '结算中': 'warning', '待审核': 'error',
  }
  return map[status] ?? 'default'
}

function rowClass(record: ReconcileRow) {
  return record.anomalyCount > 0 ? 'row-anomaly' : ''
}
</script>

<style scoped>
.reconcile-summary-page { padding: 16px; height: 100%; box-sizing: border-box; overflow: auto; }
.slist-main-card { background: #fff; border-radius: 8px; }

/* 统计卡片 */
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
.stat-card {
  background: #fff; border-radius: 8px; padding: 16px 20px;
  border: 1px solid #f0f0f0;
}
.stat-card.warn { border-color: #fff1f0; }
.stat-label { font-size: 13px; color: rgba(0,0,0,0.45); margin-bottom: 6px; }
.stat-value { font-size: 26px; font-weight: 700; color: rgba(0,0,0,0.88); line-height: 1.2; }
.stat-value.warn-val { color: #cf1322; }
.stat-sub { font-size: 12px; color: rgba(0,0,0,0.35); margin-top: 4px; }
.up { color: #389e0d; }
.ok { color: #389e0d; }

/* 异常提示 */
.anomaly-banner {
  background: #fff7e6; border: 1px solid #ffd591; border-radius: 8px;
  padding: 10px 16px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
  font-size: 13px;
}
.banner-icon { color: #fa8c16; font-size: 15px; }

/* 工具栏 */
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #f0f0f0; gap: 8px;
}
.toolbar-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.dim-label { font-size: 13px; color: rgba(0,0,0,0.45); white-space: nowrap; }

/* seg-ctrl */
.seg-ctrl { display: inline-flex; background: rgba(0,0,0,.06); border-radius: 6px; padding: 2px; }
.seg-ctrl-item {
  padding: 4px 12px; border-radius: 4px; font-size: 13px; cursor: pointer;
  color: rgba(0,0,0,0.65); transition: all .12s;
}
.seg-ctrl-item.is-active { background: #fff; color: rgba(0,0,0,0.88); font-weight: 500; }

/* 金额 */
.amount-val { font-weight: 600; color: rgba(0,0,0,0.88); }
.text-muted { color: rgba(0,0,0,0.25); }

/* 代理商单元格 */
.agent-cell { display: flex; align-items: center; gap: 8px; }
.agent-avatar {
  width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; font-size: 13px; font-weight: 600;
}
.agent-name { font-size: 13px; color: rgba(0,0,0,0.88); }
.agent-code { font-size: 11px; color: rgba(0,0,0,0.35); }

/* 分页 */
.table-footer {
  display: flex; justify-content: flex-end;
  padding: 12px 16px; border-top: 1px solid #f0f0f0;
}

/* 异常行高亮 */
:deep(.row-anomaly td) { background: #fff9f9 !important; }
</style>
