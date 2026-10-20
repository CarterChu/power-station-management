<template>
  <div class="reconcile-detail-page">
    <!-- 顶部操作行 -->
    <div class="top-actions">
      <a-button @click="handleBack">
        <template #icon><ArrowLeftOutlined /></template>
        返回对账单列表
      </a-button>
      <a-button @click="handleDownloadPdf">
        <template #icon><DownloadOutlined /></template>
        下载PDF
      </a-button>
    </div>

    <!-- 蓝色头部信息卡 -->
    <div class="header-card">
      <div class="header-left">
        <div class="header-title-row">
          <span class="reconcile-no">{{ reconcileNo }}</span>
          <a-tag :color="STATUS_COLOR[currentStatus]" style="margin-left:12px">{{ currentStatus }}</a-tag>
        </div>
        <div class="header-sub">{{ row?.year ?? '2026' }}年{{ row?.month ?? '09' }}月 对账单</div>
        <div class="header-info-grid">
          <div class="info-item">
            <span class="info-key">结算对象类型：</span>
            <span class="info-val">{{ row?.settleObjType ?? '代理商' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">经营方：</span>
            <span class="info-val">{{ row?.settleObj ?? '华东新能源科技有限公司' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">EPC：</span>
            <span class="info-val">正泰安能数字能源</span>
          </div>
          <div class="info-item">
            <span class="info-key">实际付款主体：</span>
            <span class="info-val">正泰安能数字能源（浙江）股份有限公司</span>
          </div>
          <div class="info-item">
            <span class="info-key">代理账号：</span>
            <span class="info-val">DL20260062</span>
          </div>
        </div>
      </div>
      <div class="header-amounts">
        <div class="amount-box">
          <div class="amount-label">应开票金额</div>
          <div class="amount-val">¥892,300.00</div>
        </div>
        <div class="amount-box">
          <div class="amount-label">应付 6%</div>
          <div class="amount-val">¥245,000.00</div>
        </div>
        <div class="amount-box">
          <div class="amount-label">应付 9%</div>
          <div class="amount-val">¥312,800.00</div>
        </div>
        <div class="amount-box">
          <div class="amount-label">应付 13%</div>
          <div class="amount-val">¥334,500.00</div>
        </div>
        <div class="amount-box amount-box--primary">
          <div class="amount-label">应付金额</div>
          <div class="amount-val">¥845,000.00</div>
        </div>
      </div>
    </div>

    <!-- 账单明细 / 罚单明细 Tabs -->
    <div class="detail-card">
      <a-tabs v-model:activeKey="activeTab" size="middle">
        <a-tab-pane key="bills" :tab="`账单明细（${MOCK_BILLS.length}）`">
          <a-table
            :columns="billColumns"
            :data-source="MOCK_BILLS"
            :pagination="false"
            :scroll="{ x: 800 }"
            size="middle"
            row-key="billNo"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'billNo'">
                <a class="link-cell">{{ record.billNo }}</a>
              </template>
              <template v-else-if="column.key === 'billType'">
                <a-tag :color="BILL_TYPE_COLOR[record.billType] ?? 'default'" style="margin:0">{{ record.billType }}</a-tag>
              </template>
              <template v-else-if="column.key === 'payableAmt'">
                <span>¥{{ record.payableAmt }}</span>
              </template>
            </template>
            <template #summary>
              <a-table-summary-row>
                <a-table-summary-cell :index="0" :col-span="4">
                  <strong>合计（{{ MOCK_BILLS.length }} 条）</strong>
                </a-table-summary-cell>
                <a-table-summary-cell :index="4">
                  <strong>¥{{ billTotal }}</strong>
                </a-table-summary-cell>
              </a-table-summary-row>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="penalties" :tab="`罚单明细（${MOCK_PENALTIES.length}）`">
          <a-table
            :columns="penaltyColumns"
            :data-source="MOCK_PENALTIES"
            :pagination="false"
            :scroll="{ x: 600 }"
            size="middle"
            row-key="penaltyNo"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'penaltyNo'">
                <a class="link-cell">{{ record.penaltyNo }}</a>
              </template>
              <template v-else-if="column.key === 'penaltyAmt'">
                <span style="color:#ff4d4f">¥{{ record.penaltyAmt }}</span>
              </template>
            </template>
            <template #summary>
              <a-table-summary-row>
                <a-table-summary-cell :index="0" :col-span="2">
                  <strong>合计（{{ MOCK_PENALTIES.length }} 条）</strong>
                </a-table-summary-cell>
                <a-table-summary-cell :index="2">
                  <strong style="color:#ff4d4f">¥{{ penaltyTotal }}</strong>
                </a-table-summary-cell>
              </a-table-summary-row>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 对账文件 -->
    <div class="section-card">
      <div class="section-title">
        <span>对账文件</span>
        <span class="section-count">共 2 个文件</span>
      </div>
      <div class="file-list">
        <div class="file-item" v-for="f in MOCK_FILES" :key="f.name">
          <div class="file-icon">
            <FileTextOutlined />
          </div>
          <div class="file-info">
            <div class="file-name">{{ f.name }}</div>
            <div class="file-meta">{{ f.size }} · {{ f.status }}</div>
          </div>
          <a-button type="link" size="small">预览</a-button>
          <a-button type="link" size="small">下载</a-button>
        </div>
      </div>
    </div>

    <!-- 操作日志 -->
    <div class="section-card">
      <div class="section-title">操作日志</div>
      <a-table
        :columns="logColumns"
        :data-source="MOCK_LOGS"
        :pagination="false"
        size="middle"
        row-key="id"
      />
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions" v-if="currentStatus !== '已确认'">
      <a-button v-if="currentStatus === '待代理商上传'" type="primary" @click="handleUploadConfirm">上传确认函</a-button>
      <a-button v-if="currentStatus === '待代理商确认'" type="primary" @click="handleSign">签署</a-button>
      <a-button v-if="currentStatus === '待代理商确认'" @click="handleReject">退回</a-button>
      <a-button v-if="currentStatus === '待安能审核'" type="primary" @click="handleAudit">审核</a-button>
      <a-button v-if="currentStatus === '退回安能确认'" type="primary" @click="handleResubmit">重新提交</a-button>
      <a-button v-if="currentStatus === '对账文件生成失败'" type="primary" @click="handleRegenerate">重新生成</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons-vue'

const props = defineProps<{ row?: any }>()
const emit = defineEmits<{ navigate: [payload: { target: string; row?: any }] }>()

const activeTab = ref('bills')

const reconcileNo = computed(() => props.row?.reconcileNo ?? 'DZD202609000002')
const currentStatus = computed(() => props.row?.status ?? '待代理商确认')

const STATUS_COLOR: Record<string, string> = {
  '待生成对账文件': 'default',
  '对账文件生成失败': 'error',
  '待代理商确认': 'processing',
  '已确认': 'success',
  '退回安能确认': 'warning',
  '待代理商上传': 'processing',
  '待安能审核': 'orange',
}

const BILL_TYPE_COLOR: Record<string, string> = {
  '超出范围': 'orange', '渠道服务费': 'blue', '旁路': 'cyan',
  '开发类费用': 'purple', '异常类费用': 'red',
}

// ── 账单明细 ──
const billColumns = [
  { title: '账单编号', dataIndex: 'billNo', key: 'billNo', width: 180 },
  { title: '电站编号', dataIndex: 'stationNo', key: 'stationNo', width: 160 },
  { title: '账单类型', dataIndex: 'billType', key: 'billType', width: 130 },
  { title: '账单创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
  { title: '应付金额', dataIndex: 'payableAmt', key: 'payableAmt', width: 130, align: 'right' as const },
]

const MOCK_BILLS = [
  { billNo:'ZD2026090-001-00', stationNo:'DC2026HZ299', billType:'超出范围', createTime:'2026-09-06 09:00', payableAmt:'66,720.00' },
  { billNo:'ZD2026090-002-00', stationNo:'DC2026YG207', billType:'渠道服务费', createTime:'2026-09-14 07', payableAmt:'29,315.00' },
  { billNo:'ZD2026090-003-00', stationNo:'DC2026BJ214', billType:'旁路', createTime:'2026-09-12 19:14', payableAmt:'61,200.00' },
  { billNo:'ZD2026090-004-00', stationNo:'DC2026NC221', billType:'渠道服务费', createTime:'2026-09-15 00:21', payableAmt:'9,792.00' },
  { billNo:'ZD2026090-005-00', stationNo:'DC2026WH228', billType:'开发类费用', createTime:'2026-09-18 05:23', payableAmt:'28,450.00' },
  { billNo:'ZD2026090-006-00', stationNo:'DC2026HZ235', billType:'超出范围', createTime:'2026-09-21 10:35', payableAmt:'67,528.00' },
  { billNo:'ZD2026090-007-00', stationNo:'DC2026YG242', billType:'渠道服务费', createTime:'2026-09-24 16:42', payableAmt:'20,540.00' },
  { billNo:'ZD2026090-008-00', stationNo:'DC2026BJ249', billType:'旁路', createTime:'2026-09-27 20:49', payableAmt:'52,400.00' },
  { billNo:'ZD2026090-009-00', stationNo:'DC2026NC256', billType:'渠道服务费', createTime:'2026-09-03 03:56', payableAmt:'8,912.00' },
  { billNo:'ZD2026090-010-00', stationNo:'DC2026WH263', billType:'超出范围', createTime:'2026-09-06 06:03', payableAmt:'28,825.00' },
  { billNo:'ZD2026090-011-00', stationNo:'DC2026HZ270', billType:'超出范围', createTime:'2026-09-09 19:10', payableAmt:'68,520.00' },
  { billNo:'ZD2026090-012-00', stationNo:'DC2026YG277', billType:'渠道服务费', createTime:'2026-09-12 16:17', payableAmt:'20,765.00' },
]

const billTotal = computed(() => {
  const sum = MOCK_BILLS.reduce((s, r) => s + parseFloat(r.payableAmt.replace(/,/g, '')), 0)
  return sum.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
})

// ── 罚单明细 ──
const penaltyColumns = [
  { title: '罚单编号', dataIndex: 'penaltyNo', key: 'penaltyNo', width: 180 },
  { title: '电站编号', dataIndex: 'stationNo', key: 'stationNo', width: 160 },
  { title: '罚款金额', dataIndex: 'penaltyAmt', key: 'penaltyAmt', width: 130, align: 'right' as const },
]

const MOCK_PENALTIES = [
  { penaltyNo:'FD2026090-001-00', stationNo:'DC2026HZ160', penaltyAmt:'6,108.00' },
  { penaltyNo:'FD2026090-002-00', stationNo:'DC2026YG159', penaltyAmt:'9,216.00' },
  { penaltyNo:'FD2026090-003-00', stationNo:'DC2026BJ168', penaltyAmt:'12,324.00' },
]

const penaltyTotal = computed(() => {
  const sum = MOCK_PENALTIES.reduce((s, r) => s + parseFloat(r.penaltyAmt.replace(/,/g, '')), 0)
  return sum.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
})

// ── 对账文件 ──
const MOCK_FILES = [
  { name: `对账单-${reconcileNo.value}-待签名版.pdf`, size: '1.2MB', status: '待签名' },
  { name: `对账单-${reconcileNo.value}-已签名版.pdf`, size: '606KB', status: '已签名' },
]

// ── 操作日志 ──
const logColumns = [
  { title: '动作', dataIndex: 'action', key: 'action', width: 180 },
  { title: '日志文案', dataIndex: 'log', key: 'log' },
]

const MOCK_LOGS = [
  { id:1, action:'对账单导入',      log:'对账单导入完成  操作人：系统管理员  操作时间：2026-09-22 21:39:35' },
  { id:2, action:'对账单生成完成',   log:'对账单已生成  操作人：系统管理员  操作时间：2026-09-22 21:39:35' },
  { id:3, action:'对账单文件生成成功', log:'对账单文件生成成功  操作人：系统管理员  操作时间：2026-09-22 21:39:35' },
  { id:4, action:'上传确认单',      log:'对账单上传确认单完成  操作人：张三  操作时间：2026-09-22 21:39:35' },
  { id:5, action:'对账单已签署',     log:'对账单代理商已签署  操作人：李四  操作时间：2026-09-23 09:12:05' },
]

function handleBack() { emit('navigate', { target: 'agent-reconcile-list' }) }
function handleDownloadPdf() { message.info('正在生成PDF，请稍候') }
function handleUploadConfirm() { message.info('上传确认函') }
function handleSign() { message.info('发起签署流程') }
function handleReject() { message.info('退回对账单') }
function handleAudit() { message.info('审核对账单') }
function handleResubmit() { message.info('重新提交对账单') }
function handleRegenerate() { message.info('重新生成对账文件') }
</script>

<style scoped>
.reconcile-detail-page { padding: 16px; height: 100%; box-sizing: border-box; overflow: auto; display: flex; flex-direction: column; gap: 12px; }

.top-actions { display: flex; align-items: center; gap: 8px; }

.header-card {
  background: linear-gradient(135deg, #1677ff 0%, #0050b3 100%);
  border-radius: 8px; padding: 20px 24px;
  display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap;
  color: #fff;
}
.header-left { flex: 1; min-width: 280px; }
.header-title-row { display: flex; align-items: center; margin-bottom: 4px; }
.reconcile-no { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
.header-sub { font-size: 13px; opacity: 0.8; margin-bottom: 12px; }
.header-info-grid { display: flex; flex-wrap: wrap; gap: 6px 24px; }
.info-item { font-size: 13px; white-space: nowrap; }
.info-key { opacity: 0.7; }
.info-val { font-weight: 500; }

.header-amounts { display: flex; gap: 8px; flex-wrap: wrap; align-self: center; }
.amount-box {
  background: rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 14px;
  min-width: 110px; text-align: center;
}
.amount-box--primary { background: rgba(255,255,255,0.28); }
.amount-label { font-size: 12px; opacity: 0.8; margin-bottom: 4px; }
.amount-val { font-size: 16px; font-weight: 700; }

.detail-card { background: #fff; border-radius: 8px; padding: 0 16px 16px; }

.section-card { background: #fff; border-radius: 8px; padding: 16px 20px; }
.section-title { font-size: 14px; font-weight: 600; color: rgba(0,0,0,0.88); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.section-count { font-size: 12px; color: rgba(0,0,0,0.45); font-weight: 400; }

.file-list { display: flex; gap: 12px; flex-wrap: wrap; }
.file-item {
  display: flex; align-items: center; gap: 10px;
  border: 1px solid #f0f0f0; border-radius: 8px; padding: 10px 12px;
  min-width: 280px; background: #fafafa;
}
.file-icon { font-size: 24px; color: #1677ff; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 13px; color: rgba(0,0,0,0.88); font-weight: 500; }
.file-meta { font-size: 11px; color: rgba(0,0,0,0.35); margin-top: 2px; }

.bottom-actions {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border-radius: 8px; padding: 12px 20px;
  position: sticky; bottom: 0; border-top: 1px solid #f0f0f0;
}

.link-cell { color: #1677ff; cursor: pointer; }
.link-cell:hover { text-decoration: underline; }
</style>
