<template>
  <div class="todo-page">
    <!-- 查询栏 -->
    <div class="slist-main-card" style="margin-bottom:12px">
      <div class="query-bar">
        <a-select v-model:value="queryBrand" style="width:120px" placeholder="全部品牌">
          <a-select-option value="">全部品牌</a-select-option>
          <a-select-option value="安能">安能</a-select-option>
          <a-select-option value="光伏星">光伏星</a-select-option>
        </a-select>
        <a-input
          v-model:value="queryAgent"
          placeholder="请输入代理商名称/编码"
          style="width:220px"
          allow-clear
        />
        <a-button type="primary" @click="doQuery">查询</a-button>
        <a-button @click="handleExport">
          <template #icon><DownloadOutlined /></template>
          导出
        </a-button>
        <a-button @click="handleReset">重置</a-button>
      </div>
    </div>

    <!-- 矩阵表格 -->
    <div class="slist-main-card">
      <div class="matrix-wrap">
        <table class="matrix-table">
          <thead>
            <!-- 分组行 -->
            <tr class="group-row">
              <th class="sticky-col th-idx" rowspan="2">序号</th>
              <th class="sticky-col th-agent" rowspan="2">代理商</th>
              <th class="sticky-col th-brand" rowspan="2">品牌</th>
              <th class="sticky-col th-region" rowspan="2">分公司</th>
              <th colspan="4" class="group-hd gp-sales">销售备货待办</th>
              <th colspan="6" class="group-hd gp-settle">结算待办</th>
              <th colspan="2" class="group-hd gp-archive">纸质归档待办</th>
              <th colspan="6" class="group-hd gp-freeze">冻结待办（万元）</th>
              <th colspan="6" class="group-hd gp-deduct">抵扣待办（万元）</th>
            </tr>
            <!-- 列名行 -->
            <tr class="col-row">
              <th class="gp-sales">待签署合同</th>
              <th class="gp-sales">待签收备货单</th>
              <th class="gp-sales">待开票申请</th>
              <th class="gp-sales">待退货协议签署</th>
              <th class="gp-settle">正数结算单<br>待开票</th>
              <th class="gp-settle">负数结算单<br>待开票</th>
              <th class="gp-settle">不可结算账单</th>
              <th class="gp-settle">待财务审核</th>
              <th class="gp-settle">结算管控中</th>
              <th class="gp-settle">待签署对账单</th>
              <th class="gp-archive">待整改资料</th>
              <th class="gp-archive">待邮寄资料</th>
              <th class="gp-freeze">超期物料<br>应冻结</th>
              <th class="gp-freeze">超期未并网<br>应冻结</th>
              <th class="gp-freeze">光伏贷逾期<br>应冻结</th>
              <th class="gp-freeze">运维应冻结</th>
              <th class="gp-freeze">整改逾期<br>应冻结</th>
              <th class="gp-freeze">其他应冻结</th>
              <th class="gp-deduct">超期未并网<br>应抵扣</th>
              <th class="gp-deduct">光伏贷逾期<br>应抵扣</th>
              <th class="gp-deduct">市场/运维<br>罚单应抵扣</th>
              <th class="gp-deduct">其他应抵扣</th>
              <th class="gp-deduct">负数结算单<br>应抵扣</th>
              <th class="gp-deduct">小安租转售<br>应抵扣</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in displayRows" :key="row.id">
              <td class="sticky-col td-idx">{{ idx + 1 }}</td>
              <td class="sticky-col td-agent">
                <div class="agent-cell">
                  <span class="agent-avatar" :style="{ background: row.color }">{{ row.name[0] }}</span>
                  <div class="agent-info">
                    <div class="agent-name">{{ row.name }}</div>
                    <div class="agent-code">{{ row.code }}</div>
                  </div>
                </div>
              </td>
              <td class="sticky-col td-brand">{{ row.brand }}</td>
              <td class="sticky-col td-region">{{ row.region }}</td>
              <!-- 销售备货待办 -->
              <td class="num-cell gp-sales-bg" @click="handleCellClick('sales-contract', row)"><span class="num-link" v-if="row.salesContract">{{ row.salesContract }}</span><span v-else class="num-zero">0</span></td>
              <td class="num-cell gp-sales-bg" @click="handleCellClick('sales-goods', row)"><span class="num-link" v-if="row.salesGoods">{{ row.salesGoods }}</span><span v-else class="num-zero">0</span></td>
              <td class="num-cell gp-sales-bg" @click="handleCellClick('sales-invoice', row)"><span class="num-link" v-if="row.salesInvoice">{{ row.salesInvoice }}</span><span v-else class="num-zero">0</span></td>
              <td class="num-cell gp-sales-bg" @click="handleCellClick('sales-return', row)"><span class="num-link" v-if="row.salesReturn">{{ row.salesReturn }}</span><span v-else class="num-zero">0</span></td>
              <!-- 结算待办 -->
              <td class="num-cell gp-settle-bg" @click="handleCellClick('settle-pos', row)"><span class="num-link" v-if="row.settlePosOpen">{{ row.settlePosOpen }}</span><span v-else class="num-zero">0</span></td>
              <td class="num-cell gp-settle-bg" @click="handleCellClick('settle-neg', row)"><span class="num-link" v-if="row.settleNegOpen">{{ row.settleNegOpen }}</span><span v-else class="num-zero">0</span></td>
              <td class="num-cell gp-settle-bg" @click="handleCellClick('settle-non', row)"><span class="num-link" v-if="row.settleNonSettle">{{ row.settleNonSettle }}</span><span v-else class="num-zero">0</span></td>
              <td class="num-cell gp-settle-bg" @click="handleCellClick('settle-finance', row)"><span class="num-link" v-if="row.settleFinance">{{ row.settleFinance }}</span><span v-else class="num-zero">0</span></td>
              <td class="num-cell gp-settle-bg" @click="handleCellClick('settle-controlled', row)"><span class="num-link" v-if="row.settleControlled">{{ row.settleControlled }}</span><span v-else class="num-zero">0</span></td>
              <td class="num-cell gp-settle-bg" @click="handleCellClick('settle-sign-reconcile', row)"><span class="num-link" v-if="row.settleSignReconcile">{{ row.settleSignReconcile }}</span><span v-else class="num-zero">0</span></td>
              <!-- 纸质归档待办 -->
              <td class="num-cell gp-archive-bg" @click="handleCellClick('archive-fix', row)"><span class="num-link" v-if="row.archiveFix">{{ row.archiveFix }}</span><span v-else class="num-zero">0</span></td>
              <td class="num-cell gp-archive-bg" @click="handleCellClick('archive-mail', row)"><span class="num-link" v-if="row.archiveMail">{{ row.archiveMail }}</span><span v-else class="num-zero">0</span></td>
              <!-- 冻结待办 -->
              <td class="num-cell gp-freeze-bg">{{ row.freezeMaterial }}</td>
              <td class="num-cell gp-freeze-bg">{{ row.freezeGrid }}</td>
              <td class="num-cell gp-freeze-bg">{{ row.freezeLoan }}</td>
              <td class="num-cell gp-freeze-bg">{{ row.freezeMaint }}</td>
              <td class="num-cell gp-freeze-bg">{{ row.freezeRect }}</td>
              <td class="num-cell gp-freeze-bg">{{ row.freezeOther }}</td>
              <!-- 抵扣待办 -->
              <td class="num-cell gp-deduct-bg">{{ row.deductGrid }}</td>
              <td class="num-cell gp-deduct-bg">{{ row.deductLoan }}</td>
              <td class="num-cell gp-deduct-bg">{{ row.deductPenalty }}</td>
              <td class="num-cell gp-deduct-bg">{{ row.deductOther }}</td>
              <td class="num-cell gp-deduct-bg">{{ row.deductNeg }}</td>
              <td class="num-cell gp-deduct-bg">{{ row.deductXaz }}</td>
            </tr>
            <tr v-if="displayRows.length === 0">
              <td colspan="28" style="text-align:center;padding:40px;color:#bfbfbf">暂无数据</td>
            </tr>
          </tbody>
          <tfoot v-if="displayRows.length > 0">
            <tr class="summary-row">
              <td colspan="4" class="summary-label">合计（{{ displayRows.length }}家结算对象）</td>
              <td colspan="4" class="summary-item">销售待办：<strong>{{ sumSales }}</strong> 项</td>
              <td colspan="6" class="summary-item">结算待办：<strong>{{ sumSettle }}</strong> 项&ensp;日均待办：<strong>{{ Math.ceil(sumSettle / 30) }}</strong> 项</td>
              <td colspan="2" class="summary-item">归档待办：<strong>{{ sumArchive }}</strong> 项</td>
              <td colspan="6" class="summary-item">冻结合计：<strong>¥{{ sumFreeze.toFixed(2) }}</strong> 万</td>
              <td colspan="6" class="summary-item">抵扣合计：<strong>¥{{ sumDeduct.toFixed(2) }}</strong> 万</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <!-- 分页 -->
      <div class="table-footer">
        <a-pagination
          v-model:current="page"
          v-model:page-size="pageSize"
          :total="filteredAgents.length"
          :page-size-options="['10','20','50']"
          show-size-changer
          show-quick-jumper
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
import { DownloadOutlined } from '@ant-design/icons-vue'

const queryBrand = ref('')
const queryAgent = ref('')
const page = ref(1)
const pageSize = ref(20)

interface AgentRow {
  id: number; name: string; code: string; brand: string; region: string; color: string
  salesContract: number; salesGoods: number; salesInvoice: number; salesReturn: number
  settlePosOpen: number; settleNegOpen: number; settleNonSettle: number; settleFinance: number
  settleControlled: number; settleSignReconcile: number
  archiveFix: number; archiveMail: number
  freezeMaterial: string; freezeGrid: string; freezeLoan: string
  freezeMaint: string; freezeRect: string; freezeOther: string
  deductGrid: string; deductLoan: string; deductPenalty: string
  deductOther: string; deductNeg: string; deductXaz: string
}

const MOCK_AGENTS: AgentRow[] = [
  {
    id: 1, name: '华东新能源科技有限公司', code: 'DL20240001', brand: '安能', region: '华东分公司', color: '#1677ff',
    salesContract: 5, salesGoods: 3, salesInvoice: 2, salesReturn: 1,
    settlePosOpen: 2, settleNegOpen: 1, settleNonSettle: 6, settleFinance: 3, settleControlled: 1, settleSignReconcile: 3,
    archiveFix: 2, archiveMail: 1,
    freezeMaterial: '5.20', freezeGrid: '8.50', freezeLoan: '3.80', freezeMaint: '2.00', freezeRect: '1.50', freezeOther: '0.80',
    deductGrid: '2.80', deductLoan: '2.20', deductPenalty: '1.50', deductOther: '0.00', deductNeg: '0.00', deductXaz: '0.30',
  },
  {
    id: 2, name: '阳光光伏服务有限公司', code: 'DL20240023', brand: '光伏星', region: '华南分公司', color: '#fa8c16',
    salesContract: 4, salesGoods: 2, salesInvoice: 2, salesReturn: 1,
    settlePosOpen: 0, settleNegOpen: 1, settleNonSettle: 5, settleFinance: 1, settleControlled: 2, settleSignReconcile: 3,
    archiveFix: 1, archiveMail: 2,
    freezeMaterial: '4.90', freezeGrid: '10.20', freezeLoan: '2.50', freezeMaint: '1.50', freezeRect: '1.00', freezeOther: '0.40',
    deductGrid: '2.60', deductLoan: '1.20', deductPenalty: '0.50', deductOther: '0.00', deductNeg: '0.00', deductXaz: '0.20',
  },
  {
    id: 3, name: '北方绿能电力有限公司', code: 'DL20240046', brand: '安能', region: '华北分公司', color: '#13c2c2',
    salesContract: 3, salesGoods: 3, salesInvoice: 1, salesReturn: 1,
    settlePosOpen: 2, settleNegOpen: 4, settleNonSettle: 1, settleFinance: 2, settleControlled: 2, settleSignReconcile: 2,
    archiveFix: 3, archiveMail: 1,
    freezeMaterial: '3.15', freezeGrid: '6.00', freezeLoan: '2.60', freezeMaint: '1.00', freezeRect: '0.70', freezeOther: '0.30',
    deductGrid: '1.50', deductLoan: '0.80', deductPenalty: '0.50', deductOther: '0.00', deductNeg: '0.00', deductXaz: '0.30',
  },
  {
    id: 4, name: '江南新能科技发展有限公司', code: 'DL20240087', brand: '安能', region: '华东分公司', color: '#722ed1',
    salesContract: 2, salesGoods: 1, salesInvoice: 3, salesReturn: 0,
    settlePosOpen: 4, settleNegOpen: 0, settleNonSettle: 8, settleFinance: 2, settleControlled: 0, settleSignReconcile: 5,
    archiveFix: 0, archiveMail: 2,
    freezeMaterial: '2.40', freezeGrid: '5.60', freezeLoan: '1.80', freezeMaint: '0.80', freezeRect: '0.60', freezeOther: '0.20',
    deductGrid: '3.20', deductLoan: '1.50', deductPenalty: '0.90', deductOther: '0.10', deductNeg: '0.00', deductXaz: '0.15',
  },
  {
    id: 5, name: '西部光能发展有限公司', code: 'DL20240112', brand: '光伏星', region: '西南分公司', color: '#eb2f96',
    salesContract: 6, salesGoods: 4, salesInvoice: 1, salesReturn: 2,
    settlePosOpen: 3, settleNegOpen: 2, settleNonSettle: 4, settleFinance: 5, settleControlled: 3, settleSignReconcile: 1,
    archiveFix: 4, archiveMail: 3,
    freezeMaterial: '6.80', freezeGrid: '12.30', freezeLoan: '4.50', freezeMaint: '2.80', freezeRect: '2.10', freezeOther: '1.20',
    deductGrid: '4.10', deductLoan: '3.00', deductPenalty: '2.20', deductOther: '0.30', deductNeg: '0.10', deductXaz: '0.50',
  },
]

const filteredAgents = computed(() => {
  return MOCK_AGENTS.filter(row => {
    if (queryBrand.value && row.brand !== queryBrand.value) return false
    if (queryAgent.value && !row.name.includes(queryAgent.value) && !row.code.includes(queryAgent.value)) return false
    return true
  })
})

const displayRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredAgents.value.slice(start, start + pageSize.value)
})

const sumSales = computed(() => displayRows.value.reduce((s, r) => s + r.salesContract + r.salesGoods + r.salesInvoice + r.salesReturn, 0))
const sumSettle = computed(() => displayRows.value.reduce((s, r) => s + r.settlePosOpen + r.settleNegOpen + r.settleNonSettle + r.settleFinance + r.settleControlled + r.settleSignReconcile, 0))
const sumArchive = computed(() => displayRows.value.reduce((s, r) => s + r.archiveFix + r.archiveMail, 0))
const sumFreeze = computed(() => displayRows.value.reduce((s, r) =>
  s + parseFloat(r.freezeMaterial) + parseFloat(r.freezeGrid) + parseFloat(r.freezeLoan) +
  parseFloat(r.freezeMaint) + parseFloat(r.freezeRect) + parseFloat(r.freezeOther), 0))
const sumDeduct = computed(() => displayRows.value.reduce((s, r) =>
  s + parseFloat(r.deductGrid) + parseFloat(r.deductLoan) + parseFloat(r.deductPenalty) +
  parseFloat(r.deductOther) + parseFloat(r.deductNeg) + parseFloat(r.deductXaz), 0))

function doQuery() { page.value = 1 }
function handleReset() { queryBrand.value = ''; queryAgent.value = ''; page.value = 1 }
function handleExport() { message.info('导出功能待接入') }
function handleCellClick(type: string, row: AgentRow) {
  message.info(`跳转到 ${type} 详情（代理商：${row.name}）`)
}
</script>

<style scoped>
.todo-page { padding: 16px; height: 100%; box-sizing: border-box; overflow: auto; }
.slist-main-card { background: #fff; border-radius: 8px; }

.query-bar {
  display: flex; align-items: center; gap: 8px; padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}

/* ── 矩阵表格 ── */
.matrix-wrap { overflow-x: auto; }
.matrix-table {
  width: max-content; min-width: 100%;
  border-collapse: separate; border-spacing: 0;
  font-size: 13px;
}

/* 通用单元格 */
.matrix-table th,
.matrix-table td {
  padding: 8px 10px;
  white-space: nowrap;
  border-bottom: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
  text-align: center;
}
.matrix-table th {
  font-weight: 500;
  font-size: 12px;
  color: rgba(0,0,0,0.65);
  background: #fafafa;
}

/* 分组标题行 */
.group-hd {
  font-weight: 600; font-size: 12px; border-bottom: none;
  padding: 6px 10px;
}
.gp-sales  { background: #fff7e6; color: #d46b08; }
.gp-settle { background: #e6f4ff; color: #0958d9; }
.gp-archive{ background: #f6ffed; color: #389e0d; }
.gp-freeze { background: #fff2e8; color: #d4380d; }
.gp-deduct { background: #f0f5ff; color: #531dab; }

/* 列名行（第2行header），背景色淡化 */
.col-row th.gp-sales  { background: #fffbf0; }
.col-row th.gp-settle { background: #f0f7ff; }
.col-row th.gp-archive{ background: #f9ffe6; }
.col-row th.gp-freeze { background: #fff8f5; }
.col-row th.gp-deduct { background: #f8f0ff; }

/* 数据行背景 */
.gp-sales-bg  { background: #fffdf7; }
.gp-settle-bg { background: #f8fbff; }
.gp-archive-bg{ background: #fafff5; }
.gp-freeze-bg { background: #fffaf8; }
.gp-deduct-bg { background: #fcf8ff; }

/* 固定左列 */
.sticky-col {
  position: sticky;
  background: #fff;
  z-index: 2;
  border-right: 1px solid #e8e8e8 !important;
}
.matrix-table thead .sticky-col {
  z-index: 3;
  background: #fafafa;
}
.th-idx    { left: 0;    min-width: 48px;  }
.th-agent  { left: 48px; min-width: 200px; text-align: left; }
.th-brand  { left: 248px; min-width: 72px; }
.th-region { left: 320px; min-width: 100px; border-right: 2px solid #d9d9d9 !important; }

.td-idx    { left: 0;    color: rgba(0,0,0,0.45); }
.td-agent  { left: 48px; text-align: left; min-width: 200px; }
.td-brand  { left: 248px; min-width: 72px; }
.td-region { left: 320px; min-width: 100px; border-right: 2px solid #d9d9d9 !important; }

/* 代理商单元格 */
.agent-cell { display: flex; align-items: center; gap: 8px; }
.agent-avatar {
  width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; font-size: 13px; font-weight: 600;
}
.agent-info { min-width: 0; }
.agent-name { font-size: 13px; color: rgba(0,0,0,0.88); white-space: nowrap; }
.agent-code { font-size: 11px; color: rgba(0,0,0,0.35); margin-top: 1px; }

/* 数字单元格 */
.num-cell { cursor: default; vertical-align: middle; min-width: 64px; }
.num-link {
  color: #1677ff; cursor: pointer; font-weight: 500;
  padding: 2px 8px; border-radius: 4px;
  transition: background .12s;
}
.num-link:hover { background: rgba(22,119,255,.08); }
.num-zero { color: rgba(0,0,0,0.25); }

/* 汇总行 */
.summary-row td {
  background: #fafafa; font-size: 12px;
  border-top: 2px solid #e8e8e8;
  padding: 10px 12px;
}
.summary-label { font-weight: 600; color: rgba(0,0,0,0.65); text-align: left; }
.summary-item { text-align: left; color: rgba(0,0,0,0.65); }
.summary-item strong { color: rgba(0,0,0,0.88); }

/* 分页 */
.table-footer {
  display: flex; justify-content: flex-end;
  padding: 12px 16px; border-top: 1px solid #f0f0f0;
}
</style>
