<template>
  <div class="bill-query-page">
    <div class="slist-main-card">
      <AnfeProTable
        ref="tableRef"
        table-key="lnc-bill-query"
        :columns="columns"
        :filters="filters"
        :config="tableConfig"
        :page-size="20"
        :table-props="{ scroll: { x: 1800 } }"
      >
        <template #operationRight>
          <a-space>
            <a-button @click="handleExport">导出</a-button>
          </a-space>
        </template>

        <!-- 结算状态 -->
        <template #settlementStatusSlot="{ row }">
          <a-tag v-if="row.settlementStatus" :color="SETTLEMENT_STATUS_COLOR[row.settlementStatus]" style="margin:0">
            {{ SETTLEMENT_STATUS_LABEL[row.settlementStatus] ?? row.settlementStatus }}
          </a-tag>
          <span v-else style="color:#bbb">--</span>
        </template>

        <!-- 是否可结算 -->
        <template #settleableSlot="{ row }">
          <a-tag v-if="row.isSettleable === true" color="success" style="margin:0">可结算</a-tag>
          <a-tag v-else-if="row.isSettleable === false" color="default" style="margin:0">不可结算</a-tag>
          <span v-else style="color:#bbb">--</span>
        </template>

        <!-- 推送NC状态 -->
        <template #ncPushStatusSlot="{ row }">
          <a-tag v-if="row.ncPushStatus" :color="NC_STATUS_COLOR[row.ncPushStatus]" style="margin:0">
            {{ NC_STATUS_LABEL[row.ncPushStatus] ?? row.ncPushStatus }}
          </a-tag>
          <span v-else style="color:#bbb">--</span>
        </template>

        <!-- 操作 -->
        <template #actionSlot="{ row }">
          <a-button type="link" size="small" @click="handleViewDetail(row)">详情</a-button>
        </template>
      </AnfeProTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { AnfeProTable } from '@anfe/vue-pro-components'

const tableRef = ref<any>(null)

// ── 枚举映射 ──

const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  pending:    '待结算',
  processing: '结算中',
  settled:    '已结算',
  rejected:   '结算不通过',
}

const SETTLEMENT_STATUS_COLOR: Record<string, string> = {
  pending:    'default',
  processing: 'processing',
  settled:    'success',
  rejected:   'error',
}

const NC_STATUS_LABEL: Record<string, string> = {
  not_pushed: '未推送',
  pushing:    '推送中',
  pushed:     '推送成功',
  failed:     '推送失败',
}

const NC_STATUS_COLOR: Record<string, string> = {
  not_pushed: 'default',
  pushing:    'processing',
  pushed:     'success',
  failed:     'error',
}

// ── 筛选项 ──

const filters = [
  {
    label: '结算对象类型',
    key: 'settlementObjectType',
    component: 'select',
    placeholder: '选择结算对象类型',
    options: [
      { label: '代理商', value: 'agent' },
      { label: '渠道商', value: 'channel' },
      { label: '直销', value: 'direct' },
    ],
  },
  {
    label: '结算对象',
    key: 'settlementObject',
    component: 'input',
    placeholder: '输入代理商名称/编号/简称',
  },
  {
    label: '电站编号',
    key: 'stationNo',
    component: 'input',
    placeholder: '输入电站编号，如 ZC2608240001',
  },
  {
    label: '电站类型',
    key: 'stationType',
    component: 'select',
    placeholder: '选择电站类型',
    options: [
      { label: '工商业 EMC', value: 'biz_emc' },
      { label: '工商业非 EMC', value: 'biz_non_emc' },
      { label: '居民', value: 'residential' },
    ],
  },
  {
    label: '结算单编号',
    key: 'settlementNo',
    component: 'input',
    placeholder: '输入完整的结算单编号',
  },
  {
    label: '结算状态',
    key: 'settlementStatus',
    component: 'select',
    placeholder: '选择状态（多选）',
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: '待结算',   value: 'pending' },
      { label: '结算中',   value: 'processing' },
      { label: '已结算',   value: 'settled' },
      { label: '结算不通过', value: 'rejected' },
    ],
  },
  {
    label: '账单类型',
    key: 'billType',
    component: 'select',
    placeholder: '选择账单类型（多选）',
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: 'EPC 账单', value: 'epc' },
      { label: '运维账单', value: 'operation' },
      { label: '增值服务账单', value: 'value_added' },
    ],
  },
  {
    label: '是否可结算',
    key: 'isSettleable',
    component: 'select',
    placeholder: '请选择',
    options: [
      { label: '可结算',  value: 'true' },
      { label: '不可结算', value: 'false' },
    ],
  },
  {
    label: '结算建档通过时间',
    key: 'filingApproveTimeRange',
    component: 'rangePicker',
    placeholder: ['开始时间', '结束时间'],
  },
  {
    label: '完工审核通过时间',
    key: 'completeApproveTimeRange',
    component: 'rangePicker',
    placeholder: ['开始时间', '结束时间'],
  },
  {
    label: '并网审核通过时间',
    key: 'gridApproveTimeRange',
    component: 'rangePicker',
    placeholder: ['开始时间', '结束时间'],
  },
  {
    label: '推送NC状态',
    key: 'ncPushStatus',
    component: 'select',
    placeholder: '选择推送NC状态',
    options: [
      { label: '未推送',   value: 'not_pushed' },
      { label: '推送中',   value: 'pushing' },
      { label: '推送成功', value: 'pushed' },
      { label: '推送失败', value: 'failed' },
    ],
  },
  {
    label: '账单创建时间',
    key: 'billCreateTimeRange',
    component: 'rangePicker',
    placeholder: ['开始时间', '结束时间'],
  },
  {
    label: '账单号',
    key: 'billNo',
    component: 'input',
    placeholder: '输入完整的账单号，多个以逗号分隔',
  },
  {
    label: '是否进入结算单',
    key: 'inSettlement',
    component: 'select',
    placeholder: '请选择',
    options: [
      { label: '是', value: 'true' },
      { label: '否', value: 'false' },
    ],
  },
  {
    label: '应用场景',
    key: 'scenario',
    component: 'select',
    placeholder: '选择应用场景（多选）',
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: '工商业屋顶光伏', value: 'biz_rooftop' },
      { label: '居民屋顶光伏',   value: 'res_rooftop' },
      { label: '地面电站',       value: 'ground' },
      { label: '智慧社区',       value: 'smart_community' },
    ],
  },
]

// ── 表格列 ──

const columns = [
  { title: '账单号',       dataIndex: 'billNo',               key: 'billNo',               width: 180, fixed: 'left' as const, ellipsis: true },
  { title: '电站编号',     dataIndex: 'stationNo',            key: 'stationNo',            width: 160, ellipsis: true },
  { title: '电站名称',     dataIndex: 'stationName',          key: 'stationName',          width: 200, ellipsis: true },
  { title: '结算对象类型', dataIndex: 'settlementObjectType', key: 'settlementObjectType', width: 130 },
  { title: '结算对象',     dataIndex: 'settlementObject',     key: 'settlementObject',     width: 160, ellipsis: true },
  { title: '账单类型',     dataIndex: 'billType',             key: 'billType',             width: 130 },
  { title: '账单金额(元)', dataIndex: 'billAmount',           key: 'billAmount',           width: 130 },
  { title: '结算单编号',   dataIndex: 'settlementNo',         key: 'settlementNo',         width: 180, ellipsis: true },
  { title: '结算状态',     dataIndex: 'settlementStatus',     key: 'settlementStatus',     width: 120, component: 'custom', slotName: 'settlementStatusSlot' },
  { title: '是否可结算',   dataIndex: 'isSettleable',         key: 'isSettleable',         width: 110, component: 'custom', slotName: 'settleableSlot' },
  { title: '推送NC状态',   dataIndex: 'ncPushStatus',         key: 'ncPushStatus',         width: 120, component: 'custom', slotName: 'ncPushStatusSlot' },
  { title: '账单创建时间', dataIndex: 'billCreateTime',       key: 'billCreateTime',       width: 180 },
  { title: '操作',         key: 'action',                     fixed: 'right' as const,     width: 80,  component: 'custom', slotName: 'actionSlot' },
]

// ── 请求配置 ──

const tableConfig = {
  rowKey: 'id',
  searchOnLoad: true,
  request: async (params: Record<string, any>) => {
    const { params: fp = {}, pageIndex, pageRows } = params
    const query: Record<string, any> = { ...fp, pageIndex, pageRows }

    for (const rangeKey of ['filingApproveTimeRange', 'completeApproveTimeRange', 'gridApproveTimeRange', 'billCreateTimeRange']) {
      if (query[rangeKey]?.length === 2) {
        const base = rangeKey.replace('Range', '')
        query[`${base}Start`] = query[rangeKey][0]?.format?.('YYYY-MM-DD')
        query[`${base}End`]   = query[rangeKey][1]?.format?.('YYYY-MM-DD')
        delete query[rangeKey]
      }
    }

    // Mock data
    await new Promise(r => setTimeout(r, 300))
    return {
      data: MOCK_DATA,
      count: MOCK_DATA.length,
    }
  },
}

function handleViewDetail(_row: any) {
  message.info('账单详情功能待接入')
}

function handleExport() {
  message.info('导出功能待接入')
}

// ── Mock 数据 ──

const MOCK_DATA = [
  {
    id: '1',
    billNo: 'BD20260901001',
    stationNo: 'ZC2608240001',
    stationName: '杭州滨江区某屋顶光伏项目',
    settlementObjectType: '代理商',
    settlementObject: '浙江安能科技有限公司',
    billType: 'EPC 账单',
    billAmount: '128,000.00',
    settlementNo: 'JS20260901001',
    settlementStatus: 'settled',
    isSettleable: true,
    ncPushStatus: 'pushed',
    billCreateTime: '2026-09-01 10:00:00',
  },
  {
    id: '2',
    billNo: 'BD20260901002',
    stationNo: 'ZC2608240002',
    stationName: '宁波鄞州区工厂屋顶项目',
    settlementObjectType: '代理商',
    settlementObject: '宁波绿能电力有限公司',
    billType: '运维账单',
    billAmount: '36,500.00',
    settlementNo: '',
    settlementStatus: 'pending',
    isSettleable: false,
    ncPushStatus: 'not_pushed',
    billCreateTime: '2026-09-02 14:30:00',
  },
  {
    id: '3',
    billNo: 'BD20260901003',
    stationNo: 'ZC2608240003',
    stationName: '苏州工业园区分布式电站',
    settlementObjectType: '渠道商',
    settlementObject: '苏州新能源科技有限公司',
    billType: 'EPC 账单',
    billAmount: '256,800.00',
    settlementNo: 'JS20260901002',
    settlementStatus: 'processing',
    isSettleable: true,
    ncPushStatus: 'pushing',
    billCreateTime: '2026-09-03 09:15:00',
  },
  {
    id: '4',
    billNo: 'BD20260901004',
    stationNo: 'ZC2608240004',
    stationName: '温州鹿城区商业楼宇项目',
    settlementObjectType: '代理商',
    settlementObject: '温州光能投资有限公司',
    billType: '增值服务账单',
    billAmount: '12,000.00',
    settlementNo: '',
    settlementStatus: 'rejected',
    isSettleable: false,
    ncPushStatus: 'failed',
    billCreateTime: '2026-09-04 16:45:00',
  },
]
</script>

<style scoped>
.bill-query-page {
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
}

.slist-main-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  min-height: calc(100% - 0px);
}
</style>
