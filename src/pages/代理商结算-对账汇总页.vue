<template>
  <div class="reconcile-summary-page">
    <a-alert
      message="数据统计日期为截止昨日23:59:59；数据更新时间为每天早上17:00"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom:12px"
    />
    <div class="slist-main-card">
      <AnfeProTable
        ref="tableRef"
        table-key="agent-reconcile-summary"
        :columns="columns"
        :filters="filters"
        :config="tableConfig"
        :page-size="20"
        :table-props="{ scroll: { x: 1800 } }"
      >
        <template #operationRight>
          <AnfeFileExport
            title="导出"
            template-code="RECONCILE_SUMMARY_EXPORT"
            :request="fileRequest"
          />
        </template>

        <template #settleObjSlot="{ row }">
          <div>
            <span>{{ row.settleObj }}</span>
            <a-tag v-if="row.isAgent" color="blue" style="margin-left:6px;font-size:11px">代理商</a-tag>
          </div>
        </template>

        <template #invoiceAmtSlot="{ row }">
          <span>¥{{ row.invoiceAmt }}</span>
        </template>
        <template #payableAmtSlot="{ row }">
          <span>¥{{ row.payableAmt }}</span>
        </template>
        <template #paidAmtSlot="{ row }">
          <span>¥{{ row.paidAmt }}</span>
        </template>
        <template #deductedAmtSlot="{ row }">
          <span>¥{{ row.deductedAmt }}</span>
        </template>
        <template #unpaidAmtSlot="{ row }">
          <span :style="parseFloat(row.unpaidAmt) > 0 ? 'color:#ff4d4f;font-weight:500' : ''">
            ¥{{ row.unpaidAmt }}
          </span>
        </template>
      </AnfeProTable>

      <!-- 汇总行 -->
      <div class="summary-band">
        <span class="summary-total-label">合计（{{ summaryInfo.count }} 条结算对象）</span>
        <span class="summary-amt-item">应开票金额 <strong>{{ summaryInfo.invoiceAmt }}</strong></span>
        <span class="summary-amt-item">应付金额 <strong>{{ summaryInfo.payableAmt }}</strong></span>
        <span class="summary-amt-item">已付金额 <strong>{{ summaryInfo.paidAmt }}</strong></span>
        <span class="summary-amt-item">已抵扣金额 <strong>{{ summaryInfo.deductedAmt }}</strong></span>
        <span class="summary-amt-item">未付金额 <strong style="color:#ff4d4f">{{ summaryInfo.unpaidAmt }}</strong></span>
        <span class="summary-unit-hint">单位：万元</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AnfeProTable, AnfeFileExport } from '@anfe/vue-pro-components'

const tableRef = ref<any>(null)
const fileRequest = { fetch: () => Promise.resolve({ code: 0, data: {} }), token: '' }

const summaryInfo = ref({
  count: 0,
  invoiceAmt: '¥0.00万',
  payableAmt: '¥0.00万',
  paidAmt: '¥0.00万',
  deductedAmt: '¥0.00万',
  unpaidAmt: '¥0.00万',
})

const columns = [
  { title: '品牌',       dataIndex: 'brand',          key: 'brand',          width: 90 },
  { title: '区域公司',   dataIndex: 'regionCompany',   key: 'regionCompany',  width: 120 },
  { title: '结算对象类型', dataIndex: 'settleObjType', key: 'settleObjType',  width: 120 },
  { title: '结算对象',   dataIndex: 'settleObj',       key: 'settleObj',      width: 200, component: 'custom', slotName: 'settleObjSlot' },
  { title: 'EPC',       dataIndex: 'epc',             key: 'epc',            width: 180 },
  { title: '实际付款主体', dataIndex: 'paymentEntity', key: 'paymentEntity',  width: 200 },
  { title: '应开票金额', dataIndex: 'invoiceAmt',      key: 'invoiceAmt',     width: 130, component: 'custom', slotName: 'invoiceAmtSlot' },
  { title: '应付金额',   dataIndex: 'payableAmt',      key: 'payableAmt',     width: 120, component: 'custom', slotName: 'payableAmtSlot' },
  { title: '已付金额',   dataIndex: 'paidAmt',         key: 'paidAmt',        width: 120, component: 'custom', slotName: 'paidAmtSlot' },
  { title: '已抵扣金额', dataIndex: 'deductedAmt',     key: 'deductedAmt',    width: 120, component: 'custom', slotName: 'deductedAmtSlot' },
  { title: '未付金额',   dataIndex: 'unpaidAmt',       key: 'unpaidAmt',      width: 120, component: 'custom', slotName: 'unpaidAmtSlot', fixed: 'right' as const },
]

const filters = [
  { label: '品牌', key: 'brand', component: 'select', placeholder: '全部品牌',
    options: [{ label: '安能', value: '安能' }, { label: '光伏星', value: '光伏星' }] },
  { label: '结算对象类型', key: 'settleObjType', component: 'select', placeholder: '全部类型',
    options: [
      { label: '代理商', value: '代理商' }, { label: '开发商', value: '开发商' },
      { label: '施工方', value: '施工方' }, { label: '监理方', value: '监理方' },
      { label: '设计院', value: '设计院' }, { label: '设备采购方', value: '设备采购方' },
    ] },
  { label: '结算对象', key: 'settleObj', component: 'input', placeholder: '模糊搜索结算对象' },
  { label: '实际付款主体', key: 'paymentEntity', component: 'input', placeholder: '模糊搜索付款主体' },
  { label: '结算单类型', key: 'settlementType', component: 'select', placeholder: '全部类型（多选）',
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: '代理商结算单', value: '代理商结算单' }, { label: '施工方结算单', value: '施工方结算单' },
      { label: '监理方结算单', value: '监理方结算单' }, { label: '设计院结算单', value: '设计院结算单' },
    ] },
  { label: '结算单创建时间', key: 'createTimeRange', component: 'rangePicker', placeholder: ['开始日期', '结束日期'] },
  { label: '付款/抵扣完成时间', key: 'paymentTimeRange', component: 'rangePicker', placeholder: ['开始日期', '结束日期'] },
]

interface SummaryRow { brand: string; regionCompany: string; settleObjType: string; settleObj: string; isAgent: boolean; epc: string; paymentEntity: string; invoiceAmt: string; payableAmt: string; paidAmt: string; deductedAmt: string; unpaidAmt: string }

const MOCK_DATA: SummaryRow[] = [
  { brand:'安能', regionCompany:'华东大区', settleObjType:'代理商', settleObj:'华东新能源科技有限公司', isAgent:true, epc:'正泰安能数字能源', paymentEntity:'正泰安能数字能源（浙江）股份有限公司', invoiceAmt:'2,637,000.00', payableAmt:'2,479,200.00', paidAmt:'1,650,000.00', deductedAmt:'285,000.00', unpaidAmt:'544,200.00' },
  { brand:'光伏星', regionCompany:'华北大区', settleObjType:'代理商', settleObj:'阳光光伏服务有限公司', isAgent:true, epc:'正泰安能数字能源', paymentEntity:'正泰安能数字能源（浙江）股份有限公司', invoiceAmt:'1,649,700.00', payableAmt:'1,558,400.00', paidAmt:'1,080,000.00', deductedAmt:'168,000.00', unpaidAmt:'310,400.00' },
  { brand:'安能', regionCompany:'西南大区', settleObjType:'代理商', settleObj:'北方绿能电力有限公司', isAgent:true, epc:'正泰安能数字能源', paymentEntity:'正泰安能数字能源（浙江）股份有限公司', invoiceAmt:'1,192,400.00', payableAmt:'1,131,300.00', paidAmt:'720,000.00', deductedAmt:'95,000.00', unpaidAmt:'316,300.00' },
  { brand:'安能', regionCompany:'华南大区', settleObjType:'施工方', settleObj:'浙江建工集团有限公司', isAgent:false, epc:'正泰安能数字能源', paymentEntity:'正泰安能数字能源（浙江）股份有限公司', invoiceAmt:'980,000.00', payableAmt:'920,000.00', paidAmt:'680,000.00', deductedAmt:'50,000.00', unpaidAmt:'190,000.00' },
  { brand:'光伏星', regionCompany:'华东大区', settleObjType:'设计院', settleObj:'上海设计研究院', isAgent:false, epc:'光伏星能源', paymentEntity:'光伏星能源科技（上海）有限公司', invoiceAmt:'560,000.00', payableAmt:'540,000.00', paidAmt:'480,000.00', deductedAmt:'0.00', unpaidAmt:'60,000.00' },
]

function toWan(s: string) {
  const n = parseFloat(s.replace(/,/g, ''))
  return `¥${(n / 10000).toFixed(2)}万`
}

const tableConfig = {
  rowKey: 'id',
  searchOnLoad: true,
  request: async (params: Record<string, any>) => {
    const { params: fp = {}, pageIndex, pageRows } = params
    await new Promise(r => setTimeout(r, 200))
    let data = MOCK_DATA.filter(row => {
      if (fp.brand && row.brand !== fp.brand) return false
      if (fp.settleObjType && row.settleObjType !== fp.settleObjType) return false
      if (fp.settleObj && !row.settleObj.includes(fp.settleObj)) return false
      if (fp.paymentEntity && !row.paymentEntity.includes(fp.paymentEntity)) return false
      return true
    })
    // compute summary across full result set
    const toN = (s: string) => parseFloat(s.replace(/,/g, ''))
    const sum = (f: keyof SummaryRow) => data.reduce((s, r) => s + toN(r[f] as string), 0)
    summaryInfo.value = {
      count: data.length,
      invoiceAmt: toWan(String(sum('invoiceAmt'))),
      payableAmt: toWan(String(sum('payableAmt'))),
      paidAmt: toWan(String(sum('paidAmt'))),
      deductedAmt: toWan(String(sum('deductedAmt'))),
      unpaidAmt: toWan(String(sum('unpaidAmt'))),
    }
    const dataWithId = data.map((r, i) => ({ ...r, id: i + 1 }))
    const start = ((pageIndex ?? 1) - 1) * (pageRows ?? 20)
    return { data: dataWithId.slice(start, start + (pageRows ?? 20)), count: dataWithId.length }
  },
}
</script>

<style scoped>
.reconcile-summary-page { padding: 16px; height: 100%; box-sizing: border-box; overflow: auto; }
.slist-main-card { background: #fff; border-radius: 8px; }
.summary-band {
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  padding: 10px 16px; border-top: 1px solid #f0f0f0;
  background: #fafafa; border-radius: 0 0 8px 8px;
  font-size: 13px;
}
.summary-total-label { color: rgba(0,0,0,0.65); font-weight: 500; margin-right: 4px; }
.summary-amt-item { color: rgba(0,0,0,0.55); }
.summary-amt-item strong { color: rgba(0,0,0,0.88); font-weight: 600; }
.summary-unit-hint { margin-left: auto; color: rgba(0,0,0,0.35); font-size: 12px; }
</style>
