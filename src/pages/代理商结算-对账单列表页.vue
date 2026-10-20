<template>
  <div class="reconcile-list-page">
    <div class="slist-main-card">
      <AnfeProTable
        ref="tableRef"
        table-key="agent-reconcile-list"
        :columns="columns"
        :filters="filters"
        :config="tableConfig"
        :page-size="20"
        :table-props="{ scroll: { x: 2200 } }"
      >
        <template #filterExtra>
          <div class="filter-extra-row">
            <span class="filter-extra-label">对账单号</span>
            <AnfeQuickInputControls
              v-model:value="filterReconcileNos"
              placeholder="多个单号逗号/换行分隔"
              :max-items="200"
              style="width:280px"
            />
          </div>
        </template>

        <template #operationRight>
          <a-space>
            <AnfeTemplate title="下载模板" template-code="SETTLEMENT_NO_IMPORT" :request="fileRequest" />
            <AnfeFileImport
              template-code="SETTLEMENT_NO_IMPORT"
              :request="fileRequest"
              @on-import="handleImportResult"
            />
            <AnfeFileExport
              title="导出"
              template-code="RECONCILE_LIST_EXPORT"
              :request="fileRequest"
            />
          </a-space>
        </template>

        <template #reconcileNoSlot="{ row }">
          <a class="link-cell" @click="handleView(row)">{{ row.reconcileNo }}</a>
        </template>

        <template #settleObjSlot="{ row }">
          <div>
            <div>{{ row.settleObj }}</div>
            <div style="font-size:11px;color:rgba(0,0,0,0.35)">{{ row.settleObjType }}</div>
          </div>
        </template>

        <template #invoiceAmtSlot="{ row }">
          <span>¥{{ row.invoiceAmt }}</span>
        </template>

        <template #attachmentSlot="{ row }">
          <template v-if="row.hasAttachment">
            <a-button type="link" size="small" style="padding:0">预览</a-button>
            <a-divider type="vertical" />
            <a-button type="link" size="small" style="padding:0">下载</a-button>
          </template>
          <span v-else style="color:rgba(0,0,0,0.25)">--</span>
        </template>

        <template #statusSlot="{ row }">
          <a-tag :color="STATUS_COLOR[row.status]" style="margin:0">{{ row.status }}</a-tag>
        </template>

        <template #actionSlot="{ row }">
          <a-space :size="4" wrap>
            <a-button type="link" size="small" @click="handleView(row)">查看</a-button>
            <a-button v-if="row.status === '对账文件生成失败'" type="link" size="small" @click="handleRegenerate(row)">重新生成</a-button>
            <a-button v-if="row.status === '待代理商确认'" type="link" size="small" danger @click="handleReject(row)">退回</a-button>
            <a-button v-if="row.status === '待代理商确认'" type="link" size="small" @click="handleSign(row)">签署</a-button>
            <a-button v-if="row.status === '退回安能确认'" type="link" size="small" @click="handleResubmit(row)">重新提交</a-button>
            <a-button v-if="row.status === '待代理商上传'" type="link" size="small" @click="handleUpload(row)">上传</a-button>
            <a-button v-if="row.status === '待安能审核'" type="link" size="small" @click="handleAudit(row)">审核</a-button>
          </a-space>
        </template>
      </AnfeProTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { AnfeProTable, AnfeFileImport, AnfeFileExport, AnfeTemplate, AnfeQuickInputControls } from '@anfe/vue-pro-components'

const emit = defineEmits<{ navigate: [payload: { target: string; row: any }] }>()

const tableRef = ref<any>(null)
const filterReconcileNos = ref<string[]>([])
const fileRequest = { fetch: () => Promise.resolve({ code: 0, data: {} }), token: '' }

const STATUS_COLOR: Record<string, string> = {
  '待生成对账文件': 'default',
  '对账文件生成失败': 'error',
  '待代理商确认': 'processing',
  '已确认': 'success',
  '退回安能确认': 'warning',
  '待代理商上传': 'processing',
  '待安能审核': 'orange',
}

const columns = [
  { title: '对账单号',   dataIndex: 'reconcileNo', key: 'reconcileNo', width: 200, fixed: 'left' as const, component: 'custom', slotName: 'reconcileNoSlot' },
  { title: '年',        dataIndex: 'year',         key: 'year',        width: 70 },
  { title: '月',        dataIndex: 'month',        key: 'month',       width: 60 },
  { title: '结算对象类型', dataIndex: 'settleObjType', key: 'settleObjType', width: 110 },
  { title: '结算对象',  dataIndex: 'settleObj',    key: 'settleObj',   width: 200, component: 'custom', slotName: 'settleObjSlot' },
  { title: 'EPC',      dataIndex: 'epc',          key: 'epc',         width: 160 },
  { title: '实际付款主体', dataIndex: 'paymentEntity', key: 'paymentEntity', width: 200 },
  { title: '应开票总金额', dataIndex: 'invoiceAmt', key: 'invoiceAmt', width: 130, component: 'custom', slotName: 'invoiceAmtSlot' },
  { title: '应付金额',  dataIndex: 'payableAmt',   key: 'payableAmt',  width: 120 },
  { title: '账单条数',  dataIndex: 'billCount',    key: 'billCount',   width: 90 },
  { title: '罚单条数',  dataIndex: 'penaltyCount', key: 'penaltyCount', width: 90 },
  { title: '对账附件',  dataIndex: 'hasAttachment', key: 'attachment', width: 110, component: 'custom', slotName: 'attachmentSlot' },
  { title: '对账状态',  dataIndex: 'status',       key: 'status',      width: 130, component: 'custom', slotName: 'statusSlot' },
  { title: '确认时间',  dataIndex: 'confirmTime',  key: 'confirmTime', width: 160 },
  { title: '操作',     dataIndex: 'action',         key: 'action',              width: 200, fixed: 'right' as const, component: 'custom', slotName: 'actionSlot' },
]

const filters = [
  { label: '结算对象类型', key: 'settleObjType', component: 'select', placeholder: '全部类型',
    options: [
      { label: '代理商', value: '代理商' }, { label: '开发商', value: '开发商' },
      { label: '施工方', value: '施工方' }, { label: '监理方', value: '监理方' },
      { label: '设计院', value: '设计院' }, { label: '设备采购方', value: '设备采购方' },
    ] },
  { label: '结算对象', key: 'settleObj', component: 'input', placeholder: '模糊搜索结算对象' },
  { label: '对账月份', key: 'monthRange', component: 'rangePicker', placeholder: ['开始月份', '结束月份'] },
  { label: '对账状态', key: 'status', component: 'select', placeholder: '全部状态',
    options: Object.keys(STATUS_COLOR).map(k => ({ label: k, value: k })) },
  { label: '确认时间', key: 'confirmTimeRange', component: 'rangePicker', placeholder: ['开始日期', '结束日期'] },
  { label: '实际付款主体', key: 'paymentEntity', component: 'input', placeholder: '模糊搜索付款主体' },
  { label: 'EPC', key: 'epc', component: 'input', placeholder: '模糊搜索EPC' },
]

const MOCK_DATA = [
  { id:'1', reconcileNo:'DZD202609000001', year:'2026', month:'09', settleObjType:'代理商', settleObj:'华东新能源科技有限公司', epc:'正泰安能数字能源', paymentEntity:'正泰安能数字能源（浙江）股份有限公司', invoiceAmt:'1,780,000.00', payableAmt:'¥1,780,000.00', billCount:172, penaltyCount:0, hasAttachment:true, status:'待代理商确认', confirmTime:'' },
  { id:'2', reconcileNo:'DZD202609000002', year:'2026', month:'09', settleObjType:'代理商', settleObj:'阳光光伏服务有限公司', epc:'正泰安能数字能源', paymentEntity:'正泰安能数字能源（浙江）股份有限公司', invoiceAmt:'963,200.00', payableAmt:'¥963,200.00', billCount:98, penaltyCount:3, hasAttachment:true, status:'已确认', confirmTime:'2026-09-16 14:30' },
  { id:'3', reconcileNo:'DZD202609000003', year:'2026', month:'09', settleObjType:'代理商', settleObj:'北方绿能电力有限公司', epc:'正泰安能数字能源', paymentEntity:'正泰安能数字能源（浙江）股份有限公司', invoiceAmt:'1,298,700.00', payableAmt:'¥1,298,700.00', billCount:156, penaltyCount:0, hasAttachment:false, status:'对账文件生成失败', confirmTime:'' },
  { id:'4', reconcileNo:'DZD202609000004', year:'2026', month:'09', settleObjType:'代理商', settleObj:'江南新能科技发展有限公司', epc:'正泰安能数字能源', paymentEntity:'正泰安能数字能源（浙江）股份有限公司', invoiceAmt:'745,300.00', payableAmt:'¥745,300.00', billCount:89, penaltyCount:2, hasAttachment:false, status:'待生成对账文件', confirmTime:'' },
  { id:'5', reconcileNo:'DZD202609000005', year:'2026', month:'09', settleObjType:'施工方', settleObj:'浙江建工集团有限公司', epc:'光伏星能源', paymentEntity:'光伏星能源科技（上海）有限公司', invoiceAmt:'620,000.00', payableAmt:'¥620,000.00', billCount:47, penaltyCount:0, hasAttachment:true, status:'待代理商上传', confirmTime:'' },
  { id:'6', reconcileNo:'DZD202608000001', year:'2026', month:'08', settleObjType:'代理商', settleObj:'西部光能发展有限公司', epc:'光伏星能源', paymentEntity:'光伏星能源科技（上海）有限公司', invoiceAmt:'1,450,000.00', payableAmt:'¥1,450,000.00', billCount:201, penaltyCount:5, hasAttachment:true, status:'待安能审核', confirmTime:'' },
  { id:'7', reconcileNo:'DZD202608000002', year:'2026', month:'08', settleObjType:'代理商', settleObj:'东南能源开发有限公司', epc:'正泰安能数字能源', paymentEntity:'正泰安能数字能源（浙江）股份有限公司', invoiceAmt:'890,000.00', payableAmt:'¥890,000.00', billCount:118, penaltyCount:1, hasAttachment:true, status:'退回安能确认', confirmTime:'' },
]

const tableConfig = {
  rowKey: 'id',
  searchOnLoad: true,
  beforeRequest: (params: any) => {
    if (filterReconcileNos.value.length > 0) {
      params.params = { ...params.params, reconcileNos: filterReconcileNos.value }
    }
    return params
  },
  request: async (params: Record<string, any>) => {
    const { params: fp = {}, pageIndex, pageRows } = params
    await new Promise(r => setTimeout(r, 200))
    const data = MOCK_DATA.filter(row => {
      if (fp.settleObjType && row.settleObjType !== fp.settleObjType) return false
      if (fp.settleObj && !row.settleObj.includes(fp.settleObj)) return false
      if (fp.status && row.status !== fp.status) return false
      if (fp.paymentEntity && !row.paymentEntity.includes(fp.paymentEntity)) return false
      if (fp.epc && !row.epc.includes(fp.epc)) return false
      if (fp.reconcileNos?.length && !fp.reconcileNos.includes(row.reconcileNo)) return false
      return true
    })
    const start = ((pageIndex ?? 1) - 1) * (pageRows ?? 20)
    return { data: data.slice(start, start + (pageRows ?? 20)), count: data.length }
  },
}

function handleView(row: any) {
  emit('navigate', { target: 'agent-reconcile-detail', row })
}
function handleImportResult(result: any) {
  message.success('导入完成')
  tableRef.value?.reload()
}
function handleRegenerate(row: any) { message.info(`重新生成对账文件：${row.reconcileNo}`) }
function handleReject(row: any) { message.info(`退回对账单：${row.reconcileNo}`) }
function handleSign(row: any) { message.info(`发起签署：${row.reconcileNo}`) }
function handleResubmit(row: any) { message.info(`重新提交：${row.reconcileNo}`) }
function handleUpload(row: any) { message.info(`上传确认函：${row.reconcileNo}`) }
function handleAudit(row: any) { message.info(`审核对账单：${row.reconcileNo}`) }
</script>

<style scoped>
.reconcile-list-page { padding: 16px; height: 100%; box-sizing: border-box; overflow: auto; }
.slist-main-card { background: #fff; border-radius: 8px; }
.filter-extra-row {
  display: flex; align-items: center; gap: 8px;
  padding: 0 0 8px; font-size: 13px;
}
.filter-extra-label { color: rgba(0,0,0,0.65); white-space: nowrap; }
.link-cell { color: #1677ff; cursor: pointer; }
.link-cell:hover { text-decoration: underline; }
</style>
