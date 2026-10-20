<template>
  <div class="reconcile-list-page">
    <div class="slist-main-card">
      <!-- 筛选 + 操作栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <a-select v-model:value="filterPeriod" style="width:160px" placeholder="结算周期">
            <a-select-option value="">全部周期</a-select-option>
            <a-select-option value="2026-09">2026年9月</a-select-option>
            <a-select-option value="2026-08">2026年8月</a-select-option>
            <a-select-option value="2026-07">2026年7月</a-select-option>
          </a-select>
          <a-input
            v-model:value="filterKeyword"
            placeholder="对账单号/代理商名称"
            style="width:220px"
            allow-clear
          />
          <a-select v-model:value="filterStatus" style="width:150px" placeholder="全部状态">
            <a-select-option value="">全部状态</a-select-option>
            <a-select-option v-for="s in STATUS_LIST" :key="s.value" :value="s.value">{{ s.label }}</a-select-option>
          </a-select>
          <a-button type="primary" @click="doQuery">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </div>
        <div class="toolbar-right">
          <a-button @click="showImportModal = true">
            <template #icon><UploadOutlined /></template>
            导入对账单
          </a-button>
          <a-button @click="handleExport">
            <template #icon><DownloadOutlined /></template>
            导出
          </a-button>
        </div>
      </div>

      <!-- 状态 Tab -->
      <div class="status-tabs">
        <div
          v-for="tab in STATUS_TABS"
          :key="tab.value"
          class="status-tab"
          :class="{ active: activeStatusTab === tab.value }"
          @click="activeStatusTab = tab.value"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </div>
      </div>

      <!-- 表格 -->
      <a-table
        :data-source="displayRows"
        :columns="tableColumns"
        :pagination="false"
        :scroll="{ x: 1200 }"
        row-key="id"
        size="middle"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'billNo'">
            <a-button type="link" size="small" style="padding:0" @click="emit('navigate', 'agent-reconcile-detail', { row: record })">
              {{ record.billNo }}
            </a-button>
          </template>
          <template v-else-if="column.key === 'agent'">
            <div class="agent-cell">
              <span class="agent-avatar" :style="{ background: record.color }">{{ record.agentName[0] }}</span>
              <div>
                <div class="agent-name">{{ record.agentName }}</div>
                <div class="agent-code">{{ record.agentCode }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span class="amount-val">{{ record.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusTagColor(record.status)">{{ record.status }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="action-btns">
              <!-- 查看：所有状态 -->
              <a-button type="link" size="small" @click="emit('navigate', 'agent-reconcile-detail', { row: record })">查看</a-button>
              <!-- 重新生成：对账文件生成失败 -->
              <a-button v-if="record.status === '对账文件生成失败'" type="link" size="small" @click="handleRegenerate(record)">重新生成</a-button>
              <!-- 退回 + 签署：待代理商确认 -->
              <template v-if="record.status === '待代理商确认'">
                <a-button type="link" size="small" danger @click="handleReturn(record)">退回</a-button>
                <a-button type="link" size="small" @click="handleSign(record)">签署</a-button>
              </template>
              <!-- 重新提交：退回安能确认 -->
              <a-button v-if="record.status === '退回安能确认'" type="link" size="small" @click="handleResubmit(record)">重新提交</a-button>
              <!-- 上传：待代理商上传 -->
              <a-button v-if="record.status === '待代理商上传'" type="link" size="small" @click="handleUpload(record)">上传</a-button>
              <!-- 审核：待安能审核 -->
              <a-button v-if="record.status === '待安能审核'" type="link" size="small" @click="handleAudit(record)">审核</a-button>
            </div>
          </template>
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

    <!-- 导入弹窗 -->
    <a-modal
      v-model:open="showImportModal"
      title="导入对账单"
      :width="520"
      @ok="handleImportConfirm"
      ok-text="确认导入"
      cancel-text="取消"
    >
      <div class="import-body">
        <div class="import-tip">
          <InfoCircleOutlined style="color:#1677ff;margin-right:6px" />
          请上传 Excel/CSV 格式的对账单文件，支持批量导入。
        </div>
        <a-upload-dragger
          v-model:file-list="importFiles"
          name="file"
          accept=".xlsx,.xls,.csv"
          :multiple="false"
          :before-upload="() => false"
        >
          <p class="ant-upload-drag-icon"><InboxOutlined /></p>
          <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p class="ant-upload-hint">支持 .xlsx / .xls / .csv 格式，单次上传不超过 20MB</p>
        </a-upload-dragger>
        <div v-if="importFiles.length > 0" style="margin-top:12px">
          <a-button type="link" size="small" href="#">下载导入模板</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 退回备注弹窗 -->
    <a-modal
      v-model:open="showReturnModal"
      title="退回对账单"
      :width="480"
      @ok="confirmReturn"
      ok-text="确认退回"
      cancel-text="取消"
      ok-type="danger"
    >
      <div style="margin-bottom:8px;font-size:13px;color:rgba(0,0,0,0.65)">请填写退回原因（必填）</div>
      <a-textarea
        v-model:value="returnRemark"
        placeholder="请输入退回原因"
        :rows="4"
        :maxlength="512"
        show-count
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  DownloadOutlined, UploadOutlined,
  InfoCircleOutlined, InboxOutlined,
} from '@ant-design/icons-vue'

const emit = defineEmits<{
  (e: 'navigate', target: string, payload?: Record<string, any>): void
}>()

const filterPeriod = ref('2026-09')
const filterKeyword = ref('')
const filterStatus = ref('')
const activeStatusTab = ref('')
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const showImportModal = ref(false)
const showReturnModal = ref(false)
const returnRemark = ref('')
const importFiles = ref<any[]>([])
const currentRow = ref<ReconcileListRow | null>(null)

const STATUS_LIST = [
  { value: '待生成对账文件', label: '待生成对账文件' },
  { value: '对账文件生成失败', label: '对账文件生成失败' },
  { value: '待代理商确认', label: '待代理商确认' },
  { value: '已确认', label: '已确认' },
  { value: '退回安能确认', label: '退回安能确认' },
  { value: '待代理商上传', label: '待代理商上传' },
  { value: '待安能审核', label: '待安能审核' },
]

interface StatusTab { value: string; label: string; count?: number }
const STATUS_TABS = computed((): StatusTab[] => [
  { value: '', label: '全部' },
  ...STATUS_LIST.map(s => ({
    ...s,
    count: (MOCK_DATA.filter(r => r.status === s.value).length || undefined) as number | undefined,
  })),
])

const tableColumns = [
  { title: '对账单号', key: 'billNo', dataIndex: 'billNo', fixed: 'left', width: 180 },
  { title: '代理商', key: 'agent', width: 220 },
  { title: '结算周期', dataIndex: 'period', key: 'period', width: 120 },
  { title: '账单条数', dataIndex: 'billCount', key: 'billCount', width: 90, align: 'right' },
  { title: '应结金额（万元）', key: 'amount', width: 155, align: 'right' },
  { title: '对账状态', key: 'status', width: 155 },
  { title: '最后更新', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
  { title: '操作', key: 'action', fixed: 'right', width: 180 },
]

interface ReconcileListRow {
  id: number; billNo: string; agentName: string; agentCode: string; color: string
  period: string; billCount: number; amount: number; status: string; updatedAt: string
}

const MOCK_DATA: ReconcileListRow[] = [
  { id: 1, billNo: 'DZ2026090001', agentName: '华东新能源科技有限公司', agentCode: 'DL20240001', color: '#1677ff', period: '2026年9月', billCount: 2341, amount: 161.90, status: '待代理商确认', updatedAt: '2026-10-10 14:32' },
  { id: 2, billNo: 'DZ2026090002', agentName: '阳光光伏服务有限公司', agentCode: 'DL20240023', color: '#fa8c16', period: '2026年9月', billCount: 1876, amount: 137.80, status: '已确认', updatedAt: '2026-10-11 09:15' },
  { id: 3, billNo: 'DZ2026090003', agentName: '北方绿能电力有限公司', agentCode: 'DL20240046', color: '#13c2c2', period: '2026年9月', billCount: 1540, amount: 110.60, status: '对账文件生成失败', updatedAt: '2026-10-09 16:48' },
  { id: 4, billNo: 'DZ2026090004', agentName: '江南新能科技发展有限公司', agentCode: 'DL20240087', color: '#722ed1', period: '2026年9月', billCount: 2105, amount: 175.50, status: '待安能审核', updatedAt: '2026-10-12 10:02' },
  { id: 5, billNo: 'DZ2026090005', agentName: '西部光能发展有限公司', agentCode: 'DL20240112', color: '#eb2f96', period: '2026年9月', billCount: 987, amount: 78.10, status: '退回安能确认', updatedAt: '2026-10-11 15:20' },
  { id: 6, billNo: 'DZ2026090006', agentName: '绿色新能源技术有限公司', agentCode: 'DL20240134', color: '#52c41a', period: '2026年9月', billCount: 1632, amount: 126.10, status: '待代理商上传', updatedAt: '2026-10-12 08:55' },
  { id: 7, billNo: 'DZ2026090007', agentName: '中原清洁电力有限公司', agentCode: 'DL20240156', color: '#faad14', period: '2026年9月', billCount: 843, amount: 67.50, status: '待生成对账文件', updatedAt: '2026-10-08 11:30' },
  { id: 8, billNo: 'DZ2026080001', agentName: '华东新能源科技有限公司', agentCode: 'DL20240001', color: '#1677ff', period: '2026年8月', billCount: 2189, amount: 158.40, status: '已确认', updatedAt: '2026-09-10 14:32' },
]

const filteredRows = computed(() => {
  return MOCK_DATA.filter(row => {
    if (filterPeriod.value && !row.period.includes(filterPeriod.value.slice(-2) + '月')) return false
    if (filterKeyword.value &&
      !row.billNo.includes(filterKeyword.value) &&
      !row.agentName.includes(filterKeyword.value)) return false
    const s = filterStatus.value || activeStatusTab.value
    if (s && row.status !== s) return false
    return true
  })
})

const displayRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function doQuery() { page.value = 1 }
function handleReset() {
  filterPeriod.value = ''; filterKeyword.value = ''; filterStatus.value = ''; activeStatusTab.value = ''; page.value = 1
}
function handleExport() { message.info('导出功能待接入') }

function statusTagColor(status: string) {
  const map: Record<string, string> = {
    '待生成对账文件': 'default',
    '对账文件生成失败': 'error',
    '待代理商确认': 'processing',
    '已确认': 'success',
    '退回安能确认': 'warning',
    '待代理商上传': 'blue',
    '待安能审核': 'purple',
  }
  return map[status] ?? 'default'
}

function handleRegenerate(row: ReconcileListRow) {
  message.loading({ content: `正在重新生成 ${row.billNo}...`, key: row.id, duration: 2 })
  setTimeout(() => message.success({ content: '已提交重新生成请求', key: row.id }), 2000)
}

function handleSign(row: ReconcileListRow) {
  message.info(`签署对账单 ${row.billNo}`)
}

function handleReturn(row: ReconcileListRow) {
  currentRow.value = row
  returnRemark.value = ''
  showReturnModal.value = true
}

function confirmReturn() {
  if (!returnRemark.value.trim()) {
    message.error('请填写退回原因')
    return
  }
  message.success('已退回对账单')
  showReturnModal.value = false
}

function handleResubmit(row: ReconcileListRow) {
  message.info(`重新提交对账单 ${row.billNo}`)
}

function handleUpload(row: ReconcileListRow) {
  message.info(`上传确认函：${row.billNo}`)
}

function handleAudit(row: ReconcileListRow) {
  message.info(`审核对账单：${row.billNo}`)
}

function handleImportConfirm() {
  if (importFiles.value.length === 0) {
    message.error('请先选择文件')
    return
  }
  message.success('导入任务已提交，请稍后刷新查看结果')
  showImportModal.value = false
  importFiles.value = []
}
</script>

<style scoped>
.reconcile-list-page { padding: 16px; height: 100%; box-sizing: border-box; overflow: auto; }
.slist-main-card { background: #fff; border-radius: 8px; }

.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #f0f0f0; gap: 8px;
}
.toolbar-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* 状态 Tab */
.status-tabs {
  display: flex; overflow-x: auto; padding: 0 16px;
  border-bottom: 1px solid #f0f0f0; gap: 0;
}
.status-tab {
  padding: 12px 16px; cursor: pointer; font-size: 13px; color: rgba(0,0,0,0.65);
  border-bottom: 2px solid transparent; white-space: nowrap; display: flex; align-items: center; gap: 4px;
  transition: all .12s;
}
.status-tab.active { color: #1677ff; border-bottom-color: #1677ff; font-weight: 500; }
.status-tab:hover:not(.active) { color: rgba(0,0,0,0.88); }
.tab-count {
  background: #ff4d4f; color: #fff; border-radius: 9999px;
  padding: 0 6px; font-size: 11px; min-width: 18px; text-align: center; line-height: 18px;
}
.status-tab.active .tab-count { background: #1677ff; }

.agent-cell { display: flex; align-items: center; gap: 8px; }
.agent-avatar {
  width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; font-size: 13px; font-weight: 600;
}
.agent-name { font-size: 13px; color: rgba(0,0,0,0.88); }
.agent-code { font-size: 11px; color: rgba(0,0,0,0.35); }
.amount-val { font-weight: 600; }

.action-btns { display: flex; align-items: center; gap: 0; flex-wrap: wrap; }
.action-btns :deep(.ant-btn-link) { padding: 0 4px; }

.table-footer {
  display: flex; justify-content: flex-end;
  padding: 12px 16px; border-top: 1px solid #f0f0f0;
}

.import-body { display: flex; flex-direction: column; gap: 12px; }
.import-tip {
  background: #e6f4ff; border: 1px solid #91caff; border-radius: 6px;
  padding: 8px 12px; font-size: 13px; display: flex; align-items: center;
}
</style>
