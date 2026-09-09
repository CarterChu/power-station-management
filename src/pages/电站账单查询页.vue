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

        <!-- 电站编号：跳转 + 复制 -->
        <template #stationNoSlot="{ row }">
          <span class="station-no-cell">
            <a class="station-no-link" @click="handleViewStation(row.stationNo)">{{ row.stationNo }}</a>
            <a-tooltip title="复制电站编号">
              <CopyOutlined class="copy-icon" @click.stop="handleCopy(row.stationNo)" />
            </a-tooltip>
          </span>
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
import { CopyOutlined } from '@ant-design/icons-vue'
import { AnfeProTable } from '@anfe/vue-pro-components'

const tableRef = ref<any>(null)

// ── 枚举映射 ──

const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  creating:            '创建中',
  pending_invoice_upload: '待上传发票',
  pending_invoice_sign:   '待签收发票',
  pending_contract_sign:  '待签收合同',
  finance_review:      '财务审核',
  pushing:             '推送中',
  approving:           '审批中',
  freezing:            '冻结中',
  pending_payment:     '待付款',
  partial_payment:     '部分付款',
  paid:                '已付款',
  pending_deduction:   '待抵扣',
  partial_deduction:   '部分抵扣',
  deducted:            '已抵扣',
}

const SETTLEMENT_STATUS_COLOR: Record<string, string> = {
  creating:               'default',
  pending_invoice_upload: 'warning',
  pending_invoice_sign:   'warning',
  pending_contract_sign:  'warning',
  finance_review:         'processing',
  pushing:                'processing',
  approving:              'processing',
  freezing:               'error',
  pending_payment:        'warning',
  partial_payment:        'processing',
  paid:                   'success',
  pending_deduction:      'warning',
  partial_deduction:      'processing',
  deducted:               'success',
}

const NC_STATUS_LABEL: Record<string, string> = {
  pending:     '待推送',
  pushed:      '推送成功',
  failed:      '推送失败',
  not_needed:  '无需推送',
}

const NC_STATUS_COLOR: Record<string, string> = {
  pending:    'warning',
  pushed:     'success',
  failed:     'error',
  not_needed: 'default',
}

// ── 筛选项 ──

const filters = [
  {
    label: '结算对象类型',
    key: 'settlementObjectType',
    component: 'select',
    placeholder: '选择结算对象类型',
    options: [
      { label: '代理商',     value: '代理商' },
      { label: '施工方',     value: '施工方' },
      { label: '设计院',     value: '设计院' },
      { label: '监理方',     value: '监理方' },
      { label: '运维后台厂家', value: '运维后台厂家' },
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
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: '金顶宝',              value: '金顶宝' },
      { label: '绿电家-兴业版',        value: '绿电家-兴业版' },
      { label: '绿电家-民生版',        value: '绿电家-民生版' },
      { label: '绿电家-民商版',        value: '绿电家-民商版' },
      { label: '富民购-工行版',        value: '富民购-工行版' },
      { label: '富民购-民生版',        value: '富民购-民生版' },
      { label: '金屋宝',              value: '金屋宝' },
      { label: '金租宝-兴业版',        value: '金租宝-兴业版' },
      { label: '金租宝-中信版',        value: '金租宝-中信版' },
      { label: '星光宝',              value: '星光宝' },
      { label: '安心购-兴业版',        value: '安心购-兴业版' },
      { label: '沐光宝',              value: '沐光宝' },
      { label: '悦租',               value: '悦租' },
      { label: '悦租-中信版',          value: '悦租-中信版' },
      { label: '悦租-兴业版',          value: '悦租-兴业版' },
      { label: '星光宝-越秀',          value: '星光宝-越秀' },
      { label: '金租宝-浦银版',        value: '金租宝-浦银版' },
      { label: '悦租-浦银版',          value: '悦租-浦银版' },
      { label: '金租宝-浙银版',        value: '金租宝-浙银版' },
      { label: '悦租-浙银版',          value: '悦租-浙银版' },
      { label: '安心购-民生版',        value: '安心购-民生版' },
      { label: '绿电家-工行版',        value: '绿电家-工行版' },
      { label: '金顶宝-越秀',          value: '金顶宝-越秀' },
      { label: '绿电家-浦发版',        value: '绿电家-浦发版' },
      { label: '绿电家-越秀',          value: '绿电家-越秀' },
      { label: '绿电家-全款直销(安能)', value: '绿电家-全款直销(安能)' },
      { label: '绿电家-全款直销(光伏星)', value: '绿电家-全款直销(光伏星)' },
      { label: '绿光宝',              value: '绿光宝' },
      { label: '绿家电-越秀',          value: '绿家电-越秀' },
      { label: '金顶宝整村开发',        value: '金顶宝整村开发' },
      { label: '星光宝整村开发',        value: '星光宝整村开发' },
      { label: '绿光宝整村开发',        value: '绿光宝整村开发' },
      { label: '泰阳宝（安能）',        value: '泰阳宝（安能）' },
      { label: '泰阳宝（光伏星）',      value: '泰阳宝（光伏星）' },
      { label: '泰益宝',              value: '泰益宝' },
      { label: '工商业',              value: '工商业' },
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
      { label: '创建中',    value: 'creating' },
      { label: '待上传发票', value: 'pending_invoice_upload' },
      { label: '待签收发票', value: 'pending_invoice_sign' },
      { label: '待签收合同', value: 'pending_contract_sign' },
      { label: '财务审核',  value: 'finance_review' },
      { label: '推送中',    value: 'pushing' },
      { label: '审批中',    value: 'approving' },
      { label: '冻结中',    value: 'freezing' },
      { label: '待付款',    value: 'pending_payment' },
      { label: '部分付款',  value: 'partial_payment' },
      { label: '已付款',    value: 'paid' },
      { label: '待抵扣',    value: 'pending_deduction' },
      { label: '部分抵扣',  value: 'partial_deduction' },
      { label: '已抵扣',    value: 'deducted' },
    ],
  },
  {
    label: '账单类型',
    key: 'billType',
    component: 'select',
    placeholder: '选择账单类型（多选）',
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: '泰阳宝安装费账单',        value: '泰阳宝安装费账单' },
      { label: '整村开发运维厂家变更账单',  value: '整村开发运维厂家变更账单' },
      { label: '整村开发设计变更账单',     value: '整村开发设计变更账单' },
      { label: '整村开发监理变更账单',     value: '整村开发监理变更账单' },
      { label: '整村开发施工变更账单',     value: '整村开发施工变更账单' },
      { label: '整村开发后台厂家调差账单',  value: '整村开发后台厂家调差账单' },
      { label: '整村运维厂家竣工账单',     value: '整村运维厂家竣工账单' },
      { label: '并网促销账单',           value: '并网促销账单' },
      { label: '整村代理商变更账单',      value: '整村代理商变更账单' },
      { label: '整村开发施工调差账单',     value: '整村开发施工调差账单' },
      { label: '整村开发设计调差账单',     value: '整村开发设计调差账单' },
      { label: '整村开发监理调差账单',     value: '整村开发监理调差账单' },
      { label: '整村开发代理商调差账单',   value: '整村开发代理商调差账单' },
      { label: '超期租转售账单',         value: '超期租转售账单' },
      { label: '整村开发并网考核账单',     value: '整村开发并网考核账单' },
      { label: '整村开发代理商退质保金账单', value: '整村开发代理商退质保金账单' },
      { label: '整村开发代理商竣工账单',   value: '整村开发代理商竣工账单' },
      { label: '整村开发代理商并网账单',   value: '整村开发代理商并网账单' },
      { label: '整村开发代理商完工账单',   value: '整村开发代理商完工账单' },
      { label: '整村开发设计院竣工账单',   value: '整村开发设计院竣工账单' },
      { label: '整村开发监理竣工账单',     value: '整村开发监理竣工账单' },
      { label: '整村开发施工方退质保金账单', value: '整村开发施工方退质保金账单' },
      { label: '整村开发施工方竣工账单',   value: '整村开发施工方竣工账单' },
      { label: '整村开发施工方并网账单',   value: '整村开发施工方并网账单' },
      { label: '整村开发施工方到货账单',   value: '整村开发施工方到货账单' },
      { label: '新开拓奖励账单',         value: '新开拓奖励账单' },
      { label: '并网能力兑现账单',        value: '并网能力兑现账单' },
      { label: '运营能力兑现账单',        value: '运营能力兑现账单' },
      { label: '促销费用账单',           value: '促销费用账单' },
      { label: '超期回购账单',           value: '超期回购账单' },
      { label: '电站终止账单',           value: '电站终止账单' },
      { label: '放款考核账单',           value: '放款考核账单' },
      { label: '完工开发费账单',         value: '完工开发费账单' },
      { label: '并网安装费账单',         value: '并网安装费账单' },
      { label: '特殊账单',              value: '特殊账单' },
      { label: '并网考核账单',           value: '并网考核账单' },
      { label: '退质保金账单',           value: '退质保金账单' },
      { label: '推广费用积分扣减退回',    value: '推广费用积分扣减退回' },
      { label: '推广费用积分扣减',        value: '推广费用积分扣减' },
      { label: '推广费用账单',           value: '推广费用账单' },
      { label: '差异账单',              value: '差异账单' },
      { label: '手工账单',              value: '手工账单' },
      { label: '变更账单',              value: '变更账单' },
      { label: '并网开发费账单',         value: '并网开发费账单' },
      { label: '完工安装费账单',         value: '完工安装费账单' },
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
      { label: '待推送',   value: 'pending' },
      { label: '推送成功', value: 'pushed' },
      { label: '推送失败', value: 'failed' },
      { label: '无需推送', value: 'not_needed' },
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
      { label: '平改坡',          value: '平改坡' },
      { label: '10°单坡阳光房',   value: '10°单坡阳光房' },
      { label: '平台阵列式',       value: '平台阵列式' },
      { label: '斜屋顶',          value: '斜屋顶' },
      { label: '5°单坡阳光房',    value: '5°单坡阳光房' },
      { label: '5°人字坡阳光房',  value: '5°人字坡阳光房' },
      { label: '院内支架',         value: '院内支架' },
      { label: '南10北5阳光房',   value: '南10北5阳光房' },
      { label: '默认',            value: '默认' },
      { label: '院内阳光房',       value: '院内阳光房' },
      { label: '斜屋顶北坡',       value: '斜屋顶北坡' },
      { label: '7°平台阵列式',    value: '7°平台阵列式' },
      { label: '院内支架-双坡',    value: '院内支架-双坡' },
      { label: '斜屋顶南北坡B场景', value: '斜屋顶南北坡B场景' },
      { label: '斜屋顶南北坡',     value: '斜屋顶南北坡' },
    ],
  },
]

// ── 表格列 ──

const columns = [
  { title: '账单号',       dataIndex: 'billNo',               key: 'billNo',               width: 180, fixed: 'left' as const, ellipsis: true },
  { title: '电站编号',     dataIndex: 'stationNo',            key: 'stationNo',            width: 180, component: 'custom', slotName: 'stationNoSlot' },
  { title: '电站名称',     dataIndex: 'stationName',          key: 'stationName',          width: 200, ellipsis: true },
  { title: '结算对象类型', dataIndex: 'settlementObjectType', key: 'settlementObjectType', width: 130 },
  { title: '结算对象',     dataIndex: 'settlementObject',     key: 'settlementObject',     width: 160, ellipsis: true },
  { title: '账单类型',     dataIndex: 'billType',             key: 'billType',             width: 220, ellipsis: true },
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

function handleViewStation(stationNo: string) {
  message.info(`电站详情：${stationNo}（功能待接入）`)
}

function handleCopy(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制')
  })
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
    settlementObject: '浙江安能新能源科技有限公司',
    billType: '整村开发代理商竣工账单',
    billAmount: '128,000.00',
    settlementNo: 'JS20260901001',
    settlementStatus: 'paid',
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
    billType: '并网安装费账单',
    billAmount: '36,500.00',
    settlementNo: '',
    settlementStatus: 'pending_invoice_upload',
    isSettleable: false,
    ncPushStatus: 'pending',
    billCreateTime: '2026-09-02 14:30:00',
  },
  {
    id: '3',
    billNo: 'BD20260901003',
    stationNo: 'ZC2608240003',
    stationName: '苏州工业园区分布式电站',
    settlementObjectType: '施工方',
    settlementObject: '苏州新能源建设工程有限公司',
    billType: '整村开发施工方竣工账单',
    billAmount: '256,800.00',
    settlementNo: 'JS20260901002',
    settlementStatus: 'approving',
    isSettleable: true,
    ncPushStatus: 'not_needed',
    billCreateTime: '2026-09-03 09:15:00',
  },
  {
    id: '4',
    billNo: 'BD20260901004',
    stationNo: 'ZC2608240004',
    stationName: '温州鹿城区商业楼宇项目',
    settlementObjectType: '监理方',
    settlementObject: '温州光能工程监理有限公司',
    billType: '整村开发监理竣工账单',
    billAmount: '12,000.00',
    settlementNo: '',
    settlementStatus: 'freezing',
    isSettleable: false,
    ncPushStatus: 'failed',
    billCreateTime: '2026-09-04 16:45:00',
  },
  {
    id: '5',
    billNo: 'BD20260901005',
    stationNo: 'ZC2608240005',
    stationName: '嘉兴南湖区居民光伏项目',
    settlementObjectType: '代理商',
    settlementObject: '嘉兴绿电发展有限公司',
    billType: '泰阳宝安装费账单',
    billAmount: '8,500.00',
    settlementNo: 'JS20260901003',
    settlementStatus: 'partial_payment',
    isSettleable: true,
    ncPushStatus: 'pushed',
    billCreateTime: '2026-09-05 11:20:00',
  },
  {
    id: '6',
    billNo: 'BD20260901006',
    stationNo: 'ZC2608240006',
    stationName: '绍兴越城区整村开发项目',
    settlementObjectType: '设计院',
    settlementObject: '绍兴恒远建筑设计有限公司',
    billType: '整村开发设计院竣工账单',
    billAmount: '45,000.00',
    settlementNo: '',
    settlementStatus: 'pending_contract_sign',
    isSettleable: true,
    ncPushStatus: 'pending',
    billCreateTime: '2026-09-06 08:50:00',
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
  min-height: 100%;
}

.station-no-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}

.station-no-link {
  color: #1677ff;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.station-no-link:hover {
  text-decoration: underline;
}

.copy-icon {
  color: #bbb;
  font-size: 12px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  cursor: pointer;
}

.station-no-cell:hover .copy-icon {
  opacity: 1;
}

.copy-icon:hover {
  color: #1677ff;
}
</style>
