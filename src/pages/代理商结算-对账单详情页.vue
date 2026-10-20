<template>
  <div class="reconcile-detail-page">
    <!-- 顶部蓝色 header -->
    <div class="detail-header">
      <div class="header-main">
        <a-button type="text" class="back-btn" @click="emit('navigate', 'agent-reconcile-list')">
          <template #icon><LeftOutlined /></template>
          返回列表
        </a-button>
        <div class="header-info">
          <div class="bill-no">{{ detail.billNo }}</div>
          <a-tag :color="statusTagColor(detail.status)">{{ detail.status }}</a-tag>
        </div>
        <div class="header-meta">
          <span>代理商：{{ detail.agentName }}</span>
          <span class="sep">·</span>
          <span>结算周期：{{ detail.period }}</span>
          <span class="sep">·</span>
          <span>应结金额：<strong>¥ {{ detail.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }} 万元</strong></span>
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="detail-body">
      <a-tabs v-model:activeKey="activeTab" class="detail-tabs">
        <!-- Tab1: 对账明细 -->
        <a-tab-pane key="bills" tab="对账明细">
          <div class="tab-content">
            <div class="section-toolbar">
              <a-input v-model:value="billSearch" placeholder="搜索账单号/电站名" style="width:220px" allow-clear />
              <a-button type="primary" size="small" @click="billSearch = ''">重置</a-button>
              <a-button size="small" @click="handleExportBills">
                <template #icon><DownloadOutlined /></template>
                导出明细
              </a-button>
            </div>
            <a-table
              :data-source="filteredBills"
              :columns="billColumns"
              :pagination="{ pageSize: 10, size: 'small', showTotal: t => `共 ${t} 条` }"
              row-key="id"
              size="small"
              :scroll="{ x: 1000 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'amount'">
                  <span :class="{ 'neg': record.amount < 0 }">{{ record.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</span>
                </template>
                <template v-else-if="column.key === 'billType'">
                  <a-tag :color="record.billType === '正数' ? 'blue' : 'orange'" size="small">{{ record.billType }}</a-tag>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <!-- Tab2: 抵扣台账 -->
        <a-tab-pane key="deduct" tab="抵扣台账">
          <div class="tab-content">
            <a-table
              :data-source="MOCK_DEDUCTS"
              :columns="deductColumns"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'amount'">
                  <span class="neg">-{{ record.amount.toFixed(2) }}</span>
                </template>
              </template>
              <template #summary>
                <a-table-summary-row>
                  <a-table-summary-cell :index="0" :col-span="3"><strong>抵扣合计</strong></a-table-summary-cell>
                  <a-table-summary-cell :index="3" align="right">
                    <span class="neg"><strong>-{{ MOCK_DEDUCTS.reduce((s, r) => s + r.amount, 0).toFixed(2) }}</strong></span>
                  </a-table-summary-cell>
                  <a-table-summary-cell :index="4" :col-span="2"></a-table-summary-cell>
                </a-table-summary-row>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <!-- Tab3: 对账文件 -->
        <a-tab-pane key="files" tab="对账文件">
          <div class="tab-content">
            <div v-if="detail.status === '待生成对账文件'" class="empty-hint">
              <FileOutlined style="font-size:40px;color:#d9d9d9" />
              <div>对账文件生成中，请稍候…</div>
            </div>
            <div v-else class="file-list">
              <div v-for="f in MOCK_FILES" :key="f.id" class="file-item">
                <div class="file-icon">
                  <FileExcelOutlined v-if="f.type === 'excel'" style="color:#52c41a;font-size:24px" />
                  <FilePdfOutlined v-else style="color:#ff4d4f;font-size:24px" />
                </div>
                <div class="file-info">
                  <div class="file-name">{{ f.name }}</div>
                  <div class="file-meta">{{ f.size }} · {{ f.uploadedAt }}</div>
                </div>
                <a-button type="link" size="small" @click="handleDownload(f)">下载</a-button>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- Tab4: 操作日志 -->
        <a-tab-pane key="logs" tab="操作日志">
          <div class="tab-content">
            <a-timeline>
              <a-timeline-item v-for="log in MOCK_LOGS" :key="log.id" :color="log.color">
                <div class="log-item">
                  <div class="log-action">{{ log.action }}</div>
                  <div class="log-meta">{{ log.operator }} · {{ log.time }}</div>
                  <div v-if="log.remark" class="log-remark">{{ log.remark }}</div>
                </div>
              </a-timeline-item>
            </a-timeline>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="hasBottomActions" class="detail-footer">
      <div class="footer-info">
        <span>账单共 {{ MOCK_BILLS.length }} 条</span>
        <span class="sep">·</span>
        <span>应结金额 <strong>¥{{ detail.amount.toFixed(2) }} 万元</strong></span>
        <span class="sep">·</span>
        <span>抵扣 <strong class="neg">-¥{{ MOCK_DEDUCTS.reduce((s, r) => s + r.amount, 0).toFixed(2) }} 万元</strong></span>
        <span class="sep">·</span>
        <span>实结 <strong>¥{{ (detail.amount - MOCK_DEDUCTS.reduce((s, r) => s + r.amount, 0)).toFixed(2) }} 万元</strong></span>
      </div>
      <div class="footer-actions">
        <!-- 签署：待代理商确认 AND 结算对象=代理商 -->
        <a-button
          v-if="detail.status === '待代理商确认'"
          type="primary"
          @click="handleSign"
        >签署确认</a-button>
        <!-- 退回：待代理商确认 -->
        <a-button
          v-if="detail.status === '待代理商确认'"
          danger
          @click="showReturnModal = true"
        >退回</a-button>
        <!-- 上传确认函：待代理商上传 -->
        <a-button
          v-if="detail.status === '待代理商上传'"
          type="primary"
          @click="showUploadModal = true"
        >上传确认函</a-button>
        <!-- 审核：待安能审核 -->
        <a-button
          v-if="detail.status === '待安能审核'"
          type="primary"
          @click="handleAudit"
        >审核通过</a-button>
        <!-- 重新提交：退回安能确认 -->
        <a-button
          v-if="detail.status === '退回安能确认'"
          type="primary"
          @click="showResubmitModal = true"
        >重新提交</a-button>
        <!-- 重新生成：对账文件生成失败 -->
        <a-button
          v-if="detail.status === '对账文件生成失败'"
          @click="handleRegenerate"
        >重新生成</a-button>
      </div>
    </div>

    <!-- 退回弹窗 -->
    <a-modal v-model:open="showReturnModal" title="退回对账单" :width="480"
      @ok="confirmReturn" ok-text="确认退回" cancel-text="取消" ok-type="danger">
      <div style="margin-bottom:8px;font-size:13px;color:rgba(0,0,0,0.65)">请填写退回原因（必填）</div>
      <a-textarea v-model:value="returnRemark" placeholder="请输入退回原因" :rows="4" :maxlength="512" show-count />
    </a-modal>

    <!-- 重新提交弹窗 -->
    <a-modal v-model:open="showResubmitModal" title="重新提交" :width="480"
      @ok="confirmResubmit" ok-text="确认提交" cancel-text="取消">
      <div style="margin-bottom:8px;font-size:13px;color:rgba(0,0,0,0.65)">请填写补充说明（选填，最多 512 字）</div>
      <a-textarea v-model:value="resubmitRemark" placeholder="可填写本次重新提交的说明" :rows="4" :maxlength="512" show-count />
    </a-modal>

    <!-- 上传确认函弹窗 -->
    <a-modal v-model:open="showUploadModal" title="上传确认函" :width="520"
      @ok="confirmUpload" ok-text="确认上传" cancel-text="取消">
      <a-upload-dragger v-model:file-list="uploadFiles" name="file"
        accept=".pdf,.jpg,.jpeg,.png" :multiple="false" :before-upload="() => false">
        <p class="ant-upload-drag-icon"><InboxOutlined /></p>
        <p class="ant-upload-text">点击或拖拽上传确认函</p>
        <p class="ant-upload-hint">支持 PDF / JPG / PNG，不超过 10MB</p>
      </a-upload-dragger>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  LeftOutlined, DownloadOutlined,
  FileOutlined, FileExcelOutlined, FilePdfOutlined,
  InboxOutlined,
} from '@ant-design/icons-vue'

const emit = defineEmits<{
  (e: 'navigate', target: string, payload?: Record<string, any>): void
}>()

const props = defineProps<{
  row?: Record<string, any> | null
}>()

const activeTab = ref('bills')
const billSearch = ref('')
const showReturnModal = ref(false)
const showResubmitModal = ref(false)
const showUploadModal = ref(false)
const returnRemark = ref('')
const resubmitRemark = ref('')
const uploadFiles = ref<any[]>([])

// 从父页面传入的行数据，或使用默认mock
const detail = computed(() => {
  if (props.row) return {
    billNo: props.row.billNo ?? 'DZ2026090001',
    agentName: props.row.agentName ?? '华东新能源科技有限公司',
    period: props.row.period ?? '2026年9月',
    amount: props.row.amount ?? 161.90,
    status: props.row.status ?? '待代理商确认',
  }
  return {
    billNo: 'DZ2026090001',
    agentName: '华东新能源科技有限公司',
    period: '2026年9月',
    amount: 161.90,
    status: '待代理商确认',
  }
})

const hasBottomActions = computed(() => {
  const s = detail.value.status
  return ['待代理商确认','待代理商上传','待安能审核','退回安能确认','对账文件生成失败'].includes(s)
})

function statusTagColor(status: string) {
  const map: Record<string, string> = {
    '待生成对账文件': 'default', '对账文件生成失败': 'error',
    '待代理商确认': 'processing', '已确认': 'success',
    '退回安能确认': 'warning', '待代理商上传': 'blue', '待安能审核': 'purple',
  }
  return map[status] ?? 'default'
}

interface BillRow { id: number; billNo: string; stationName: string; billType: string; amount: number; period: string; remark: string }
const MOCK_BILLS: BillRow[] = [
  { id: 1, billNo: 'BD202609000101', stationName: '江苏省徐州市铜山区光伏电站', billType: '正数', amount: 8.52, period: '2026年9月', remark: '' },
  { id: 2, billNo: 'BD202609000102', stationName: '安徽省合肥市庐阳区分布式电站', billType: '正数', amount: 12.38, period: '2026年9月', remark: '' },
  { id: 3, billNo: 'BD202609000103', stationName: '浙江省杭州市余杭区光伏电站', billType: '负数', amount: -3.21, period: '2026年9月', remark: '退货抵扣' },
  { id: 4, billNo: 'BD202609000104', stationName: '上海市松江区工商业屋顶电站', billType: '正数', amount: 24.60, period: '2026年9月', remark: '' },
  { id: 5, billNo: 'BD202609000105', stationName: '江苏省苏州市吴江区光伏电站', billType: '正数', amount: 16.80, period: '2026年9月', remark: '' },
  { id: 6, billNo: 'BD202609000106', stationName: '安徽省芜湖市鸠江区电站', billType: '负数', amount: -5.40, period: '2026年9月', remark: '质量问题退款' },
]
const billColumns = [
  { title: '账单号', dataIndex: 'billNo', key: 'billNo', width: 180 },
  { title: '电站名称', dataIndex: 'stationName', key: 'stationName', width: 220 },
  { title: '账单类型', key: 'billType', width: 90, align: 'center' },
  { title: '结算金额（万元）', key: 'amount', dataIndex: 'amount', width: 150, align: 'right' },
  { title: '结算周期', dataIndex: 'period', key: 'period', width: 110 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
]
const filteredBills = computed(() => {
  if (!billSearch.value) return MOCK_BILLS
  return MOCK_BILLS.filter(b => b.billNo.includes(billSearch.value) || b.stationName.includes(billSearch.value))
})

interface DeductRow { id: number; type: string; desc: string; amount: number; basis: string; date: string }
const MOCK_DEDUCTS: DeductRow[] = [
  { id: 1, type: '超期未并网抵扣', desc: '徐州项目超期 45 天', amount: 8.50, basis: '合同第12条', date: '2026-09-30' },
  { id: 2, type: '光伏贷逾期抵扣', desc: '2 笔光伏贷逾期', amount: 5.20, basis: '贷款协议附件', date: '2026-09-30' },
  { id: 3, type: '市场罚单抵扣', desc: '违规展示物料', amount: 2.40, basis: '市场管理办法', date: '2026-09-28' },
  { id: 4, type: '负数结算单抵扣', desc: '退货对应负数账单', amount: 5.50, basis: '退货确认单', date: '2026-09-25' },
]
const deductColumns = [
  { title: '抵扣类型', dataIndex: 'type', key: 'type', width: 160 },
  { title: '说明', dataIndex: 'desc', key: 'desc' },
  { title: '依据', dataIndex: 'basis', key: 'basis', width: 140 },
  { title: '抵扣金额（万元）', key: 'amount', dataIndex: 'amount', width: 150, align: 'right' },
  { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
]

interface FileItem { id: number; name: string; type: string; size: string; uploadedAt: string }
const MOCK_FILES: FileItem[] = [
  { id: 1, name: '对账单_DZ2026090001_正式版.xlsx', type: 'excel', size: '248 KB', uploadedAt: '2026-10-10 14:32' },
  { id: 2, name: '对账单_DZ2026090001_明细说明.pdf', type: 'pdf', size: '1.2 MB', uploadedAt: '2026-10-10 14:33' },
]

const MOCK_LOGS = [
  { id: 1, action: '系统自动生成对账单', operator: '系统', time: '2026-10-08 09:00', remark: '', color: 'gray' },
  { id: 2, action: '对账文件生成完成', operator: '系统', time: '2026-10-10 14:32', remark: '', color: 'green' },
  { id: 3, action: '已发送至代理商确认', operator: '王芳（财务）', time: '2026-10-10 15:00', remark: '', color: 'blue' },
]

function handleExportBills() { message.info('导出明细功能待接入') }
function handleDownload(f: FileItem) { message.info(`正在下载：${f.name}`) }
function handleSign() { message.success('签署成功') }
function handleAudit() { message.success('审核通过') }
function handleRegenerate() {
  message.loading({ content: '正在重新生成对账文件…', key: 'regen', duration: 2 })
  setTimeout(() => message.success({ content: '已提交重新生成请求', key: 'regen' }), 2000)
}
function confirmReturn() {
  if (!returnRemark.value.trim()) { message.error('请填写退回原因'); return }
  message.success('已退回')
  showReturnModal.value = false
}
function confirmResubmit() {
  message.success('已重新提交')
  showResubmitModal.value = false
}
function confirmUpload() {
  if (uploadFiles.value.length === 0) { message.error('请先选择文件'); return }
  message.success('确认函上传成功')
  showUploadModal.value = false
}
</script>

<style scoped>
.reconcile-detail-page {
  display: flex; flex-direction: column; height: 100%;
  background: #f5f5f5; overflow: hidden;
}

/* header */
.detail-header {
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  padding: 16px 24px; flex-shrink: 0;
}
.back-btn { color: rgba(255,255,255,0.8) !important; padding: 0; margin-bottom: 8px; }
.back-btn:hover { color: #fff !important; }
.header-info { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.bill-no { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: .5px; }
.header-meta { font-size: 13px; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 8px; }
.header-meta strong { color: #fff; }
.sep { opacity: 0.4; }

/* body */
.detail-body { flex: 1; overflow: auto; padding: 12px; }
.detail-tabs { background: #fff; border-radius: 8px; }
:deep(.ant-tabs-nav) { margin: 0 !important; padding: 0 16px; }
.tab-content { padding: 16px; }

.section-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }

.neg { color: #cf1322; }

.empty-hint {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px; gap: 12px; color: rgba(0,0,0,0.35);
}

/* 文件列表 */
.file-list { display: flex; flex-direction: column; gap: 8px; }
.file-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; border: 1px solid #f0f0f0; border-radius: 8px; background: #fafafa;
}
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 13px; color: rgba(0,0,0,0.88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-meta { font-size: 12px; color: rgba(0,0,0,0.35); margin-top: 2px; }

/* 操作日志 */
.log-item { display: flex; flex-direction: column; gap: 2px; padding-bottom: 4px; }
.log-action { font-size: 13px; color: rgba(0,0,0,0.88); font-weight: 500; }
.log-meta { font-size: 12px; color: rgba(0,0,0,0.35); }
.log-remark { font-size: 12px; color: rgba(0,0,0,0.55); background: #f5f5f5; border-radius: 4px; padding: 4px 8px; margin-top: 2px; }

/* footer */
.detail-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; background: #fff; border-top: 1px solid #f0f0f0; flex-shrink: 0;
}
.footer-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(0,0,0,0.65); }
.footer-info strong { color: rgba(0,0,0,0.88); }
.footer-actions { display: flex; gap: 8px; }
</style>
