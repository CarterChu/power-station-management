<template>
  <div class="fj-review-list-page">
    <div class="fj-main-card">
      <AnfeProTable
        ref="tableRef"
        table-key="fj-review-list-pc-v1"
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

        <!-- 复验状态 -->
        <template #statusSlot="{ row }">
          <a-tag v-if="row.status === 'reviewing'" color="processing" style="margin:0">待复验</a-tag>
          <a-tag v-else-if="row.status === 'passed'" color="success" style="margin:0">复验通过</a-tag>
          <a-tag v-else-if="row.status === 'rejected'" color="error" style="margin:0">退回整改</a-tag>
        </template>

        <!-- 操作 -->
        <template #actionSlot="{ row }">
          <a-button type="link" size="small" @click="handleDetail(row)">详情</a-button>
        </template>
      </AnfeProTable>
    </div>

    <!-- 复验详情 Drawer -->
    <a-drawer
      v-model:open="detailVisible"
      width="900"
      :body-style="{ padding: '0' }"
      destroy-on-close
    >
      <template v-if="currentRow" #title>
        <span style="margin-right:10px">复验详情 · {{ currentRow.rectifyNo }}</span>
        <a-tag v-if="currentRow.status === 'reviewing'" color="processing" style="margin:0">待复验</a-tag>
        <a-tag v-else-if="currentRow.status === 'passed'" color="success" style="margin:0">复验通过</a-tag>
        <a-tag v-else-if="currentRow.status === 'rejected'" color="error" style="margin:0">退回整改</a-tag>
      </template>
      <template v-if="currentRow">
        <div class="review-detail-wrap">
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
                <div class="info-value">{{ currentRow.owner }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">一级代理商</div>
                <div class="info-value">{{ currentRow.firstAgent }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">代理商</div>
                <div class="info-value">{{ currentRow.agent }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">整改复验人</div>
                <div class="info-value">{{ currentRow.rectifyEngineer || '—' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">整改期限</div>
                <div class="info-value">{{ currentRow.deadline }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">整改提交时间</div>
                <div class="info-value">{{ currentRow.submitTime }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">复验状态</div>
                <div class="info-value">
                  <a-tag v-if="currentRow.status === 'reviewing'" color="processing" style="margin:0">待复验</a-tag>
                  <a-tag v-else-if="currentRow.status === 'passed'" color="success" style="margin:0">复验通过</a-tag>
                  <a-tag v-else-if="currentRow.status === 'rejected'" color="error" style="margin:0">退回整改</a-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 退回原因（仅 rejected 状态展示） -->
          <div v-if="currentRow.status === 'rejected' && currentRow.rejectReason" class="detail-section reject-section">
            <div class="section-title" style="color:#ff4d4f">退回原因</div>
            <p class="reject-reason-text">{{ currentRow.rejectReason }}</p>
          </div>

          <!-- 整改内容 -->
          <div class="detail-section">
            <div class="section-title">整改内容核查</div>
            <div
              v-for="(defect, idx) in currentRow.defects"
              :key="idx"
              class="defect-review-card"
            >
              <div class="defect-review-head">
                <span class="defect-idx">{{ idx + 1 }}</span>
                <span class="defect-badge-small" :class="defect.level">{{ defect.level?.toUpperCase() }}</span>
                <span class="defect-name">{{ defect.checkName }}</span>
              </div>
              <div class="defect-compare">
                <!-- 原缺陷描述 -->
                <div class="compare-col">
                  <div class="compare-col-title">
                    <span class="col-dot origin"></span>原缺陷描述
                  </div>
                  <div class="compare-col-content">{{ defect.reason }}</div>
                  <div v-if="defect.originPhotos?.length" class="photos-row">
                    <a-image-preview-group>
                      <a-image
                        v-for="(src, pi) in defect.originPhotos"
                        :key="pi"
                        :src="src"
                        :width="72"
                        :height="72"
                        style="object-fit:cover;border-radius:4px;border:1px solid #f0f0f0"
                      />
                    </a-image-preview-group>
                  </div>
                </div>
                <div class="compare-divider"></div>
                <!-- 整改内容 -->
                <div class="compare-col">
                  <div class="compare-col-title">
                    <span class="col-dot rectify"></span>整改内容
                  </div>
                  <div v-if="defect.rectifyContent" class="compare-col-content">{{ defect.rectifyContent }}</div>
                  <div v-else class="compare-col-content empty">暂未填写整改内容</div>
                  <div v-if="defect.rectifyPhotos?.length" class="photos-row">
                    <a-image-preview-group>
                      <a-image
                        v-for="(src, pi) in defect.rectifyPhotos"
                        :key="pi"
                        :src="src"
                        :width="72"
                        :height="72"
                        style="object-fit:cover;border-radius:4px;border:1px solid #f0f0f0"
                      />
                    </a-image-preview-group>
                  </div>
                  <div v-else class="photos-empty">暂无整改照片</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮区（仅 reviewing 状态） -->
        <div v-if="currentRow.status === 'reviewing'" class="review-actions-bar">
          <a-button danger @click="openRejectModal">退回整改</a-button>
          <a-button type="primary" @click="handlePass">通过复验</a-button>
        </div>
      </template>
    </a-drawer>

    <!-- 退回原因弹窗 -->
    <a-modal
      v-model:open="rejectVisible"
      title="退回整改"
      ok-text="确认退回"
      cancel-text="取消"
      :ok-button-props="{ danger: true, disabled: !rejectReason.trim() }"
      width="460px"
      @ok="handleRejectConfirm"
      @cancel="rejectReason = ''"
    >
      <div style="padding: 8px 0 4px">
        <div style="margin-bottom:8px;font-size:13px;color:rgba(0,0,0,0.65)">请填写退回原因，整改人将收到通知</div>
        <a-textarea
          v-model:value="rejectReason"
          :rows="4"
          placeholder="请说明退回原因，如：整改内容描述不够详细，请补充现场照片及处理措施。"
          :maxlength="200"
          show-count
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { AnfeProTable } from '@anfe/vue-pro-components'

const tableRef = ref<any>(null)
const detailVisible = ref(false)
const currentRow = ref<any>(null)

const rejectVisible = ref(false)
const rejectReason = ref('')

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
  { title: '整改提交时间', dataIndex: 'submitTime', key: 'submitTime', width: 150 },
  { title: '复验状态', key: 'status', width: 110, component: 'custom', slotName: 'statusSlot' },
  { title: '操作', key: 'action', fixed: 'right' as const, width: 120, component: 'custom', slotName: 'actionSlot' },
]

const filters = [
  { label: '整改单号', key: 'rectifyNo', component: 'input', placeholder: '请输入整改单号' },
  { label: '关联飞检单', key: 'sheetNo', component: 'input', placeholder: '请输入飞检单号' },
  { label: '关联电站', key: 'stationNo', component: 'input', placeholder: '请输入电站编号' },
  { label: '一级代理商', key: 'firstAgent', component: 'input', placeholder: '请输入一级代理商' },
  { label: '整改期限', key: 'deadlineRange', component: 'rangePicker', placeholder: ['开始日期', '结束日期'] },
  { label: '复验状态', key: 'status', component: 'select', placeholder: '请选择',
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: '待复验', value: 'reviewing' },
      { label: '复验通过', value: 'passed' },
      { label: '退回整改', value: 'rejected' },
    ]},
]

const tableConfig = {
  rowKey: 'id',
  searchOnLoad: true,
  request: async (params: Record<string, any>) => {
    const { params: fp = {}, pageIndex, pageRows } = params
    await new Promise(r => setTimeout(r, 200))
    let list = [...MOCK_REVIEW]
    if (fp.rectifyNo) list = list.filter(r => r.rectifyNo.includes(fp.rectifyNo))
    if (fp.sheetNo) list = list.filter(r => r.sheetNo.includes(fp.sheetNo))
    if (fp.stationNo) list = list.filter(r => r.stationNo.includes(fp.stationNo))
    if (fp.firstAgent) list = list.filter(r => r.firstAgent.includes(fp.firstAgent))
    if (fp.status?.length) list = list.filter(r => fp.status.includes(r.status))
    const total = list.length
    list = list.slice(((pageIndex ?? 1) - 1) * (pageRows ?? 10), (pageIndex ?? 1) * (pageRows ?? 10))
    return { data: list, count: total }
  },
}

function handleDetail(row: any) {
  currentRow.value = row
  detailVisible.value = true
}

function openRejectModal() {
  rejectReason.value = ''
  rejectVisible.value = true
}

function handlePass() {
  if (!currentRow.value) return
  currentRow.value.status = 'passed'
  message.success('已通过复验，整改单状态已更新')
  detailVisible.value = false
  tableRef.value?.refresh?.()
}

function handleRejectConfirm() {
  const reason = rejectReason.value.trim()
  if (!reason) return
  if (currentRow.value) {
    currentRow.value.status = 'rejected'
    currentRow.value.rejectReason = reason
  }
  message.success('已退回整改，整改人将收到通知')
  rejectVisible.value = false
  rejectReason.value = ''
  detailVisible.value = false
  tableRef.value?.refresh?.()
}

const MOCK_REVIEW = [
  {
    id: 'rv001', rectifyNo: 'ZGD-2026-003', sheetNo: 'FJD-2026-002002', stationNo: 'GFDZ-2025-002002',
    owner: '褚三', firstAgent: '浙江大区代理商', address: '浙江省金华市婺城区宾虹路',
    agent: '金华光伏建设集团有限公司', rectifyEngineer: '周斌',
    deadline: '2026-10-08', submitTime: '2026-10-06 14:23', remainDays: 0,
    crCount: 0, maCount: 1, miCount: 0, status: 'reviewing',
    defects: [
      { level: 'ma', checkName: '汇流箱密封情况',
        reason: '汇流箱密封圈老化开裂，存在进水风险',
        rectifyContent: '已更换密封圈，通过防水测试，恢复正常',
        originPhotos: [], rectifyPhotos: [] }
    ]
  },
  {
    id: 'rv002', rectifyNo: 'ZGD-2026-006', sheetNo: 'FJD-2026-004001', stationNo: 'GFDZ-2025-004001',
    owner: '孙七', firstAgent: '浙江大区代理商', address: '浙江省绍兴市柯桥区华舍街道',
    agent: '绍兴越能新能源开发有限公司', rectifyEngineer: '赵飞',
    deadline: '2026-10-18', submitTime: '2026-10-14 09:45', remainDays: 4,
    crCount: 1, maCount: 1, miCount: 2, status: 'reviewing',
    defects: [
      { level: 'cr', checkName: '直流侧短路保护',
        reason: '直流开关保护定值设置不符合规范，存在安全隐患',
        rectifyContent: '已重新设置保护定值，经测试符合规范要求',
        originPhotos: [], rectifyPhotos: [] },
      { level: 'ma', checkName: '逆变器运行状态',
        reason: 'MPPT 效率异常偏低，约 86%',
        rectifyContent: '已清洁组件并检查接线，效率恢复至 97%',
        originPhotos: [], rectifyPhotos: [] },
      { level: 'mi', checkName: '支架防腐情况',
        reason: '个别支架节点轻微锈蚀',
        rectifyContent: '已做防腐处理，涂刷防锈漆',
        originPhotos: [], rectifyPhotos: [] },
      { level: 'mi', checkName: '线缆整理情况',
        reason: '部分电缆扎带固定不规范，存在下垂',
        rectifyContent: '已重新整理并固定，符合规范',
        originPhotos: [], rectifyPhotos: [] },
    ]
  },
  {
    id: 'rv003', rectifyNo: 'ZGD-2026-007', sheetNo: 'FJD-2026-005002', stationNo: 'GFDZ-2025-005002',
    owner: '陈八', firstAgent: '安徽大区代理商', address: '安徽省合肥市庐阳区杏花公园路',
    agent: '合肥蓝天光能有限公司', rectifyEngineer: '刘海',
    deadline: '2026-10-22', submitTime: '2026-10-17 16:05', remainDays: 5,
    crCount: 0, maCount: 2, miCount: 1, status: 'reviewing',
    defects: [
      { level: 'ma', checkName: '汇流箱熔丝情况',
        reason: '2 路支路熔丝烧断，导致发电损失',
        rectifyContent: '已更换同规格熔丝，测试正常，记录在案',
        originPhotos: [], rectifyPhotos: [] },
      { level: 'ma', checkName: '接线端子紧固情况',
        reason: '逆变器侧 AC 接线端子有松动',
        rectifyContent: '已重新紧固，力矩符合要求',
        originPhotos: [], rectifyPhotos: [] },
      { level: 'mi', checkName: '标识标牌完整性',
        reason: '部分危险标识脱落',
        rectifyContent: '已补贴新标识',
        originPhotos: [], rectifyPhotos: [] },
    ]
  },
  {
    id: 'rv004', rectifyNo: 'ZGD-2026-008', sheetNo: 'FJD-2026-001005', stationNo: 'GFDZ-2025-001005',
    owner: '周九', firstAgent: '浙江大区代理商', address: '浙江省嘉兴市南湖区东升路',
    agent: '嘉兴阳光能源股份有限公司', rectifyEngineer: '黄磊',
    deadline: '2026-10-05', submitTime: '2026-10-03 11:20', remainDays: -3,
    crCount: 0, maCount: 0, miCount: 1, status: 'passed',
    defects: [
      { level: 'mi', checkName: '组件外观清洁度',
        reason: '组件表面积灰较厚，影响发电效率',
        rectifyContent: '已进行专业清洁，发电量恢复正常',
        originPhotos: [], rectifyPhotos: [] },
    ]
  },
  {
    id: 'rv005', rectifyNo: 'ZGD-2026-009', sheetNo: 'FJD-2026-002005', stationNo: 'GFDZ-2025-002005',
    owner: '吴二', firstAgent: '安徽大区代理商', address: '安徽省芜湖市镜湖区步行街',
    agent: '芜湖清洁能源发展有限公司', rectifyEngineer: '吴杰',
    deadline: '2026-10-12', submitTime: '2026-10-09 10:00', remainDays: -2,
    crCount: 0, maCount: 1, miCount: 0, status: 'rejected',
    rejectReason: '整改内容描述不够详细，需补充处理前后对比照片，以及更换部件的型号规格记录。',
    defects: [
      { level: 'ma', checkName: 'MC4 接头防水情况',
        reason: '多个 MC4 接头防水套损坏，存在进水风险',
        rectifyContent: '已更换接头防水套',
        originPhotos: [], rectifyPhotos: [] },
    ]
  },
  {
    id: 'rv006', rectifyNo: 'ZGD-2026-010', sheetNo: 'FJD-2026-003005', stationNo: 'GFDZ-2025-003005',
    owner: '郑四', firstAgent: '浙江大区代理商', address: '浙江省宁波市鄞州区中山东路',
    agent: '宁波绿能电力安装有限公司', rectifyEngineer: '陈明海',
    deadline: '2026-10-28', submitTime: '2026-10-20 14:00', remainDays: 8,
    crCount: 0, maCount: 1, miCount: 1, status: 'reviewing',
    defects: [
      { level: 'ma', checkName: '直流线缆绝缘层完整性',
        reason: '部分直流线缆绝缘层老化，存在漏电风险',
        rectifyContent: '已更换老化段线缆，绝缘测试合格',
        originPhotos: [], rectifyPhotos: [] },
      { level: 'mi', checkName: '电缆管管口封堵情况',
        reason: '穿管管口未封堵，存在小动物进入风险',
        rectifyContent: '已用防火泥封堵管口',
        originPhotos: [], rectifyPhotos: [] },
    ]
  },
]
</script>

<style scoped>
.fj-review-list-page { padding: 16px; }
.fj-main-card { background: #fff; border-radius: 8px; overflow: hidden; }
.fj-main-card :deep(.anfe-pro-table) { background: transparent !important; border-radius: 0 !important; box-shadow: none !important; }

/* 详情 */
.review-detail-wrap { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.detail-section { background: #fff; border-radius: 8px; padding: 18px 20px; border: 1px solid #f0f0f0; }
.section-title { font-size: 16px; font-weight: 600; color: #262626; margin-bottom: 14px; }
.info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 0; }
.info-label { font-size: 14px; color: rgba(0,0,0,0.45); padding-bottom: 6px; }
.info-value { font-size: 14px; color: #262626; }

/* 退回信息 */
.reject-section { border-color: rgba(255,77,79,0.2); background: rgba(255,77,79,0.02); }
.reject-reason-text { margin: 0; font-size: 14px; color: #595959; line-height: 1.7; }

/* 整改核查卡 */
.defect-review-card { border: 1px solid #f0f0f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; }
.defect-review-card:last-child { margin-bottom: 0; }
.defect-review-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.defect-idx { width: 20px; height: 20px; background: #f5f5f5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #595959; flex-shrink: 0; }
.defect-name { font-size: 14px; font-weight: 600; color: #262626; }

/* 对比布局 */
.defect-compare { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0; }
.compare-divider { width: 1px; background: #f0f0f0; margin: 0 16px; }
.compare-col { padding: 0 4px; }
.compare-col-title { font-size: 13px; font-weight: 600; color: rgba(0,0,0,0.65); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.col-dot.origin { background: #fa8c16; }
.col-dot.rectify { background: #52c41a; }
.compare-col-content { font-size: 14px; color: #262626; line-height: 1.7; }
.compare-col-content.empty { color: #bfbfbf; font-style: italic; }
.photos-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.photos-empty { font-size: 13px; color: #bfbfbf; margin-top: 10px; }

/* 操作按钮栏 */
.review-actions-bar { position: sticky; bottom: 0; background: #fff; border-top: 1px solid #f0f0f0; padding: 14px 24px; display: flex; justify-content: flex-end; gap: 10px; }

/* badge */
.defect-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 5px; border-radius: 3px; margin-right: 4px; }
.defect-badge.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge.mi { background: rgba(250,219,20,0.15); color: #d48806; }
.defect-badge-small { font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 3px; flex-shrink: 0; }
.defect-badge-small.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge-small.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge-small.mi { background: rgba(250,219,20,0.15); color: #d48806; }
</style>
