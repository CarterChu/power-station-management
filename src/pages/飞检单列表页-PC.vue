<template>
  <div class="fj-sheet-list-page">
    <div class="fj-main-card">
      <AnfeProTable
        ref="tableRef"
        table-key="fj-sheet-list-pc"
        :columns="columns"
        :filters="filters"
        :config="tableConfig"
        :page-size="10"
        :table-props="{ scroll: { x: 1800 } }"
      >
        <template #operationRight>
          <a-button @click="handleExport">导出</a-button>
        </template>

        <!-- 检查状态 -->
        <template #checkStatusSlot="{ row }">
          <span class="fj-status-dot-wrap">
            <span class="fj-status-dot" :class="`fj-dot--${row.checkStatus}`"></span>
            {{ CHECK_STATUS_LABEL[row.checkStatus] ?? row.checkStatus }}
          </span>
        </template>

        <!-- 整改状态 -->
        <template #rectifyStatusSlot="{ row }">
          <span v-if="row.checkStatus === 'pending'" style="color:#bfbfbf">—</span>
          <a-tag v-else-if="row.rectifyStatus === 'none'" color="default" style="margin:0">无缺陷</a-tag>
          <a-tag v-else-if="row.rectifyStatus === 'rectifying'" color="warning" style="margin:0">整改中</a-tag>
          <a-tag v-else-if="row.rectifyStatus === 'done'" color="success" style="margin:0">整改完成</a-tag>
        </template>

        <!-- 缺陷统计 -->
        <template #defectsSlot="{ row }">
          <span v-if="row.checkStatus === 'pending'" style="color:#bfbfbf">—</span>
          <span v-else>
            <span class="defect-badge cr">CR {{ row.crCount }}</span>
            <span class="defect-badge ma">MA {{ row.maCount }}</span>
            <span class="defect-badge mi">MI {{ row.miCount }}</span>
          </span>
        </template>

        <!-- 行操作 -->
        <template #actionSlot="{ row }">
          <a-space :size="0">
            <a-button
              v-if="row.checkStatus === 'pending'"
              type="link" size="small"
              @click="handleStartCheck(row)"
            >执行飞检</a-button>
            <a-button type="link" size="small" @click="handleDetail(row)">详情</a-button>
          </a-space>
        </template>
      </AnfeProTable>
    </div>
  </div>

  <!-- 飞检单详情 Drawer -->
  <a-drawer
    v-model:open="detailVisible"
    :title="detailRow ? detailRow.sheetNo : ''"
    width="860"
    :body-style="{ padding: '16px 20px' }"
    destroy-on-close
  >
    <template v-if="detailRow" #title>
      <span style="margin-right:10px">飞检详情 · {{ detailRow.sheetNo }}</span>
      <a-tag v-if="detailRow.checkStatus === 'pending'" color="default" style="margin:0">待检查</a-tag>
      <a-tag v-else-if="detailRow.checkStatus === 'passed'" color="success" style="margin:0">通过</a-tag>
      <a-tag v-else color="error" style="margin:0">不通过</a-tag>
    </template>
    <FjSheetDetailPC v-if="detailRow" :init-row="detailRow" />
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FjSheetDetailPC from './飞检单详情页-PC.vue'
import { AnfeProTable } from '@anfe/vue-pro-components'
import { message } from 'ant-design-vue'

const props = defineProps<{ pendingUpdate?: any }>()
const emit = defineEmits<{
  navigate: [target: string, payload?: any]
  updateApplied: []
}>()

const tableRef = ref<any>(null)
const detailVisible = ref(false)
const detailRow = ref<any>(null)

const CHECK_STATUS_LABEL: Record<string, string> = { pending: '待检查', passed: '通过', failed: '不通过' }

const columns: any[] = [
  { title: '飞检单号', dataIndex: 'sheetNo', key: 'sheetNo', width: 170, fixed: 'left' as const, ellipsis: true },
  { title: '电站编号', dataIndex: 'stationNo', key: 'stationNo', width: 160, ellipsis: true },
  { title: '业主', dataIndex: 'owner', key: 'owner', width: 100 },
  { title: '批次单号', dataIndex: 'batchNo', key: 'batchNo', width: 155, ellipsis: true },
  { title: '代理商', dataIndex: 'agent', key: 'agent', width: 170, ellipsis: true },
  { title: '一级代理商', dataIndex: 'firstAgent', key: 'firstAgent', width: 160, ellipsis: true },
  { title: '飞检工程师', dataIndex: 'engineer', key: 'engineer', width: 110 },
  { title: '飞检日期', dataIndex: 'checkDate', key: 'checkDate', width: 130 },
  { title: '缺陷统计', key: 'defects', width: 180, component: 'custom', slotName: 'defectsSlot' },
  { title: '检查状态', key: 'checkStatus', width: 110, component: 'custom', slotName: 'checkStatusSlot' },
  { title: '整改状态', key: 'rectifyStatus', width: 110, component: 'custom', slotName: 'rectifyStatusSlot' },
  { title: '操作', key: 'action', fixed: 'right' as const, width: 130, component: 'custom', slotName: 'actionSlot' },
]

const filters = [
  { label: '飞检单号',   key: 'sheetNo',     component: 'input',  placeholder: '请输入飞检单号' },
  { label: '电站编号',   key: 'stationNo',   component: 'input',  placeholder: '请输入电站编号' },
  { label: '业主姓名',   key: 'owner',       component: 'input',  placeholder: '请输入业主姓名' },
  { label: '批次单号',   key: 'batchNo',     component: 'input',  placeholder: '请输入批次单号' },
  { label: '代理商',     key: 'agent',       component: 'input',  placeholder: '请输入代理商' },
  { label: '飞检工程师', key: 'engineer',    component: 'input',  placeholder: '请输入工程师姓名' },
  { label: '飞检日期',   key: 'checkDateRange', component: 'rangePicker', placeholder: ['开始日期', '结束日期'] },
  { label: '检查状态',   key: 'checkStatus', component: 'select', placeholder: '请选择', options: [
    { label: '待检查', value: 'pending' },
    { label: '通过',   value: 'passed' },
    { label: '不通过', value: 'failed' },
  ]},
  { label: '整改状态',   key: 'rectifyStatus', component: 'select', placeholder: '请选择', options: [
    { label: '无缺陷',   value: 'none' },
    { label: '整改中',   value: 'rectifying' },
    { label: '整改完成', value: 'done' },
  ]},
]

const tableConfig = {
  rowKey: 'id',
  searchOnLoad: true,
  request: async (params: Record<string, any>) => {
    const { params: fp = {}, pageIndex, pageRows } = params
    await new Promise(r => setTimeout(r, 200))
    let list = [...MOCK_SHEETS.value]
    if (fp.sheetNo) list = list.filter(s => s.sheetNo.includes(fp.sheetNo))
    if (fp.stationNo) list = list.filter(s => s.stationNo.includes(fp.stationNo))
    if (fp.batchNo) list = list.filter(s => s.batchNo.includes(fp.batchNo))
    if (fp.owner) list = list.filter(s => s.owner.includes(fp.owner))
    if (fp.agent) list = list.filter(s => s.agent.includes(fp.agent))
    if (fp.engineer) list = list.filter(s => s.engineer.includes(fp.engineer))
    if (fp.checkStatus) list = list.filter(s => s.checkStatus === fp.checkStatus)
    if (fp.rectifyStatus) list = list.filter(s => s.rectifyStatus === fp.rectifyStatus)
    const total = list.length
    list = list.slice(((pageIndex ?? 1) - 1) * (pageRows ?? 10), (pageIndex ?? 1) * (pageRows ?? 10))
    return { data: list, count: total }
  },
}

function handleStartCheck(row: any) {
  emit('navigate', 'fj-sheet-check', { row })
}

function handleDetail(row: any) {
  detailRow.value = row
  detailVisible.value = true
}

function handleExport() {
  message.info('导出功能接入后生效')
}

const MOCK_SHEETS = ref([
  { id: 'fj001', sheetNo: 'FJD-2026-001001', batchNo: 'FJB-2026-001', stationNo: 'FJZ-2025-001001', owner: '张三',  agent: '杭州阳光新能源科技有限公司', firstAgent: '浙江大区代理商',     engineer: '赵飞', checkDate: '2026-09-10', crCount: 0, maCount: 1, miCount: 2, checkStatus: 'failed', rectifyStatus: 'done' },
  { id: 'fj002', sheetNo: 'FJD-2026-001002', batchNo: 'FJB-2026-001', stationNo: 'FJZ-2025-001003', owner: '王五',  agent: '苏州工业光伏集成商', firstAgent: '江苏大区代理商',     engineer: '刘海', checkDate: '2026-09-10', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'passed', rectifyStatus: 'none' },
  { id: 'fj003', sheetNo: 'FJD-2026-001003', batchNo: 'FJB-2026-001', stationNo: 'FJZ-2025-001004', owner: '赵六',  agent: '合肥绿色能源技术有限公司', firstAgent: '安徽大区代理商', engineer: '黄磊', checkDate: '2026-09-10', crCount: 1, maCount: 0, miCount: 1, checkStatus: 'failed', rectifyStatus: 'rectifying' },
  { id: 'fj004', sheetNo: 'FJD-2026-001004', batchNo: 'FJB-2026-001', stationNo: 'FJZ-2025-001006', owner: '周八',  agent: '南京太阳能科技有限公司', firstAgent: '江苏大区代理商',   engineer: '赵飞', checkDate: '2026-09-10', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'passed', rectifyStatus: 'none' },
  { id: 'fj005', sheetNo: 'FJD-2026-001005', batchNo: 'FJB-2026-001', stationNo: 'FJZ-2025-001007', owner: '吴九',  agent: '杭州阳光新能源科技有限公司', firstAgent: '浙江大区代理商', engineer: '周斌', checkDate: '2026-09-10', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'passed', rectifyStatus: 'none' },
  { id: 'fj006', sheetNo: 'FJD-2026-002001', batchNo: 'FJB-2026-002', stationNo: 'FJZ-2025-001009', owner: '冯一',  agent: '宁波绿能电力安装有限公司', firstAgent: '浙江大区代理商',  engineer: '赵飞', checkDate: '2026-09-18', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'passed', rectifyStatus: 'none' },
  { id: 'fj007', sheetNo: 'FJD-2026-002002', batchNo: 'FJB-2026-002', stationNo: 'FJZ-2025-001011', owner: '褚三',  agent: '金华光伏建设集团有限公司', firstAgent: '浙江大区代理商',  engineer: '刘海', checkDate: '2026-09-18', crCount: 0, maCount: 1, miCount: 0, checkStatus: 'failed', rectifyStatus: 'done' },
  { id: 'fj008', sheetNo: 'FJD-2026-003001', batchNo: 'FJB-2026-003', stationNo: 'FJZ-2025-001008', owner: '郑十',  agent: '芜湖清洁能源发展有限公司', firstAgent: '安徽大区代理商', engineer: '吴杰', checkDate: '2026-09-25', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'pending', rectifyStatus: 'none' },
  { id: 'fj009', sheetNo: 'FJD-2026-003002', batchNo: 'FJB-2026-003', stationNo: 'FJZ-2025-001012', owner: '卫四',  agent: '合肥绿色能源技术有限公司', firstAgent: '安徽大区代理商', engineer: '刘海', checkDate: '2026-09-25', crCount: 0, maCount: 2, miCount: 0, checkStatus: 'failed', rectifyStatus: 'rectifying' },
  { id: 'fj010', sheetNo: 'FJD-2026-004001', batchNo: 'FJB-2026-004', stationNo: 'FJZ-2025-001010', owner: '陈二',  agent: '苏州工业光伏集成商', firstAgent: '江苏大区代理商',     engineer: '赵飞', checkDate: '2026-10-08', crCount: 0, maCount: 0, miCount: 0, checkStatus: 'pending', rectifyStatus: 'none' },
])

watch(() => props.pendingUpdate, (update) => {
  if (!update) return
  const idx = MOCK_SHEETS.value.findIndex(s => s.id === update.id)
  if (idx !== -1) {
    MOCK_SHEETS.value[idx] = {
      ...MOCK_SHEETS.value[idx],
      checkStatus: update.checkStatus,
      crCount: update.crCount,
      maCount: update.maCount,
      miCount: update.miCount,
      rectifyStatus: update.checkStatus === 'failed' ? 'rectifying' : 'none',
    }
  }
  tableRef.value?.onSearch(1)
  emit('updateApplied')
}, { immediate: true })
</script>

<style scoped>
.fj-sheet-list-page { padding: 16px; }
.fj-main-card { background: #fff; border-radius: 8px; overflow: hidden; }
.fj-main-card :deep(.anfe-pro-table) { background: transparent !important; border-radius: 0 !important; box-shadow: none !important; }
.fj-status-dot-wrap { display: inline-flex; align-items: center; gap: 6px; }
.fj-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.fj-dot--pending { background: #fa8c16; }
.fj-dot--passed { background: #52c41a; }
.fj-dot--failed { background: #ff4d4f; }
.defect-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 5px; border-radius: 3px; margin-right: 4px; }
.defect-badge.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge.mi { background: rgba(250,219,20,0.15); color: #d48806; }
</style>
