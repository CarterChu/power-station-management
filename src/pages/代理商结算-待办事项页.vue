<template>
  <div class="todo-page">
    <!-- 筛选栏 -->
    <div class="slist-main-card" style="margin-bottom:12px">
      <div class="filter-area">
        <a-form layout="vertical" size="middle" :model="filterModel">
          <a-row :gutter="[12, 0]" style="align-items:flex-end">
            <a-col :span="4">
              <a-form-item label="品牌">
                <a-select v-model:value="queryBrand" placeholder="全部" allow-clear style="width:100%">
                  <a-select-option value="安能">安能</a-select-option>
                  <a-select-option value="光伏星">光伏星</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item label="区域分公司">
                <a-select v-model:value="queryRegion" placeholder="全部" allow-clear style="width:100%">
                  <a-select-option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item label="代理商">
                <a-input v-model:value="queryAgent" placeholder="名称/编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col flex="none">
              <a-form-item label=" " class="btn-col">
                <a-space>
                  <a-button type="primary" @click="doQuery">查询</a-button>
                  <a-button @click="handleReset">重置</a-button>
                </a-space>
              </a-form-item>
            </a-col>
            <a-col flex="1" style="display:flex;justify-content:flex-end">
              <a-form-item label=" " class="btn-col">
                <a-space>
                  <a-button-group>
                    <a-tooltip title="列表视图">
                      <a-button :type="viewMode==='table'?'primary':'default'" @click="setViewMode('table')">
                        <template #icon><BarsOutlined /></template>
                      </a-button>
                    </a-tooltip>
                    <a-tooltip title="卡片视图">
                      <a-button :type="viewMode==='card'?'primary':'default'" @click="setViewMode('card')">
                        <template #icon><AppstoreOutlined /></template>
                      </a-button>
                    </a-tooltip>
                  </a-button-group>
                  <AnfeFileExport title="导出" template-code="AGENT_TODO_EXPORT" :request="fileRequest" />
                </a-space>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-if="viewMode === 'table'" class="slist-main-card">
      <div class="table-pad">
      <a-table
        :columns="columns"
        :data-source="filteredAgents"
        row-key="id"
        size="middle"
        :scroll="{ x: 2600 }"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t: number) => `共 ${t} 条`,
          size: 'small',
          pageSizeOptions: ['10', '20', '50'],
        }"
      >
        <template #summary>
          <a-table-summary fixed="bottom">
            <a-table-summary-row>
              <a-table-summary-cell :index="0" :col-span="4" class="td-summary-label">
                合计（{{ filteredAgents.length }} 家结算对象）
              </a-table-summary-cell>
              <a-table-summary-cell :index="4" :col-span="4" class="td-summary-item" style="background:#fffefb">
                销售待办：<strong>{{ sumSales }}</strong> 项
              </a-table-summary-cell>
              <a-table-summary-cell :index="8" :col-span="6" class="td-summary-item" style="background:#fcfdff">
                结算待办：<strong>{{ sumSettle }}</strong> 项
              </a-table-summary-cell>
              <a-table-summary-cell :index="14" :col-span="2" class="td-summary-item" style="background:#fdfffa">
                归档待办：<strong>{{ sumArchive }}</strong> 项
              </a-table-summary-cell>
              <a-table-summary-cell :index="16" :col-span="6" class="td-summary-item" style="background:#fffdfc">
                冻结合计：<strong>¥{{ sumFreeze.toFixed(2) }}</strong> 万
              </a-table-summary-cell>
              <a-table-summary-cell :index="22" :col-span="6" class="td-summary-item" style="background:#fcfbff">
                抵扣合计：<strong>¥{{ sumDeduct.toFixed(2) }}</strong> 万
              </a-table-summary-cell>
            </a-table-summary-row>
          </a-table-summary>
        </template>
      </a-table>
      </div>
    </div>

    <!-- 卡片视图 -->
    <template v-else>
      <div v-if="filteredAgents.length === 0" class="card-empty">
        <a-empty description="暂无数据" />
      </div>
      <div v-else class="card-view">
        <div v-for="agent in pagedAgents" :key="agent.id" class="agent-card">
          <div class="agent-card-hd">
            <span class="agent-avatar-lg" :style="{ background: agent.color }">{{ agent.name[0] }}</span>
            <div>
              <div class="agent-card-name">{{ agent.name }}</div>
              <div class="agent-card-meta">{{ agent.code }} · {{ agent.brand }} · {{ agent.region }}</div>
            </div>
          </div>
          <div class="agent-groups">
            <div v-for="group in CARD_GROUPS" :key="group.key" class="agent-group-card">
              <div class="agent-group-hd">
                <span class="agent-group-dot" :style="`background:${group.color}`"></span>
                <span class="agent-group-title">{{ group.title }}</span>
                <span class="agent-group-total">
                  {{ group.isCount ? agentCountTotal(agent, group) + ' 项' : '¥' + agentMoneyTotal(agent, group) + ' 万' }}
                </span>
              </div>
              <template v-if="group.isCount">
                <div v-for="item in group.items" :key="item.field"
                  class="agent-group-item"
                  :class="{ 'item-clickable': agentItemCount(agent, item) > 0 }"
                  @click="agentItemCount(agent, item) > 0 && handleItemNav(item.label)">
                  <span class="item-label">{{ item.label }}</span>
                  <span class="item-val" :class="agentItemCount(agent, item) > 0 ? 'val-count-active' : 'val-zero'">
                    {{ agentItemCount(agent, item) }}<RightOutlined v-if="agentItemCount(agent, item) > 0" class="item-arrow" />
                  </span>
                </div>
              </template>
              <template v-else>
                <div v-for="item in group.items" :key="item.field"
                  class="agent-group-item"
                  :class="{ 'item-clickable': agentItemMoney(agent, item) > 0 }"
                  @click="agentItemMoney(agent, item) > 0 && handleItemNav(item.label)">
                  <span class="item-label">{{ item.label }}</span>
                  <span class="item-val" :class="agentItemMoney(agent, item) > 0 ? 'val-money-active' : 'val-zero'">
                    {{ agentItemMoney(agent, item) > 0 ? agentItemMoney(agent, item).toFixed(2) + ' 万' : '0.00 万' }}<RightOutlined v-if="agentItemMoney(agent, item) > 0" class="item-arrow" />
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="card-pagination">
          <a-pagination
            v-model:current="cardPage"
            v-model:page-size="cardPageSize"
            :total="filteredAgents.length"
            :show-size-changer="true"
            :show-quick-jumper="true"
            :page-size-options="['5', '10', '20']"
            :show-total="(t: number) => `共 ${t} 家`"
            size="small"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { message } from 'ant-design-vue'
import { BarsOutlined, AppstoreOutlined, RightOutlined } from '@ant-design/icons-vue'
import { AnfeFileExport } from '@anfe/vue-pro-components'


const REGIONS = ['华东分公司', '华南分公司', '华北分公司', '西南分公司', '西北分公司', '东北分公司', '华中分公司']

const queryBrand  = ref('')
const queryRegion = ref('')
const queryAgent  = ref('')
const viewMode    = ref<'table' | 'card'>((localStorage.getItem('todo-view-mode') as 'table' | 'card') || 'table')
function setViewMode(mode: 'table' | 'card') { viewMode.value = mode; localStorage.setItem('todo-view-mode', mode) }
const fileRequest = { fetch: () => Promise.resolve({ code: 0, data: {} }), token: '' }
const filterModel = computed(() => ({ brand: queryBrand.value, region: queryRegion.value, agent: queryAgent.value }))

// ── 卡片组定义 ─────────────────────────────────────────────────

interface CardItem { label: string; field: string }
interface CardGroup {
  key: string; title: string; color: string; bg: string
  isCount: boolean; items: CardItem[]
}

const CARD_GROUPS: CardGroup[] = [
  {
    key: 'sales', title: '销售备货待办', color: '#d46b08', bg: '#fffbf3', isCount: true,
    items: [
      { label: '待签署合同',   field: 'salesContract' },
      { label: '待签收备货单', field: 'salesGoods' },
      { label: '待开票申请',   field: 'salesInvoice' },
    ],
  },
  {
    key: 'settle', title: '结算待办', color: '#0958d9', bg: '#f3faff', isCount: true,
    items: [
      { label: '正数结算单待开票', field: 'settlePosOpen' },
      { label: '负数结算单待开票', field: 'settleNegOpen' },
      { label: '不可结算账单',     field: 'settleNonSettle' },
      { label: '待财务审核',       field: 'settleFinance' },
      { label: '结算管控中',       field: 'settleControlled' },
      { label: '待签署对账单',     field: 'settleSignReconcile' },
    ],
  },
  {
    key: 'archive', title: '纸质归档待办', color: '#389e0d', bg: '#fbfff6', isCount: true,
    items: [
      { label: '待整改资料', field: 'archiveFix' },
      { label: '待邮寄资料', field: 'archiveMail' },
    ],
  },
  {
    key: 'freeze', title: '冻结待办（万元）', color: '#d4380d', bg: '#fff9f4', isCount: false,
    items: [
      { label: '超期物料应冻结',   field: 'freezeMaterial' },
      { label: '超期未并网应冻结', field: 'freezeGrid' },
      { label: '光伏贷逾期应冻结', field: 'freezeLoan' },
      { label: '运维应冻结',       field: 'freezeMaint' },
      { label: '整改逾期应冻结',   field: 'freezeRect' },
      { label: '其他应冻结',       field: 'freezeOther' },
    ],
  },
  {
    key: 'deduct', title: '抵扣待办（万元）', color: '#531dab', bg: '#f6f4ff', isCount: false,
    items: [
      { label: '超期未并网应抵扣',    field: 'deductGrid' },
      { label: '光伏贷逾期应抵扣',    field: 'deductLoan' },
      { label: '市场/运维罚单应抵扣', field: 'deductPenalty' },
      { label: '其他应抵扣',          field: 'deductOther' },
      { label: '负数结算单应抵扣',    field: 'deductNeg' },
      { label: '小安租转售应抵扣',    field: 'deductXaz' },
    ],
  },
]

function agentCountTotal(agent: AgentRow, group: CardGroup): number {
  return group.items.reduce((s, item) => s + (Number((agent as any)[item.field]) || 0), 0)
}
function agentMoneyTotal(agent: AgentRow, group: CardGroup): string {
  return group.items.reduce((s, item) => s + parseFloat(String((agent as any)[item.field] || '0')), 0).toFixed(2)
}
function agentItemCount(agent: AgentRow, item: CardItem): number {
  return Number((agent as any)[item.field]) || 0
}
function agentItemMoney(agent: AgentRow, item: CardItem): number {
  return parseFloat(String((agent as any)[item.field] || '0'))
}
function handleItemNav(label: string) {
  message.info(`「${label}」相关功能页面建设中`)
}

// ── 列定义 ─────────────────────────────────────────────────

type CH = () => Record<string, unknown>
type CC = () => Record<string, unknown>

const mkHdr = (bg: string, color: string): CH =>
  () => ({ style: `background:${bg};color:${color};text-align:center` })

const countCol = (title: string, key: string, hdr: CH, cell: CC) => ({
  title, dataIndex: key, key, width: 84, align: 'center' as const,
  customHeaderCell: hdr, customCell: cell,
  customRender: ({ value }: { value: number }) =>
    value
      ? h('span', { class: 'cell-nav cell-nav--count', onClick: () => handleItemNav(title) }, String(value))
      : h('span', { style: 'color:rgba(0,0,0,0.25)' }, '0'),
})

const moneyCol = (title: string, key: string, hdr: CH, cell: CC) => ({
  title, dataIndex: key, key, width: 84, align: 'center' as const,
  customHeaderCell: hdr, customCell: cell,
  customRender: ({ value }: { value: string }) => {
    const n = parseFloat(value || '0')
    return n > 0
      ? h('span', { class: 'cell-nav cell-nav--money', onClick: () => handleItemNav(title) }, value)
      : h('span', { style: 'color:rgba(0,0,0,0.25)' }, '0.00')
  },
})

const H = {
  sales:   { gh: mkHdr('#fffbf3', '#d46b08'), ch: mkHdr('#fffdf8', '#595959'), cc: () => ({ style: 'background:#fffefb' }) },
  settle:  { gh: mkHdr('#f3faff', '#0958d9'), ch: mkHdr('#f8fbff', '#595959'), cc: () => ({ style: 'background:#fcfdff' }) },
  archive: { gh: mkHdr('#fbfff6', '#389e0d'), ch: mkHdr('#fcfff3', '#595959'), cc: () => ({ style: 'background:#fdfffa' }) },
  freeze:  { gh: mkHdr('#fff9f4', '#d4380d'), ch: mkHdr('#fffcfa', '#595959'), cc: () => ({ style: 'background:#fffdfc' }) },
  deduct:  { gh: mkHdr('#f6f4ff', '#531dab'), ch: mkHdr('#f9f7ff', '#595959'), cc: () => ({ style: 'background:#fcfbff' }) },
}

const columns = [
  {
    title: '序号', key: '_idx', width: 52, fixed: 'left' as const, align: 'center' as const,
    customHeaderCell: () => ({ style: 'background:#fafafa' }),
    customRender: ({ index }: { index: number }) => h('span', { style: 'color:rgba(0,0,0,0.45)' }, String(index + 1)),
  },
  {
    title: '代理商', dataIndex: 'name', key: 'name', width: 200, fixed: 'left' as const,
    customHeaderCell: () => ({ style: 'background:#fafafa;text-align:left' }),
    customRender: ({ record }: { record: AgentRow }) =>
      h('div', null, [
        h('div', { style: 'font-size:14px;color:rgba(0,0,0,0.88)' }, record.name),
        h('div', { style: 'font-size:12px;color:rgba(0,0,0,0.35);margin-top:1px' }, record.code),
      ]),
  },
  {
    title: '品牌', dataIndex: 'brand', key: 'brand', width: 72, fixed: 'left' as const, align: 'center' as const,
    customHeaderCell: () => ({ style: 'background:#fafafa' }),
  },
  {
    title: '分公司', dataIndex: 'region', key: 'region', width: 100, fixed: 'left' as const, align: 'center' as const,
    customHeaderCell: () => ({ style: 'background:#fafafa' }),
  },
  {
    title: '销售备货待办', customHeaderCell: H.sales.gh,
    children: [
      countCol('待签署合同',   'salesContract', H.sales.ch, H.sales.cc),
      countCol('待签收备货单', 'salesGoods',    H.sales.ch, H.sales.cc),
      countCol('待开票申请',   'salesInvoice',  H.sales.ch, H.sales.cc),
    ],
  },
  {
    title: '结算待办', customHeaderCell: H.settle.gh,
    children: [
      countCol('正数结算单待开票',  'settlePosOpen',       H.settle.ch, H.settle.cc),
      countCol('负数结算单待开票',  'settleNegOpen',       H.settle.ch, H.settle.cc),
      countCol('不可结算账单',      'settleNonSettle',     H.settle.ch, H.settle.cc),
      countCol('待财务审核',        'settleFinance',       H.settle.ch, H.settle.cc),
      countCol('结算管控中',        'settleControlled',    H.settle.ch, H.settle.cc),
      countCol('待签署对账单',      'settleSignReconcile', H.settle.ch, H.settle.cc),
    ],
  },
  {
    title: '纸质归档待办', customHeaderCell: H.archive.gh,
    children: [
      countCol('待整改资料', 'archiveFix',  H.archive.ch, H.archive.cc),
      countCol('待邮寄资料', 'archiveMail', H.archive.ch, H.archive.cc),
    ],
  },
  {
    title: '冻结待办（万元）', customHeaderCell: H.freeze.gh,
    children: [
      moneyCol('超期物料应冻结',   'freezeMaterial', H.freeze.ch, H.freeze.cc),
      moneyCol('超期未并网应冻结', 'freezeGrid',     H.freeze.ch, H.freeze.cc),
      moneyCol('光伏贷逾期应冻结', 'freezeLoan',     H.freeze.ch, H.freeze.cc),
      moneyCol('运维应冻结',       'freezeMaint',    H.freeze.ch, H.freeze.cc),
      moneyCol('整改逾期应冻结',   'freezeRect',     H.freeze.ch, H.freeze.cc),
      moneyCol('其他应冻结',       'freezeOther',    H.freeze.ch, H.freeze.cc),
    ],
  },
  {
    title: '抵扣待办（万元）', customHeaderCell: H.deduct.gh,
    children: [
      moneyCol('超期未并网应抵扣',    'deductGrid',    H.deduct.ch, H.deduct.cc),
      moneyCol('光伏贷逾期应抵扣',    'deductLoan',    H.deduct.ch, H.deduct.cc),
      moneyCol('市场/运维罚单应抵扣', 'deductPenalty', H.deduct.ch, H.deduct.cc),
      moneyCol('其他应抵扣',          'deductOther',   H.deduct.ch, H.deduct.cc),
      moneyCol('负数结算单应抵扣',    'deductNeg',     H.deduct.ch, H.deduct.cc),
      moneyCol('小安租转售应抵扣',    'deductXaz',     H.deduct.ch, H.deduct.cc),
    ],
  },
]

// ── 数据 ─────────────────────────────────────────────────────────

interface AgentRow {
  id: number; name: string; code: string; brand: string; region: string; color: string
  salesContract: number; salesGoods: number; salesInvoice: number
  settlePosOpen: number; settleNegOpen: number; settleNonSettle: number; settleFinance: number
  settleControlled: number; settleSignReconcile: number
  archiveFix: number; archiveMail: number
  freezeMaterial: string; freezeGrid: string; freezeLoan: string
  freezeMaint: string; freezeRect: string; freezeOther: string
  deductGrid: string; deductLoan: string; deductPenalty: string
  deductOther: string; deductNeg: string; deductXaz: string
}

const MOCK_AGENTS: AgentRow[] = [
  { id:1, name:'华东新能源科技有限公司', code:'DL20240001', brand:'安能', region:'华东分公司', color:'#1677ff',
    salesContract:5, salesGoods:3, salesInvoice:2,
    settlePosOpen:2, settleNegOpen:1, settleNonSettle:6, settleFinance:3, settleControlled:1, settleSignReconcile:3,
    archiveFix:2, archiveMail:1,
    freezeMaterial:'5.20', freezeGrid:'8.50', freezeLoan:'3.80', freezeMaint:'2.00', freezeRect:'1.50', freezeOther:'0.80',
    deductGrid:'2.80', deductLoan:'2.20', deductPenalty:'1.50', deductOther:'0.00', deductNeg:'0.00', deductXaz:'0.30' },
  { id:2, name:'阳光光伏服务有限公司', code:'DL20240023', brand:'光伏星', region:'华南分公司', color:'#fa8c16',
    salesContract:4, salesGoods:2, salesInvoice:2,
    settlePosOpen:0, settleNegOpen:1, settleNonSettle:5, settleFinance:1, settleControlled:2, settleSignReconcile:3,
    archiveFix:1, archiveMail:2,
    freezeMaterial:'4.90', freezeGrid:'10.20', freezeLoan:'2.50', freezeMaint:'1.50', freezeRect:'1.00', freezeOther:'0.40',
    deductGrid:'2.60', deductLoan:'1.20', deductPenalty:'0.50', deductOther:'0.00', deductNeg:'0.00', deductXaz:'0.20' },
  { id:3, name:'北方绿能电力有限公司', code:'DL20240046', brand:'安能', region:'华北分公司', color:'#13c2c2',
    salesContract:3, salesGoods:3, salesInvoice:1,
    settlePosOpen:2, settleNegOpen:4, settleNonSettle:1, settleFinance:2, settleControlled:2, settleSignReconcile:2,
    archiveFix:3, archiveMail:1,
    freezeMaterial:'3.15', freezeGrid:'6.00', freezeLoan:'2.60', freezeMaint:'1.00', freezeRect:'0.70', freezeOther:'0.30',
    deductGrid:'1.50', deductLoan:'0.80', deductPenalty:'0.50', deductOther:'0.00', deductNeg:'0.00', deductXaz:'0.30' },
  { id:4, name:'江南新能科技发展有限公司', code:'DL20240087', brand:'安能', region:'华东分公司', color:'#722ed1',
    salesContract:2, salesGoods:1, salesInvoice:3,
    settlePosOpen:4, settleNegOpen:0, settleNonSettle:8, settleFinance:2, settleControlled:0, settleSignReconcile:5,
    archiveFix:0, archiveMail:2,
    freezeMaterial:'2.40', freezeGrid:'5.60', freezeLoan:'1.80', freezeMaint:'0.80', freezeRect:'0.60', freezeOther:'0.20',
    deductGrid:'3.20', deductLoan:'1.50', deductPenalty:'0.90', deductOther:'0.10', deductNeg:'0.00', deductXaz:'0.15' },
  { id:5, name:'西部光能发展有限公司', code:'DL20240112', brand:'光伏星', region:'西南分公司', color:'#eb2f96',
    salesContract:6, salesGoods:4, salesInvoice:1,
    settlePosOpen:3, settleNegOpen:2, settleNonSettle:4, settleFinance:5, settleControlled:3, settleSignReconcile:1,
    archiveFix:4, archiveMail:3,
    freezeMaterial:'6.80', freezeGrid:'12.30', freezeLoan:'4.50', freezeMaint:'2.80', freezeRect:'2.10', freezeOther:'1.20',
    deductGrid:'4.10', deductLoan:'3.00', deductPenalty:'2.20', deductOther:'0.30', deductNeg:'0.10', deductXaz:'0.50' },
  { id:6, name:'东南能源开发有限公司', code:'DL20240134', brand:'安能', region:'华东分公司', color:'#52c41a',
    salesContract:1, salesGoods:2, salesInvoice:4,
    settlePosOpen:3, settleNegOpen:0, settleNonSettle:2, settleFinance:4, settleControlled:1, settleSignReconcile:2,
    archiveFix:1, archiveMail:0,
    freezeMaterial:'1.80', freezeGrid:'4.20', freezeLoan:'1.20', freezeMaint:'0.60', freezeRect:'0.40', freezeOther:'0.00',
    deductGrid:'1.20', deductLoan:'0.60', deductPenalty:'0.30', deductOther:'0.00', deductNeg:'0.00', deductXaz:'0.10' },
  { id:7, name:'中原新能投资集团', code:'DL20240158', brand:'安能', region:'华北分公司', color:'#1677ff',
    salesContract:3, salesGoods:1, salesInvoice:2,
    settlePosOpen:1, settleNegOpen:2, settleNonSettle:7, settleFinance:2, settleControlled:0, settleSignReconcile:4,
    archiveFix:2, archiveMail:2,
    freezeMaterial:'3.60', freezeGrid:'7.80', freezeLoan:'2.10', freezeMaint:'1.20', freezeRect:'0.90', freezeOther:'0.50',
    deductGrid:'2.10', deductLoan:'1.40', deductPenalty:'0.80', deductOther:'0.00', deductNeg:'0.00', deductXaz:'0.20' },
  { id:8, name:'南粤绿能科技有限公司', code:'DL20240172', brand:'光伏星', region:'华南分公司', color:'#fa541c',
    salesContract:2, salesGoods:3, salesInvoice:1,
    settlePosOpen:2, settleNegOpen:1, settleNonSettle:3, settleFinance:1, settleControlled:2, settleSignReconcile:2,
    archiveFix:0, archiveMail:1,
    freezeMaterial:'2.90', freezeGrid:'5.40', freezeLoan:'1.60', freezeMaint:'0.80', freezeRect:'0.50', freezeOther:'0.20',
    deductGrid:'1.80', deductLoan:'0.90', deductPenalty:'0.60', deductOther:'0.10', deductNeg:'0.00', deductXaz:'0.15' },
  { id:9, name:'蜀道光伏能源股份公司', code:'DL20240195', brand:'安能', region:'西南分公司', color:'#722ed1',
    salesContract:4, salesGoods:2, salesInvoice:3,
    settlePosOpen:0, settleNegOpen:3, settleNonSettle:5, settleFinance:3, settleControlled:1, settleSignReconcile:3,
    archiveFix:3, archiveMail:1,
    freezeMaterial:'4.50', freezeGrid:'9.10', freezeLoan:'3.20', freezeMaint:'1.60', freezeRect:'1.10', freezeOther:'0.60',
    deductGrid:'3.00', deductLoan:'2.00', deductPenalty:'1.20', deductOther:'0.20', deductNeg:'0.00', deductXaz:'0.40' },
  { id:10, name:'秦岭清洁能源有限公司', code:'DL20240218', brand:'光伏星', region:'西北分公司', color:'#13c2c2',
    salesContract:2, salesGoods:1, salesInvoice:2,
    settlePosOpen:1, settleNegOpen:1, settleNonSettle:4, settleFinance:2, settleControlled:0, settleSignReconcile:2,
    archiveFix:1, archiveMail:1,
    freezeMaterial:'2.10', freezeGrid:'4.80', freezeLoan:'1.50', freezeMaint:'0.70', freezeRect:'0.40', freezeOther:'0.10',
    deductGrid:'1.40', deductLoan:'0.70', deductPenalty:'0.40', deductOther:'0.00', deductNeg:'0.00', deductXaz:'0.10' },
  { id:11, name:'黑土地新能源科技公司', code:'DL20240241', brand:'安能', region:'东北分公司', color:'#fa8c16',
    salesContract:1, salesGoods:2, salesInvoice:1,
    settlePosOpen:2, settleNegOpen:0, settleNonSettle:3, settleFinance:1, settleControlled:1, settleSignReconcile:1,
    archiveFix:0, archiveMail:2,
    freezeMaterial:'1.50', freezeGrid:'3.20', freezeLoan:'1.00', freezeMaint:'0.40', freezeRect:'0.30', freezeOther:'0.00',
    deductGrid:'0.90', deductLoan:'0.50', deductPenalty:'0.20', deductOther:'0.00', deductNeg:'0.00', deductXaz:'0.05' },
  { id:12, name:'渤海湾风光互补能源公司', code:'DL20240263', brand:'光伏星', region:'东北分公司', color:'#eb2f96',
    salesContract:3, salesGoods:2, salesInvoice:2,
    settlePosOpen:1, settleNegOpen:2, settleNonSettle:6, settleFinance:2, settleControlled:2, settleSignReconcile:3,
    archiveFix:2, archiveMail:1,
    freezeMaterial:'3.30', freezeGrid:'6.60', freezeLoan:'2.20', freezeMaint:'1.10', freezeRect:'0.80', freezeOther:'0.30',
    deductGrid:'2.20', deductLoan:'1.10', deductPenalty:'0.70', deductOther:'0.10', deductNeg:'0.00', deductXaz:'0.20' },
  { id:13, name:'陇原光伏电力开发公司', code:'DL20240287', brand:'安能', region:'西北分公司', color:'#52c41a',
    salesContract:2, salesGoods:1, salesInvoice:3,
    settlePosOpen:3, settleNegOpen:1, settleNonSettle:2, settleFinance:3, settleControlled:0, settleSignReconcile:2,
    archiveFix:1, archiveMail:0,
    freezeMaterial:'2.70', freezeGrid:'5.10', freezeLoan:'1.70', freezeMaint:'0.90', freezeRect:'0.60', freezeOther:'0.20',
    deductGrid:'1.60', deductLoan:'0.80', deductPenalty:'0.50', deductOther:'0.00', deductNeg:'0.00', deductXaz:'0.10' },
  { id:14, name:'闽台合作新能源集团', code:'DL20240309', brand:'光伏星', region:'华南分公司', color:'#1677ff',
    salesContract:5, salesGoods:3, salesInvoice:2,
    settlePosOpen:2, settleNegOpen:2, settleNonSettle:4, settleFinance:2, settleControlled:3, settleSignReconcile:4,
    archiveFix:3, archiveMail:2,
    freezeMaterial:'5.60', freezeGrid:'10.80', freezeLoan:'3.60', freezeMaint:'2.20', freezeRect:'1.70', freezeOther:'0.90',
    deductGrid:'3.50', deductLoan:'2.50', deductPenalty:'1.80', deductOther:'0.20', deductNeg:'0.10', deductXaz:'0.40' },
  { id:15, name:'湘赣清洁能源发展公司', code:'DL20240332', brand:'安能', region:'华中分公司', color:'#fa541c',
    salesContract:1, salesGoods:2, salesInvoice:1,
    settlePosOpen:1, settleNegOpen:1, settleNonSettle:3, settleFinance:1, settleControlled:1, settleSignReconcile:2,
    archiveFix:1, archiveMail:1,
    freezeMaterial:'1.90', freezeGrid:'3.80', freezeLoan:'1.30', freezeMaint:'0.50', freezeRect:'0.35', freezeOther:'0.10',
    deductGrid:'1.10', deductLoan:'0.60', deductPenalty:'0.35', deductOther:'0.00', deductNeg:'0.00', deductXaz:'0.08' },
  { id:16, name:'粤港澳光伏投资管理公司', code:'DL20240355', brand:'光伏星', region:'华南分公司', color:'#722ed1',
    salesContract:4, salesGoods:3, salesInvoice:3,
    settlePosOpen:2, settleNegOpen:3, settleNonSettle:5, settleFinance:4, settleControlled:2, settleSignReconcile:3,
    archiveFix:2, archiveMail:2,
    freezeMaterial:'4.20', freezeGrid:'8.90', freezeLoan:'2.80', freezeMaint:'1.80', freezeRect:'1.30', freezeOther:'0.70',
    deductGrid:'2.90', deductLoan:'1.80', deductPenalty:'1.10', deductOther:'0.15', deductNeg:'0.05', deductXaz:'0.30' },
]

const filteredAgents = computed(() => MOCK_AGENTS.filter(row => {
  if (queryBrand.value  && row.brand  !== queryBrand.value)  return false
  if (queryRegion.value && row.region !== queryRegion.value) return false
  if (queryAgent.value  && !row.name.includes(queryAgent.value) && !row.code.includes(queryAgent.value)) return false
  return true
}))

const cardPage     = ref(1)
const cardPageSize = ref(10)
const pagedAgents  = computed(() => {
  const start = (cardPage.value - 1) * cardPageSize.value
  return filteredAgents.value.slice(start, start + cardPageSize.value)
})
watch(filteredAgents, () => { cardPage.value = 1 })


const sumSales   = computed(() => filteredAgents.value.reduce((s, r) => s + r.salesContract + r.salesGoods + r.salesInvoice, 0))
const sumSettle  = computed(() => filteredAgents.value.reduce((s, r) => s + r.settlePosOpen + r.settleNegOpen + r.settleNonSettle + r.settleFinance + r.settleControlled + r.settleSignReconcile, 0))
const sumArchive = computed(() => filteredAgents.value.reduce((s, r) => s + r.archiveFix + r.archiveMail, 0))
const sumFreeze  = computed(() => filteredAgents.value.reduce((s, r) => s + parseFloat(r.freezeMaterial) + parseFloat(r.freezeGrid) + parseFloat(r.freezeLoan) + parseFloat(r.freezeMaint) + parseFloat(r.freezeRect) + parseFloat(r.freezeOther), 0))
const sumDeduct  = computed(() => filteredAgents.value.reduce((s, r) => s + parseFloat(r.deductGrid) + parseFloat(r.deductLoan) + parseFloat(r.deductPenalty) + parseFloat(r.deductOther) + parseFloat(r.deductNeg) + parseFloat(r.deductXaz), 0))

function doQuery() {}
function handleReset() { queryBrand.value = ''; queryRegion.value = ''; queryAgent.value = '' }
</script>

<style scoped>
.todo-page       { padding: 16px; height: 100%; box-sizing: border-box; overflow: auto; }
.slist-main-card { background: #fff; border-radius: 8px; overflow: hidden; }
.filter-area     { padding: 20px 20px 8px; }

/* 按钮列的 form-item 去掉 label 占位高度的额外间距 */
.btn-col :deep(.ant-form-item-label) { opacity: 0; pointer-events: none; }

.table-pad  { padding: 20px; }
.table-pad :deep(.ant-table-container) { border-radius: 8px; clip-path: inset(0 round 8px); }
.card-empty { background: #fff; border-radius: 8px; padding: 60px; }
.card-view  { padding: 20px; background: #fff; border-radius: 8px; }
.card-pagination { display: flex; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #f0f0f0; margin-top: 16px; }

.agent-card {
  background: #fff; overflow: hidden;
}
.agent-card + .agent-card {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  margin-top: 16px;
}
.agent-card-hd {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0 8px;
}
.agent-avatar-lg {
  width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px; font-weight: 700;
}
.agent-card-name { font-size: 15px; font-weight: 600; color: rgba(0,0,0,0.88); }
.agent-card-meta { font-size: 12px; color: rgba(0,0,0,0.45); margin-top: 2px; }

.agent-groups { display: flex; gap: 10px; padding: 8px 0 12px; }
.agent-group-card {
  flex: 1; background: #fff; border-radius: 8px;
  border: 1px solid #f0f0f0; overflow: hidden;
  padding: 12px 16px;
}
.agent-group-hd {
  display: flex; align-items: center; gap: 6px; padding: 9px 0;
}
.agent-group-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.agent-group-title { font-size: 14px; font-weight: 600; flex: 1; }
.agent-group-total { font-size: 14px; font-weight: 700; white-space: nowrap; }
.agent-group-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 8px;
  margin: 0 -8px;
  border-radius: 4px;
}
.item-label { font-size: 13px; color: rgba(0,0,0,0.65); }
.item-val   { font-size: 13px; font-weight: 500; min-width: 64px; text-align: right; }
.item-clickable { cursor: pointer; }
.item-clickable:hover { background: #f5f5f5; }
.item-arrow { margin-left: 3px; font-size: 10px; opacity: 0.7; }
.val-count-active { color: rgba(0,0,0,0.88); }
.val-money-active { color: rgba(0,0,0,0.88); }
.val-zero         { color: rgba(0,0,0,0.25); }
</style>

<style>
.cell-nav { display: inline-block; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 500; }
.cell-nav--count { color: #1677ff; }
.cell-nav--money { color: #d4380d; }
.cell-nav:hover  { background: rgba(0,0,0,0.06); }

.ant-table-cell-fix-left-last::after,
.ant-table-cell-fix-right-first::before { display: none !important; }

.ant-table-tbody > tr > td.ant-table-cell-fix-left { background: #fff; }
.ant-table-thead > tr > th.ant-table-cell-fix-left { background: #fafafa !important; border-right-color: transparent !important; }

.td-summary-label { font-weight: 600; color: rgba(0,0,0,0.65); background: #fafafa !important; }
.td-summary-item  { color: rgba(0,0,0,0.65); font-size: 14px; }
.td-summary-item strong { color: rgba(0,0,0,0.88); }

</style>
