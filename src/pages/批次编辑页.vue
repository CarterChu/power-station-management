<template>
  <div class="batch-edit-page">
    <div class="batch-edit-header">
      <a-button type="text" @click="handleBack">
        <template #icon><LeftOutlined /></template>
      </a-button>
      <span class="batch-edit-title">{{ isEdit ? '编辑飞检批次' : batchType === 'special' ? '新增专项飞检' : '新增日常飞检' }}</span>
      <div class="batch-edit-status-tag" v-if="isEdit">
        <a-tag :color="statusColor[formData.status]" style="margin:0">{{ STATUS_LABEL[formData.status] }}</a-tag>
      </div>
    </div>

    <div class="batch-edit-body">
      <!-- 左侧基础信息 -->
      <div class="batch-info-card">
        <div class="card-section-title" style="margin-bottom:20px">基础信息</div>
        <a-form :model="formData" layout="vertical" :disabled="formReadOnly">
          <a-form-item label="飞检类型">
            <div class="fake-radio-group">
              <label class="fake-radio" :class="{ checked: formData.type === 'daily', disabled: isEdit }" @click="!isEdit && (formData.type = 'daily')">
                <span class="fake-radio-dot" :class="{ checked: formData.type === 'daily' }"><span class="fake-radio-inner"></span></span>
                日常飞检
              </label>
              <label class="fake-radio" :class="{ checked: formData.type === 'special', disabled: isEdit }" @click="!isEdit && (formData.type = 'special')">
                <span class="fake-radio-dot" :class="{ checked: formData.type === 'special' }"><span class="fake-radio-inner"></span></span>
                专项飞检
              </label>
            </div>
          </a-form-item>
          <a-form-item v-if="formData.type === 'special'" label="飞检名称" required>
            <a-input v-model:value="formData.name" placeholder="请输入飞检名称" maxlength="50" show-count />
          </a-form-item>
          <a-form-item label="小组负责人" required>
            <a-select
              v-model:value="formData.leader"
              placeholder="请选择负责人"
              show-search
              :options="LEADER_OPTIONS"
              :filter-option="(input: string, opt: any) => opt.label.includes(input)"
            />
          </a-form-item>
          <a-form-item label="飞检日期" required>
            <a-date-picker v-model:value="formData.checkDate" style="width:100%" placeholder="请选择飞检日期" />
          </a-form-item>
          <a-form-item label="是否随机抽验">
            <a-switch v-model:checked="formData.random" checked-children="是" un-checked-children="否" />
          </a-form-item>
          <a-form-item v-if="formData.random" label="抽验比例">
            <a-input-number v-model:value="formData.sampleRate" :min="10" :max="100" :step="5" style="width:100%" addon-after="%" />
          </a-form-item>
          <a-form-item label="备注">
            <a-textarea v-model:value="formData.remark" :rows="3" :maxlength="200" show-count placeholder="可填写备注信息" />
          </a-form-item>
        </a-form>
      </div>

      <!-- 右侧电站列表 -->
      <div class="batch-station-card">
        <div class="station-card-header">
          <span class="card-section-title">飞检电站清单</span>
          <span class="station-count-badge">共 {{ stationList.length }} 个电站</span>
          <div style="flex:1"></div>
          <a-space v-if="!formReadOnly">
            <a-button @click="addStationVisible = true">
              <template #icon><PlusOutlined /></template>
              添加电站
            </a-button>
            <a-button
              danger
              :disabled="isEdit || stationList.length === 0"
              @click="handleClearStations"
            >
              <a-tooltip v-if="isEdit" title="提交后不允许清空电站">
                <span>清空电站</span>
              </a-tooltip>
              <span v-else>清空电站</span>
            </a-button>
          </a-space>
        </div>

        <a-table
          :columns="stationColumns"
          :data-source="stationList"
          :pagination="false"
          size="small"
          row-key="stationId"
          :scroll="{ y: 380 }"
          :locale="{ emptyText: '暂无电站，请先点击添加电站' }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'idx'">{{ index + 1 }}</template>
            <template v-if="column.key === 'engineer'">
              <a-select
                v-if="!formReadOnly"
                v-model:value="record.engineerId"
                size="small"
                style="width:120px"
                show-search
                placeholder="分配工程师"
                :options="ENGINEER_OPTIONS"
                :filter-option="(i: string, o: any) => o.label.includes(i)"
                @change="(val: string) => onEngineerChange(record, val)"
              />
              <span v-else>{{ record.engineerName || '—' }}</span>
            </template>
            <template v-if="column.key === 'action'">
              <a-button
                v-if="!formReadOnly"
                type="link" size="small" danger
                @click="removeStation(record.stationId)"
              >移除</a-button>
              <span v-else style="color:#bfbfbf">—</span>
            </template>
          </template>
        </a-table>

        <!-- 提交按钮区 -->
        <div class="station-footer" v-if="!formReadOnly">
          <a-space>
            <a-button @click="handleSaveDraft" :loading="savingDraft">保存草稿</a-button>
            <a-button
              type="primary"
              :disabled="stationList.length === 0"
              @click="submitConfirmVisible = true"
            >提交（生成飞检单）</a-button>
          </a-space>
          <span class="draft-tip" v-if="lastSaved">已自动保存 {{ lastSaved }}</span>
        </div>
      </div>
    </div>

    <!-- ── 添加电站弹窗 ── -->
    <a-modal
      v-model:open="addStationVisible"
      title="添加电站"
      width="820px"
      :footer="null"
      destroy-on-close
    >
      <div class="add-station-modal">
        <div class="add-station-filters">
          <a-space wrap>
            <a-input v-model:value="stationFilter.no" placeholder="电站编号" style="width:140px" allowClear />
            <a-input v-model:value="stationFilter.owner" placeholder="业主姓名" style="width:120px" allowClear />
            <a-input v-model:value="stationFilter.agent" placeholder="代理商" style="width:140px" allowClear />
            <a-cascader
              v-model:value="stationFilter.region"
              :options="REGION_OPTIONS"
              placeholder="省/市/区"
              style="width:200px"
              :display-render="({ labels }: any) => labels.join('/')"
              change-on-select
              allowClear
            />
            <a-button type="primary" @click="searchPickerStations">查询</a-button>
            <a-button @click="resetPickerFilter">重置</a-button>
          </a-space>
        </div>
        <a-table
          :columns="pickerColumns"
          :data-source="pickerList"
          :row-selection="rowSelection"
          size="small"
          :pagination="{ pageSize: 8, size: 'small' }"
          row-key="stationId"
          style="margin-top:12px"
          :scroll="{ y: 300 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'stationNo'">
              <div style="display:flex;flex-direction:column;gap:2px">
                <span :class="{ 'disabled-station': isStationExclusive(record) }">{{ record.stationNo }}</span>
                <a-tooltip v-if="isStationExclusive(record)" :title="`已在 ${record.exclusiveBatch} 中`">
                  <span class="exclusive-badge" style="align-self:flex-start">占用中</span>
                </a-tooltip>
              </div>
            </template>
          </template>
        </a-table>
        <div class="add-station-footer">
          <span class="selected-count">已选 {{ selectedStationKeys.length }} 个电站</span>
          <a-space>
            <a-button @click="addStationVisible = false">取消</a-button>
            <a-button type="primary" :disabled="selectedStationKeys.length === 0" @click="confirmAddStations">
              添加到列表
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>

    <!-- ── 提交确认弹窗 ── -->
    <a-modal
      v-model:open="submitConfirmVisible"
      title="确认提交"
      width="400px"
      :ok-loading="submitting"
      ok-text="确认提交"
      cancel-text="取消"
      @ok="handleSubmit"
    >
      <div class="submit-confirm-body">
        <div class="submit-confirm-item">
          <CheckCircleFilled class="confirm-icon" />
          <span>将为 <strong>{{ stationList.length }}</strong> 个电站生成飞检单</span>
        </div>
        <div class="submit-confirm-tip">
          <InfoCircleOutlined style="color:#fa8c16;margin-right:6px" />
          提交后不允许清空电站，如需修改请联系管理员
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { LeftOutlined, PlusOutlined, CheckCircleFilled, InfoCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const props = defineProps<{
  initMode?: 'create' | 'edit'
  initType?: string
  initRow?: any
}>()

const emit = defineEmits<{
  navigate: [target: string, payload?: any]
  back: []
  submitted: [batch: any]
}>()

// ── 状态 ─────────────────────────────────────────────────────────────────
const isEdit = computed(() => props.initMode === 'edit' && !!props.initRow)
const batchType = computed(() => props.initType ?? 'daily')
const formReadOnly = computed(() => isEdit.value && !['draft', 'pending'].includes(formData.status))

const STATUS_LABEL: Record<string, string> = { draft: '草稿', pending: '待检查', checking: '检查中', done: '已验收' }
const statusColor: Record<string, string> = { draft: 'default', pending: 'warning', checking: 'processing', done: 'success' }

const formData = reactive({
  type: (props.initRow?.type ?? props.initType ?? 'daily') as string,
  name: props.initRow?.name ?? '',
  leader: props.initRow?.leader ?? undefined as string | undefined,
  checkDate: props.initRow?.checkDate ? dayjs(props.initRow.checkDate) : null,
  random: props.initRow?.random ?? false,
  sampleRate: props.initRow?.sampleRate ?? 30,
  remark: props.initRow?.remark ?? '',
  status: props.initRow?.status ?? 'draft',
})

const stationList = ref<any[]>(props.initRow?.stations ?? [])
const savingDraft = ref(false)
const submitting = ref(false)
const addStationVisible = ref(false)
const submitConfirmVisible = ref(false)
const lastSaved = ref('')
const selectedStationKeys = ref<string[]>([])

// ── 电站列表列 ────────────────────────────────────────────────────────────
const stationColumns = [
  { title: '#', key: 'idx', width: 50 },
  { title: '电站编号', key: 'stationNo', dataIndex: 'stationNo', width: 185 },
  { title: '业主', dataIndex: 'owner', key: 'owner', width: 110 },
  { title: '代理商', dataIndex: 'agent', key: 'agent', width: 160, ellipsis: true },
  { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
  { title: '飞检工程师', key: 'engineer', width: 150 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
]

const MOCK_POOL_STATIONS = [
  { stationId: 'ps01', stationNo: 'FJZ-2025-001001', owner: '张三', address: '浙江省杭州市余杭区未来科技城', agent: '杭州阳光新能源科技有限公司', exclusiveBatch: null },
  { stationId: 'ps02', stationNo: 'FJZ-2025-001002', owner: '李四', address: '浙江省宁波市鄞州区', agent: '宁波绿能电力安装有限公司', exclusiveBatch: 'FJB-2026-004' },
  { stationId: 'ps03', stationNo: 'FJZ-2025-001003', owner: '王五', address: '江苏省苏州市工业园区', agent: '苏州工业光伏集成商', exclusiveBatch: null },
  { stationId: 'ps04', stationNo: 'FJZ-2025-001004', owner: '赵六', address: '安徽省合肥市蜀山区', agent: '合肥绿色能源技术有限公司', exclusiveBatch: null },
  { stationId: 'ps05', stationNo: 'FJZ-2025-001005', owner: '孙七', address: '浙江省温州市鹿城区', agent: '温州光能工程技术有限公司', exclusiveBatch: 'FJB-2026-004' },
  { stationId: 'ps06', stationNo: 'FJZ-2025-001006', owner: '周八', address: '江苏省南京市江宁区', agent: '南京太阳能科技有限公司', exclusiveBatch: null },
  { stationId: 'ps07', stationNo: 'FJZ-2025-001007', owner: '吴九', address: '浙江省杭州市萧山区', agent: '杭州阳光新能源科技有限公司', exclusiveBatch: null },
  { stationId: 'ps08', stationNo: 'FJZ-2025-001008', owner: '郑十', address: '安徽省芜湖市弋江区', agent: '芜湖清洁能源发展有限公司', exclusiveBatch: null },
  { stationId: 'ps09', stationNo: 'FJZ-2025-001009', owner: '冯一', address: '浙江省宁波市江北区', agent: '宁波绿能电力安装有限公司', exclusiveBatch: null },
  { stationId: 'ps10', stationNo: 'FJZ-2025-001010', owner: '陈二', address: '江苏省苏州市虎丘区', agent: '苏州工业光伏集成商', exclusiveBatch: null },
  { stationId: 'ps11', stationNo: 'FJZ-2025-001011', owner: '褚三', address: '浙江省金华市婺城区', agent: '金华光伏建设集团有限公司', exclusiveBatch: null },
  { stationId: 'ps12', stationNo: 'FJZ-2025-001012', owner: '卫四', address: '安徽省合肥市包河区', agent: '合肥绿色能源技术有限公司', exclusiveBatch: null },
]

// ── 选人弹窗 ──────────────────────────────────────────────────────────────
const stationFilter = reactive({ no: '', owner: '', agent: '', region: [] as string[] })
const pickerList = ref<any[]>([...MOCK_POOL_STATIONS])

const rowSelection = computed(() => ({
  selectedRowKeys: selectedStationKeys.value,
  getCheckboxProps: (record: any) => ({ disabled: isStationExclusive(record) || stationList.value.some(s => s.stationId === record.stationId) }),
  onChange: (keys: string[]) => { selectedStationKeys.value = keys },
}))

const pickerColumns = [
  { title: '电站编号', key: 'stationNo', dataIndex: 'stationNo', width: 160 },
  { title: '业主', dataIndex: 'owner', key: 'owner', width: 100 },
  { title: '地址', dataIndex: 'address', key: 'address', width: 160, ellipsis: true },
  { title: '代理商', dataIndex: 'agent', key: 'agent', width: 150, ellipsis: true },
]

function isStationExclusive(record: any) {
  // 模拟：FJB-2026-004 进行中，占用了部分电站
  return record.exclusiveBatch != null
}

function searchPickerStations() {
  let list = [...MOCK_POOL_STATIONS]
  if (stationFilter.no) list = list.filter(s => s.stationNo.includes(stationFilter.no))
  if (stationFilter.owner) list = list.filter(s => s.owner.includes(stationFilter.owner))
  if (stationFilter.agent) list = list.filter(s => s.agent.includes(stationFilter.agent))
  pickerList.value = list
}

function resetPickerFilter() {
  stationFilter.no = ''
  stationFilter.owner = ''
  stationFilter.agent = ''
  stationFilter.region = []
  pickerList.value = [...MOCK_POOL_STATIONS]
  selectedStationKeys.value = []
}

function confirmAddStations() {
  const toAdd = MOCK_POOL_STATIONS.filter(s => selectedStationKeys.value.includes(s.stationId) && !stationList.value.some(e => e.stationId === s.stationId))
  stationList.value.push(...toAdd)
  selectedStationKeys.value = []
  addStationVisible.value = false
  message.success(`已添加 ${toAdd.length} 个电站`)
}

function removeStation(stationId: string) {
  stationList.value = stationList.value.filter(s => s.stationId !== stationId)
}

function handleClearStations() {
  stationList.value = []
}

function onEngineerChange(record: any, val: string) {
  const eng = ENGINEER_OPTIONS.find(e => e.value === val)
  record.engineerName = eng?.label ?? ''
}

// ── 草稿保存 ──────────────────────────────────────────────────────────────
async function handleSaveDraft() {
  savingDraft.value = true
  await new Promise(r => setTimeout(r, 400))
  savingDraft.value = false
  lastSaved.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  message.success('草稿已保存')
}

// 自动保存
watch(stationList, () => {
  if (stationList.value.length > 0) {
    setTimeout(async () => {
      await handleSaveDraft()
    }, 2000)
  }
}, { deep: true })

// ── 提交 ──────────────────────────────────────────────────────────────────
async function handleSubmit() {
  if (!formData.leader) { message.error('请选择小组负责人'); return }
  if (!formData.checkDate) { message.error('请选择飞检日期'); return }
  const unassigned = stationList.value.filter(s => !s.engineerId)
  if (unassigned.length > 0) {
    message.warning(`还有 ${unassigned.length} 个电站未分配飞检工程师，建议先分配再提交`)
  }
  submitting.value = true
  await new Promise(r => setTimeout(r, 600))
  submitting.value = false
  submitConfirmVisible.value = false
  message.success('提交成功，飞检单已生成')
  const newBatch = {
    id: 'b' + Date.now(),
    batchNo: 'FJB-2026-' + String(Math.floor(Math.random() * 900) + 100),
    type: formData.type,
    name: formData.name,
    leader: formData.leader,
    checkDate: formData.checkDate ? formData.checkDate.format('YYYY-MM-DD') : '',
    stationCount: stationList.value.length,
    passCount: null,
    passRate: null,
    status: 'pending',
    autoGenerated: false,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
  }
  emit('submitted', newBatch)
}

function handleBack() {
  emit('back')
}

// ── 静态数据 ──────────────────────────────────────────────────────────────
const LEADER_OPTIONS = [
  { label: '王建国', value: '王建国' },
  { label: '李志远', value: '李志远' },
  { label: '张晓云', value: '张晓云' },
  { label: '陈明海', value: '陈明海' },
]

const ENGINEER_OPTIONS = [
  { label: '赵飞', value: 'eng01' },
  { label: '刘海', value: 'eng02' },
  { label: '黄磊', value: 'eng03' },
  { label: '周斌', value: 'eng04' },
  { label: '吴杰', value: 'eng05' },
]

const REGION_OPTIONS = [
  { label: '浙江省', value: 'zj', children: [
    { label: '杭州市', value: 'hz', children: [{ label: '余杭区', value: 'yh' }, { label: '萧山区', value: 'xs' }] },
    { label: '宁波市', value: 'nb' },
    { label: '温州市', value: 'wz' },
  ]},
  { label: '江苏省', value: 'js', children: [
    { label: '南京市', value: 'nj' },
    { label: '苏州市', value: 'sz' },
  ]},
  { label: '安徽省', value: 'ah', children: [
    { label: '合肥市', value: 'hf' },
    { label: '芜湖市', value: 'wh' },
  ]},
]

</script>

<style scoped>
.batch-edit-page { display: flex; flex-direction: column; height: calc(100vh - 82px); overflow: hidden; }

.batch-edit-header {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px;
  background: #fff; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.batch-edit-title { font-size: 15px; font-weight: 600; color: #262626; }

.batch-edit-body {
  display: flex; flex: 1; gap: 12px; padding: 14px 16px; overflow: hidden;
}

/* 基础信息卡 */
.batch-info-card {
  width: 360px; flex-shrink: 0; background: #fff; border-radius: 8px;
  padding: 20px 24px; overflow-y: auto;
}

/* 电站卡片 */
.batch-station-card {
  flex: 1; background: #fff; border-radius: 8px; padding: 20px 24px;
  display: flex; flex-direction: column; gap: 0; overflow: hidden; min-width: 0;
}

.card-section-title { font-size: 16px; font-weight: 600; color: #262626; margin-bottom: 0; }

.station-card-header {
  display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-bottom: 16px;
}

.station-count-badge {
  font-size: 13px; color: #8c8c8c;
  background: #f5f5f5; padding: 1px 8px; border-radius: 10px;
}

.station-footer {
  display: flex; align-items: center; gap: 16px; padding-top: 16px; margin-top: 16px;
  border-top: 1px solid #f0f0f0; flex-shrink: 0;
}

.draft-tip { font-size: 12px; color: #8c8c8c; }
.batch-station-card :deep(.ant-table-tbody > tr > td) { height: 56px; padding-top: 0; padding-bottom: 0; }

/* 添加电站弹窗 */
.add-station-modal { padding: 4px 0; }
.add-station-filters { }
.add-station-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0;
}
.selected-count { font-size: 14px; color: #3060FF; font-weight: 500; }
.disabled-station { color: #bfbfbf; }
.exclusive-badge {
  margin-left: 6px; font-size: 11px; color: #ff7a45;
  background: rgba(255,122,69,0.1); padding: 0 5px; border-radius: 3px;
}

/* 飞检类型单选 */
.fake-radio-group { display: flex; gap: 20px; }
.fake-radio { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; color: #262626; cursor: pointer; user-select: none; line-height: 1; }
.fake-radio.disabled { cursor: not-allowed; opacity: 0.5; }
.fake-radio-dot {
  width: 14px; height: 14px; border-radius: 50%; border: 3px solid #d9d9d9;
  background: #fff; flex-shrink: 0; transition: border-color 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.fake-radio-inner {
  width: 7px; height: 7px; border-radius: 50%; background: transparent; transition: background 0.15s;
}
.fake-radio-dot.checked { border-color: #3060FF; border-width: 3px; }
.fake-radio-dot.checked .fake-radio-inner { background: transparent; }

/* 提交确认 */
.submit-confirm-body { padding: 8px 0; }
.submit-confirm-item {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; color: #262626; margin-bottom: 12px;
}
.confirm-icon { color: #52c41a; font-size: 20px; }
.submit-confirm-tip {
  padding: 8px 12px; background: #fffbe6; border: 1px solid #ffe58f;
  border-radius: 4px; font-size: 13px; color: #ad6800;
}
</style>
