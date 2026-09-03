<template>
  <div class="project-list-page">

    <!-- 节点汇总卡片 + 主表格（合并为一张卡片） -->
    <div class="slist-main-card">
      <div class="slist-node-row">
        <div
          v-for="card in nodeCards"
          :key="card.label"
          class="slist-node-card"
          :class="{ active: !nodeMultiSelect && activeNodeCard === card.nodeKey }"
          @click="selectNodeCard(card.nodeKey)"
        >
          <div class="slist-node-label" style="display:flex;align-items:center;gap:4px">
            {{ card.label }}
            <a-tooltip v-if="card.nodeKey === null" title="统计所有电站编号维度的电站数量，非电站节点数量之和" placement="top">
              <QuestionCircleOutlined style="font-size:12px;color:#8c8c8c;cursor:default;position:relative;top:-1px" @click.stop />
            </a-tooltip>
          </div>
          <div class="slist-node-count">{{ card.count }}</div>
        </div>
      </div>

      <AnfeProTable
      ref="tableRef"
      :columns="columns"
      :filters="filters"
      :config="tableConfig"
      :page-size="10"
      :table-props="{ scroll: { x: 1600 } }"
      @search="onTableSearch"
      @reset="onTableReset"
    >
      <!-- 操作栏（操作按钮在右侧） -->
      <template #operationRight>
        <a-space>
          <a-button type="primary" @click="handleCreateFiling">新增建档</a-button>
          <a-button @click="handleExport">导出</a-button>
        </a-space>
      </template>

      <!-- 电站节点状态列 -->
      <template #nodeStatusSlot="{ row }">
        <span class="node-dot-wrap">
          <span class="node-dot" :class="`node-dot--${row.nodeStatus}`"></span>
          {{ NODE_STATUS_LABEL[row.nodeStatus] ?? row.nodeStatus }}
        </span>
      </template>

      <!-- 建档状态列（含审核进度） -->
      <template #filingStatusSlot="{ row }">
        <template v-if="row.nodeStatus === 'stock' && props.variant !== 'B'">
          <a-tooltip v-if="row.filingStatus" :title="FILING_STATUS_LABEL[row.filingStatus]">
            <a-tag :color="STOCK_SIMPLIFIED_TAG_COLOR[stockSimplifiedKey(row.filingStatus)]" style="cursor:default">
              {{ STOCK_SIMPLIFIED_LABEL[stockSimplifiedKey(row.filingStatus)] }}
            </a-tag>
          </a-tooltip>
          <span v-else style="color: #bbb">--</span>
        </template>
        <template v-else>
          <a-tag v-if="row.filingStatus" :color="FILING_STATUS_TAG_COLOR[row.filingStatus]" style="margin:0">
            {{ FILING_STATUS_LABEL[row.filingStatus] }}
          </a-tag>
          <span v-else style="color: #bbb">--</span>
        </template>
      </template>

      <!-- 建档审核状态列 -->
      <template #reviewProgressSlot="{ row }">
        <template v-if="row.filingStatus === 'self_reviewing'">
          <div style="display:flex;flex-direction:column;gap:3px;font-size:13px">
            <span :style="{ color: row.selfReviewProgress?.biz === 'pass' ? '#52c41a' : row.selfReviewProgress?.biz === 'reject' ? '#ff4d4f' : '#8c8c8c' }">
              {{ row.selfReviewProgress?.biz === 'pass' ? '商务自审通过' : row.selfReviewProgress?.biz === 'reject' ? '商务自审不通过' : '商务待自审' }}
            </span>
            <span :style="{ color: row.selfReviewProgress?.tech === 'pass' ? '#52c41a' : row.selfReviewProgress?.tech === 'reject' ? '#ff4d4f' : '#8c8c8c' }">
              {{ row.selfReviewProgress?.tech === 'pass' ? '技术自审通过' : row.selfReviewProgress?.tech === 'reject' ? '技术自审不通过' : '技术待自审' }}
            </span>
          </div>
        </template>
        <template v-else-if="row.filingStatus === 'pending_review'">
          <div style="display:flex;flex-direction:column;gap:3px;font-size:13px">
            <span :style="{ color: row.platformReviewProgress?.biz === 'pass' ? '#52c41a' : row.platformReviewProgress?.biz === 'reject' ? '#ff4d4f' : '#8c8c8c' }">
              {{ row.platformReviewProgress?.biz === 'pass' ? '平台商务审核通过' : row.platformReviewProgress?.biz === 'reject' ? '平台商务审核不通过' : '平台商务待审核' }}
            </span>
            <span :style="{ color: row.platformReviewProgress?.tech === 'pass' ? '#52c41a' : row.platformReviewProgress?.tech === 'reject' ? '#ff4d4f' : '#8c8c8c' }">
              {{ row.platformReviewProgress?.tech === 'pass' ? '平台技术审核通过' : row.platformReviewProgress?.tech === 'reject' ? '平台技术审核不通过' : '平台技术待审核' }}
            </span>
          </div>
        </template>
        <template v-else-if="row.filingStatus === 'filing_approved'">
          <div style="display:flex;flex-direction:column;gap:3px;font-size:13px">
            <span style="color:#52c41a">平台商务审核通过</span>
            <span style="color:#52c41a">平台技术审核通过</span>
          </div>
        </template>
        <template v-else-if="row.filingStatus === 'filing_self_rejected'">
          <div style="display:flex;flex-direction:column;gap:3px;font-size:13px">
            <span style="color:#ff4d4f">商务自审不通过</span>
            <span style="color:#ff4d4f">技术自审不通过</span>
          </div>
        </template>
        <template v-else-if="row.filingStatus === 'filing_platform_rejected'">
          <div style="display:flex;flex-direction:column;gap:3px;font-size:13px">
            <span style="color:#ff4d4f">平台商务审核不通过</span>
            <span style="color:#ff4d4f">平台技术审核不通过</span>
          </div>
        </template>
        <span v-else style="color:#8c8c8c">--</span>
      </template>

      <!-- 行操作列 -->
      <template #actionSlot="{ row }">
        <a-space :size="0">
          <a-button
            v-if="row.nodeStatus === 'start' && row.filingStatus === 'waiting_start'"
            type="link"
            size="small"
            @click="handleApplyStart(row)"
          >开工申请</a-button>

          <a-button
            v-if="row.nodeStatus === 'stock' && row.filingStatus === 'waiting_stock'"
            type="link"
            size="small"
            @click="handleApplyStock(row)"
          >{{ props.variant === 'B' ? '去到货' : '到货申请' }}</a-button>

          <a-button
            v-if="row.nodeStatus === 'dispatch' && row.filingStatus === 'waiting_dispatch'"
            type="link"
            size="small"
            @click="handleApplyDispatch(row)"
          >去派工</a-button>

          <a-button
            v-if="row.nodeStatus === 'dispatch' && row.filingStatus === 'dispatching'"
            type="link"
            size="small"
            @click="handleApplyDispatch(row)"
          >编辑</a-button>

          <a-button
            v-if="row.nodeStatus === 'complete' && row.filingStatus === 'waiting_complete'"
            type="link"
            size="small"
            @click="handleApplyComplete(row)"
          >完工申请</a-button>

          <a-button
            v-if="row.filingStatus === 'filing'"
            type="link"
            size="small"
            @click="handleEdit(row)"
          >编辑</a-button>

          <a-button
            v-if="['start_rejected', 'complete_rejected', ...FILING_REJECTED_STATUSES].includes(row.filingStatus)"
            type="link"
            size="small"
            @click="handleEdit(row)"
          >修改</a-button>

          <!-- 建档自审中：两行布局，同开工审核 -->
          <template v-if="row.filingStatus === 'self_reviewing'">
            <div style="display:flex;flex-direction:column;gap:0;line-height:1">
              <div style="display:flex">
                <a-button type="link" size="small" style="padding:0 4px" @click="handleDetail(row)">详情</a-button>
                <a-tooltip :title="row.selfReviewProgress?.biz === 'pass' ? '商务自审通过' : row.selfReviewProgress?.biz === 'reject' ? '商务自审不通过' : ''">
                  <span style="display:inline-block"><a-button type="link" size="small" style="padding:0 4px" :style="{ pointerEvents: row.selfReviewProgress?.biz ? 'none' : 'auto' }" :disabled="!!row.selfReviewProgress?.biz" @click="handleSelfReview(row, 'biz')">商务自审</a-button></span>
                </a-tooltip>
              </div>
              <div style="display:flex">
                <a-tooltip :title="row.selfReviewProgress?.tech === 'pass' ? '技术自审通过' : row.selfReviewProgress?.tech === 'reject' ? '技术自审不通过' : ''">
                  <span style="display:inline-block"><a-button type="link" size="small" style="padding:0 4px" :style="{ pointerEvents: row.selfReviewProgress?.tech ? 'none' : 'auto' }" :disabled="!!row.selfReviewProgress?.tech" @click="handleSelfReview(row, 'tech')">技术自审</a-button></span>
                </a-tooltip>
                <a-button v-if="row.selfReviewProgress?.biz === 'reject' || row.selfReviewProgress?.tech === 'reject'" type="link" size="small" style="padding:0 4px" @click="handleEdit(row)">修改</a-button>
              </div>
            </div>
          </template>

          <!-- 建档审核通过 -->
          <a-button v-if="row.filingStatus === 'filing_approved'" type="link" size="small" style="padding:0 4px" @click="handleDetail(row)">详情</a-button>

          <!-- 建档自审不通过 / 建档审核不通过：详情 + 修改 -->
          <template v-if="row.filingStatus === 'filing_self_rejected' || row.filingStatus === 'filing_platform_rejected'">
            <a-button type="link" size="small" style="padding:0 4px" @click="handleDetail(row)">详情</a-button>
            <a-button type="link" size="small" style="padding:0 4px" @click="handleEdit(row)">修改</a-button>
          </template>

          <!-- 建档平台审核中：两行布局 -->
          <template v-if="row.filingStatus === 'pending_review'">
            <div style="display:flex;flex-direction:column;gap:0;line-height:1">
              <div style="display:flex">
                <a-button type="link" size="small" style="padding:0 4px" @click="handleDetail(row)">详情</a-button>
                <a-tooltip :title="row.platformReviewProgress?.tech === 'pass' ? '技术平台审核通过' : row.platformReviewProgress?.tech === 'reject' ? '技术平台审核不通过' : ''">
                  <span style="display:inline-block"><a-button type="link" size="small" style="padding:0 4px" :style="{ pointerEvents: row.platformReviewProgress?.tech ? 'none' : 'auto' }" :disabled="!!row.platformReviewProgress?.tech" @click="handlePlatformReview(row, 'tech')">技术审核</a-button></span>
                </a-tooltip>
              </div>
              <div style="display:flex">
                <a-button v-if="row.platformReviewProgress?.biz === 'reject' || row.platformReviewProgress?.tech === 'reject'" type="link" size="small" style="padding:0 4px" @click="handleEdit(row)">修改</a-button>
              </div>
            </div>
          </template>

          <a-button
            v-if="row.nodeStatus === 'stock' && ['reviewing_stock', 'partial_stock', 'partial_stock_rejected', 'full_stock_rejected'].includes(row.filingStatus)"
            type="link"
            size="small"
            @click="handleEdit(row)"
          >编辑</a-button>

          <!-- B版开工审核中：详情 + 三角色审核按钮 -->
          <template v-if="props.variant === 'B' && row.nodeStatus === 'start' && row.filingStatus === 'applying_start'">
            <div style="display:flex;flex-direction:column;gap:0;line-height:1">
              <div style="display:flex">
                <a-button type="link" size="small" style="padding:0 4px" @click="handleDetail(row)">详情</a-button>
                <a-tooltip :title="row.reviewProgress?.biz === 'pass' ? '商务审核通过' : row.reviewProgress?.biz === 'reject' ? '商务审核不通过' : ''">
                  <span style="display:inline-block"><a-button type="link" size="small" style="padding:0 4px" :style="{ pointerEvents: row.reviewProgress?.biz ? 'none' : 'auto' }" :disabled="!!row.reviewProgress?.biz" @click="handleReview(row, 'biz')">商务审核</a-button></span>
                </a-tooltip>
              </div>
              <div style="display:flex">
                <a-tooltip :title="row.reviewProgress?.tech === 'pass' ? '技术审核通过' : row.reviewProgress?.tech === 'reject' ? '技术审核不通过' : ''">
                  <span style="display:inline-block"><a-button type="link" size="small" style="padding:0 4px" :style="{ pointerEvents: row.reviewProgress?.tech ? 'none' : 'auto' }" :disabled="!!row.reviewProgress?.tech" @click="handleReview(row, 'tech')">技术审核</a-button></span>
                </a-tooltip>
                <a-tooltip :title="row.reviewProgress?.eng === 'pass' ? '工程审核通过' : row.reviewProgress?.eng === 'reject' ? '工程审核不通过' : ''">
                  <span style="display:inline-block"><a-button type="link" size="small" style="padding:0 4px" :style="{ pointerEvents: row.reviewProgress?.eng ? 'none' : 'auto' }" :disabled="!!row.reviewProgress?.eng" @click="handleReview(row, 'eng')">工程审核</a-button></span>
                </a-tooltip>
              </div>
            </div>
          </template>

          <a-button
            v-else-if="row.filingStatus && ['applying_start', 'reviewing_complete', 'reviewing_stock'].includes(row.filingStatus)"
            type="link"
            size="small"
            @click="handleDetail(row)"
          >详情(审核)</a-button>

          <a-button
            v-else-if="row.filingStatus && !['filing','self_reviewing','pending_review','filing_approved','filing_self_rejected','filing_platform_rejected','waiting_start','waiting_stock','waiting_dispatch','waiting_complete'].includes(row.filingStatus)"
            type="link"
            size="small"
            @click="handleDetail(row)"
          >详情</a-button>
        </a-space>
      </template>
    </AnfeProTable>
    </div>

    <!-- 项目类型确认 Drawer -->
    <a-drawer
      v-model:open="policyModalVisible"
      title="项目类型确认"
      :width="480"
      placement="right"
      destroy-on-close
      @after-open-change="(v) => { if (!v) resetModal() }"
    >
      <a-form ref="modalFormRef" :model="modalForm">

        <!-- 项目类型 -->
        <div class="drawer-field-label"><span class="drawer-required">*</span>项目类型</div>
        <div class="drawer-card-row">
          <div class="drawer-card" :class="{ active: modalForm.projectType === 'public_emc' }"
            @click="modalForm.projectType = 'public_emc'; modalForm.policyMatched = true; modalForm.oaNo = ''; modalForm.region = []; modalAuthPassed = null">
            <div class="drawer-card-title">公建 EMC</div>
            <div class="drawer-card-desc">可选标准政策或非标准政策，根据政策匹配情况决定流程</div>
          </div>
          <div class="drawer-card" :class="{ active: modalForm.projectType === 'emc' }"
            @click="modalForm.projectType = 'emc'; modalForm.policyMatched = false; modalForm.oaNo = ''; modalAuthPassed = null">
            <div class="drawer-card-title">常规 EMC</div>
            <div class="drawer-card-desc">固定非标政策，需关联立项 OA 编号</div>
          </div>
        </div>

        <!-- 政策匹配：公建 EMC 可选，常规 EMC 固定非标 -->
        <template v-if="modalForm.projectType">
          <div class="drawer-field-label" style="margin-top:20px">
            <span class="drawer-required" v-if="modalForm.projectType === 'public_emc'">*</span>政策匹配
          </div>
          <template v-if="modalForm.projectType === 'public_emc'">
            <div class="drawer-card-row">
              <div class="drawer-card" :class="{ active: modalForm.policyMatched }"
                @click="modalForm.policyMatched = true; modalForm.oaNo = ''; modalAuthPassed = null">
                <div class="drawer-card-title">标准政策</div>
                <div class="drawer-card-desc">按区域标准政策签约，根据项目地区匹配 MTO 渠道授权</div>
              </div>
              <div class="drawer-card" :class="{ active: !modalForm.policyMatched }"
                @click="modalForm.policyMatched = false; modalForm.region = []; modalAuthPassed = null">
                <div class="drawer-card-title">非标政策</div>
                <div class="drawer-card-desc">基于 OA 合同单据，带入项目信息</div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="drawer-card-row">
              <div class="drawer-card active" style="cursor:default;flex:0 0 calc(50% - 6px);">
                <div class="drawer-card-title">非标政策</div>
                <div class="drawer-card-desc">基于 OA 合同单据，带入项目信息</div>
              </div>
            </div>
          </template>
        </template>

        <!-- 公建 EMC + 标准政策：项目地区 + 授权校验 -->
        <template v-if="modalForm.projectType === 'public_emc' && modalForm.policyMatched">
          <div class="drawer-field-label" style="margin-top:20px"><span class="drawer-required">*</span>项目地区</div>
          <a-cascader
            v-model:value="modalForm.region"
            :options="MODAL_REGION_OPTIONS"
            placeholder="请选择省 / 市 / 区"
            style="width:100%"
            @change="handleModalRegionChange"
          />
          <div style="margin-top:10px">
            <template v-if="!modalForm.region?.length">
              <span class="field-hint">请先选择项目地区</span>
            </template>
            <template v-else-if="modalAuthChecking">
              <a-spin size="small" /><span class="field-hint" style="margin-left:8px">校验中…</span>
            </template>
            <template v-else-if="modalAuthPassed === true">
              <a-badge status="success" /><span style="color:#16a34a;margin-left:4px">已授权，可在此地区建档</span>
            </template>
            <template v-else-if="modalAuthPassed === false">
              <a-badge status="error" /><span style="color:#dc2626;margin-left:4px">该地区代理商未授权，无法建档</span>
            </template>
          </div>
        </template>

        <!-- 非标政策（公建非标 或 常规 EMC）：立项OA编号 -->
        <template v-if="modalForm.projectType && (!modalForm.policyMatched || modalForm.projectType === 'emc')">
          <div class="drawer-field-label" style="margin-top:20px"><span class="drawer-required">*</span>立项OA编号</div>
          <div class="oa-field-wrap">
            <div class="oa-selector-wrap" @click="oaDropdownOpen = !oaDropdownOpen">
              <span v-if="modalForm.oaNo" class="oa-selector-val">{{ modalForm.oaNo }}</span>
              <span v-else class="oa-selector-placeholder">请选择</span>
              <DownOutlined class="oa-selector-arrow" :class="{ open: oaDropdownOpen }" />
            </div>
            <div v-if="modalForm.oaNo" class="oa-selected-name">{{ modalForm.projectName }}</div>
            <div v-if="oaDropdownOpen" class="oa-dropdown">
              <a-table :columns="oaColumns" :data-source="OA_MOCK" :pagination="false" size="small">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'info'">
                    <div class="oa-cell-name">{{ record.projectName }}</div>
                    <a-tag v-if="record.linkedStationNo" color="warning" style="font-size:11px;padding:0 4px;line-height:18px;margin:2px 0 0">已关联 {{ record.linkedStationNo }}</a-tag>
                    <div class="oa-cell-no">{{ record.oaNo }}</div>
                  </template>
                  <template v-if="column.key === 'action'">
                    <a-button type="link" size="small" @click.stop="selectOa(record)">选择</a-button>
                  </template>
                </template>
              </a-table>
            </div>
          </div>
        </template>
      </a-form>

      <template #footer>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <a-button @click="policyModalVisible = false">取消</a-button>
          <a-button type="primary" @click="confirmFiling">确认去建档</a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, computed, onMounted, nextTick, watch } from 'vue'
import { sharedStockRecords, hasUserSubmittedRecords } from '../stores/stockRecords'
import { stationStatusOverrides, startReviewProgress, filingReviewProgress } from '../stores/stationStatus'

const props = defineProps<{ variant?: string }>()
const emit = defineEmits<{ navigate: [target: string, payload?: any] }>()
import { message, Modal, Tooltip } from 'ant-design-vue'
import { RightOutlined, DownOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'
import { AnfeProTable } from '@anfe/vue-pro-components'

// ─── 地区选项（弹窗用） ────────────────────────────────────────────────────────

const MODAL_REGION_OPTIONS = [
  { value: '浙江省', label: '浙江省', children: [
    { value: '杭州市', label: '杭州市', children: [
      { value: '滨江区', label: '滨江区' }, { value: '余杭区', label: '余杭区' },
      { value: '萧山区', label: '萧山区' }, { value: '西湖区', label: '西湖区' },
    ]},
    { value: '宁波市', label: '宁波市', children: [
      { value: '鄞州区', label: '鄞州区' }, { value: '江北区', label: '江北区' }, { value: '北仑区', label: '北仑区' },
    ]},
    { value: '温州市', label: '温州市', children: [
      { value: '鹿城区', label: '鹿城区' }, { value: '瓯海区', label: '瓯海区' },
    ]},
  ]},
  { value: '江苏省', label: '江苏省', children: [
    { value: '苏州市', label: '苏州市', children: [
      { value: '工业园区', label: '工业园区' }, { value: '吴中区', label: '吴中区' }, { value: '相城区', label: '相城区' },
    ]},
    { value: '南京市', label: '南京市', children: [
      { value: '江宁区', label: '江宁区' }, { value: '栖霞区', label: '栖霞区' },
    ]},
    { value: '无锡市', label: '无锡市', children: [
      { value: '惠山区', label: '惠山区' }, { value: '新吴区', label: '新吴区' },
    ]},
  ]},
  { value: '上海市', label: '上海市', children: [
    { value: '上海市', label: '上海市', children: [
      { value: '松江区', label: '松江区' }, { value: '闵行区', label: '闵行区' }, { value: '奉贤区', label: '奉贤区' },
    ]},
  ]},
]

// ─── 节点卡片 ─────────────────────────────────────────────────────────────────

const nodeCards = computed(() => {
  const counts: Record<string, number> = {}
  for (const r of MOCK_LIST) {
    counts[r.nodeStatus] = (counts[r.nodeStatus] ?? 0) + 1
  }
  const nodes = ['filing', 'start', 'stock', 'dispatch', 'complete', 'grid', 'done']
  const labels: Record<string, string> = { filing: '建档', start: '开工', stock: '到货', dispatch: '派工', complete: '完工', grid: '并网', done: '竣工' }
  return [
    { label: '全部', nodeKey: null, count: MOCK_LIST.length },
    ...nodes.map(k => ({ label: labels[k], nodeKey: k, count: counts[k] ?? 0 })),
  ]
})

const NODE_STATUS_COLOR: Record<string, string> = {
  filing: 'blue', start: 'green', stock: 'orange',
  dispatch: 'geekblue', complete: 'cyan', grid: 'purple', done: 'default',
}
const NODE_STATUS_LABEL: Record<string, string> = {
  filing: '建档', start: '开工', stock: '到货',
  dispatch: '派工', complete: '完工', grid: '并网', done: '竣工',
}
const FILING_STATUS_BADGE: Record<string, 'processing' | 'error' | 'default' | 'success'> = {
  filing: 'processing', self_reviewing: 'processing', pending_review: 'processing', rejected: 'error',
  waiting_start: 'default', applying_start: 'processing', start_rejected: 'error', started: 'success',
  waiting_stock: 'default', reviewing_stock: 'processing', partial_stock: 'processing', full_stock: 'success',
  partial_stock_rejected: 'error', full_stock_rejected: 'error',
  waiting_dispatch: 'default', dispatching: 'processing', dispatched: 'success',
}
const FILING_STATUS_LABEL: Record<string, string> = {
  filing: '建档中', self_reviewing: '建档自审中', pending_review: '建档平台审核中', filing_approved: '建档审核通过',
  filing_self_rejected: '建档自审不通过', filing_platform_rejected: '建档审核不通过',
  waiting_start: '待开工', applying_start: '开工审核中', start_rejected: '开工审核不通过', started: '已开工',
  waiting_stock: '待到货', reviewing_stock: '到货审核中', partial_stock: '部分已到货', full_stock: '全部已到货',
  partial_stock_rejected: '部分到货审核不通过', full_stock_rejected: '全部到货审核不通过',
  waiting_complete: '待完工', reviewing_complete: '完工审核中', complete_rejected: '完工审核不通过', completed: '已完工',
  waiting_dispatch: '待派工', dispatching: '派工中', dispatched: '已派工',
}

const STOCK_SIMPLIFIED_MAP: Record<string, 'waiting' | 'in_progress' | 'done'> = {
  waiting_stock:          'waiting',
  reviewing_stock:        'in_progress',
  partial_stock:          'in_progress',
  partial_stock_rejected: 'in_progress',
  full_stock_rejected:    'in_progress',
  full_stock:             'done',
}
const STOCK_SIMPLIFIED_LABEL: Record<string, string> = {
  waiting:     '待到货',
  in_progress: '到货中',
  done:        '已到货',
}
const STOCK_SIMPLIFIED_BADGE: Record<string, 'default' | 'processing' | 'success'> = {
  waiting:     'default',
  in_progress: 'processing',
  done:        'success',
}
const FILING_STATUS_TAG_COLOR: Record<string, string> = {
  filing: 'warning', self_reviewing: 'processing', pending_review: 'purple', filing_approved: 'success',
  filing_self_rejected: 'error', filing_platform_rejected: 'error',
  waiting_start: 'default', applying_start: 'processing', start_rejected: 'error', started: 'success',
  waiting_stock: 'default', reviewing_stock: 'processing', partial_stock: 'cyan', full_stock: 'success',
  partial_stock_rejected: 'error', full_stock_rejected: 'error',
  waiting_complete: 'default', reviewing_complete: 'processing', complete_rejected: 'error', completed: 'success',
  waiting_dispatch: 'default', dispatching: 'processing', dispatched: 'success',
}
const STOCK_SIMPLIFIED_TAG_COLOR: Record<string, string> = {
  waiting: 'default', in_progress: 'processing', done: 'success',
}
function stockSimplifiedKey(filingStatus: string): 'waiting' | 'in_progress' | 'done' {
  return STOCK_SIMPLIFIED_MAP[filingStatus] ?? 'waiting'
}

const stockTarget = computed(() => props.variant === 'B' ? 'stock-apply-b' : 'stock-apply')
const startTarget = computed(() => props.variant === 'B' ? 'start-apply-b' : 'start-apply')

// ─── 状态 ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tableRef           = ref<any>()
const activeNodeCard     = ref<string | null>(null)

watch(stationStatusOverrides,  () => { tableRef.value?.onSearch() }, { deep: true })
watch(startReviewProgress,    () => { tableRef.value?.onSearch() }, { deep: true })
watch(filingReviewProgress,   () => { tableRef.value?.onSearch() }, { deep: true })
const nodeMultiSelect    = ref(false)
const policyModalVisible = ref(false)

// ─── 建档向导弹窗状态 ─────────────────────────────────────────────────────────

const modalFormRef = ref<any>()
const modalForm    = reactive({
  projectType:    '' as 'emc' | 'public_emc' | '',
  policyMatched:  true,
  region:         [] as string[],
  projectName:    '',
  oaNo:           '',
})
const modalAuthChecking = ref(false)
const modalAuthPassed   = ref<boolean | null>(null)

// ─── OA 选择器 ────────────────────────────────────────────────────────────────

const oaDropdownOpen = ref(false)

const OA_MOCK = [
  { key: '1', projectName: '陕西西安正泰物流园0.72MW工商业光伏EMC项目',    oaNo: 'A304202606300003' },
  { key: '2', projectName: '正泰物流园0.72MW工商业光伏EMC项目',             oaNo: 'A304202606300004' },
  { key: '3', projectName: '杭州滨江区某商业综合体屋顶光伏EMC项目',         oaNo: 'A304202607100012', linkedStationNo: '260731751337' },
  { key: '4', projectName: '苏州工业园区精密仪器厂屋顶光伏EMC项目',         oaNo: 'A304202607250021' },
  { key: '5', projectName: '南京江宁区物流仓库屋顶光伏EMC项目',             oaNo: 'A304202608010035' },
]

const oaColumns = [
  { title: '项目名称 / OA 单号', key: 'info' },
  { title: '操作', key: 'action', width: 60 },
]

function selectOa(record: any) {
  if (record.linkedStationNo) {
    Modal.warning({
      title: '无法关联',
      content: `该 OA 单已关联电站编号 ${record.linkedStationNo}，若需重新关联，需作废已关联的电站。`,
      okText: '我知道了',
    })
    return
  }
  modalForm.projectName  = record.projectName
  modalForm.oaNo         = record.oaNo
  oaDropdownOpen.value   = false
}

function resetModal() {
  modalStep.value = 1
  Object.assign(modalForm, { projectType: '', policyMatched: true, region: [], projectName: '', oaNo: '' })
  modalAuthChecking.value = false
  modalAuthPassed.value   = null
  oaDropdownOpen.value    = false
}

async function handleModalRegionChange(val: string[]) {
  if (!val?.length) { modalAuthPassed.value = null; return }
  modalAuthChecking.value = true
  modalAuthPassed.value   = null
  await new Promise(r => setTimeout(r, 600))
  modalAuthPassed.value   = true   // mock: 始终通过
  modalAuthChecking.value = false
}

async function confirmFiling() {
  try { await modalFormRef.value?.validate() } catch { return }
  if (modalForm.projectType === 'public_emc' && modalForm.policyMatched && !modalAuthPassed.value) {
    message.error('请先完成代理商授权校验')
    return
  }
  policyModalVisible.value = false
  const isNonStandard = !modalForm.policyMatched || modalForm.projectType === 'emc'
  const target = isNonStandard ? 'filing-non-standard' : 'filing-standard'
  const label  = isNonStandard ? '非标政策建档' : '标准政策建档'
  emit('navigate', target, {
    projectType:   modalForm.projectType,
    policyMatched: modalForm.policyMatched,
    region:        [...modalForm.region],
    projectName:   modalForm.projectName,
    oaNo:          modalForm.oaNo,
    tabLabel:      label,
  })
}

const NODE_KEYS = ['filing', 'start', 'stock', 'complete', 'grid', 'done']

function syncCardFromNodeFilter(val: string[]) {
  if (!val?.length || val.length >= NODE_KEYS.length) {
    activeNodeCard.value = null
    nodeMultiSelect.value = false
  } else if (val.length === 1) {
    activeNodeCard.value = val[0]
    nodeMultiSelect.value = false
  } else {
    activeNodeCard.value = null
    nodeMultiSelect.value = true
  }
}

function onTableSearch(params: any) {
  syncCardFromNodeFilter(params?.params?.nodeStatus ?? [])
}

function onTableReset() {
  activeNodeCard.value = null
  nodeMultiSelect.value = false
  sessionStorage.removeItem(_NODE_CARD_KEY)
}

const _NODE_CARD_KEY = 'lnc-list-node-card'

onMounted(async () => {
  // 回到列表时重置 demo 到货记录；有用户真实提交的数据时保留
  if (!hasUserSubmittedRecords.value) sharedStockRecords.splice(0)

  const saved = sessionStorage.getItem(_NODE_CARD_KEY)
  if (!saved || saved === 'null') return
  activeNodeCard.value = saved
  await nextTick()
  tableRef.value?.setDefaultValue('nodeStatus', [saved])
  tableRef.value?.onSearch(1)
})

function selectNodeCard(nodeKey: string | null) {
  activeNodeCard.value = nodeKey
  nodeMultiSelect.value = false
  sessionStorage.setItem(_NODE_CARD_KEY, nodeKey ?? 'null')
  tableRef.value?.setDefaultValue('nodeStatus', nodeKey ? [nodeKey] : [])
  tableRef.value?.onSearch(1)
}

// ─── 表格列 ───────────────────────────────────────────────────────────────────

const tipCell = (text: string) => h(Tooltip, { title: text }, () => h('span', { class: 'cell-tip' }, text))

const REVIEW_ROLES = [
  { key: 'biz',  label: '商务' },
  { key: 'tech', label: '技术' },
  { key: 'eng',  label: '工程' },
]

const BASE_COLUMNS = [
  { title: '电站编号',   dataIndex: 'stationNo',      key: 'stationNo',      width: 160, fixed: 'left' as const, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '项目名称',   dataIndex: 'projectName',    key: 'projectName',    width: 220, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '项目公司',   dataIndex: 'projectCompany', key: 'projectCompany', width: 180, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '代理商名称', dataIndex: 'agentName',      key: 'agentName',      width: 160, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '项目地址',   dataIndex: 'address',        key: 'address',        width: 200, ellipsis: true, customRender: ({ text }: any) => tipCell(text) },
  { title: '电站节点',   dataIndex: 'nodeStatus',     key: 'nodeStatus',     width: 120, component: 'custom', slotName: 'nodeStatusSlot' },
  { title: '电站状态',   dataIndex: 'filingStatus',   key: 'filingStatus',   width: 130, component: 'custom', slotName: 'filingStatusSlot' },
  { title: '创建时间',   dataIndex: 'createdAt',      key: 'createdAt',      width: 180, customRender: ({ text }: any) => tipCell(text) },
  { title: '操作',       key: 'action',               fixed: 'right' as const, width: 140, component: 'custom', slotName: 'actionSlot' },
]

const REVIEW_PROGRESS_COLUMN = { title: '审核状态', dataIndex: 'reviewProgress', key: 'reviewProgress', width: 130, component: 'custom', slotName: 'reviewProgressSlot' }

const columns = computed(() => {
  if (activeNodeCard.value === 'filing') {
    const idx = BASE_COLUMNS.findIndex(c => c.key === 'createdAt')
    return [...BASE_COLUMNS.slice(0, idx), REVIEW_PROGRESS_COLUMN, ...BASE_COLUMNS.slice(idx)]
  }
  return BASE_COLUMNS
})

// ─── 筛选项（key 非 field；日期用 rangePicker 组件，参考 repurchase-preview） ──

const START_STATUS_OPTIONS_A = [
  { label: '待开工',       value: 'waiting_start' },
  { label: '开工审核中',   value: 'applying_start' },
  { label: '开工审核不通过', value: 'start_rejected' },
  { label: '已开工',       value: 'started' },
]
const START_STATUS_OPTIONS_B = [
  { label: '待开工',         value: 'waiting_start' },
  { label: '开工审核中',     value: 'applying_start' },
  { label: '开工审核不通过', value: 'start_rejected' },
  { label: '已开工',         value: 'started' },
]

const filters = computed(() => [
  { label: '项目名称',   key: 'projectName',    component: 'input',  placeholder: '请输入项目名称' },
  { label: '电站编号',   key: 'stationNo',      component: 'input',  placeholder: '请输入电站编号' },
  { label: '代理商名称', key: 'agentName',      component: 'input',  placeholder: '请输入代理商名称' },
  { label: '项目公司',   key: 'projectCompany', component: 'input',  placeholder: '请输入项目公司名称' },
  { label: '项目地址',   key: 'address',        component: 'input',  placeholder: '请输入项目地址关键词' },
  {
    label: '电站节点',
    key: 'nodeStatus',
    component: 'select',
    placeholder: '请选择电站节点',
    props: { mode: 'multiple', showArrow: true },
    options: [
      { label: '建档', value: 'filing' },
      { label: '开工', value: 'start' },
      { label: '到货', value: 'stock' },
      { label: '派工', value: 'dispatch' },
      { label: '完工', value: 'complete' },
      { label: '并网', value: 'grid' },
      { label: '竣工', value: 'done' },
    ],
  },
  {
    label: '电站状态',
    key: 'filingStatus',
    component: 'select',
    placeholder: '请选择电站状态',
    options: [
      { label: '建档中',           value: 'filing' },
      { label: '建档自审中',       value: 'self_reviewing' },
      { label: '建档自审不通过',   value: 'filing_self_rejected' },
      { label: '建档平台审核中',   value: 'pending_review' },
      { label: '建档审核不通过',   value: 'filing_platform_rejected' },
      { label: '建档审核通过',     value: 'filing_approved' },
      ...START_STATUS_OPTIONS_A,
      { label: '待到货',             value: 'waiting_stock' },
      { label: '到货审核中',         value: 'reviewing_stock' },
      { label: '部分已到货',         value: 'partial_stock' },
      { label: '全部已到货',         value: 'full_stock' },
      { label: '部分到货审核不通过', value: 'partial_stock_rejected' },
      { label: '全部到货审核不通过', value: 'full_stock_rejected' },
      { label: '待派工',             value: 'waiting_dispatch' },
      { label: '派工中',             value: 'dispatching' },
      { label: '已派工',             value: 'dispatched' },
      { label: '待完工',             value: 'waiting_complete' },
      { label: '完工审核中',         value: 'reviewing_complete' },
      { label: '完工审核不通过',     value: 'complete_rejected' },
      { label: '已完工',             value: 'completed' },
    ],
  },
  { label: '创建时间', key: 'createdAtRange', component: 'rangePicker', placeholder: ['开始日期', '结束日期'] },
])

// ─── 请求配置 ─────────────────────────────────────────────────────────────────

const tableConfig = {
  rowKey: 'id',
  searchOnLoad: true,
  request: async (params: Record<string, any>) => {
    // 筛选值在 params.params 里，不能直接展开 params（AnfeProTable 特性）
    const { params: filterParams = {}, pageIndex, pageRows } = params

    const query: Record<string, any> = { ...filterParams, pageIndex, pageRows }

    // 日期范围解包（rangePicker 返回 Dayjs[]）
    if (query.createdAtRange?.length === 2) {
      query.createdAtStart = query.createdAtRange[0]?.format?.('YYYY-MM-DD')
      query.createdAtEnd   = query.createdAtRange[1]?.format?.('YYYY-MM-DD')
      delete query.createdAtRange
    }

    const res = await getProjectList(query)
    return { data: res.list, count: res.total }
  },
}

// ─── 行操作权限 ───────────────────────────────────────────────────────────────

const FILING_REJECTED_STATUSES: string[] = []
const canEdit = (row: any) => {
  if (['filing', 'start_rejected'].includes(row.filingStatus)) return true
  if (row.filingStatus === 'self_reviewing') {
    const p = row.selfReviewProgress ?? {}
    return p.biz === 'reject' || p.tech === 'reject'
  }
  if (row.filingStatus === 'pending_review') {
    const p = row.platformReviewProgress ?? {}
    return p.biz === 'reject' || p.tech === 'reject'
  }
  return false
}
const canVoid = (row: any) => row.filingStatus === 'filing'

// ─── 操作处理 ─────────────────────────────────────────────────────────────────

const handleExport = () => {
  // 接入时替换为 AnfeFileExport 或调用导出接口
  message.info('导出功能接入后生效')
}

const handleCreateFiling = () => {
  policyModalVisible.value = true
}

function deriveFilingEditStatus(row: any): string {
  const s = row.filingStatus
  const sp = row.selfReviewProgress ?? {}
  const pp = row.platformReviewProgress ?? {}
  if (s === 'self_reviewing') {
    const bizR = sp.biz === 'reject', techR = sp.tech === 'reject'
    if (bizR && techR) return 'all_self_rejected'
    if (bizR) return 'biz_self_rejected'
    if (techR) return 'tech_self_rejected'
  }
  if (s === 'pending_review') {
    if (pp.tech === 'reject') return 'tech_rejected'
    if (pp.biz === 'reject') return 'biz_rejected'
  }
  if (s === 'filing_self_rejected') return 'filing_self_rejected'
  if (s === 'filing_platform_rejected') return 'filing_platform_rejected'
  return s
}

const handleEdit = (row: any) => {
  if (row.nodeStatus === 'filing') {
    const editTarget = row.policyType === 'nonstandard' ? 'filing-non-standard' : 'filing-standard'
    emit('navigate', editTarget, { editId: row.id, initStatus: deriveFilingEditStatus(row) })
  } else if (row.nodeStatus === 'start') {
    emit('navigate', startTarget.value, { editId: row.id, initStatus: row.filingStatus, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, policyType: row.policyType })
  } else if (row.nodeStatus === 'stock') {
    emit('navigate', stockTarget.value, { editId: row.id, initStatus: row.filingStatus, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, policyType: row.policyType })
  } else if (row.nodeStatus === 'complete') {
    emit('navigate', 'complete-apply', { editId: row.id, initStatus: row.filingStatus, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, policyType: row.policyType })
  }
}

const handleApplyStart = (row: any) => {
  emit('navigate', startTarget.value, { stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, policyType: row.policyType })
}

const handleApplyStock = (row: any) => {
  emit('navigate', stockTarget.value, { id: row.id, filingStatus: row.filingStatus, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, policyType: row.policyType })
}

const handleApplyDispatch = (row: any) => {
  emit('navigate', 'dispatch-apply', { id: row.id, filingStatus: row.filingStatus, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, policyType: row.policyType })
}

const handleApplyComplete = (row: any) => {
  emit('navigate', 'complete-apply', { stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, policyType: row.policyType })
}

const handleDetail = (row: any) => {
  if (row.nodeStatus === 'filing') {
    emit('navigate', 'detail', { filingStatus: row.filingStatus, policyType: row.policyType, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, selfReviewProgress: row.selfReviewProgress ?? null, platformReviewProgress: row.platformReviewProgress ?? null })
  } else if (row.nodeStatus === 'start') {
    const startDetailTarget = props.variant === 'B' ? 'start-detail-b' : 'start-detail'
    emit('navigate', startDetailTarget, { id: row.id, filingStatus: row.filingStatus, policyType: row.policyType, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName })
  } else if (row.nodeStatus === 'stock') {
    const detailTarget = props.variant === 'B' ? 'stock-detail-b' : 'stock-detail'
    emit('navigate', detailTarget, { id: row.id, filingStatus: row.filingStatus, policyType: row.policyType, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName })
  } else if (row.nodeStatus === 'complete') {
    emit('navigate', 'complete-detail', { id: row.id, filingStatus: row.filingStatus, policyType: row.policyType, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName })
  } else if (row.nodeStatus === 'dispatch') {
    emit('navigate', 'dispatch-detail', { id: row.id, filingStatus: row.filingStatus, policyType: row.policyType, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName })
  }
}

const handleReview = (row: any, role: string) => {
  emit('navigate', 'start-detail-b', { id: row.id, filingStatus: row.filingStatus, policyType: row.policyType, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, reviewRole: role })
}

const handleSelfReview = (row: any, role: string) => {
  emit('navigate', 'detail', { id: row.id, filingStatus: row.filingStatus, policyType: row.policyType, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, selfReviewRole: role, selfReviewProgress: row.selfReviewProgress ?? null, platformReviewProgress: row.platformReviewProgress ?? null })
}

const handlePlatformReview = (row: any, role: string) => {
  emit('navigate', 'detail', { id: row.id, filingStatus: row.filingStatus, policyType: row.policyType, stationNo: row.stationNo, projectName: row.projectName, agentName: row.agentName, platformReviewRole: role, selfReviewProgress: row.selfReviewProgress ?? null, platformReviewProgress: row.platformReviewProgress ?? null })
}

const handleVoid = async (row: any) => {
  try {
    await voidProject(row.id)
    message.success('作废成功')
    tableRef.value?.onSearch()
  } catch {
    message.error('作废失败，请重试')
  }
}

// ─── 接口占位（接入时替换） ───────────────────────────────────────────────────

const MOCK_LIST = [
  // ── 建档节点 × 15 ── 前3条每状态各一，其余随机
  { id: 'f01', stationNo: 'LNC-2026-0001', projectName: '杭州市滨江区某商业综合体屋顶光伏项目', projectCompany: '杭州光伏资产管理有限公司',   agentName: '浙江绿能科技有限公司',         address: '浙江省杭州市滨江区滨盛路18号',       nodeStatus: 'filing', filingStatus: 'filing',         policyType: 'standard',    createdAt: '2026-08-10 14:32' },
  { id: 'f02', stationNo: 'LNC-2026-0002', projectName: '宁波市鄞州区工业园区分布式光伏项目', projectCompany: '宁波新能源股份有限公司',       agentName: '宁波蓝天能源有限公司',         address: '浙江省宁波市鄞州区集士港工业园',     nodeStatus: 'filing', filingStatus: 'pending_review', policyType: 'standard',    createdAt: '2026-08-10 10:05', platformReviewProgress: { biz: null, tech: null } },
  { id: 'f14', stationNo: 'LNC-2026-0003', projectName: '金华市婺城区五金制造厂屋顶光伏',     projectCompany: '金华绿源光伏有限公司',       agentName: '金华阳光能源技术有限公司',     address: '浙江省金华市婺城区银海路128号',     nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'standard',    createdAt: '2026-08-09 09:45', selfReviewProgress: { biz: 'reject', tech: null } },
  { id: 'f03', stationNo: 'LNC-2026-0004', projectName: '南京市江宁区物流仓库屋顶光伏',       projectCompany: '南京绿色能源科技有限公司',   agentName: '南京清洁能源有限公司',         address: '江苏省南京市江宁区科学园路88号',     nodeStatus: 'filing', filingStatus: 'filing',         policyType: 'nonstandard', createdAt: '2026-08-08 16:40' },
  { id: 'f04', stationNo: 'LNC-2026-0005', projectName: '无锡市惠山区工业厂房屋顶光伏',       projectCompany: '无锡惠山光伏有限公司',       agentName: '无锡泰阳能源科技有限公司',     address: '江苏省无锡市惠山区前洲工业园',       nodeStatus: 'filing', filingStatus: 'filing',         policyType: 'standard',    createdAt: '2026-08-07 10:22' },
  { id: 'f05', stationNo: 'LNC-2026-0006', projectName: '苏州市相城区冷链物流园光伏项目',     projectCompany: '苏州相城光伏资产有限公司',   agentName: '苏州阳光新能源技术有限公司',   address: '江苏省苏州市相城区澄阳路138号',     nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'standard',    createdAt: '2026-08-06 09:15', selfReviewProgress: { biz: null, tech: null } },
  { id: 'f06', stationNo: 'LNC-2026-0007', projectName: '常州市武进区钢结构厂房屋顶光伏',     projectCompany: '常州新能源产业发展有限公司', agentName: '常州晴天能源有限公司',         address: '江苏省常州市武进区湟里工业园',       nodeStatus: 'filing', filingStatus: 'filing',         policyType: 'nonstandard', createdAt: '2026-08-05 14:00' },
  { id: 'f07', stationNo: 'LNC-2026-0008', projectName: '镇江市丹徒区食品加工厂屋顶光伏',     projectCompany: '镇江绿源光伏投资有限公司',   agentName: '镇江安能新能源有限公司',       address: '江苏省镇江市丹徒区宜城工业园',       nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'standard',    createdAt: '2026-08-04 11:30', selfReviewProgress: { biz: null, tech: 'reject' } },
  { id: 'f16', stationNo: 'LNC-2026-0055', projectName: '南京市高淳区农业大棚屋顶光伏',       projectCompany: '南京高淳光伏资产有限公司',   agentName: '南京绿能科技有限公司',         address: '江苏省南京市高淳区经济开发区',       nodeStatus: 'filing', filingStatus: 'pending_review', policyType: 'standard',    createdAt: '2026-08-04 09:00', platformReviewProgress: { biz: 'reject', tech: null } },
  { id: 'f17', stationNo: 'LNC-2026-0056', projectName: '苏州市吴江区纺织工厂屋顶光伏',       projectCompany: '苏州吴江光伏投资有限公司',   agentName: '苏州蓝天能源有限公司',         address: '江苏省苏州市吴江区盛泽工业区',       nodeStatus: 'filing', filingStatus: 'pending_review', policyType: 'nonstandard', createdAt: '2026-08-03 14:20', platformReviewProgress: { biz: null, tech: 'reject' } },
  { id: 'f18', stationNo: 'LNC-2026-0057', projectName: '无锡市宜兴市化工企业屋顶光伏',       projectCompany: '无锡宜兴清洁能源有限公司',   agentName: '无锡联合能源有限公司',         address: '江苏省无锡市宜兴市工业园区',         nodeStatus: 'filing', filingStatus: 'filing_self_rejected',     policyType: 'standard',    createdAt: '2026-08-03 10:00', selfReviewProgress: { biz: 'reject', tech: 'reject' } },
  { id: 'f19', stationNo: 'LNC-2026-0058', projectName: '杭州市富阳区造纸厂屋顶光伏项目',     projectCompany: '杭州富阳光伏管理有限公司',   agentName: '杭州晴天能源科技有限公司',     address: '浙江省杭州市富阳区新登工业区',       nodeStatus: 'filing', filingStatus: 'filing_platform_rejected', policyType: 'nonstandard', createdAt: '2026-08-02 16:30', platformReviewProgress: { biz: 'reject', tech: 'reject' } },
  { id: 'f20', stationNo: 'LNC-2026-0059', projectName: '嘉兴市南湖区光伏农业大棚项目',         projectCompany: '嘉兴绿源光伏投资有限公司',   agentName: '嘉兴蓝天新能源技术有限公司',   address: '浙江省嘉兴市南湖区余新工业区',       nodeStatus: 'filing', filingStatus: 'filing_approved', policyType: 'standard',    createdAt: '2026-08-01 10:00', platformReviewProgress: { biz: 'pass', tech: 'pass' } },
  { id: 'f21', stationNo: 'LNC-2026-0060', projectName: '舟山市定海区海洋装备厂屋顶光伏',       projectCompany: '舟山绿源新能源有限公司',     agentName: '舟山联合能源技术有限公司',     address: '浙江省舟山市定海区临城工业园',       nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'standard',    createdAt: '2026-07-28 09:30', selfReviewProgress: { biz: 'pass', tech: null } },
  { id: 'f22', stationNo: 'LNC-2026-0061', projectName: '衢州市柯城区食品加工企业屋顶光伏',     projectCompany: '衢州清洁能源投资有限公司',   agentName: '衢州阳光新能源技术有限公司',   address: '浙江省衢州市柯城区工业园区',         nodeStatus: 'filing', filingStatus: 'pending_review', policyType: 'nonstandard', createdAt: '2026-07-27 14:00', platformReviewProgress: { biz: 'pass', tech: null } },
  { id: 'f23', stationNo: 'LNC-2026-0062', projectName: '丽水市莲都区竹木加工厂屋顶光伏',       projectCompany: '丽水绿源光伏资产有限公司',   agentName: '丽水新日能源技术有限公司',     address: '浙江省丽水市莲都区工业园区',         nodeStatus: 'filing', filingStatus: 'pending_review', policyType: 'standard',    createdAt: '2026-07-26 10:00', platformReviewProgress: { biz: null, tech: 'pass' } },
  { id: 'f24', stationNo: 'LNC-2026-0063', projectName: '金华市义乌区小商品物流仓屋顶光伏',     projectCompany: '义乌光伏资产运营有限公司',   agentName: '义乌阳光新能源有限公司',       address: '浙江省金华市义乌市国际商贸城',       nodeStatus: 'filing', filingStatus: 'pending_review', policyType: 'standard',    createdAt: '2026-07-25 09:30', platformReviewProgress: { biz: 'pass', tech: 'reject' } },
  { id: 'f25', stationNo: 'LNC-2026-0064', projectName: '台州市温岭市模具制造厂屋顶光伏',       projectCompany: '温岭清洁能源发展有限公司',   agentName: '台州联合新能源技术有限公司',   address: '浙江省台州市温岭市工业城',           nodeStatus: 'filing', filingStatus: 'pending_review', policyType: 'nonstandard', createdAt: '2026-07-24 14:30', platformReviewProgress: { biz: 'reject', tech: 'pass' } },
  { id: 'f26', stationNo: 'LNC-2026-0065', projectName: '宁波市慈溪市家电制造业屋顶光伏',       projectCompany: '慈溪光伏投资管理有限公司',   agentName: '宁波蓝日能源科技有限公司',     address: '浙江省宁波市慈溪市工业园区',         nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'standard',    createdAt: '2026-07-23 11:00', selfReviewProgress: { biz: null, tech: 'pass' } },
  { id: 'f27', stationNo: 'LNC-2026-0066', projectName: '杭州市余杭区电商仓储园屋顶光伏',       projectCompany: '余杭清洁能源有限公司',       agentName: '杭州晴天新能源技术有限公司',   address: '浙江省杭州市余杭区仓前工业园',       nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'nonstandard', createdAt: '2026-07-22 15:00', selfReviewProgress: { biz: 'pass', tech: 'reject' } },
  { id: 'f28', stationNo: 'LNC-2026-0067', projectName: '绍兴市诸暨市针织企业屋顶光伏',         projectCompany: '诸暨光伏资产运营有限公司',   agentName: '绍兴绿源能源有限公司',         address: '浙江省绍兴市诸暨市大唐工业区',       nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'standard',    createdAt: '2026-07-21 10:30', selfReviewProgress: { biz: 'reject', tech: 'pass' } },
  { id: 'f08', stationNo: 'LNC-2026-0009', projectName: '扬州市广陵区纺织企业屋顶光伏',       projectCompany: '扬州光伏能源管理有限公司',   agentName: '扬州新日能源科技有限公司',     address: '江苏省扬州市广陵区江都路209号',     nodeStatus: 'filing', filingStatus: 'filing',         policyType: 'standard',    createdAt: '2026-08-03 15:45' },
  { id: 'f09', stationNo: 'LNC-2026-0010', projectName: '嘉兴市南湖区电子制造工厂屋顶光伏',   projectCompany: '嘉兴新能源发展有限公司',     agentName: '嘉兴蓝日能源技术有限公司',     address: '浙江省嘉兴市南湖区大桥镇工业区',   nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'standard',    createdAt: '2026-08-02 09:00', selfReviewProgress: { biz: null, tech: null } },
  { id: 'f10', stationNo: 'LNC-2026-0011', projectName: '湖州市吴兴区建材企业屋顶光伏',       projectCompany: '湖州清洁能源有限公司',       agentName: '湖州联合新能源有限公司',       address: '浙江省湖州市吴兴区织里工业园',       nodeStatus: 'filing', filingStatus: 'filing',         policyType: 'nonstandard', createdAt: '2026-08-01 13:20' },
  { id: 'f11', stationNo: 'LNC-2026-0012', projectName: '绍兴市越城区印染厂屋顶光伏项目',     projectCompany: '绍兴光伏资产运营有限公司',   agentName: '绍兴阳光能源有限公司',         address: '浙江省绍兴市越城区东浦工业区',       nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'standard',    createdAt: '2026-07-31 16:10', selfReviewProgress: { biz: null, tech: null } },
  { id: 'f12', stationNo: 'LNC-2026-0013', projectName: '温州市瓯海区鞋业园区屋顶光伏',       projectCompany: '温州新能源有限公司',         agentName: '温州绿岛能源科技有限公司',     address: '浙江省温州市瓯海区瓯海大道868号',   nodeStatus: 'filing', filingStatus: 'filing',         policyType: 'standard',    createdAt: '2026-07-30 10:30' },
  { id: 'f13', stationNo: 'LNC-2026-0014', projectName: '台州市椒江区汽配企业屋顶光伏',       projectCompany: '台州光伏管理有限公司',       agentName: '台州绿能科技有限公司',         address: '浙江省台州市椒江区云健工业区',       nodeStatus: 'filing', filingStatus: 'self_reviewing', policyType: 'nonstandard', createdAt: '2026-07-29 14:00', selfReviewProgress: { biz: null, tech: null } },
  { id: 'f15', stationNo: 'LNC-2026-0015', projectName: '衢州市柯城区橡胶厂屋顶光伏项目',     projectCompany: '衢州清洁能源有限公司',       agentName: '衢州新日能源有限公司',         address: '浙江省衢州市柯城区花园工业区',       nodeStatus: 'filing', filingStatus: 'filing',         policyType: 'nonstandard', createdAt: '2026-07-28 11:00' },

  // ── 开工节点 × 10 ── 前4条每状态各一，其余随机
  { id: 's01', stationNo: 'LNC-2026-0016', projectName: '上海市嘉定区汽车配件厂屋顶光伏',   projectCompany: '上海新能源发展有限公司',       agentName: '上海晴天能源科技有限公司',     address: '上海市嘉定区嘉松北路2000号',         nodeStatus: 'start', filingStatus: 'waiting_start',  policyType: 'standard',    createdAt: '2026-07-25 08:30' },
  { id: 's04', stationNo: 'LNC-2026-0017', projectName: '芜湖市鸠江区装备制造厂屋顶光伏',   projectCompany: '芜湖清洁能源有限公司',         agentName: '芜湖联合能源技术有限公司',     address: '安徽省芜湖市鸠江区机械工业园',       nodeStatus: 'start', filingStatus: 'applying_start', policyType: 'standard',    createdAt: '2026-07-24 09:00', reviewProgress: { biz: null, tech: null, eng: null } },
  { id: 's07', stationNo: 'LNC-2026-0018', projectName: '徐州市铜山区钢铁加工厂屋顶光伏',   projectCompany: '徐州光伏管理有限公司',         agentName: '徐州绿能科技有限公司',         address: '江苏省徐州市铜山区工业新区',         nodeStatus: 'start', filingStatus: 'start_rejected',      policyType: 'standard',    createdAt: '2026-07-22 08:45' },
  { id: 's09', stationNo: 'LNC-2026-0019', projectName: '泰州市姜堰区电气制造企业光伏',     projectCompany: '泰州清洁能源科技有限公司',     agentName: '泰州蓝天能源有限公司',         address: '江苏省泰州市姜堰区工业集中区',       nodeStatus: 'start', filingStatus: 'started',        policyType: 'standard',    createdAt: '2026-07-21 10:30' },
  { id: 's02', stationNo: 'LNC-2026-0020', projectName: '上海市奉贤区化工仓储屋顶光伏',     projectCompany: '上海奉贤光伏资产有限公司',     agentName: '上海绿电能源科技有限公司',     address: '上海市奉贤区庄行工业区',             nodeStatus: 'start', filingStatus: 'waiting_start',  policyType: 'nonstandard', createdAt: '2026-07-20 14:00' },
  { id: 's03', stationNo: 'LNC-2026-0021', projectName: '合肥市肥东县物流园区屋顶光伏',     projectCompany: '合肥光伏资产运营有限公司',     agentName: '合肥蓝天新能源有限公司',       address: '安徽省合肥市肥东县经济开发区',       nodeStatus: 'start', filingStatus: 'applying_start', policyType: 'standard',    createdAt: '2026-07-18 10:15', reviewProgress: { biz: 'pass', tech: null, eng: null } },
  { id: 's05', stationNo: 'LNC-2026-0022', projectName: '南通市如皋市造纸厂屋顶光伏',       projectCompany: '南通绿源光伏投资有限公司',     agentName: '南通阳光能源科技有限公司',     address: '江苏省南通市如皋市长江工业园',       nodeStatus: 'start', filingStatus: 'waiting_start',  policyType: 'nonstandard', createdAt: '2026-07-15 15:30' },
  { id: 's06', stationNo: 'LNC-2026-0023', projectName: '盐城市大丰区纺织工厂屋顶光伏',     projectCompany: '盐城新能源发展有限公司',       agentName: '盐城晴天能源有限公司',         address: '江苏省盐城市大丰区经济开发区',       nodeStatus: 'start', filingStatus: 'start_rejected',      policyType: 'standard',    createdAt: '2026-07-12 11:20' },
  { id: 's10', stationNo: 'LNC-2026-0025', projectName: '扬州市江都区机械制造企业屋顶光伏', projectCompany: '扬州光伏资产有限公司',         agentName: '扬州新能源联合有限公司',       address: '江苏省扬州市江都区仙女工业区',       nodeStatus: 'start', filingStatus: 'start_rejected',      policyType: 'standard',    createdAt: '2026-07-08 09:30' },
  { id: 's08', stationNo: 'LNC-2026-0024', projectName: '连云港市赣榆区冷冻食品厂光伏',     projectCompany: '连云港绿源能源有限公司',       agentName: '连云港新日能源科技有限公司',   address: '江苏省连云港市赣榆区海州工业区',     nodeStatus: 'start', filingStatus: 'applying_start',  policyType: 'nonstandard', createdAt: '2026-07-10 13:00', reviewProgress: { biz: 'pass', tech: 'pass', eng: null } },
  { id: 's11', stationNo: 'LNC-2026-0029', projectName: '淮安市清江浦区食品加工园光伏',     projectCompany: '淮安光伏资产运营有限公司',     agentName: '淮安阳光能源技术有限公司',     address: '江苏省淮安市清江浦区工业北区',       nodeStatus: 'start', filingStatus: 'start_rejected',  policyType: 'standard',    createdAt: '2026-07-08 09:15' },
  { id: 's13', stationNo: 'LNC-2026-0031', projectName: '镇江市丹阳市眼镜配件厂屋顶光伏',   projectCompany: '镇江丹阳光伏资产有限公司',     agentName: '镇江新能源科技有限公司',       address: '江苏省镇江市丹阳市工业园区',         nodeStatus: 'start', filingStatus: 'start_rejected',      policyType: 'standard',   createdAt: '2026-07-06 14:00' },
  { id: 's14', stationNo: 'LNC-2026-0032', projectName: '泰州市海陵区机电设备厂屋顶光伏',   projectCompany: '泰州海陵光伏资产有限公司',     agentName: '泰州新能源发展有限公司',       address: '江苏省泰州市海陵区工业园区',         nodeStatus: 'start', filingStatus: 'start_rejected',      policyType: 'standard',   createdAt: '2026-07-05 09:00' },
  { id: 's12', stationNo: 'LNC-2026-0030', projectName: '宿迁市宿城区纺织服装工厂屋顶光伏', projectCompany: '宿迁清洁能源发展有限公司',     agentName: '宿迁晴天能源有限公司',         address: '江苏省宿迁市宿城区经济开发区',       nodeStatus: 'start', filingStatus: 'started',         policyType: 'standard',    createdAt: '2026-07-07 10:00' },

  // ── 到货节点 × 6 ── 每条对应一个子状态，按流程顺序排列
  { id: 'g01', stationNo: 'LNC-2026-0026', projectName: '苏州市吴中区精密仪器厂屋顶光伏',       projectCompany: '苏州精密光伏有限公司',         agentName: '苏州绿岛能源科技有限公司',     address: '江苏省苏州市吴中区东吴工业园',             nodeStatus: 'stock', filingStatus: 'waiting_stock',          policyType: 'standard',    createdAt: '2026-07-05 14:20' },
  { id: 'g02', stationNo: 'LNC-2026-0027', projectName: '杭州市余杭区电商仓储园区光伏',         projectCompany: '杭州余杭光伏资产有限公司',       agentName: '杭州新能源联合有限公司',       address: '浙江省杭州市余杭区仓前工业区',             nodeStatus: 'stock', filingStatus: 'reviewing_stock',        policyType: 'nonstandard', createdAt: '2026-07-03 09:30' },
  { id: 'g09', stationNo: 'LNC-2026-0028', projectName: '镇江市句容市农光互补屋顶光伏',         projectCompany: '镇江句容光伏资产有限公司',       agentName: '镇江绿能科技有限公司',         address: '江苏省镇江市句容市开发区工业园',           nodeStatus: 'stock', filingStatus: 'partial_stock_rejected', policyType: 'standard',    createdAt: '2026-07-01 16:00' },
  { id: 'g10', stationNo: 'LNC-2026-0029', projectName: '扬州市仪征市化工企业屋顶光伏',         projectCompany: '扬州仪征光伏管理有限公司',       agentName: '扬州阳光能源技术有限公司',     address: '江苏省扬州市仪征市化工园区',               nodeStatus: 'stock', filingStatus: 'full_stock_rejected',    policyType: 'nonstandard', createdAt: '2026-06-28 10:30' },
  { id: 'g04', stationNo: 'LNC-2026-0030', projectName: '南京市浦口区汽车零部件厂光伏',         projectCompany: '南京浦口光伏管理有限公司',       agentName: '南京绿能科技有限公司',         address: '江苏省南京市浦口区高新技术开发区',         nodeStatus: 'stock', filingStatus: 'partial_stock',          policyType: 'standard',    createdAt: '2026-06-25 15:00' },
  { id: 'g06', stationNo: 'LNC-2026-0031', projectName: '常州市新北区轨道交通零件厂光伏',       projectCompany: '常州新北光伏资产有限公司',       agentName: '常州新日能源科技有限公司',     address: '江苏省常州市新北区高新技术园',             nodeStatus: 'stock', filingStatus: 'full_stock',             policyType: 'standard',    createdAt: '2026-06-22 08:30' },
  { id: 'g07', stationNo: 'LNC-2026-0032', projectName: '嘉兴市平湖市箱包制造厂屋顶光伏',       projectCompany: '嘉兴平湖清洁能源有限公司',       agentName: '嘉兴阳光能源技术有限公司',     address: '浙江省嘉兴市平湖市独山港镇工业区',         nodeStatus: 'stock', filingStatus: 'waiting_stock',          policyType: 'standard',    createdAt: '2026-06-20 13:10' },
  { id: 'g08', stationNo: 'LNC-2026-0033', projectName: '湖州市德清县农业园区屋顶光伏',         projectCompany: '湖州德清光伏有限公司',           agentName: '湖州绿源能源科技有限公司',     address: '浙江省湖州市德清县青山工业园',             nodeStatus: 'stock', filingStatus: 'reviewing_stock',        policyType: 'nonstandard', createdAt: '2026-06-18 09:00' },
  { id: 'g03', stationNo: 'LNC-2026-0034', projectName: '宁波市北仑区港口仓储屋顶光伏',         projectCompany: '宁波北仑清洁能源有限公司',       agentName: '宁波晴天能源科技有限公司',     address: '浙江省宁波市北仑区大碶经济开发区',         nodeStatus: 'stock', filingStatus: 'partial_stock',          policyType: 'standard',    createdAt: '2026-06-16 11:00' },
  { id: 'g05', stationNo: 'LNC-2026-0035', projectName: '无锡市锡山区家用电器厂光伏',           projectCompany: '无锡锡山光伏投资有限公司',       agentName: '无锡联合能源有限公司',         address: '江苏省无锡市锡山区东港工业园',             nodeStatus: 'stock', filingStatus: 'full_stock',             policyType: 'nonstandard', createdAt: '2026-06-14 10:45' },

  // ── 完工节点 × 12 ──
  { id: 'c01', stationNo: 'LNC-2026-0036', projectName: '绍兴市诸暨市纺织企业屋顶光伏',   projectCompany: '绍兴诸暨光伏资产有限公司',   agentName: '绍兴新能源发展有限公司',       address: '浙江省绍兴市诸暨市大唐工业区',       nodeStatus: 'complete', filingStatus: 'reviewing_complete', policyType: 'standard',    createdAt: '2026-06-15 14:30' },
  { id: 'c02', stationNo: 'LNC-2026-0037', projectName: '温州市乐清市电气企业屋顶光伏',   projectCompany: '温州乐清清洁能源有限公司',   agentName: '温州蓝天能源有限公司',           address: '浙江省温州市乐清市柳市工业区',       nodeStatus: 'complete', filingStatus: 'complete_rejected',  policyType: 'standard',    createdAt: '2026-06-12 10:00' },
  { id: 'c03', stationNo: 'LNC-2026-0038', projectName: '台州市黄岩区模具企业屋顶光伏',   projectCompany: '台州黄岩光伏管理有限公司',   agentName: '台州晴天能源科技有限公司',       address: '浙江省台州市黄岩区工业园区',         nodeStatus: 'complete', filingStatus: 'completed',          policyType: 'standard',    createdAt: '2026-06-10 09:15' },
  { id: 'c04', stationNo: 'LNC-2026-0039', projectName: '合肥市庐江县农业大棚屋顶光伏',   projectCompany: '合肥庐江光伏投资有限公司',   agentName: '合肥绿源能源技术有限公司',       address: '安徽省合肥市庐江县工业经济区',       nodeStatus: 'complete', filingStatus: 'waiting_complete',   policyType: 'standard',    createdAt: '2026-06-08 15:45' },
  { id: 'c05', stationNo: 'LNC-2026-0040', projectName: '芜湖市繁昌区冶金企业屋顶光伏',   projectCompany: '芜湖繁昌光伏资产有限公司',   agentName: '芜湖新日能源有限公司',           address: '安徽省芜湖市繁昌区工业集中区',       nodeStatus: 'complete', filingStatus: 'waiting_complete',   policyType: 'nonstandard', createdAt: '2026-06-05 11:30' },
  { id: 'c06', stationNo: 'LNC-2026-0041', projectName: '南通市海安市家具制造厂光伏',     projectCompany: '南通海安光伏有限公司',       agentName: '南通联合能源科技有限公司',       address: '江苏省南通市海安市工业新区',         nodeStatus: 'complete', filingStatus: 'reviewing_complete', policyType: 'standard',    createdAt: '2026-06-02 08:00' },
  { id: 'c07', stationNo: 'LNC-2026-0042', projectName: '盐城市东台市建材工厂屋顶光伏',   projectCompany: '盐城东台光伏管理有限公司',   agentName: '盐城阳光能源科技有限公司',       address: '江苏省盐城市东台市工业园区',         nodeStatus: 'complete', filingStatus: 'completed',          policyType: 'standard',    createdAt: '2026-05-28 14:20' },
  { id: 'c08', stationNo: 'LNC-2026-0043', projectName: '徐州市贾汪区煤化工厂光伏',       projectCompany: '徐州贾汪清洁能源有限公司',   agentName: '徐州绿能科技有限公司',           address: '江苏省徐州市贾汪区工业集中区',       nodeStatus: 'complete', filingStatus: 'complete_rejected',  policyType: 'standard',    createdAt: '2026-05-25 10:10' },
  { id: 'c09', stationNo: 'LNC-2026-0044', projectName: '苏州市太仓市港口物流屋顶光伏',   projectCompany: '苏州太仓光伏资产有限公司',   agentName: '苏州新能源联合有限公司',         address: '江苏省苏州市太仓市港区工业园',       nodeStatus: 'complete', filingStatus: 'waiting_complete',   policyType: 'standard',    createdAt: '2026-05-22 09:00' },
  { id: 'c10', stationNo: 'LNC-2026-0045', projectName: '杭州市临安区木制品加工厂光伏',   projectCompany: '杭州临安光伏投资有限公司',   agentName: '杭州蓝天能源有限公司',           address: '浙江省杭州市临安区板桥工业区',       nodeStatus: 'complete', filingStatus: 'reviewing_complete', policyType: 'standard',    createdAt: '2026-05-20 15:00' },
  { id: 'c11', stationNo: 'LNC-2026-0046', projectName: '宁波市象山县水产加工厂光伏',     projectCompany: '宁波象山清洁能源有限公司',   agentName: '宁波晴天能源科技有限公司',       address: '浙江省宁波市象山县爵溪工业区',       nodeStatus: 'complete', filingStatus: 'completed',          policyType: 'standard',    createdAt: '2026-05-18 11:30' },
  { id: 'c12', stationNo: 'LNC-2026-0047', projectName: '南京市溧水区航空零件厂光伏',     projectCompany: '南京溧水光伏管理有限公司',   agentName: '南京绿源能源技术有限公司',       address: '江苏省南京市溧水区经济开发区',       nodeStatus: 'complete', filingStatus: 'waiting_complete',   policyType: 'standard',    createdAt: '2026-05-15 08:45' },

  // ── 派工节点（方案B专有）──
  { id: 'dp01', stationNo: 'LNC-2026-0048a', projectName: '无锡市江阴市精密零件厂屋顶光伏',     projectCompany: '无锡江阴精工能源有限公司',       agentName: '无锡联合能源有限公司',     address: '江苏省无锡市江阴市临港工业区A区',     nodeStatus: 'dispatch', filingStatus: 'waiting_dispatch', policyType: 'standard',    createdAt: '2026-05-08 09:00' },
  { id: 'dp02', stationNo: 'LNC-2026-0048b', projectName: '无锡市江阴市电气设备厂屋顶光伏',     projectCompany: '无锡江阴电气清洁能源有限公司',   agentName: '无锡联合能源有限公司',     address: '江苏省无锡市江阴市临港工业区B区',     nodeStatus: 'dispatch', filingStatus: 'dispatching',      policyType: 'standard',    createdAt: '2026-05-06 14:00' },
  { id: 'dp03', stationNo: 'LNC-2026-0048c', projectName: '无锡市江阴市汽车配件厂屋顶光伏',     projectCompany: '无锡江阴汽配清洁能源有限公司',   agentName: '无锡联合能源有限公司',     address: '江苏省无锡市江阴市临港工业区C区',     nodeStatus: 'dispatch', filingStatus: 'dispatched',       policyType: 'standard',    createdAt: '2026-05-04 10:00' },
  { id: 'dp04', stationNo: 'LNC-2026-0049a', projectName: '苏州市吴江区纺织印染厂屋顶光伏',     projectCompany: '苏州吴江清洁能源有限公司',       agentName: '苏州绿岛能源科技有限公司', address: '江苏省苏州市吴江区盛泽镇工业园',       nodeStatus: 'dispatch', filingStatus: 'waiting_dispatch', policyType: 'nonstandard', createdAt: '2026-05-03 11:30' },
  { id: 'dp05', stationNo: 'LNC-2026-0049b', projectName: '苏州市吴江区电子元器件厂屋顶光伏',   projectCompany: '苏州吴江电子能源有限公司',       agentName: '苏州绿岛能源科技有限公司', address: '江苏省苏州市吴江区震泽镇工业区',       nodeStatus: 'dispatch', filingStatus: 'dispatching',      policyType: 'nonstandard', createdAt: '2026-05-01 09:00' },
  { id: 'dp06', stationNo: 'LNC-2026-0050a', projectName: '南京市江宁区智能制造产业园屋顶光伏', projectCompany: '南京江宁智慧能源有限公司',       agentName: '南京绿能科技有限公司',     address: '江苏省南京市江宁区麒麟科技创新园',     nodeStatus: 'dispatch', filingStatus: 'dispatched',       policyType: 'standard',    createdAt: '2026-04-28 15:00' },
  { id: 'dp07', stationNo: 'LNC-2026-0050b', projectName: '南京市江宁区新能源装备厂屋顶光伏',   projectCompany: '南京江宁清洁能源科技有限公司', agentName: '南京绿能科技有限公司',     address: '江苏省南京市江宁区禄口经济开发区',     nodeStatus: 'dispatch', filingStatus: 'dispatching',      policyType: 'standard',    createdAt: '2026-04-25 10:30' },

  // ── 并网节点 × 4 ── filingStatus 待补充
  { id: 'p01', stationNo: 'LNC-2026-0048', projectName: '无锡市江阴市钢铁企业屋顶光伏', projectCompany: '无锡江阴光伏资产有限公司', agentName: '无锡联合能源有限公司', address: '江苏省无锡市江阴市临港工业区', nodeStatus: 'grid', filingStatus: undefined, policyType: 'standard',    createdAt: '2026-05-10 14:00' },
  { id: 'p02', stationNo: 'LNC-2026-0049', projectName: '常州市金坛区蓄电池工厂屋顶光伏', projectCompany: '常州金坛光伏有限公司', agentName: '常州新日能源科技有限公司', address: '江苏省常州市金坛区工业新区', nodeStatus: 'grid', filingStatus: undefined, policyType: 'nonstandard', createdAt: '2026-05-05 10:30' },
  { id: 'p03', stationNo: 'LNC-2026-0050', projectName: '苏州市昆山市电子制造企业光伏', projectCompany: '苏州昆山光伏投资有限公司', agentName: '苏州阳光新能源技术有限公司', address: '江苏省苏州市昆山市开发区', nodeStatus: 'grid', filingStatus: undefined, policyType: 'standard',    createdAt: '2026-04-28 09:00' },
  { id: 'p04', stationNo: 'LNC-2026-0051', projectName: '嘉兴市桐乡市纺织品工厂光伏', projectCompany: '嘉兴桐乡清洁能源有限公司', agentName: '嘉兴蓝日能源技术有限公司', address: '浙江省嘉兴市桐乡市振东工业区', nodeStatus: 'grid', filingStatus: undefined, policyType: 'standard',    createdAt: '2026-04-20 15:20' },

  // ── 竣工节点 × 3 ── filingStatus 待补充
  { id: 'd01', stationNo: 'LNC-2026-0052', projectName: '杭州市萧山区化纤工厂屋顶光伏', projectCompany: '杭州萧山光伏资产有限公司', agentName: '浙江绿能科技有限公司', address: '浙江省杭州市萧山区义蓬工业区', nodeStatus: 'done', filingStatus: undefined, policyType: 'standard',    createdAt: '2026-04-10 10:00' },
  { id: 'd02', stationNo: 'LNC-2026-0053', projectName: '南京市栖霞区生物医药厂屋顶光伏', projectCompany: '南京栖霞光伏管理有限公司', agentName: '南京清洁能源有限公司', address: '江苏省南京市栖霞区仙林科技城', nodeStatus: 'done', filingStatus: undefined, policyType: 'nonstandard', createdAt: '2026-03-25 14:30' },
  { id: 'd03', stationNo: 'LNC-2026-0054', projectName: '苏州市虎丘区光学镜片厂光伏', projectCompany: '苏州虎丘光伏投资有限公司', agentName: '苏州阳光新能源技术有限公司', address: '江苏省苏州市虎丘区工业园区', nodeStatus: 'done', filingStatus: undefined, policyType: 'standard',    createdAt: '2026-03-15 09:00' },
]

async function getProjectList(params: any): Promise<{ list: any[]; total: number }> {
  // 接入时替换：return http.post('/api/lnc/project/list', params)
  await new Promise(r => setTimeout(r, 200))
  // B方案：到货覆盖用 'b:' 前缀（由到货申请页-B写入），开工覆盖无前缀（共用A方案开工详情页）
  const overrideKey = (id: string) => {
    if (props.variant !== 'B') return id
    return stationStatusOverrides['b:' + id] !== undefined ? 'b:' + id : id
  }
  let list = MOCK_LIST.map(r => {
    const ov  = stationStatusOverrides[overrideKey(r.id)]
    const rp  = startReviewProgress['b:' + r.id]
    const frp = filingReviewProgress[r.id]
    const merged: any = { ...r }
    if (ov) merged.filingStatus = ov
    if (rp) merged.reviewProgress = rp
    if (frp) {
      merged.selfReviewProgress     = frp.self
      merged.platformReviewProgress = frp.platform
      // status override from filingReviewProgress takes precedence via stationStatusOverrides already handled above
    }
    return merged
  })

  if (params.nodeStatus?.length)   list = list.filter(r => params.nodeStatus.includes(r.nodeStatus))
  if (params.filingStatus) {
    const STOCK_IN_PROGRESS = ['reviewing_stock', 'partial_stock', 'partial_stock_rejected', 'full_stock_rejected']
    if (params.filingStatus === 'stock_in_progress') {
      list = list.filter(r => STOCK_IN_PROGRESS.includes(r.filingStatus))
    } else if (params.filingStatus === 'stock_done') {
      list = list.filter(r => r.filingStatus === 'full_stock')
    } else {
      list = list.filter(r => r.filingStatus === params.filingStatus)
    }
  }
  if (params.projectName)          list = list.filter(r => r.projectName.includes(params.projectName))
  if (params.stationNo)            list = list.filter(r => r.stationNo.includes(params.stationNo))
  if (params.agentName)            list = list.filter(r => r.agentName.includes(params.agentName))
  if (params.projectCompany)       list = list.filter(r => r.projectCompany.includes(params.projectCompany))
  if (params.address)              list = list.filter(r => r.address.includes(params.address))

  const total = list.length
  const page  = params.pageIndex ?? 1
  const size  = params.pageRows  ?? 20
  list = list.slice((page - 1) * size, page * size)

  return { list, total }
}

async function voidProject(_id: string) {
  // POST /api/lnc/project/void
}
</script>

<style scoped>
.cell-tip { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.node-dot-wrap { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; }
.node-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.node-dot--filing   { background: #1677ff; }
.node-dot--start    { background: #52c41a; }
.node-dot--stock    { background: #fa8c16; }
.node-dot--dispatch { background: #2f54eb; }
.node-dot--complete { background: #13c2c2; }
.node-dot--grid     { background: #722ed1; }
.node-dot--done     { background: #d9d9d9; }

.project-list-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 去掉 processing badge 的脉冲光晕 */
.project-list-page :deep(.ant-badge-status-processing::after) {
  animation: none;
}

/* 外层合并卡片 */
.slist-main-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.slist-main-card :deep(.anfe-pro-table) {
  background: transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* 节点卡片行 */
.slist-node-row { display: flex; gap: 10px; padding: 20px 20px 12px; }

.slist-node-card {
  flex: 1;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.slist-node-card:hover { border-color: #3060FF; }
.slist-node-card.active { border-color: #3060FF; background: #EEF2FF; }

.slist-node-label { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
.slist-node-card.active .slist-node-label { color: #3060FF; }

.slist-node-count { font-size: 22px; font-weight: 700; color: #1f2937; line-height: 1.2; }
.slist-node-card.active .slist-node-count { color: #3060FF; }

/* 选择建档类型弹窗 */
.policy-select {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0 8px;
}

.policy-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s;
}

.policy-card:hover {
  border-color: #1677ff;
  background: #f0f7ff;
}

.policy-card:hover .policy-card-arrow {
  color: #1677ff;
}

.policy-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.policy-card-desc {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.5;
}

.policy-card-arrow {
  color: #d9d9d9;
  font-size: 14px;
  flex-shrink: 0;
  margin-left: 12px;
  transition: color 0.18s;
}

.drawer-fixed-val {
  font-size: 14px;
  color: #1a1a1a;
}

.field-hint { font-size: 12px; color: #8c8c8c; }

.oa-field-wrap { position: relative; }

.oa-selector-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 11px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s;
}
.oa-selector-wrap:hover { border-color: #1677ff; }
.oa-selector-val { font-size: 14px; color: #1a1a1a; }
.oa-selector-placeholder { font-size: 14px; color: #bfbfbf; }
.oa-selector-arrow { font-size: 11px; color: #8c8c8c; transition: transform 0.2s; }
.oa-selector-arrow.open { transform: rotate(180deg); }

.oa-cell-name { font-size: 13px; color: #1a1a1a; line-height: 1.4; }
.oa-cell-no   { font-size: 12px; color: #8c8c8c; margin-top: 3px; }

.oa-dropdown {
  position: absolute;
  left: 0;
  min-width: 360px;
  top: 36px;
  z-index: 200;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  overflow: hidden;
}

.oa-selected-name {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
  padding-left: 2px;
}

.fake-radio-group { display: inline-flex; gap: 20px; }

.fake-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
  user-select: none;
}

.fake-radio::before {
  content: '';
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #d9d9d9;
  background: #fff;
  flex-shrink: 0;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.fake-radio.active { color: #1677ff; }

.fake-radio.active::before {
  border-color: #1677ff;
  background: #1677ff;
  box-shadow: inset 0 0 0 3px #fff;
}

/* Drawer 上下结构布局 */
.drawer-field-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  margin-bottom: 8px;
}
.drawer-required {
  color: #ff4d4f;
  font-size: 14px;
  font-family: SimSun, sans-serif;
  line-height: 1;
  margin-inline-end: 4px;
}
.drawer-card-row {
  display: flex;
  gap: 12px;
}
.drawer-card {
  flex: 1;
  border: 1.5px solid #e4e4e4;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
  background: #fff;
}
.drawer-card:hover {
  border-color: #1677ff;
  background: #f0f6ff;
}
.drawer-card.active {
  border-color: #1677ff;
  background: #f0f6ff;
}
.drawer-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}
.drawer-card.active .drawer-card-title {
  color: #1677ff;
}
.drawer-card-desc {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.5;
}
</style>

<style>
/* OA 下拉表格单元格 padding 加大 */
.oa-dropdown .ant-table-thead > tr > th,
.oa-dropdown .ant-table-tbody > tr > td {
  padding: 10px 14px !important;
}

/* 固定列 z-index 与背景色（全局，因 ant-table-cell 不接受 scoped 穿透） */
.ant-table-cell-fix-right {
  z-index: 4 !important;
  background: #fff !important;
}
.ant-table-tbody > tr:hover > .ant-table-cell-fix-right {
  background: #fafafa !important;
}
.ant-table-thead > tr > .ant-table-cell-fix-right {
  background: #fafafa !important;
  z-index: 5 !important;
}
</style>
