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

        <!-- 剩余天数 -->
        <template #remainDaysSlot="{ row }">
          <span v-if="row.remainDays > 3" style="color:#262626">{{ row.remainDays }} 天</span>
          <span v-else-if="row.remainDays > 0" style="color:#fa8c16;font-weight:500">{{ row.remainDays }} 天</span>
          <span v-else style="color:#ff4d4f;font-weight:600">已逾期 {{ Math.abs(row.remainDays) }} 天</span>
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
                <div class="info-value">{{ currentRow.rectifyEngineer || '—' }}</div>
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
            <div class="section-title">不合格项（{{ currentRow.defects?.length ?? 0 }} 项）</div>
            <div v-for="(defect, i) in currentRow.defects" :key="i" class="defect-item-card" :class="`rs-${currentRow.status}`">
              <div class="defect-item-head">
                <span class="defect-badge-small" :class="defect.level">{{ defect.level?.toUpperCase() }}</span>
                <span class="defect-item-name">{{ defect.checkName }}</span>
              </div>
              <div class="defect-row">
                <div class="defect-meta">
                  <span class="defect-meta-label">缺陷原因</span>
                  <span class="defect-meta-value">{{ defect.reason }}</span>
                </div>
                <template v-if="currentRow.status === 'reviewing' || currentRow.status === 'passed'">
                  <div class="defect-divider"></div>
                  <div class="defect-meta">
                    <span class="defect-meta-label">整改内容</span>
                    <span class="defect-meta-value" :class="{ 'is-empty': !defect.rectifyContent }">{{ defect.rectifyContent ?? '未填写' }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
    const total = list.length
    list = list.slice(((pageIndex ?? 1) - 1) * (pageRows ?? 10), (pageIndex ?? 1) * (pageRows ?? 10))
    return { data: list, count: total }
  },
}

function handleRectify(row: any) {
  emit('navigate', 'fj-rectify-input', { row })
}

function handleDetail(row: any) {
  currentRow.value = row
  detailVisible.value = true
}

const MOCK_RECTIFY = [
  { id: 'r001', rectifyNo: 'ZGD-2026-001', sheetNo: 'FJD-2026-001001', stationNo: 'GFDZ-2025-001001',
    owner: '张三', firstAgent: '浙江大区代理商', address: '浙江省杭州市余杭区未来科技城',
    agent: '杭州阳光新能源科技有限公司', rectifyEngineer: '吴杰', deadline: '2026-09-25', remainDays: 13,
    crCount: 0, maCount: 1, miCount: 1, status: 'passed',
    defects: [{ level: 'ma', checkName: '支架腐蚀锈蚀情况', reason: '支架发现明显锈蚀', rectifyContent: '已更换锈蚀段支架并做防腐处理' }, { level: 'mi', checkName: '组件背板气泡/发黄情况', reason: '2号组件背板轻微气泡', rectifyContent: '观察无扩大，已做标记，下次复查' }] },
  { id: 'r002', rectifyNo: 'ZGD-2026-002', sheetNo: 'FJD-2026-001003', stationNo: 'GFDZ-2025-001004',
    owner: '赵六', firstAgent: '安徽大区代理商', address: '安徽省合肥市蜀山区科学大道128号',
    agent: '合肥绿色能源技术有限公司', rectifyEngineer: '吴杰', deadline: '2026-09-30', remainDays: -8,
    crCount: 1, maCount: 0, miCount: 1, status: 'pending',
    defects: [{ level: 'cr', checkName: '支架固定螺栓紧固情况', reason: '多处螺栓松动，存在安全隐患', rectifyContent: null }, { level: 'mi', checkName: '直流线缆绝缘层完整性', reason: '局部绝缘层老化', rectifyContent: null }] },
  { id: 'r003', rectifyNo: 'ZGD-2026-003', sheetNo: 'FJD-2026-002002', stationNo: 'GFDZ-2025-002002',
    owner: '褚三', firstAgent: '浙江大区代理商', address: '浙江省金华市婺城区宾虹路',
    agent: '金华光伏建设集团有限公司', rectifyEngineer: '周斌', deadline: '2026-10-08', remainDays: 0,
    crCount: 0, maCount: 1, miCount: 0, status: 'reviewing',
    defects: [{ level: 'ma', checkName: '汇流箱密封情况', reason: '汇流箱密封圈老化开裂', rectifyContent: '已更换密封圈，通过防水测试' }] },
  { id: 'r004', rectifyNo: 'ZGD-2026-004', sheetNo: 'FJD-2026-003002', stationNo: 'GFDZ-2025-003002',
    owner: '冯一', firstAgent: '浙江大区代理商', address: '浙江省宁波市江北区庄桥街道',
    agent: '宁波绿能电力安装有限公司', rectifyEngineer: '', deadline: '2026-10-20', remainDays: 12,
    crCount: 0, maCount: 2, miCount: 0, status: 'pending',
    defects: [{ level: 'ma', checkName: 'MC4接头紧固情况', reason: 'B组串 MC4 接头松动', rectifyContent: null }, { level: 'ma', checkName: '逆变器散热风扇', reason: '风扇异响，疑似轴承损坏', rectifyContent: null }] },
  { id: 'r005', rectifyNo: 'ZGD-2026-005', sheetNo: 'FJD-2026-003001', stationNo: 'GFDZ-2025-003001',
    owner: '郑十', firstAgent: '安徽大区代理商', address: '安徽省芜湖市弋江区九华中路',
    agent: '芜湖清洁能源发展有限公司', rectifyEngineer: '', deadline: '2026-10-15', remainDays: 7,
    crCount: 0, maCount: 0, miCount: 1, status: 'pending',
    defects: [{ level: 'mi', checkName: '组件外观破损情况', reason: '边框轻微变形', rectifyContent: null }] },
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
.defect-item-card { border: 1px solid #f0f0f0; border-left-width: 3px; border-radius: 6px; padding: 14px 16px; margin-bottom: 10px; }
.defect-item-card.rs-pending   { border-left-color: #fa8c16; background: rgba(250,140,22,0.02); }
.defect-item-card.rs-reviewing { border-left-color: #1677ff; background: rgba(22,119,255,0.02); }
.defect-item-card.rs-passed    { border-left-color: #52c41a; background: rgba(82,196,26,0.02); }
.defect-item-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.defect-item-name { font-size: 14px; font-weight: 600; color: #262626; }
.defect-badge-small { font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 3px; flex-shrink: 0; }
.defect-badge-small.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge-small.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge-small.mi { background: rgba(250,219,20,0.15); color: #d48806; }
.defect-row { display: flex; flex-direction: column; gap: 8px; }
.defect-divider { border-top: 1px solid #f0f0f0; margin: 4px 0; }
.defect-meta { display: flex; gap: 12px; align-items: baseline; }
.defect-meta-label { font-size: 13px; color: rgba(0,0,0,0.45); flex-shrink: 0; min-width: 56px; }
.defect-meta-value { font-size: 14px; color: #262626; line-height: 1.6; }
.defect-meta-value.is-empty { color: #bfbfbf; }
.defect-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 5px; border-radius: 3px; margin-right: 4px; }
.defect-badge.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge.mi { background: rgba(250,219,20,0.15); color: #d48806; }
</style>
