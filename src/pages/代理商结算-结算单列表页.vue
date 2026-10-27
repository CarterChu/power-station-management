<template>
  <div class="settlement-list-page">
    <div class="slist-main-card">
      <div class="status-summary-bar">
        <span class="summary-label">结算单状态总览：</span>
        <a-tag
          v-for="s in statusSummary"
          :key="s.key"
          color="processing"
          class="summary-tag"
          :class="{ 'summary-tag--active': activeStatusFilter === s.key }"
          @click="handleStatusFilter(s.key)"
        >{{ s.label }} <span class="summary-count">{{ s.count }}</span></a-tag>
      </div>

      <AnfeProTable
        ref="tableRef"
        table-key="agent-settlement-list"
        :columns="columns"
        :filters="filters"
        :config="tableConfig"
        :page-size="20"
        :table-props="{ scroll: { x: 2800 }, size: 'middle' }"
      >
        <template #operationLeft>
          <a-space>
            <a-button type="primary" @click="handleCreate">+ 新增</a-button>
            <a-dropdown>
              <a-button>下载结算批次 <DownOutlined /></a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="message.info('下载全部结算批次')">下载全部</a-menu-item>
                  <a-menu-item @click="message.info('下载当前筛选结算批次')">下载当前筛选</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-dropdown>
              <a-button>下载结算明细 <DownOutlined /></a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="message.info('下载全部结算明细')">下载全部</a-menu-item>
                  <a-menu-item @click="message.info('下载当前筛选明细')">下载当前筛选</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-dropdown>
              <a-button>下载结算单 <DownOutlined /></a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="message.info('下载选中结算单')">下载选中</a-menu-item>
                  <a-menu-item @click="message.info('下载全部结算单')">下载全部</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </template>

        <template #operationRight>
          <AnfeFileExport
            title="导出"
            template-code="SETTLEMENT_LIST_EXPORT"
            :request="fileRequest"
          />
        </template>

        <template #settlementNoSlot="{ row }">
          <a class="link-cell" @click="handleDetail(row)">{{ row.settlementNo }}</a>
        </template>

        <template #statusSlot="{ row }">
          <span class="status-cell">
            <a-tag :color="STATUS_COLOR[row.status]" style="margin:0">{{ row.status }}</a-tag>
            <SyncOutlined v-if="PENDING_STATUSES.includes(row.status)" class="status-refresh-icon" @click="message.info(`刷新状态：${row.settlementNo}`)" />
          </span>
        </template>

        <template #agentStatusSlot="{ row }">
          <a-tag v-if="row.agentStatus" :color="AGENT_STATUS_COLOR[row.agentStatus]" style="margin:0">
            {{ row.agentStatus }}
          </a-tag>
          <span v-else style="color:rgba(0,0,0,0.25)">—</span>
        </template>

        <template #specialMarkSlot="{ row }">
          <a-tag v-if="row.specialMark" color="warning" style="margin:0">{{ row.specialMark }}</a-tag>
          <span v-else style="color:rgba(0,0,0,0.25)">—</span>
        </template>

        <template #actionSlot="{ row }">
          <a-space :size="0">
            <a-button type="link" size="small" style="padding:0 4px" @click="handleDetail(row)">详情</a-button>
            <a-button v-if="row.status !== '已付款'" type="link" size="small" style="padding:0 4px" @click="handlePayDetail(row)">付款明细</a-button>
          </a-space>
        </template>
      </AnfeProTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { DownOutlined, SyncOutlined } from '@ant-design/icons-vue'
import { AnfeProTable, AnfeFileExport } from '@anfe/vue-pro-components'

const emit = defineEmits<{ navigate: [payload: { target: string; row?: any }] }>()

const tableRef = ref<any>(null)
const fileRequest = { fetch: () => Promise.resolve({ code: 0, data: {} }), token: '' }
const activeStatusFilter = ref<string | null>(null)

const STATUS_COLOR: Record<string, string> = {
  '已付款':   'success',
  '冻结中':   'warning',
  '待付款':   'processing',
  '审批中':   'default',
  '部分付款': 'cyan',
  '待开票':   'orange',
  '待收票':   'purple',
}

const PENDING_STATUSES = ['冻结中', '待付款', '审批中', '部分付款']

const AGENT_STATUS_COLOR: Record<string, string> = {
  '正常': 'success',
  '冻结': 'warning',
  '退商': 'error',
  '异常': 'orange',
}

const statusSummary = ref([
  { key: '待上传发票', label: '待上传发票', count: 4380 },
  { key: '待签收发票', label: '待签收发票', count: 0 },
  { key: '待签收合同', label: '待签收合同', count: 19 },
])

function handleStatusFilter(key: string) {
  activeStatusFilter.value = activeStatusFilter.value === key ? null : key
  tableRef.value?.reload()
}

const columns = [
  { title: '结算单号',      dataIndex: 'settlementNo',   key: 'settlementNo',   width: 190, fixed: 'left' as const, component: 'custom', slotName: 'settlementNoSlot' },
  { title: '结算对象',      dataIndex: 'agentName',      key: 'agentName',      width: 200 },
  { title: '电站编号',      dataIndex: 'stationCode',    key: 'stationCode',    width: 130 },
  { title: '品牌',          dataIndex: 'brand',          key: 'brand',          width: 80 },
  { title: '分公司',        dataIndex: 'branch',         key: 'branch',         width: 120 },
  { title: '实际付款主体',  dataIndex: 'payEntity',      key: 'payEntity',      width: 220 },
  { title: '应付金额',      dataIndex: 'payableAmt',     key: 'payableAmt',     width: 120 },
  { title: '已付金额',      dataIndex: 'paidAmt',        key: 'paidAmt',        width: 110 },
  { title: '已抵扣金额',    dataIndex: 'deductedAmt',    key: 'deductedAmt',    width: 110 },
  { title: '未付金额',      dataIndex: 'unpaidAmt',      key: 'unpaidAmt',      width: 110 },
  { title: '冻结中金额',    dataIndex: 'frozenAmt',      key: 'frozenAmt',      width: 110 },
  { title: '抵扣中金额',    dataIndex: 'deductingAmt',   key: 'deductingAmt',   width: 110 },
  { title: '付款审批中金额', dataIndex: 'approvalAmt',   key: 'approvalAmt',    width: 130 },
  { title: '结算单类型',    dataIndex: 'settlementType', key: 'settlementType', width: 130 },
  { title: '创建时间',      dataIndex: 'createTime',     key: 'createTime',     width: 165 },
  { title: '状态',          dataIndex: 'status',         key: 'status',         width: 120, component: 'custom', slotName: 'statusSlot' },
  { title: '代理商状态',    dataIndex: 'agentStatus',    key: 'agentStatus',    width: 110, component: 'custom', slotName: 'agentStatusSlot' },
  { title: '特殊标记',      dataIndex: 'specialMark',    key: 'specialMark',    width: 110, component: 'custom', slotName: 'specialMarkSlot' },
  { title: '操作',          dataIndex: 'action',         key: 'action',         width: 130, fixed: 'right' as const, component: 'custom', slotName: 'actionSlot' },
]

const filters = [
  { label: '结算单号',    key: 'settlementNo',    component: 'input',       placeholder: '请输入' },
  { label: '结算对象类型', key: 'agentType',      component: 'select',      placeholder: '请选择',
    options: [{ label: '代理商', value: '代理商' }, { label: '开发商', value: '开发商' }, { label: '施工方', value: '施工方' }] },
  { label: '结算对象',    key: 'agentName',       component: 'input',       placeholder: '请输入' },
  { label: '电站编号',    key: 'stationCode',     component: 'input',       placeholder: '请输入' },
  { label: '品牌',        key: 'brand',           component: 'select',      placeholder: '请选择',
    options: [{ label: '安能', value: '安能' }, { label: '光伏星', value: '光伏星' }] },
  { label: '状态',        key: 'status',          component: 'select',      placeholder: '请选择',
    labelTips: '冻结中：资金被临时冻结，等待解冻；待付款：已审批通过等待打款',
    options: Object.keys(STATUS_COLOR).map(k => ({ label: k, value: k })) },
  { label: '结算单类型',  key: 'settlementType',  component: 'select',      placeholder: '请选择',
    options: [
      { label: '开发安装费', value: '开发安装费' }, { label: '质保金', value: '质保金' },
      { label: '超期电站回购', value: '超期电站回购' }, { label: '返佣', value: '返佣' },
    ] },
  { label: '创建日期',    key: 'createTimeRange', component: 'rangePicker', placeholder: ['开始日期', '结束日期'] },
  { label: '分公司',      key: 'branch',          component: 'select',      placeholder: '请选择',
    options: ['华东分公司','华南分公司','华北分公司','西南分公司','西北分公司','东北分公司','华中分公司'].map(v => ({ label: v, value: v })) },
  { label: '省份',        key: 'province',        component: 'select',      placeholder: '请选择',
    options: ['浙江','江苏','广东','四川','山东','河南','湖北','福建','安徽','湖南'].map(v => ({ label: v, value: v })) },
  { label: '实际付款主体', key: 'payEntity',      component: 'input',       placeholder: '请输入' },
  { label: '代理商状态',  key: 'agentStatus',     component: 'select',      placeholder: '请选择',
    options: Object.keys(AGENT_STATUS_COLOR).map(k => ({ label: k, value: k })) },
  { label: '特殊标记',    key: 'specialMark',     component: 'select',      placeholder: '请选择',
    options: ['诉讼','跨区域','重点关注','冻结处理'].map(v => ({ label: v, value: v })) },
]

const MOCK_DATA = [
  { id:'1',  settlementNo:'JS202609000001', agentName:'华东新能源科技有限公司', stationCode:'GF202401001', brand:'安能', branch:'华东分公司', province:'浙江', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:192, paidAmt:192, deductedAmt:0, unpaidAmt:0, frozenAmt:0, deductingAmt:0, approvalAmt:0, settlementType:'质保金', createTime:'2026-09-21 10:12:00', status:'已付款', agentStatus:'正常', specialMark:'' },
  { id:'2',  settlementNo:'JS202609000002', agentName:'华东新能源科技有限公司', stationCode:'GF202401002', brand:'安能', branch:'华东分公司', province:'浙江', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:348355.46, paidAmt:0, deductedAmt:0, unpaidAmt:348355.46, frozenAmt:348355.46, deductingAmt:0, approvalAmt:0, settlementType:'开发安装费', createTime:'2026-09-21 09:18:00', status:'冻结中', agentStatus:'正常', specialMark:'' },
  { id:'3',  settlementNo:'JS202609000003', agentName:'阳光光伏服务有限公司', stationCode:'GF202401015', brand:'安能', branch:'华东分公司', province:'江苏', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:1398976, paidAmt:0, deductedAmt:0, unpaidAmt:1398976, frozenAmt:0, deductingAmt:0, approvalAmt:1398976, settlementType:'开发安装费', createTime:'2026-09-21 09:05:00', status:'待付款', agentStatus:'正常', specialMark:'' },
  { id:'4',  settlementNo:'JS202609000004', agentName:'阳光光伏服务有限公司', stationCode:'GF202401016', brand:'安能', branch:'华东分公司', province:'江苏', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:393422, paidAmt:0, deductedAmt:0, unpaidAmt:393422, frozenAmt:0, deductingAmt:0, approvalAmt:0, settlementType:'开发安装费', createTime:'2026-09-21 09:00:00', status:'审批中', agentStatus:'正常', specialMark:'' },
  { id:'5',  settlementNo:'JS202609000005', agentName:'北方绿能电力有限公司', stationCode:'GF202401030', brand:'光伏星', branch:'华北分公司', province:'山东', payEntity:'光伏星能源科技（上海）有限公司', payableAmt:159549, paidAmt:0, deductedAmt:0, unpaidAmt:159549, frozenAmt:0, deductingAmt:0, approvalAmt:0, settlementType:'开发安装费', createTime:'2026-09-21 09:00:00', status:'审批中', agentStatus:'正常', specialMark:'' },
  { id:'6',  settlementNo:'JS202609000006', agentName:'江南新能科技发展有限公司', stationCode:'GF202401044', brand:'安能', branch:'华东分公司', province:'安徽', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:97574.4, paidAmt:730, deductedAmt:0, unpaidAmt:96844.4, frozenAmt:96844.4, deductingAmt:0, approvalAmt:0, settlementType:'超期电站回购', createTime:'2026-09-21 03:00:00', status:'部分付款', agentStatus:'正常', specialMark:'' },
  { id:'7',  settlementNo:'JS202609000007', agentName:'江南新能科技发展有限公司', stationCode:'GF202401045', brand:'安能', branch:'华东分公司', province:'安徽', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:59272.2, paidAmt:0, deductedAmt:0, unpaidAmt:59272.2, frozenAmt:59272.2, deductingAmt:0, approvalAmt:0, settlementType:'超期电站回购', createTime:'2026-09-21 03:00:00', status:'待付款', agentStatus:'正常', specialMark:'' },
  { id:'8',  settlementNo:'JS202609000008', agentName:'西部光能发展有限公司', stationCode:'GF202401060', brand:'光伏星', branch:'西南分公司', province:'四川', payEntity:'光伏星能源科技（上海）有限公司', payableAmt:235180, paidAmt:0, deductedAmt:0, unpaidAmt:235180, frozenAmt:0, deductingAmt:0, approvalAmt:0, settlementType:'超期电站回购', createTime:'2026-09-21 02:00:00', status:'待付款', agentStatus:'冻结', specialMark:'冻结处理' },
  { id:'9',  settlementNo:'JS202609000009', agentName:'东南能源开发有限公司', stationCode:'GF202401071', brand:'安能', branch:'华东分公司', province:'福建', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:482000, paidAmt:482000, deductedAmt:0, unpaidAmt:0, frozenAmt:0, deductingAmt:0, approvalAmt:0, settlementType:'开发安装费', createTime:'2026-09-20 18:00:00', status:'已付款', agentStatus:'正常', specialMark:'' },
  { id:'10', settlementNo:'JS202609000010', agentName:'中原新能投资集团', stationCode:'GF202401088', brand:'安能', branch:'华北分公司', province:'河南', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:176500, paidAmt:0, deductedAmt:0, unpaidAmt:176500, frozenAmt:0, deductingAmt:176500, approvalAmt:0, settlementType:'返佣', createTime:'2026-09-20 15:30:00', status:'审批中', agentStatus:'异常', specialMark:'重点关注' },
  { id:'11', settlementNo:'JS202609000011', agentName:'南粤绿能科技有限公司', stationCode:'GF202401099', brand:'光伏星', branch:'华南分公司', province:'广东', payEntity:'光伏星能源科技（上海）有限公司', payableAmt:625000, paidAmt:150000, deductedAmt:0, unpaidAmt:475000, frozenAmt:0, deductingAmt:0, approvalAmt:475000, settlementType:'开发安装费', createTime:'2026-09-20 14:00:00', status:'部分付款', agentStatus:'正常', specialMark:'' },
  { id:'12', settlementNo:'JS202609000012', agentName:'秦岭清洁能源有限公司', stationCode:'GF202401112', brand:'光伏星', branch:'西北分公司', province:'湖北', payEntity:'光伏星能源科技（上海）有限公司', payableAmt:88200, paidAmt:0, deductedAmt:0, unpaidAmt:88200, frozenAmt:88200, deductingAmt:0, approvalAmt:0, settlementType:'质保金', createTime:'2026-09-20 11:00:00', status:'冻结中', agentStatus:'退商', specialMark:'诉讼' },
  { id:'13', settlementNo:'JS202608000001', agentName:'黑土地新能源科技公司', stationCode:'GF202401125', brand:'安能', branch:'东北分公司', province:'湖南', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:312000, paidAmt:312000, deductedAmt:0, unpaidAmt:0, frozenAmt:0, deductingAmt:0, approvalAmt:0, settlementType:'开发安装费', createTime:'2026-08-31 17:00:00', status:'已付款', agentStatus:'正常', specialMark:'' },
  { id:'14', settlementNo:'JS202608000002', agentName:'渤海湾风光互补能源公司', stationCode:'GF202401136', brand:'光伏星', branch:'东北分公司', province:'山东', payEntity:'光伏星能源科技（上海）有限公司', payableAmt:540000, paidAmt:200000, deductedAmt:50000, unpaidAmt:290000, frozenAmt:0, deductingAmt:290000, approvalAmt:0, settlementType:'开发安装费', createTime:'2026-08-30 10:00:00', status:'部分付款', agentStatus:'正常', specialMark:'跨区域' },
  { id:'15', settlementNo:'JS202608000003', agentName:'陇原光伏电力开发公司', stationCode:'GF202401148', brand:'安能', branch:'西北分公司', province:'安徽', payEntity:'正泰安能数字能源（浙江）股份有限公司', payableAmt:198000, paidAmt:198000, deductedAmt:0, unpaidAmt:0, frozenAmt:0, deductingAmt:0, approvalAmt:0, settlementType:'返佣', createTime:'2026-08-29 09:00:00', status:'已付款', agentStatus:'正常', specialMark:'' },
]

const tableConfig = {
  rowKey: 'id',
  searchOnLoad: true,
  request: async (params: Record<string, any>) => {
    const { params: fp = {}, pageIndex, pageRows } = params
    await new Promise(r => setTimeout(r, 200))
    const data = MOCK_DATA.filter(row => {
      if (fp.settlementNo   && !row.settlementNo.includes(fp.settlementNo))     return false
      if (fp.agentName      && !row.agentName.includes(fp.agentName))           return false
      if (fp.stationCode    && !row.stationCode.includes(fp.stationCode))       return false
      if (fp.brand          && row.brand !== fp.brand)                          return false
      if (fp.branch         && row.branch !== fp.branch)                        return false
      if (fp.province       && row.province !== fp.province)                    return false
      if (fp.status         && row.status !== fp.status)                        return false
      if (fp.settlementType && row.settlementType !== fp.settlementType)        return false
      if (fp.payEntity      && !row.payEntity.includes(fp.payEntity))           return false
      if (fp.agentStatus    && row.agentStatus !== fp.agentStatus)              return false
      if (fp.specialMark    && row.specialMark !== fp.specialMark)              return false
      if (activeStatusFilter.value === '待上传发票' && row.status === '已付款') return false
      if (activeStatusFilter.value === '待签收合同' && !['审批中','待付款'].includes(row.status)) return false
      return true
    })
    const start = ((pageIndex ?? 1) - 1) * (pageRows ?? 20)
    return { data: data.slice(start, start + (pageRows ?? 20)), count: data.length }
  },
}

function handleCreate() { message.info('新增结算单') }
function handleDetail(row: any) { emit('navigate', { target: 'agent-settlement-detail', row }) }
function handlePayDetail(row: any) { message.info(`查看付款明细：${row.settlementNo}`) }
</script>

<style scoped>
.settlement-list-page { padding: 16px; height: 100%; box-sizing: border-box; overflow: auto; }
.slist-main-card { background: #fff; border-radius: 8px; }

.status-summary-bar {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
  padding: 12px 16px; border-bottom: 1px solid #f0f0f0;
}
.summary-label { font-size: 13px; color: rgba(0,0,0,0.65); white-space: nowrap; }
.summary-tag { cursor: pointer; user-select: none; }
.summary-tag--active { outline: 2px solid #1677ff; border-radius: 4px; }
.summary-count { font-weight: 700; margin-left: 2px; }

.link-cell { color: #1677ff; cursor: pointer; }
.link-cell:hover { text-decoration: underline; }

.status-cell { display: inline-flex; align-items: center; gap: 4px; }
.status-refresh-icon { font-size: 12px; color: rgba(0,0,0,0.45); cursor: pointer; }
.status-refresh-icon:hover { color: #1677ff; }
</style>
