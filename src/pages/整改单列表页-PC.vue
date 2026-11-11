<template>
  <div class="fj-rectify-list-page">
    <div class="fj-main-card">
      <AnfeProTable
        ref="tableRef"
        table-key="fj-rectify-list-pc-v3"
        :columns="columns"
        :filters="filters"
        :config="tableConfig"
        :page-size="10"
        :table-props="{ scroll: { x: 2000 } }"
      >
        <!-- 缺陷统计 -->
        <template #defectSlot="{ row }">
          <span class="defect-badge cr">CR {{ row.crCount }}</span>
          <span class="defect-badge ma">MA {{ row.maCount }}</span>
          <span class="defect-badge mi">MI {{ row.miCount }}</span>
        </template>

        <!-- 整改状态 -->
        <template #statusSlot="{ row }">
          <a-tag v-if="row.status === 'pending'" color="warning" style="margin:0">待整改</a-tag>
          <a-tag v-else-if="row.status === 'reviewing'" color="processing" style="margin:0">待复验</a-tag>
          <a-tag v-else-if="row.status === 'passed'" color="success" style="margin:0">整改通过</a-tag>
        </template>

        <!-- 剩余天数（取所有缺陷中最大剩余天数） -->
        <template #remainDaysSlot="{ row }">
          <template v-if="row.status === 'passed'">
            <span style="color:#8c8c8c">—</span>
          </template>
          <template v-else>
            <span v-if="getMaxRemainDays(row) > 3" style="color:#262626">{{ getMaxRemainDays(row) }} 天</span>
            <span v-else-if="getMaxRemainDays(row) > 0" style="color:#fa8c16;font-weight:500">{{ getMaxRemainDays(row) }} 天</span>
            <span v-else style="color:#ff4d4f;font-weight:600">已逾期 {{ Math.abs(getMaxRemainDays(row)) }} 天</span>
          </template>
        </template>

        <!-- 操作 -->
        <template #actionSlot="{ row }">
          <a-space :size="0">
            <a-button
              v-if="APP_ONLY && row.status === 'pending'"
              type="link" size="small"
              @click="handleRectify(row)"
            >去整改</a-button>
            <a-button type="link" size="small" @click="handleDetail(row)">详情</a-button>
          </a-space>
        </template>
      </AnfeProTable>
    </div>

    <!-- 整改单详情 Drawer -->
    <a-drawer
      v-model:open="detailVisible"
      width="860"
      :body-style="{ padding: '16px 20px' }"
      destroy-on-close
    >
      <template v-if="currentRow" #title>
        <span style="margin-right:10px">整改详情 · {{ currentRow.rectifyNo }}</span>
        <a-tag v-if="currentRow.status === 'pending'" color="warning" style="margin:0">待整改</a-tag>
        <a-tag v-else-if="currentRow.status === 'reviewing'" color="processing" style="margin:0">待复验</a-tag>
        <a-tag v-else-if="currentRow.status === 'passed'" color="success" style="margin:0">整改通过</a-tag>
      </template>
      <template v-if="currentRow">
        <div class="rectify-detail-wrap">
          <!-- 基本信息 -->
          <div class="detail-section">
            <div class="section-title">基本信息</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">整改单号</div>
                <div class="info-value">{{ currentRow.rectifyNo }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">关联飞检单</div>
                <div class="info-value">{{ currentRow.sheetNo }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">关联电站</div>
                <div class="info-value">{{ currentRow.stationNo }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">业主姓名</div>
                <div class="info-value">{{ currentRow.owner || '—' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">一级代理商</div>
                <div class="info-value">{{ currentRow.firstAgent || '—' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">代理商</div>
                <div class="info-value">{{ currentRow.agent || '—' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">整改复验人</div>
                <div class="info-value info-value--action">
                  <span>{{ drawerRectifyEngineer || '—' }}</span>
                  <a-button v-if="['pending','reviewing'].includes(currentRow.status)" type="link" size="small" class="transfer-btn" @click="rectifyTransferVisible = true">转办</a-button>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">整改期限</div>
                <div class="info-value">{{ currentRow.deadline }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">剩余天数</div>
                <div class="info-value">
                  <span v-if="currentRow.remainDays > 3" style="color:#262626">{{ currentRow.remainDays }} 天</span>
                  <span v-else-if="currentRow.remainDays > 0" style="color:#fa8c16;font-weight:500">{{ currentRow.remainDays }} 天</span>
                  <span v-else style="color:#ff4d4f;font-weight:600">已逾期 {{ Math.abs(currentRow.remainDays) }} 天</span>
                </div>
              </div>
              <div class="info-item info-item--span2">
                <div class="info-label">项目地址</div>
                <div class="info-value">{{ currentRow.address || '—' }}</div>
              </div>
            </div>
          </div>

          <!-- 不合格项 -->
          <div class="detail-section">
            <div class="section-title">整改项（{{ currentRow.defects?.length ?? 0 }} 项）</div>
            <div v-for="(defect, i) in currentRow.defects" :key="i" class="defect-item-card">
              <div class="defect-item-head">
                <span class="defect-badge-small" :class="defect.level">{{ defect.level?.toUpperCase() }}</span>
                <span class="defect-item-name">{{ defect.checkName }}</span>
                <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
                  <span class="defect-deadline-tag">{{ defect.deadlineDays }} 天限</span>
                  <template v-if="currentRow.status !== 'passed'">
                    <span v-if="getDefectRemainDays(defect, currentRow) > 3" class="defect-remain" style="color:#8c8c8c">剩 {{ getDefectRemainDays(defect, currentRow) }} 天</span>
                    <span v-else-if="getDefectRemainDays(defect, currentRow) > 0" class="defect-remain" style="color:#fa8c16;font-weight:500">剩 {{ getDefectRemainDays(defect, currentRow) }} 天</span>
                    <span v-else class="defect-remain" style="color:#ff4d4f;font-weight:600">逾期 {{ Math.abs(getDefectRemainDays(defect, currentRow)) }} 天</span>
                  </template>
                </div>
              </div>
              <div class="defect-row">
                <div class="defect-meta">
                  <span class="defect-meta-label">缺陷分类</span>
                  <span class="defect-meta-value">{{ defect.defectCategory || '—' }}</span>
                </div>
                <div class="defect-meta">
                  <span class="defect-meta-label">缺陷原因</span>
                  <span class="defect-meta-value">{{ defect.reason }}</span>
                </div>
                <div class="defect-meta defect-meta--photos">
                  <span class="defect-meta-label">缺陷图片</span>
                  <a-image-preview-group v-if="defect.defectPhotos?.length">
                    <div class="defect-photos">
                      <span
                        v-for="(photo, photoIndex) in defect.defectPhotos"
                        :key="photoIndex"
                        class="defect-photo-thumb"
                      >
                        <a-image :src="photo" :width="64" :height="64" />
                      </span>
                    </div>
                  </a-image-preview-group>
                  <span v-else class="defect-meta-value is-empty">—</span>
                </div>
                <template v-if="getDefectRounds(defect, currentRow).length">
                  <div class="defect-divider"></div>
                  <div
                    v-for="round in getDefectRounds(defect, currentRow)"
                    :key="round.round"
                    class="defect-round-block"
                    :class="{ 'is-current': isCurrentDefectRound(defect, round, currentRow), 'is-single': !hasMultipleDefectRounds(defect, currentRow) }"
                  >
                    <div v-if="hasMultipleDefectRounds(defect, currentRow)" class="defect-round-head">
                      <span>第 {{ round.round }} 轮整改</span>
                      <a-tag :color="getRoundStatusColor(round.reviewStatus)" style="margin:0">{{ getRoundStatusLabel(round.reviewStatus) }}</a-tag>
                      <span v-if="round.submitTime" class="defect-round-time">{{ round.submitTime }}</span>
                    </div>
                    <div v-else class="defect-round-head">
                      <span>整改</span>
                    </div>
                    <div class="defect-meta">
                      <span class="defect-meta-label">整改内容</span>
                      <span class="defect-meta-value" :class="{ 'is-empty': !round.rectifyContent }">{{ round.rectifyContent ?? '未填写' }}</span>
                    </div>
                    <div class="defect-meta defect-meta--photos">
                      <span class="defect-meta-label">整改图片</span>
                      <a-image-preview-group v-if="getRectifyPhotos(round).length">
                        <div class="defect-photos">
                          <span
                            v-for="(photo, photoIndex) in getRectifyPhotos(round)"
                            :key="photoIndex"
                            class="defect-photo-thumb"
                          >
                            <a-image :src="photo" :width="64" :height="64" />
                          </span>
                        </div>
                      </a-image-preview-group>
                      <span v-else class="defect-meta-value is-empty">—</span>
                    </div>
                    <div v-if="round.reviewStatus !== 'pending'" class="defect-divider"></div>
                    <div v-if="round.reviewStatus !== 'pending'" class="defect-round-review">
                      <span>{{ hasMultipleDefectRounds(defect, currentRow) ? `第 ${round.round} 轮复验` : '复验' }}</span>
                      <a-tag :color="getRoundStatusColor(round.reviewStatus)" style="margin:0">{{ getRoundStatusLabel(round.reviewStatus) }}</a-tag>
                      <span v-if="round.reviewTime" class="defect-round-time">{{ round.reviewTime }}</span>
                    </div>
                    <template v-if="!['pending', 'reviewing'].includes(round.reviewStatus)">
                      <div class="defect-meta">
                        <span class="defect-meta-label">缺陷分类</span>
                        <span class="defect-meta-value">{{ defect.defectCategory || '—' }}</span>
                      </div>
                      <div class="defect-meta">
                        <span class="defect-meta-label">缺陷原因</span>
                        <span class="defect-meta-value">{{ defect.reason }}</span>
                      </div>
                      <div class="defect-meta defect-meta--photos">
                        <span class="defect-meta-label">缺陷图片</span>
                        <a-image-preview-group v-if="defect.defectPhotos?.length">
                          <div class="defect-photos">
                            <span
                              v-for="(photo, photoIndex) in defect.defectPhotos"
                              :key="photoIndex"
                              class="defect-photo-thumb"
                            >
                              <a-image :src="photo" :width="64" :height="64" />
                            </span>
                          </div>
                        </a-image-preview-group>
                        <span v-else class="defect-meta-value is-empty">—</span>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </a-drawer>

  <!-- 整改复验人转办弹窗 -->
  <a-modal
    v-model:open="rectifyTransferVisible"
    title="转办整改复验人"
    ok-text="确认转办"
    cancel-text="取消"
    :ok-button-props="{ disabled: !rectifyTransferTarget }"
    width="400px"
    @ok="handleRectifyTransferConfirm"
    @cancel="rectifyTransferTarget = ''"
  >
    <div style="padding:8px 0 4px">
      <a-select
        v-model:value="rectifyTransferTarget"
        show-search
        placeholder="搜索被转办人姓名"
        style="width:100%"
        :options="ENGINEER_OPTIONS"
        :filter-option="(input: string, opt: any) => opt.label.includes(input)"
      />
    </div>
  </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { AnfeProTable } from '@anfe/vue-pro-components'

// APP 端功能，PC 暂不展示；需要演示时改为 true
const APP_ONLY = false

const emit = defineEmits<{ navigate: [target: string, payload?: any] }>()

const tableRef = ref<any>(null)
const detailVisible = ref(false)
const currentRow = ref<any>(null)

const columns: any[] = [
  { title: '整改单号', dataIndex: 'rectifyNo', key: 'rectifyNo', width: 170, fixed: 'left' as const, ellipsis: true },
  { title: '关联飞检单', dataIndex: 'sheetNo', key: 'sheetNo', width: 170, ellipsis: true },
  { title: '关联电站', dataIndex: 'stationNo', key: 'stationNo', width: 160, ellipsis: true },
  { title: '业主姓名', dataIndex: 'owner', key: 'owner', width: 100 },
  { title: '项目地址', dataIndex: 'address', key: 'address', width: 200, ellipsis: true },
  { title: '一级代理商', dataIndex: 'firstAgent', key: 'firstAgent', width: 140, ellipsis: true },
  { title: '代理商', dataIndex: 'agent', key: 'agent', width: 180, ellipsis: true },
  { title: '整改复验人', dataIndex: 'rectifyEngineer', key: 'rectifyEngineer', width: 110 },
  { title: '缺陷统计', key: 'defects', width: 160, component: 'custom', slotName: 'defectSlot' },
  { title: '整改期限', dataIndex: 'deadline', key: 'deadline', width: 130 },
  { title: '整改状态', key: 'status', width: 110, component: 'custom', slotName: 'statusSlot' },
  { title: '剩余天数', key: 'remainDays', width: 110, component: 'custom', slotName: 'remainDaysSlot' },
  { title: '操作', key: 'action', fixed: 'right' as const, width: 80, component: 'custom', slotName: 'actionSlot' },
]

const filters = [
  { label: '整改单号', key: 'rectifyNo', component: 'input', placeholder: '请输入整改单号' },
  { label: '关联飞检单', key: 'sheetNo', component: 'input', placeholder: '请输入飞检单号' },
  { label: '关联电站', key: 'stationNo', component: 'input', placeholder: '请输入电站编号' },
  { label: '一级代理商', key: 'firstAgent', component: 'input', placeholder: '请输入一级代理商' },
  { label: '整改期限', key: 'deadlineRange', component: 'rangePicker', placeholder: ['开始日期', '结束日期'] },
  { label: '整改状态', key: 'status', component: 'select', placeholder: '请选择',
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: '待整改', value: 'pending' },
      { label: '待复验', value: 'reviewing' },
      { label: '整改通过', value: 'passed' },
    ]},
]

const RECTIFY_STATUS_ORDER: Record<string, number> = { pending: 0, reviewing: 1, passed: 2 }

function getRowRoundCount(row: any) {
  return Math.max(1, ...(row.defects ?? []).map((defect: any) => defect.rounds?.length ?? 1))
}

const tableConfig = {
  rowKey: 'id',
  searchOnLoad: true,
  request: async (params: Record<string, any>) => {
    const { params: fp = {}, pageIndex, pageRows } = params
    await new Promise(r => setTimeout(r, 200))
    let list = [...MOCK_RECTIFY]
    if (fp.rectifyNo) list = list.filter(r => r.rectifyNo.includes(fp.rectifyNo))
    if (fp.sheetNo) list = list.filter(r => r.sheetNo.includes(fp.sheetNo))
    if (fp.stationNo) list = list.filter(r => r.stationNo.includes(fp.stationNo))
    if (fp.firstAgent) list = list.filter(r => r.firstAgent.includes(fp.firstAgent))
    if (fp.status?.length) list = list.filter(r => fp.status.includes(r.status))
    list.sort((a, b) => {
      const statusDiff = (RECTIFY_STATUS_ORDER[a.status] ?? 99) - (RECTIFY_STATUS_ORDER[b.status] ?? 99)
      return statusDiff || getRowRoundCount(a) - getRowRoundCount(b) || a.rectifyNo.localeCompare(b.rectifyNo)
    })
    const total = list.length
    list = list.slice(((pageIndex ?? 1) - 1) * (pageRows ?? 10), (pageIndex ?? 1) * (pageRows ?? 10))
    return { data: list, count: total }
  },
}

// 整改时限工具函数
// row.remainDays 以 max(deadlineDays) 对应的截止日为基准
// 各缺陷独立剩余天数 = row.remainDays + (defect.deadlineDays - maxDeadlineDays)
function getMaxDeadlineDays(defects: any[]): number {
  return defects.length ? Math.max(...defects.map(d => d.deadlineDays ?? 7)) : 7
}
function getDefectRemainDays(defect: any, row: any): number {
  const maxDays = getMaxDeadlineDays(row.defects ?? [])
  return row.remainDays + ((defect.deadlineDays ?? 7) - maxDays)
}
function getMaxRemainDays(row: any): number {
  if (!row.defects?.length) return row.remainDays
  return Math.max(...row.defects.map((d: any) => getDefectRemainDays(d, row)))
}

function getDefectRounds(defect: any, row: any) {
  if (defect.rounds?.length) return defect.rounds
  if (!defect.rectifyContent && row.status === 'pending') return []
  return [{
    round: 1,
    submitTime: row.submitTime,
    rectifyContent: defect.rectifyContent,
    rectifyPhotos: defect.rectifyPhotos,
    reviewStatus: row.status,
  }]
}

function getRectifyPhotos(round: any) {
  if (round.rectifyPhotos?.length) return round.rectifyPhotos
  if (!round.rectifyContent) return []
  return [`https://picsum.photos/160/120?random=${300 + (round.round ?? 1)}`]
}

function isCurrentDefectRound(defect: any, round: any, row: any) {
  const rounds = getDefectRounds(defect, row)
  return round.round === rounds[rounds.length - 1]?.round
}

function hasMultipleDefectRounds(defect: any, row: any) {
  return getDefectRounds(defect, row).length > 1
}

function getRoundStatusLabel(status: string) {
  return ({ pending: '待整改', reviewing: '待复验', passed: '复验通过', rejected: '退回整改' } as Record<string, string>)[status] ?? '—'
}

function getRoundStatusColor(status: string) {
  return ({ pending: 'orange', reviewing: 'blue', passed: 'green', rejected: 'red' } as Record<string, string>)[status] ?? 'gray'
}

function handleRectify(row: any) {
  emit('navigate', 'fj-rectify-input', { row })
}

function handleDetail(row: any) {
  currentRow.value = row
  drawerRectifyEngineer.value = row.rectifyEngineer || ''
  detailVisible.value = true
}

// ── 整改复验人转办 ─────────────────────────────────────────────────────────
const ENGINEERS = ['赵飞', '刘海', '黄磊', '周斌', '吴杰', '陈明海', '李志远', '王建国', '张晓云', '刘明', '陈浩', '林峰']
const ENGINEER_OPTIONS = ENGINEERS.map(name => ({ label: name, value: name }))

const drawerRectifyEngineer = ref('')
const rectifyTransferVisible = ref(false)
const rectifyTransferTarget = ref('')

function handleRectifyTransferConfirm() {
  const name = rectifyTransferTarget.value
  if (!name) return
  drawerRectifyEngineer.value = name
  message.success(`整改复验已转办给 ${name}`)
  rectifyTransferVisible.value = false
  rectifyTransferTarget.value = ''
}

const MOCK_RECTIFY = [
  { id: 'r001', rectifyNo: 'ZGD-2026-001', sheetNo: 'FJD-2026-001001', stationNo: 'GFDZ-2025-001001',
    owner: '张建华', firstAgent: '浙江大区代理商', address: '浙江省杭州市余杭区未来科技城',
    agent: '杭州阳光新能源科技有限公司', rectifyEngineer: '吴杰', deadline: '2026-09-25', remainDays: 13,
    crCount: 0, maCount: 1, miCount: 1, status: 'passed',
    defects: [
      { level: 'ma', deadlineDays: 7, checkName: '支架腐蚀锈蚀情况', defectCategory: '设备故障', reason: '支架发现明显锈蚀', defectPhotos: ['https://picsum.photos/160/120?random=201'], rectifyContent: '已更换锈蚀段支架并做防腐处理' },
      { level: 'mi', deadlineDays: 3, checkName: '组件背板气泡/发黄情况', defectCategory: '安装工艺缺陷', reason: '2号组件背板轻微气泡', defectPhotos: ['https://picsum.photos/160/120?random=202'], rectifyContent: '观察无扩大，已做标记，下次复查' },
    ] },
  // 待整改：单轮样例
  { id: 'r002', rectifyNo: 'ZGD-2026-002', sheetNo: 'FJD-2026-001003', stationNo: 'GFDZ-2025-001004',
    owner: '赵丽娜', firstAgent: '安徽大区代理商', address: '安徽省合肥市蜀山区科学大道128号',
    agent: '合肥绿色能源技术有限公司', rectifyEngineer: '吴杰', deadline: '2026-09-30', remainDays: -8,
    crCount: 1, maCount: 0, miCount: 1, status: 'pending',
    defects: [
      { level: 'cr', deadlineDays: 7, checkName: '支架固定螺栓紧固情况', defectCategory: '安全隐患', reason: '多处螺栓松动，存在安全隐患', defectPhotos: ['https://picsum.photos/160/120?random=203'], rectifyContent: null,
        rounds: [{ round: 1, rectifyContent: null, rectifyPhotos: [], reviewStatus: 'pending' }] },
      { level: 'mi', deadlineDays: 3, checkName: '直流线缆绝缘层完整性', defectCategory: '安全隐患', reason: '局部绝缘层老化', defectPhotos: ['https://picsum.photos/160/120?random=204'], rectifyContent: null,
        rounds: [{ round: 1, rectifyContent: null, rectifyPhotos: [], reviewStatus: 'pending' }] },
    ] },
  { id: 'r003', rectifyNo: 'ZGD-2026-003', sheetNo: 'FJD-2026-002002', stationNo: 'GFDZ-2025-002002',
    owner: '褚文博', firstAgent: '浙江大区代理商', address: '浙江省金华市婺城区宾虹路',
    agent: '金华光伏建设集团有限公司', rectifyEngineer: '周斌', deadline: '2026-10-08', remainDays: 0,
    crCount: 0, maCount: 1, miCount: 0, status: 'reviewing',
    defects: [
      { level: 'ma', deadlineDays: 7, checkName: '汇流箱密封情况', defectCategory: '设备故障', reason: '汇流箱密封圈老化开裂', defectPhotos: ['https://picsum.photos/160/120?random=205'], rectifyContent: '已更换密封圈并补充防水处理，通过防水测试',
        rounds: [
          { round: 1, submitTime: '2026-09-27 15:20', rectifyContent: '已更换密封圈，通过防水测试', rectifyPhotos: [], reviewStatus: 'rejected', reviewTime: '2026-09-29 10:05', reviewNote: '密封圈更换后仍有渗水痕迹，请补充防水处理并重新提交。' },
          { round: 2, submitTime: '2026-10-06 14:23', rectifyContent: '已更换密封圈并补充防水处理，通过防水测试', rectifyPhotos: [], reviewStatus: 'reviewing' },
        ] },
    ] },
  // 待整改：多轮样例（第 1 轮复验退回，等待第 2 轮整改）
  { id: 'r004', rectifyNo: 'ZGD-2026-004', sheetNo: 'FJD-2026-003002', stationNo: 'GFDZ-2025-003002',
    owner: '冯国强', firstAgent: '浙江大区代理商', address: '浙江省宁波市江北区庄桥街道',
    agent: '宁波绿能电力安装有限公司', rectifyEngineer: '', deadline: '2026-10-20', remainDays: 12,
    crCount: 0, maCount: 2, miCount: 0, status: 'pending',
    defects: [
      { level: 'ma', deadlineDays: 7, checkName: 'MC4接头紧固情况', defectCategory: '安装工艺缺陷', reason: 'B组串 MC4 接头松动', defectPhotos: ['https://picsum.photos/160/120?random=206'], rectifyContent: null,
        rounds: [
          { round: 1, submitTime: '2026-10-03 10:15', rectifyContent: '已紧固 MC4 接头并完成拉力测试', rectifyPhotos: [], reviewStatus: 'rejected', reviewTime: '2026-10-05 09:30' },
          { round: 2, rectifyContent: null, rectifyPhotos: [], reviewStatus: 'pending' },
        ] },
      { level: 'ma', deadlineDays: 7, checkName: '逆变器散热风扇', defectCategory: '设备故障', reason: '风扇异响，疑似轴承损坏', defectPhotos: ['https://picsum.photos/160/120?random=207'], rectifyContent: null,
        rounds: [
          { round: 1, submitTime: '2026-10-03 10:15', rectifyContent: '已更换风扇并进行空载试运行', rectifyPhotos: [], reviewStatus: 'rejected', reviewTime: '2026-10-05 09:30' },
          { round: 2, rectifyContent: null, rectifyPhotos: [], reviewStatus: 'pending' },
        ] },
    ] },
  { id: 'r005', rectifyNo: 'ZGD-2026-005', sheetNo: 'FJD-2026-003001', stationNo: 'GFDZ-2025-003001',
    owner: '郑秀兰', firstAgent: '安徽大区代理商', address: '安徽省芜湖市弋江区九华中路',
    agent: '芜湖清洁能源发展有限公司', rectifyEngineer: '', deadline: '2026-10-15', remainDays: 7,
    crCount: 0, maCount: 0, miCount: 1, status: 'pending',
    defects: [
      { level: 'mi', deadlineDays: 3, checkName: '组件外观破损情况', defectCategory: '设备故障', reason: '边框轻微变形', defectPhotos: ['https://picsum.photos/160/120?random=208'], rectifyContent: null },
    ] },
  // 待复验：单轮样例
  { id: 'r006', rectifyNo: 'ZGD-2026-006', sheetNo: 'FJD-2026-004001', stationNo: 'GFDZ-2025-004001',
    owner: '孙明远', firstAgent: '浙江大区代理商', address: '浙江省绍兴市柯桥区华舍街道',
    agent: '绍兴越能新能源开发有限公司', rectifyEngineer: '赵飞', deadline: '2026-10-18', remainDays: 4, submitTime: '2026-10-14 09:45',
    crCount: 1, maCount: 0, miCount: 0, status: 'reviewing',
    defects: [
      { level: 'cr', deadlineDays: 7, checkName: '直流侧短路保护', defectCategory: '安全隐患', reason: '直流开关保护定值设置不符合规范', defectPhotos: ['https://picsum.photos/160/120?random=209'], rectifyContent: '已重新设置保护定值，经测试符合规范要求', rectifyPhotos: [] },
    ] },
  // 整改通过：多轮样例
  { id: 'r007', rectifyNo: 'ZGD-2026-007', sheetNo: 'FJD-2026-005002', stationNo: 'GFDZ-2025-005002',
    owner: '陈宇航', firstAgent: '安徽大区代理商', address: '安徽省合肥市庐阳区杏花公园路',
    agent: '合肥蓝天光能有限公司', rectifyEngineer: '刘海', deadline: '2026-10-22', remainDays: 0, submitTime: '2026-10-17 16:05',
    crCount: 0, maCount: 1, miCount: 0, status: 'passed',
    defects: [
      { level: 'ma', deadlineDays: 7, checkName: '汇流箱熔丝情况', defectCategory: '设备故障', reason: '2 路支路熔丝烧断，导致发电损失', defectPhotos: ['https://picsum.photos/160/120?random=210'], rectifyContent: '已更换同规格熔丝并完成通电测试',
        rounds: [
          { round: 1, submitTime: '2026-10-09 14:30', rectifyContent: '已更换熔丝并恢复送电', rectifyPhotos: [], reviewStatus: 'rejected', reviewTime: '2026-10-11 09:20' },
          { round: 2, submitTime: '2026-10-15 16:40', rectifyContent: '已复核支路并更换同规格熔丝，通电测试正常', rectifyPhotos: [], reviewStatus: 'passed', reviewTime: '2026-10-17 16:05', reviewPhotos: [] },
        ] },
    ] },
]
</script>

<style scoped>
.fj-rectify-list-page { padding: 16px; }
.fj-main-card { background: #fff; border-radius: 8px; overflow: hidden; }
.fj-main-card :deep(.anfe-pro-table) { background: transparent !important; border-radius: 0 !important; box-shadow: none !important; }
.rectify-detail-wrap { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
.detail-section { background: #fff; border-radius: 8px; padding: 18px 20px; }
.section-title { font-size: 16px; font-weight: 600; color: #262626; margin-bottom: 14px; }
.info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 0; }
.info-item--span2 { grid-column: span 2; }
.info-label { font-size: 14px; color: rgba(0,0,0,0.45); line-height: 22px; padding-bottom: 8px; white-space: nowrap; }
.info-value { font-size: 14px; color: #262626; }
.info-value--action { display: flex; align-items: center; gap: 2px; }
.transfer-btn { padding: 0 4px; height: auto; font-size: 13px; }
.defect-item-card { border: 1px solid #f0f0f0; border-left-width: 3px; border-left-color: #d9d9d9; border-radius: 6px; padding: 14px 16px; margin-bottom: 10px; }
.defect-item-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.defect-item-name { font-size: 14px; font-weight: 600; color: #262626; }
.defect-badge-small { font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 3px; flex-shrink: 0; }
.defect-badge-small.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge-small.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge-small.mi { background: rgba(250,219,20,0.15); color: #d48806; }
.defect-row { display: flex; flex-direction: column; gap: 8px; }
.defect-divider { border-top: 1px solid #f0f0f0; margin: 4px 0; }
.defect-meta { display: flex; gap: 12px; align-items: baseline; }
.defect-meta--photos { align-items: flex-start; }
.defect-meta-label { font-size: 14px; color: rgba(0,0,0,0.45); flex-shrink: 0; min-width: 56px; }
.defect-meta-value { font-size: 14px; color: #262626; line-height: 1.6; }
.defect-meta-value.is-empty { color: #bfbfbf; }
.defect-photos { display: flex; gap: 8px; }
:deep(.defect-photo-thumb) { display: inline-flex; overflow: hidden; border: 1px solid #f0f0f0; border-radius: 8px; }
:deep(.defect-photo-thumb .ant-image),
:deep(.defect-photo-thumb .ant-image-img),
:deep(.defect-photo-thumb img) { display: block; overflow: hidden; object-fit: cover; border-radius: 8px !important; }
:deep(.defect-photo-thumb .ant-image-mask) { border-radius: 8px !important; }
.defect-deadline-tag { font-size: 11px; color: rgba(0,0,0,0.45); background: #f5f5f5; border-radius: 3px; padding: 1px 6px; white-space: nowrap; }
.defect-remain { font-size: 12px; white-space: nowrap; }
.defect-round-block { display: flex; flex-direction: column; gap: 8px; padding: 12px; margin-top: 8px; background: #fafafa; border-radius: 4px; }
.defect-round-block.is-current { border: 1px solid #d6e4ff; }
.defect-round-block.is-single { padding: 0; margin-top: 0; background: transparent; border: 0; }
.defect-round-head, .defect-round-review { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 14px; font-weight: 600; color: #262626; }
.defect-round-time { margin-left: auto; font-size: 12px; font-weight: 400; color: rgba(0,0,0,0.45); }
.defect-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 5px; border-radius: 3px; margin-right: 4px; }
.defect-badge.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge.mi { background: rgba(250,219,20,0.15); color: #d48806; }
</style>
