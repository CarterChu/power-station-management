<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { UploadChangeParam, UploadFile, UploadProps } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'

// ── Types ─────────────────────────────────────────────────────────────────

interface AttestationRow {
  key: string
  materialCode: string
  materialName: string
  serialNo: string
  validationCode: string
  validationMessage: string
  /** 系统自动带出的佐证种类 */
  attestationReason: string
  attestationSubmitted?: boolean
  attestationSource?: 'app' | 'user'
  /** 轨迹链接 URL，由供应链接口返回 */
  trajectoryUrl?: string
  /** 加载轨迹链接时的状态 */
  trajectoryStatus: 'loading' | 'ready' | 'error'
  /** 用户上传的佐证照片（1 必填，最多 2 张） */
  photos: UploadFile[]
}

// ── Props / Emits ──────────────────────────────────────────────────────────

const props = defineProps<{
  open: boolean
  rows: Array<{
    key: string
    materialCode: string
    materialName: string
    serialNo: string
    validationCode?: string
    validationMessage?: string
    attestationReason?: string
    attestationSubmitted?: boolean
    attestationSource?: 'app' | 'user'
    /** 之前已提交过的佐证照片；重新打开「已佐证」记录时用来还原上传状态 */
    photos?: UploadFile[]
  }>
  /** 提交佐证的 API */
  onSubmitAttestation: (data: AttestationRow[]) => Promise<void>
  /** 这批序列号是否已经提交过佐证（查看态）：按钮文案变「知道了」，点击只关闭弹窗，不重新提交 */
  alreadySubmitted?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  /** 携带本次提交的佐证数据（含照片），方便外部记录「已佐证」状态 */
  submitted: [rows: AttestationRow[]]
}>()

// ── State ──────────────────────────────────────────────────────────────────

const attestationList = ref<AttestationRow[]>([])
const submitting = ref(false)
const hasEdited = ref(false)

/** 当前预览的序列号 key（用于左侧选中高亮） */
const activeKey = ref<string>('')

const activeRow = computed(() =>
  attestationList.value.find((r) => r.key === activeKey.value) ?? attestationList.value[0]
)

/** 弹窗标题和触发它的按钮文案保持一致 */
const modalTitle = computed(() =>
  props.alreadySubmitted ? `已佐证（${props.rows.length} 条）` : `未佐证（${props.rows.length} 条）`
)

const okText = computed(() =>
  props.alreadySubmitted && !hasEdited.value ? '知道了' : '确认提交佐证'
)

const showCancel = computed(() =>
  !props.alreadySubmitted || hasEdited.value
)

// ── Watchers ───────────────────────────────────────────────────────────────

watch(
  () => props.open,
  async (val) => {
    if (!val) { hasEdited.value = false; return }
    hasEdited.value = false
    // 初始化：将传入的行数据转换为佐证列表，并异步加载轨迹链接
    attestationList.value = props.rows.map((r) => ({
      ...r,
      validationCode: r.validationCode ?? '',
      validationMessage: r.validationMessage ?? '',
      attestationReason: r.attestationReason ?? '',
      trajectoryUrl: undefined,
      trajectoryStatus: 'loading' as const,
      photos: r.photos ?? [],
    }))
    activeKey.value = attestationList.value[0]?.key ?? ''
    // 并行加载所有序列号的轨迹链接
    attestationList.value.forEach((row) => loadTrajectory(row))
  }
)

// ── Methods ────────────────────────────────────────────────────────────────

async function loadTrajectory(row: AttestationRow) {
  try {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600))
    row.trajectoryUrl = row.serialNo  // 用序列号标记"已就绪"
    row.trajectoryStatus = 'ready'
  } catch {
    row.trajectoryStatus = 'error'
  }
}

// ── 轨迹弹窗 ──────────────────────────────────────────────────────────────

const trajectoryOpen = ref(false)
const trajectorySerialNo = ref('')
const trajectoryPalletNo = ref('')

interface TrajectoryRecord {
  palletNo: string
  materialCode: string
  materialName: string
  serialNo: string
  orderType: string
  status: string
  warehouse: string
  flowNo: string
  stationCode: string
  operateTime: string
}

const MOCK_TRAJECTORY: TrajectoryRecord[] = [
  { palletNo: 'GKAI110212511004 18', materialCode: '2010012092', materialName: '730W33FC边框-J7-BH', serialNo: '', orderType: '安能发货单', status: '代理商已签收', warehouse: '广东润宇廉江仓库2', flowNo: 'FH251112345884', stationCode: '', operateTime: '2025-11-19 16:20:20' },
  { palletNo: 'GKAI110212511004 18', materialCode: '2010012092', materialName: 'CHSM78RN(DG/F-730W33FC边框-J7-BH', serialNo: '', orderType: '安能拣配单', status: '安能已拣配', warehouse: '安能南宁材料仓', flowNo: 'FH251112345884', stationCode: '', operateTime: '2025-11-14 10:23:22' },
  { palletNo: 'GKAI110212511004 18', materialCode: '2010012092', materialName: 'CHSM78RN(DG/F-730W33FC边框-J7-BH', serialNo: '', orderType: '安能发货单', status: '安能已发货', warehouse: '安能南宁材料仓', flowNo: 'FH251112345884', stationCode: '', operateTime: '2025-11-14 10:23:22' },
  { palletNo: 'GKAI110212511004 18', materialCode: '2010012092', materialName: 'CHSM78RN(DG/F-730W33FC边框-J7-BH', serialNo: '', orderType: '安能拣配单', status: '安能拣配中', warehouse: '安能南宁材料仓', flowNo: 'FH251112345884', stationCode: '', operateTime: '2025-11-13 15:57:47' },
  { palletNo: 'GKAI110212511004 18', materialCode: '2010012092', materialName: 'CHSM78RN(DG/F-730W33FC边框-J7-BH', serialNo: '', orderType: '安能收货单', status: '安能已入库', warehouse: '安能南宁材料仓', flowNo: 'DH10633248', stationCode: '', operateTime: '2025-11-09 17:09:04' },
  { palletNo: 'GKAI110212511004 18', materialCode: '2010012092', materialName: 'CHSM78RN(DG/F-730W33FC边框-J7-BH', serialNo: '', orderType: '供应商发货单', status: '供应商已发货', warehouse: '广州基景广州材料仓', flowNo: 'SG10576767', stationCode: '', operateTime: '2025-11-08 01:28:51' },
  { palletNo: 'GKAI110212511004 18', materialCode: '2010012092', materialName: 'CHSM78RN(DG/F-730W33FC边框-J7-BH', serialNo: '', orderType: '采购订单', status: '已入库', warehouse: '供应商仓库', flowNo: 'PO10234512', stationCode: '', operateTime: '2025-11-01 09:00:00' },
]

const trajectoryData = computed<TrajectoryRecord[]>(() => {
  return MOCK_TRAJECTORY.map((r) => ({ ...r, serialNo: trajectorySerialNo.value }))
})

function openTrajectory(row: AttestationRow) {
  if (row.trajectoryStatus !== 'ready') return
  trajectorySerialNo.value = row.serialNo
  trajectoryPalletNo.value = ''
  trajectoryOpen.value = true
}

const trajectoryColumns = [
  { title: '托盘号',   dataIndex: 'palletNo',      ellipsis: true },
  { title: '物料编码', dataIndex: 'materialCode',   ellipsis: true },
  { title: '物料名称', dataIndex: 'materialName',   ellipsis: true },
  { title: '序列号',   dataIndex: 'serialNo',       ellipsis: true },
  { title: '单据类型', dataIndex: 'orderType',      ellipsis: true },
  { title: '状态',     dataIndex: 'status',         ellipsis: true },
  { title: '仓库',     dataIndex: 'warehouse',      ellipsis: true },
  { title: '流程单号', dataIndex: 'flowNo',         ellipsis: true },
  { title: '电站编码', dataIndex: 'stationCode',    ellipsis: true },
  { title: '操作时间', dataIndex: 'operateTime',    ellipsis: true, width: 160 },
]

function handleUploadChange(row: AttestationRow, info: { fileList: UploadFile[] }) {
  row.photos = info.fileList.slice(0, 2)
  hasEdited.value = true
}

function validateBeforeSubmit(): boolean {
  for (const row of attestationList.value) {
    if (!row.photos.length) {
      message.warning(`「${row.serialNo}」至少需要上传 1 张佐证照片`)
      activeKey.value = row.key
      return false
    }
  }
  return true
}

async function handleOk() {
  if (props.alreadySubmitted && !hasEdited.value) {
    emit('update:open', false)
    return
  }
  if (!validateBeforeSubmit()) return
  submitting.value = true
  try {
    await props.onSubmitAttestation(attestationList.value)
    emit('update:open', false)
    emit('submitted', attestationList.value)
  } catch {
    message.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 照片上传前校验（限制 5MB）
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) message.error('照片不超过 5MB')
  return isLt5M ? false : false  // 返回 false 阻止自动上传，手动管理
}

// 状态颜色
const attestationStatusColor: Record<string, string> = {
  OCCUPIED:            '#1677ff',
  DUPLICATE_ATTEST:    '#1677ff',
}
function getStatusColor(code: string) {
  return attestationStatusColor[code] ?? '#1677ff'
}
</script>

<template>
  <a-modal
    :open="open"
    :title="modalTitle"
    width="680px"
    :confirm-loading="submitting"
    :ok-text="okText"
    cancel-text="取消"
    :cancel-button-props="showCancel ? undefined : { style: { display: 'none' } }"
    :destroy-on-close="true"
    @ok="handleOk"
    @cancel="emit('update:open', false)"
  >
    <div class="attestation-modal">
      <!-- ── 左侧：序列号列表 ────────────────────────────────────── -->
      <div class="attest-sidebar">
        <div
          v-for="row in attestationList"
          :key="row.key"
          class="attest-sidebar__item"
          :class="{ 'is-active': row.key === activeKey }"
          @click="activeKey = row.key"
        >
          <div class="sidebar-item__sn">{{ row.serialNo }}</div>
          <div class="sidebar-item__tag">
            <a-tag :color="getStatusColor(row.validationCode)" style="margin: 0">
              {{ row.attestationSubmitted
                ? '已佐证'
                : (row.attestationReason || row.validationMessage) }}
            </a-tag>
          </div>
          <!-- 照片上传完成标记 -->
          <div v-if="row.photos.length" class="sidebar-item__done">
            <a-badge status="success" :text="`已上传 ${row.photos.length} 张`" />
          </div>
          <div v-else class="sidebar-item__pending">
            <a-badge status="warning" text="待上传" />
          </div>
        </div>
      </div>

      <!-- ── 右侧：当前序列号佐证详情 ─────────────────────────────── -->
      <div v-if="activeRow" class="attest-content">

        <!-- 序列号基本信息 -->
        <a-descriptions :column="1" size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="序列号">
            <div class="serial-value-block">
              <strong>{{ activeRow.serialNo }}</strong>
              <div class="trajectory-inline">
                <template v-if="activeRow.trajectoryStatus === 'loading'">
                  <a-spin size="small" />
                  <span style="margin-left: 6px; color: #8c8c8c; font-size: 12px">加载轨迹链接…</span>
                </template>
                <template v-else-if="activeRow.trajectoryStatus === 'ready'">
                  <a-button
                    type="link"
                    style="padding: 0; height: auto; font-size: 12px"
                    @click="openTrajectory(activeRow)"
                  >
                    查看序列号轨迹 →
                  </a-button>
                </template>
                <template v-else>
                  <span style="font-size: 12px; color: #fa8c16">轨迹链接加载失败，可上传照片佐证</span>
                </template>
              </div>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="物料编码">
            {{ activeRow.materialCode }}
          </a-descriptions-item>
          <a-descriptions-item label="物料编号">
            {{ activeRow.materialName }}
          </a-descriptions-item>
          <a-descriptions-item label="异常原因">
            <span style="color: #595959">{{ activeRow.validationMessage }}</span>
          </a-descriptions-item>
        </a-descriptions>

        <a-divider style="margin: 0 0 16px" />

        <!-- 佐证照片 -->
        <div class="photo-section">
          <div class="section-label">
            佐证照片
            <template v-if="!alreadySubmitted">
              <span class="section-hint">（<span class="section-hint--required">必传 1 张</span>，最多 2 张，每张不超过 5MB）</span>
            </template>
          </div>
          <!-- 已佐证：只读查看 -->
          <template v-if="alreadySubmitted">
            <a-image-preview-group>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <a-image
                  v-for="photo in activeRow.photos"
                  :key="photo.uid"
                  :src="photo.url || photo.thumbUrl"
                  :width="96"
                  :height="96"
                  style="object-fit:cover;border-radius:6px;border:1px solid #f0f0f0"
                />
              </div>
            </a-image-preview-group>
            <div v-if="!activeRow.photos.length" style="color:#bfbfbf;font-size:13px;padding:4px 0">暂无照片</div>
          </template>
          <!-- 未佐证：可上传 -->
          <template v-else>
            <a-upload
              v-model:file-list="activeRow.photos"
              list-type="picture-card"
              :max-count="2"
              :before-upload="beforeUpload"
              accept="image/*"
              @change="(info: UploadChangeParam) => handleUploadChange(activeRow, info)"
            >
              <div v-if="activeRow.photos.length < 2">
                <PlusOutlined />
              </div>
            </a-upload>
          </template>
        </div>

      </div>
    </div>
  </a-modal>

  <!-- 序列号轨迹查询弹窗 -->
  <a-modal
    v-model:open="trajectoryOpen"
    title="序列号轨迹查询"
    width="1000px"
    :footer="null"
    destroy-on-close
  >
    <a-space style="margin-bottom: 16px">
      <span style="font-size: 13px; color: #595959">序列号</span>
      <a-input v-model:value="trajectorySerialNo" style="width: 200px" />
      <span style="font-size: 13px; color: #595959">托盘号</span>
      <a-input v-model:value="trajectoryPalletNo" placeholder="请输入" style="width: 160px" />
      <a-button type="primary">查询</a-button>
    </a-space>
    <a-table
      :columns="trajectoryColumns"
      :data-source="trajectoryData"
      :pagination="{ pageSize: 10, showTotal: (total: number) => `共 ${total} 条`, showSizeChanger: false }"
      size="small"
      bordered
      row-key="flowNo"
      :scroll="{ x: 'max-content' }"
    />
  </a-modal>
</template>

<style scoped>
.attestation-modal {
  display: flex;
  gap: 0;
  min-height: 320px;
}

/* 左侧列表 */
.attest-sidebar {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  max-height: 420px;
}

.attest-sidebar__item {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;
  background: #e6f4ff10;
}

.attest-sidebar__item:hover { background: #f5f5f5; }
.attest-sidebar__item.is-active { background: #e6f4ff; }

.sidebar-item__sn {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 2px;
}
.sidebar-item__tag { margin-bottom: 4px; }
.sidebar-item__done,
.sidebar-item__pending { font-size: 12px; }

/* 右侧内容 */
.attest-content {
  flex: 1;
  padding: 4px 20px 4px;
  overflow-y: auto;
  max-height: 420px;
}

.photo-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.section-hint {
  font-size: 12px;
  font-weight: 400;
  color: #8c8c8c;
  margin-left: 4px;
}

.section-hint--required {
  color: #ff4d4f;
}

.serial-value-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.trajectory-inline {
  margin-top: 4px;
  line-height: 1.2;
}
</style>
