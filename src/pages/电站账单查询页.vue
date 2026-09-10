<template>
  <div class="bill-query-page">
    <div class="slist-main-card">
      <AnfeProTable
        ref="tableRef"
        table-key="lnc-bill-query"
        :columns="columns"
        :filters="filters"
        :config="tableConfig"
        :page-size="10"
        :table-props="{ scroll: { x: 1960 } }"
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
          <a-button type="link" size="small" @click="handleViewDetail(row)">查看费用项</a-button>
        </template>
      </AnfeProTable>
    </div>

    <!-- 账单详情 Drawer -->
    <a-drawer
      v-model:open="drawerVisible"
      title="账单详情"
      width="760"
      :body-style="{ padding: '0', overflowY: 'auto' }"
      destroy-on-close
    >
      <template v-if="currentRow">
        <!-- 上部分：核心信息 -->
        <div class="detail-section">
          <div class="info-section-title">
            {{ currentRow.stationName }}
            <a-tag
              v-if="currentRow.stationType === '工商业'"
              :color="currentRow.policyType === '标准政策' ? 'blue' : 'orange'"
              style="margin: 0; font-size: 12px; font-weight: 400"
            >{{ currentRow.policyType }}电站</a-tag>
            <span class="detail-toggle" @click="detailExpanded = !detailExpanded">
              <UpOutlined v-if="detailExpanded" />
              <DownOutlined v-else />
              {{ detailExpanded ? '收起' : '展开' }}
            </span>
          </div>
          <div class="detail-info-grid">
            <!-- 第一行：默认显示 -->
            <div class="info-item">
              <span class="info-label">账单号</span>
              <span class="info-value">{{ currentRow.billNo }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">电站编号</span>
              <span class="info-value">
                <span class="station-no-cell">
                  <a class="station-no-link" @click="handleViewStation(currentRow.stationNo)">{{ currentRow.stationNo }}</a>
                  <a-tooltip title="复制电站编号">
                    <CopyOutlined class="copy-icon-sm" @click="handleCopy(currentRow.stationNo)" />
                  </a-tooltip>
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">电站类型</span>
              <span class="info-value">{{ currentRow.stationType || '--' }}</span>
            </div>
            <!-- 第2-4行：展开后显示 -->
            <template v-if="detailExpanded">
              <div class="info-item">
                <span class="info-label">结算对象类型</span>
                <span class="info-value">{{ currentRow.settlementObjectType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">结算对象</span>
                <span class="info-value">{{ currentRow.settlementObject }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">账单类型</span>
                <span class="info-value">{{ currentRow.billType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">应用场景</span>
                <span class="info-value">{{ currentRow.scenario || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">结算单编号</span>
                <span class="info-value">{{ currentRow.settlementNo || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">结算状态</span>
                <span class="info-value">
                  <a-tag :color="SETTLEMENT_STATUS_COLOR[currentRow.settlementStatus]" style="margin:0">
                    {{ SETTLEMENT_STATUS_LABEL[currentRow.settlementStatus] ?? currentRow.settlementStatus }}
                  </a-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">是否可结算</span>
                <span class="info-value">
                  <a-tag :color="currentRow.isSettleable ? 'success' : 'default'" style="margin:0">
                    {{ currentRow.isSettleable ? '可结算' : '不可结算' }}
                  </a-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">推送NC状态</span>
                <span class="info-value">
                  <a-tag :color="NC_STATUS_COLOR[currentRow.ncPushStatus]" style="margin:0">
                    {{ NC_STATUS_LABEL[currentRow.ncPushStatus] ?? currentRow.ncPushStatus }}
                  </a-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">账单创建时间</span>
                <span class="info-value">{{ currentRow.billCreateTime }}</span>
              </div>
            </template>
          </div>
        </div>

        <div class="section-divider"></div>

        <!-- 下部分：账单明细 -->
        <div class="detail-section">
          <!-- 工商业：按角色/按费用类型切换 -->
          <template v-if="currentRow.stationType === '工商业'">
            <div class="info-section-title">
              账单明细
              <div class="seg-ctrl">
                <span :class="['seg-ctrl-item', detailViewMode === 'role' ? 'is-active' : '']" @click="detailViewMode = 'role'">按角色</span>
                <span :class="['seg-ctrl-item', detailViewMode === 'type' ? 'is-active' : '']" @click="detailViewMode = 'type'">按费用类型</span>
              </div>
            </div>
            <div class="fee-groups">
              <template v-if="detailViewMode === 'role'">
                <div class="fee-group" v-for="group in allDetailGroups" :key="group.type">
                  <div class="fee-group-label">{{ group.type }}</div>
                  <div class="fee-cards">
                    <div class="fee-card" v-for="item in group.items" :key="item.code">
                      <div class="fee-card-name">{{ item.name }}</div>
                      <div :class="['fee-card-amt', item.amt === '0.00' && 'is-zero']">¥ {{ item.amt }}</div>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="fee-group" v-for="group in feeTypeGroups" :key="group.type">
                  <div class="fee-group-label">{{ group.type }}</div>
                  <div class="fee-cards">
                    <div class="fee-card" v-for="item in group.items" :key="item.name">
                      <div class="fee-card-name">{{ item.name }}{{ group.type }}</div>
                      <div :class="['fee-card-amt', item.amt === '0.00' && 'is-zero']">¥ {{ item.amt }}</div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </template>
          <!-- 非工商业：直接平铺费用项 -->
          <template v-else>
            <div class="info-section-title">账单明细</div>
            <div class="fee-cards">
              <div class="fee-card" v-for="item in flatDetailItems" :key="item.code">
                <div class="fee-card-name">{{ item.name }}</div>
                <div :class="['fee-card-amt', item.amt === '0.00' && 'is-zero']">¥ {{ item.amt }}</div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { message, Tooltip } from 'ant-design-vue'
import { CopyOutlined, DownOutlined, UpOutlined } from '@ant-design/icons-vue'
import { AnfeProTable } from '@anfe/vue-pro-components'

const tableRef = ref<any>(null)
const drawerVisible = ref(false)
const currentRow = ref<any>(null)
const detailExpanded = ref(false)
const detailViewMode = ref<'role' | 'type'>('role')

// ── 账单明细 ──

const SETTLEMENT_FEE_MAP: Record<string, { name: string; code: string }[]> = {
  代理商: [
    { name: '开发商开工费', code: 'KFSKGF01' },
    { name: '开发商并网费', code: 'KFSBWF01' },
    { name: '开发商竣工费', code: 'KFSJGF01' },
    { name: '开发商质保金', code: 'KFSZBJ01' },
  ],
  施工方: [
    { name: '施工方开工费', code: 'SGFKGF01' },
    { name: '施工方并网费', code: 'SGFBWF01' },
    { name: '施工方竣工费', code: 'SGFJGF01' },
    { name: '施工方质保金', code: 'SGFZBJ01' },
  ],
  监理方: [
    { name: '监理方开工费', code: 'JLFKGF01' },
    { name: '监理方并网费', code: 'JLFBWF01' },
    { name: '监理方竣工费', code: 'JLFJGF01' },
    { name: '监理方质保金', code: 'JLFZBJ01' },
  ],
  设计院: [
    { name: '设计院开工费', code: 'SJYKGF01' },
    { name: '设计院并网费', code: 'SJYBWF01' },
    { name: '设计院竣工费', code: 'SJYJGF01' },
    { name: '设计院质保金', code: 'SJYZBJ01' },
  ],
  设备采购方: [
    { name: '设备采购方开工费', code: 'CGFKGF01' },
    { name: '设备采购方并网费', code: 'CGFBWF01' },
    { name: '设备采购方竣工费', code: 'CGFJGF01' },
    { name: '设备采购方质保金', code: 'CGFZBJ01' },
  ],
}

function mockAmt(seed: string, base: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff
  if (h % 5 === 0) return '0.00'
  return ((base + (h % 50000)) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const GROUP_BASE: Record<string, number> = {
  代理商:     3200000,
  施工方:     8500000,
  监理方:      480000,
  设计院:      260000,
  设备采购方:  5600000,
}

const NON_GY_FEE_ITEMS = [
  { name: '并网促销费',        code: 'NF01' },
  { name: '其他补助费',        code: 'NF02' },
  { name: '整村运维监控设备费', code: 'NF03' },
  { name: '新签分享激励费',    code: 'NF04' },
  { name: '高压并网费',        code: 'NF05' },
  { name: '开拓奖励费',        code: 'NF06' },
  { name: '低压并网费',        code: 'NF07' },
  { name: '监理竣工费',        code: 'NF08' },
  { name: '整县开发激励费',    code: 'NF09' },
  { name: '专营奖励费',        code: 'NF10' },
  { name: '规约转化器补贴费',  code: 'NF11' },
  { name: '战区补贴费',        code: 'NF12' },
  { name: '逆变器补贴费',      code: 'NF13' },
  { name: '安装费',            code: 'NF14' },
  { name: '阳光房水槽费',      code: 'NF15' },
  { name: '国补费',            code: 'NF16' },
  { name: '市占率奖励费',      code: 'NF17' },
  { name: '终验扣款费',        code: 'NF18' },
  { name: '自采物料补贴费',    code: 'NF19' },
  { name: '抗风补助费',        code: 'NF20' },
  { name: '推广商品费',        code: 'NF21' },
  { name: '支架补贴费',        code: 'NF22' },
  { name: '设计竣工费',        code: 'NF23' },
  { name: '开发费质保金费',    code: 'NF24' },
  { name: '金顶宝补贴费',      code: 'NF25' },
  { name: '开发费',            code: 'NF26' },
  { name: '高质量运营兑现费',  code: 'NF27' },
  { name: '低压质保金费',      code: 'NF28' },
  { name: '封彩钢费',          code: 'NF29' },
  { name: '安装费质保金费',    code: 'NF30' },
  { name: '暂扣开发费',        code: 'NF31' },
  { name: '越秀新商激励费',    code: 'NF32' },
  { name: '并网能力兑现费',    code: 'NF33' },
  { name: '超期电站基础费',    code: 'NF34' },
  { name: '新开拓奖励费',      code: 'NF35' },
  { name: '高压竣工费',        code: 'NF36' },
  { name: '阳光房补贴费',      code: 'NF37' },
  { name: '高压设备到货款费',  code: 'NF38' },
  { name: '完工考核费',        code: 'NF39' },
  { name: '特殊方案费',        code: 'NF40' },
  { name: '低压竣工费',        code: 'NF41' },
  { name: '低压完工款费',      code: 'NF42' },
  { name: '低压并网考核费',    code: 'NF43' },
  { name: '完工促销费',        code: 'NF44' },
  { name: '高压质保金费',      code: 'NF45' },
  { name: '并网考核费',        code: 'NF46' },
]

const flatDetailItems = computed(() => {
  if (!currentRow.value || currentRow.value.stationType === '工商业') return []
  let h = 0
  const seed = String(currentRow.value.id)
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff
  const count = 10 + (h % 8)
  const result = []
  for (let i = 0; i < NON_GY_FEE_ITEMS.length && result.length < count; i++) {
    const pick = (h * (i + 7)) & 0xff
    if (pick % 3 !== 0) result.push({
      ...NON_GY_FEE_ITEMS[i],
      amt: mockAmt(NON_GY_FEE_ITEMS[i].code + currentRow.value.id, 300000 + i * 25000),
    })
  }
  return result.slice(0, count)
})

const FEE_TYPE_LABELS = ['开工费', '并网费', '竣工费', '质保金']

const activeRoles = computed(() => {
  if (!currentRow.value) return Object.keys(SETTLEMENT_FEE_MAP)
  if (currentRow.value.stationType === '工商业' && currentRow.value.policyType === '非标准政策') {
    return ['代理商', '施工方']
  }
  return Object.keys(SETTLEMENT_FEE_MAP)
})

const feeTypeGroups = computed(() => {
  if (!currentRow.value) return []
  const roles = Object.entries(SETTLEMENT_FEE_MAP).filter(([role]) => activeRoles.value.includes(role))
  return FEE_TYPE_LABELS.map((label, typeIdx) => ({
    type: label,
    items: roles.map(([role, items]) => ({
      name: role,
      code: items[typeIdx].code,
      amt: mockAmt(items[typeIdx].code + currentRow.value.id, (GROUP_BASE[role] ?? 800000) + typeIdx * 30000),
    })),
  }))
})

const allDetailGroups = computed(() => {
  if (!currentRow.value) return []
  return Object.entries(SETTLEMENT_FEE_MAP)
    .filter(([type]) => activeRoles.value.includes(type))
    .map(([type, items]) => ({
      type,
      items: items.map((item, idx) => ({
        ...item,
        amt: mockAmt(item.code + currentRow.value.id, (GROUP_BASE[type] ?? 800000) + idx * 30000),
      })),
    }))
})

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

const tipCell = (text: string) => h(Tooltip, { title: text }, () => h('span', { class: 'cell-tip' }, text))

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
  { title: '账单号',       dataIndex: 'billNo',               key: 'billNo',               width: 180, fixed: 'left' as const, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '电站编号',     dataIndex: 'stationNo',            key: 'stationNo',            width: 180, component: 'custom', slotName: 'stationNoSlot' },
  { title: '电站名称',     dataIndex: 'stationName',          key: 'stationName',          width: 200, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '电站类型',     dataIndex: 'stationType',          key: 'stationType',          width: 160, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '结算对象类型', dataIndex: 'settlementObjectType', key: 'settlementObjectType', width: 130 },
  { title: '结算对象',     dataIndex: 'settlementObject',     key: 'settlementObject',     width: 160, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '账单类型',     dataIndex: 'billType',             key: 'billType',             width: 220, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '应用场景',     dataIndex: 'scenario',             key: 'scenario',             width: 140, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '结算单编号',   dataIndex: 'settlementNo',         key: 'settlementNo',         width: 180, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '结算状态',     dataIndex: 'settlementStatus',     key: 'settlementStatus',     width: 120, component: 'custom', slotName: 'settlementStatusSlot' },
  { title: '是否可结算',   dataIndex: 'isSettleable',         key: 'isSettleable',         width: 110, component: 'custom', slotName: 'settleableSlot' },
  { title: '推送NC状态',   dataIndex: 'ncPushStatus',         key: 'ncPushStatus',         width: 120, component: 'custom', slotName: 'ncPushStatusSlot' },
  { title: '账单创建时间', dataIndex: 'billCreateTime',       key: 'billCreateTime',       width: 180 },
  { title: '操作',         key: 'action',                     fixed: 'right' as const,     width: 100, component: 'custom', slotName: 'actionSlot' },
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

    // 筛选
    const filtered = MOCK_DATA.filter(row => {
      if (query.settlementObjectType && row.settlementObjectType !== query.settlementObjectType) return false
      if (query.settlementObject && !row.settlementObject.includes(query.settlementObject)) return false
      if (query.stationNo && !row.stationNo.includes(query.stationNo)) return false
      if (query.stationType?.length && !query.stationType.includes(row.stationType)) return false
      if (query.settlementNo && !row.settlementNo?.includes(query.settlementNo)) return false
      if (query.settlementStatus?.length && !query.settlementStatus.includes(row.settlementStatus)) return false
      if (query.billType?.length && !query.billType.includes(row.billType)) return false
      if (query.isSettleable != null && query.isSettleable !== '') {
        if (row.isSettleable !== (query.isSettleable === 'true')) return false
      }
      if (query.ncPushStatus && row.ncPushStatus !== query.ncPushStatus) return false
      if (query.scenario?.length && !query.scenario.includes(row.scenario)) return false
      if (query.billNo && !row.billNo.includes(query.billNo)) return false
      if (query.inSettlement != null && query.inSettlement !== '') {
        const hasSettlement = Boolean(row.settlementNo)
        if (hasSettlement !== (query.inSettlement === 'true')) return false
      }
      return true
    })

    await new Promise(r => setTimeout(r, 300))
    const start = ((pageIndex ?? 1) - 1) * (pageRows ?? 20)
    return {
      data: filtered.slice(start, start + (pageRows ?? 20)),
      count: filtered.length,
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

function handleViewDetail(row: any) {
  currentRow.value = row
  detailExpanded.value = false
  detailViewMode.value = 'role'
  drawerVisible.value = true
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
    stationType: '金顶宝',
    settlementObjectType: '代理商',
    settlementObject: '浙江安能新能源科技有限公司',
    billType: '整村开发代理商竣工账单',
    scenario: '平改坡',
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
    stationType: '绿电家-兴业版',
    settlementObjectType: '代理商',
    settlementObject: '宁波绿能电力有限公司',
    billType: '并网安装费账单',
    scenario: '斜屋顶',
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
    stationType: '工商业',
    policyType: '标准政策',
    settlementObjectType: '施工方',
    settlementObject: '苏州新能源建设工程有限公司',
    billType: '整村开发施工方竣工账单',
    scenario: '平台阵列式',
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
    stationType: '泰益宝',
    settlementObjectType: '监理方',
    settlementObject: '温州光能工程监理有限公司',
    billType: '整村开发监理竣工账单',
    scenario: '院内支架',
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
    stationType: '泰阳宝（安能）',
    settlementObjectType: '代理商',
    settlementObject: '嘉兴绿电发展有限公司',
    billType: '泰阳宝安装费账单',
    scenario: '5°单坡阳光房',
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
    stationType: '星光宝',
    settlementObjectType: '设计院',
    settlementObject: '绍兴恒远建筑设计有限公司',
    billType: '整村开发设计院竣工账单',
    scenario: '斜屋顶南北坡',
    settlementNo: '',
    settlementStatus: 'pending_contract_sign',
    isSettleable: true,
    ncPushStatus: 'pending',
    billCreateTime: '2026-09-06 08:50:00',
  },
  {
    id: '7',
    billNo: 'BD20260901007',
    stationNo: 'ZC2608240007',
    stationName: '南京江宁区物流园屋顶光伏',
    stationType: '悦租',
    settlementObjectType: '运维后台厂家',
    settlementObject: '南京智慧能源管理有限公司',
    billType: '整村开发后台厂家调差账单',
    scenario: '7°平台阵列式',
    settlementNo: 'JS20260901004',
    settlementStatus: 'pending_payment',
    isSettleable: true,
    ncPushStatus: 'pushed',
    billCreateTime: '2026-09-07 13:40:00',
  },
  {
    id: '8',
    billNo: 'BD20260901008',
    stationNo: 'ZC2608240008',
    stationName: '无锡惠山区钢结构厂房项目',
    stationType: '绿光宝',
    settlementObjectType: '施工方',
    settlementObject: '无锡泰阳建设工程有限公司',
    billType: '整村开发施工方并网账单',
    scenario: '斜屋顶北坡',
    settlementNo: '',
    settlementStatus: 'creating',
    isSettleable: false,
    ncPushStatus: 'pending',
    billCreateTime: '2026-09-08 09:00:00',
  },
  {
    id: '9',
    billNo: 'BD20260901009',
    stationNo: 'ZC2608240009',
    stationName: '常州武进区冷链仓储光伏',
    stationType: '金屋宝',
    settlementObjectType: '代理商',
    settlementObject: '常州晴天能源科技有限公司',
    billType: '并网开发费账单',
    scenario: '10°单坡阳光房',
    settlementNo: 'JS20260901005',
    settlementStatus: 'deducted',
    isSettleable: true,
    ncPushStatus: 'pushed',
    billCreateTime: '2026-09-09 15:10:00',
  },
  {
    id: '10',
    billNo: 'BD20260901010',
    stationNo: 'ZC2608240010',
    stationName: '金华婺城区食品加工厂光伏',
    stationType: '绿电家-民生版',
    settlementObjectType: '监理方',
    settlementObject: '金华中正工程监理咨询有限公司',
    billType: '整村开发监理变更账单',
    scenario: '院内阳光房',
    settlementNo: '',
    settlementStatus: 'pending_invoice_sign',
    isSettleable: false,
    ncPushStatus: 'not_needed',
    billCreateTime: '2026-09-10 10:25:00',
  },
  {
    id: '11',
    billNo: 'BD20260901011',
    stationNo: 'ZC2608240011',
    stationName: '台州椒江区商业综合体光伏',
    stationType: '金租宝-兴业版',
    settlementObjectType: '代理商',
    settlementObject: '台州阳光新能源有限公司',
    billType: '完工安装费账单',
    scenario: '5°人字坡阳光房',
    settlementNo: 'JS20260901006',
    settlementStatus: 'pushing',
    isSettleable: true,
    ncPushStatus: 'pending',
    billCreateTime: '2026-09-11 14:05:00',
  },
  {
    id: '12',
    billNo: 'BD20260901012',
    stationNo: 'ZC2608240012',
    stationName: '义乌市国际商贸城屋顶光伏',
    stationType: '工商业',
    policyType: '非标准政策',
    settlementObjectType: '施工方',
    settlementObject: '义乌鑫源建设工程有限公司',
    billType: '整村开发施工方到货账单',
    scenario: '院内支架-双坡',
    settlementNo: '',
    settlementStatus: 'finance_review',
    isSettleable: true,
    ncPushStatus: 'pending',
    billCreateTime: '2026-09-12 08:30:00',
  },
  {
    id: '13',
    billNo: 'BD20260901013',
    stationNo: 'ZC2608240013',
    stationName: '湖州吴兴区纺织厂屋顶光伏',
    stationType: '泰益宝',
    settlementObjectType: '设计院',
    settlementObject: '湖州建筑规划设计研究院有限公司',
    billType: '整村开发设计变更账单',
    scenario: '斜屋顶南北坡B场景',
    settlementNo: 'JS20260901007',
    settlementStatus: 'partial_deduction',
    isSettleable: true,
    ncPushStatus: 'pushed',
    billCreateTime: '2026-09-13 16:55:00',
  },
  {
    id: '14',
    billNo: 'BD20260901014',
    stationNo: 'ZC2608240014',
    stationName: '衢州柯城区农业大棚光伏',
    stationType: '星光宝整村开发',
    settlementObjectType: '代理商',
    settlementObject: '衢州绿色能源发展有限公司',
    billType: '退质保金账单',
    scenario: '南10北5阳光房',
    settlementNo: '',
    settlementStatus: 'pending_deduction',
    isSettleable: false,
    ncPushStatus: 'failed',
    billCreateTime: '2026-09-14 11:45:00',
  },
  {
    id: '15',
    billNo: 'BD20260901015',
    stationNo: 'ZC2608240015',
    stationName: '丽水莲都区山地光伏电站',
    stationType: '泰阳宝（光伏星）',
    settlementObjectType: '运维后台厂家',
    settlementObject: '丽水数字能源科技有限公司',
    billType: '整村运维厂家竣工账单',
    scenario: '默认',
    settlementNo: 'JS20260901008',
    settlementStatus: 'paid',
    isSettleable: true,
    ncPushStatus: 'pushed',
    billCreateTime: '2026-09-15 09:20:00',
  },
  {
    id: '16',
    billNo: 'BD20260901016',
    stationNo: 'ZC2608240016',
    stationName: '舟山定海区港口仓储光伏',
    stationType: '绿电家-全款直销(安能)',
    settlementObjectType: '代理商',
    settlementObject: '舟山海岛新能源有限公司',
    billType: '并网考核账单',
    scenario: '平改坡',
    settlementNo: '',
    settlementStatus: 'pending_invoice_upload',
    isSettleable: false,
    ncPushStatus: 'pending',
    billCreateTime: '2026-09-16 17:30:00',
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

.cell-tip {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-section {
  padding: 20px 24px;
}

.section-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0 24px;
}

/* info-grid — 与建档详情页一致 */
.info-section-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.info-item--span2 { grid-column: span 2; }
.info-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 22px;
  padding-bottom: 8px;
  white-space: nowrap;
}
.info-value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 22px;
  word-break: break-word;
}

/* 账单明细费用卡片 */
.fee-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.fee-group-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 8px;
}
.fee-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.fee-card {
  border: 1px solid rgba(0, 0, 0, 0.09);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fee-card-name {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 20px;
}
.fee-card-amt {
  font-size: 18px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  line-height: 28px;
}
.fee-card-amt.is-zero {
  color: rgba(0, 0, 0, 0.25);
  font-weight: 400;
}

/* 标题内电站名称链接 */
.station-name-link {
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;
  font-weight: 500;
}
.station-name-link:hover {
  color: #1677ff;
  text-decoration: underline;
}
.seg-ctrl {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  height: 28px;
  box-sizing: border-box;
}
.seg-ctrl-item {
  padding: 0 10px;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.45);
  transition: background 0.15s, color 0.15s;
  user-select: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  height: 100%;
}
.seg-ctrl-item.is-active {
  background: #fff;
  color: rgba(0, 0, 0, 0.88);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
.detail-toggle {
  margin-left: auto;
  font-size: 13px;
  font-weight: 400;
  color: #1677ff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}
.detail-toggle:hover {
  opacity: 0.8;
}
.copy-icon-sm {
  font-size: 13px;
  color: #bbb;
  cursor: pointer;
  flex-shrink: 0;
}
.copy-icon-sm:hover {
  color: #1677ff;
}
</style>
