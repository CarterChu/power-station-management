<template>
  <AnfeConfigProvider user-type="Anneng">
    <div class="app-layout">

      <!-- ── 顶部导航栏（1:1 参考） ── -->
      <header class="app-topbar">
        <div class="topbar-brand">
          <img class="brand-logo" src="/icons/app-icon.png" alt="正泰安能" />
          <span class="brand-name">正泰安能数字能源云平台</span>
        </div>
        <div class="topbar-tools">
          <button class="tool-btn">
            <img src="/icons/icon1.png" class="tool-icon-img" alt="" />
            电站搜索
          </button>
          <button class="tool-btn">
            <img src="/icons/icon2.png" class="tool-icon-img" alt="" />
            客服
          </button>
          <button class="tool-btn">
            <img src="/icons/icon3.png" class="tool-icon-img" alt="" />
            帮助文档
          </button>
          <div class="tool-icons-group">
            <button class="tool-icon-btn" title="消息">
              <img src="/icons/icon4.png" class="tool-icon-img" alt="" />
            </button>
            <button class="tool-icon-btn" title="视图">
              <img src="/icons/icon5.png" class="tool-icon-img" alt="" />
            </button>
            <button class="tool-icon-btn" title="通知">
              <img src="/icons/icon6.png" class="tool-icon-img" alt="" />
            </button>
          </div>
          <div class="user-info">
            <img class="user-avatar" src="/icons/avatar.png" alt="用户头像" />
            <span>章志民</span>
          </div>
        </div>
      </header>

      <!-- ── 主体：侧边栏 + 内容区（1:1 参考） ── -->
      <div class="app-body">

        <!-- 左侧两级导航菜单 -->
        <div class="sidebar-wrap" :class="{ collapsed: sidebarCollapsed }">
          <aside class="app-sidebar">
            <div class="sidebar-nav-area">
              <!-- 搜索框 -->
              <div v-show="!sidebarCollapsed" class="sidebar-search-wrap">
                <div class="sidebar-search-box">
                  <SearchOutlined class="sidebar-search-icon" />
                  <input
                    v-model="sidebarSearch"
                    class="sidebar-search-input"
                    placeholder=""
                  />
                  <span
                    v-show="sidebarSearch"
                    class="sidebar-search-clear"
                    @click="sidebarSearch = ''"
                  >×</span>
                </div>
              </div>

              <!-- 搜索结果 -->
              <div v-show="!sidebarCollapsed && sidebarSearch" class="sidebar-search-results">
                <div v-if="searchResults.length === 0" class="sidebar-search-empty">无匹配结果</div>
                <div
                  v-for="item in searchResults"
                  :key="item.key"
                  class="sidebar-search-item"
                  :class="{ active: activeMenuKey === item.key }"
                  @click="handleMenuClick({ key: item.key }); sidebarSearch = ''"
                >
                  <span class="sidebar-search-item-label">{{ item.label }}</span>
                  <span class="sidebar-search-item-domain">{{ item.domain }}</span>
                </div>
              </div>

              <a-menu
                v-show="!sidebarCollapsed && !sidebarSearch"
                mode="inline"
                :selected-keys="[activeMenuKey]"
                v-model:open-keys="menuOpenKeys"
                style="border-inline-end: none"
                @click="handleMenuClick"
              >
                <a-sub-menu v-for="group in menuGroups" :key="group.domain" :title="group.domain">
                  <template #icon><component :is="group.icon" /></template>
                  <a-menu-item v-for="item in group.items" :key="item.key">
                    {{ item.label }}
                  </a-menu-item>
                </a-sub-menu>
              </a-menu>

              <div v-show="sidebarCollapsed" class="sidebar-icon-list">
                <a-tooltip
                  v-for="group in menuGroups"
                  :key="group.domain"
                  :title="group.domain"
                  placement="right"
                >
                  <div
                    class="sidebar-icon-item"
                    :class="{ active: activeMenuGroupDomain === group.domain }"
                    @click="sidebarCollapsed = false; menuOpenKeys = [group.domain]"
                  >
                    <component :is="group.icon" />
                  </div>
                </a-tooltip>
              </div>
            </div>

            <button class="sidebar-collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
              <component :is="sidebarCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined" />
            </button>
          </aside>
        </div>

        <!-- 内容区 -->
        <div class="app-main">
          <!-- Chrome 风格标签栏 -->
          <div class="app-tabbar">
            <div class="tabbar-inner">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                class="chrome-tab"
                :class="{ active: activeTabKey === tab.key }"
                @click="switchTab(tab.key)"
              >
                <span class="tab-label">{{ tab.label }}</span>
                <span v-if="tab.closable" class="tab-close" @click.stop="closeTab(tab.key)">×</span>
              </button>
            </div>
          </div>

          <!-- 页面内容 -->
          <div class="app-content">
            <LncProjectList v-if="activeTabKey === 'list'" @navigate="handleNavigate" />
            <LncProjectList v-else-if="activeTabKey === 'list-b'" variant="B" @navigate="handleNavigate" />
            <FilingStandard v-else-if="activeTabKey === 'filing-standard'" :edit-id="editingId" :init-status="filingInitStatus" :init-data="filingInitData" @back="handleBackFromFiling" />
            <FilingNonStandard v-else-if="activeTabKey === 'filing-non-standard'" :edit-id="editingId" :init-status="filingInitStatus" :init-data="filingInitData" @back="handleBackFromNonStandardFiling" />
            <FilingDetail v-else-if="activeTabKey === 'detail'" :init-status="detailStatus" :policy-type="detailPolicyType" :init-row="detailRow" @back="handleBackFromDetail" @edit="handleEditFromDetail" />
            <StartApply v-else-if="activeTabKey === 'start-apply'" :edit-id="editingId" :init-status="startApplyInitStatus" :init-data="startApplyInitData" @back="handleBackFromStartApply" />
            <StartDetail v-else-if="activeTabKey === 'start-detail'" :init-row="startDetailRow" @back="handleBackFromStartDetail" @edit="handleEditFromStartDetail" />
            <StartApplyB v-else-if="activeTabKey === 'start-apply-b'" :edit-id="editingId" :init-status="startApplyBInitStatus" :init-data="startApplyBInitData" @back="handleBackFromStartApplyB" />
            <StartDetailB v-else-if="activeTabKey === 'start-detail-b'" :init-row="startDetailBRow" @back="handleBackFromStartDetailB" @edit="handleEditFromStartDetailB" />
            <StockApply v-else-if="activeTabKey === 'stock-apply'" :edit-id="editingId" :init-status="stockApplyInitStatus" :init-data="stockApplyInitData" @back="handleBackFromStockApply" />
            <StockDetail v-else-if="activeTabKey === 'stock-detail'" :init-row="stockDetailRow" @back="handleBackFromStockDetail" @edit="handleEditFromStockDetail" />
            <CompleteApply v-else-if="activeTabKey === 'complete-apply'" :edit-id="editingId" :init-status="completeApplyInitStatus" :init-data="completeApplyInitData" :policy-type="completePolicyType" @back="handleBackFromCompleteApply" />
            <CompleteDetail v-else-if="activeTabKey === 'complete-detail'" :init-row="completeDetailRow" :policy-type="completePolicyType" @back="handleBackFromCompleteDetail" @edit="handleEditFromCompleteDetail" />
            <StockApplyB v-else-if="activeTabKey === 'stock-apply-b'" :init-status="stockApplyBInitStatus" :init-data="stockApplyBInitData" @back="handleBackFromStockApplyB" />
            <StockDetailB v-else-if="activeTabKey === 'stock-detail-b'" :init-row="stockDetailBRow" @back="handleBackFromStockDetailB" @edit="handleEditFromStockDetailB" />
            <DispatchApply v-else-if="activeTabKey === 'dispatch-apply'" :init-status="dispatchApplyInitStatus" :init-data="dispatchApplyInitData" @back="handleBackFromDispatchApply" />
            <DispatchDetail v-else-if="activeTabKey === 'dispatch-detail'" :init-row="dispatchDetailRow" @back="handleBackFromDispatchDetail" @edit="handleEditFromDispatchDetail" />
          </div>
        </div>

      </div>
    </div>
  </AnfeConfigProvider>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { AnfeConfigProvider } from '@anfe/vue-pro-components'
import {
  MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined,
} from '@ant-design/icons-vue'
import NavIconBasic from './components/nav-icons/NavIconBasic.vue'
import NavIconMarketing from './components/nav-icons/NavIconMarketing.vue'
import NavIconStation from './components/nav-icons/NavIconStation.vue'
import NavIconOperation from './components/nav-icons/NavIconOperation.vue'
import NavIconSupply from './components/nav-icons/NavIconSupply.vue'
import NavIconFinance from './components/nav-icons/NavIconFinance.vue'
import NavIconOther from './components/nav-icons/NavIconOther.vue'
import LncProjectList from './pages/工商业项目管理列表页.vue'
import FilingStandard from './pages/建档申请页-标准政策.vue'
import FilingNonStandard from './pages/建档申请页-非标政策.vue'
import FilingDetail from './pages/建档详情页.vue'
import StartApply  from './pages/开工申请页.vue'
import StartDetail from './pages/开工详情页.vue'
import StartApplyB  from './pages/开工申请页-B.vue'
import StartDetailB from './pages/开工详情页-B.vue'
import StockApply from './pages/到货申请页.vue'
import StockDetail from './pages/到货详情页.vue'
import CompleteApply from './pages/完工申请页.vue'
import CompleteDetail from './pages/完工详情页.vue'
import StockApplyB from './pages/到货申请页-B.vue'
import StockDetailB from './pages/到货详情页-B.vue'
import DispatchApply from './pages/派工申请页.vue'
import DispatchDetail from './pages/派工详情页.vue'

// ── Tab 路由状态 ──
interface Tab { key: string; label: string; closable?: boolean }

const tabs = ref<Tab[]>([
  { key: 'list-b', label: '电站列表', closable: false },
])
const activeTabKey = ref('list-b')
const editingId        = ref<string | null>(null)
const detailStatus     = ref<string>('filing')
const detailPolicyType = ref<string>('standard')
const detailRow        = ref<Record<string, any>>({})
const filingInitData   = ref<any>(null)
const filingInitStatus = ref<string | null>(null)
const startApplyInitData   = ref<any>(null)
const startApplyInitStatus = ref<string | null>(null)
const startDetailRow       = ref<Record<string, any>>({})
const previousListTab      = ref<string>('list')
const startApplyBInitData   = ref<any>(null)
const startApplyBInitStatus = ref<string | null>(null)
const startDetailBRow       = ref<Record<string, any>>({})
const stockApplyInitData   = ref<any>(null)
const stockApplyInitStatus = ref<string | null>(null)
const stockDetailRow       = ref<Record<string, any>>({})
const completeApplyInitData   = ref<any>(null)
const completeApplyInitStatus = ref<string | null>(null)
const completeDetailRow       = ref<Record<string, any>>({})
const completePolicyType      = ref<string>('standard')
const stockApplyBInitData    = ref<any>(null)
const stockApplyBInitStatus  = ref<string | null>(null)
const stockDetailBRow        = ref<Record<string, any>>({})
const dispatchApplyInitData   = ref<any>(null)
const dispatchApplyInitStatus = ref<string | null>(null)
const dispatchDetailRow       = ref<Record<string, any>>({})

// page 别名，供兼容
const page = computed(() => activeTabKey.value)

// ── sessionStorage 状态持久化（刷新保留当前页） ──
const _SS_KEY = 'lnc-app-state'
function _saveState() {
  try {
    sessionStorage.setItem(_SS_KEY, JSON.stringify({
      tabs: tabs.value,
      activeTabKey: activeTabKey.value,
      editingId: editingId.value,
      detailStatus: detailStatus.value,
      detailPolicyType: detailPolicyType.value,
      detailRow: detailRow.value,
      filingInitData: filingInitData.value,
      filingInitStatus: filingInitStatus.value,
      startApplyInitData: startApplyInitData.value,
      startApplyInitStatus: startApplyInitStatus.value,
      startDetailRow: startDetailRow.value,
      stockApplyInitData: stockApplyInitData.value,
      stockApplyInitStatus: stockApplyInitStatus.value,
      stockDetailRow: stockDetailRow.value,
      completeApplyInitData: completeApplyInitData.value,
      completeApplyInitStatus: completeApplyInitStatus.value,
      completeDetailRow: completeDetailRow.value,
      completePolicyType: completePolicyType.value,
    }))
  } catch {}
}
watch(
  [tabs, activeTabKey, editingId, detailStatus, detailPolicyType, detailRow,
   filingInitData, filingInitStatus, startApplyInitData, startApplyInitStatus,
   startDetailRow, stockApplyInitData, stockApplyInitStatus, stockDetailRow,
   completeApplyInitData, completeApplyInitStatus, completeDetailRow, completePolicyType],
  _saveState, { deep: true }
)
onMounted(() => {
  try {
    const raw = sessionStorage.getItem(_SS_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    if (s.tabs) tabs.value = s.tabs
    if (s.activeTabKey) activeTabKey.value = s.activeTabKey
    editingId.value = s.editingId ?? null
    if (s.detailStatus) detailStatus.value = s.detailStatus
    if (s.detailPolicyType) detailPolicyType.value = s.detailPolicyType
    if (s.detailRow) detailRow.value = s.detailRow
    filingInitData.value = s.filingInitData ?? null
    filingInitStatus.value = s.filingInitStatus ?? null
    startApplyInitData.value = s.startApplyInitData ?? null
    startApplyInitStatus.value = s.startApplyInitStatus ?? null
    if (s.startDetailRow) startDetailRow.value = s.startDetailRow
    stockApplyInitData.value = s.stockApplyInitData ?? null
    stockApplyInitStatus.value = s.stockApplyInitStatus ?? null
    if (s.stockDetailRow) stockDetailRow.value = s.stockDetailRow
    completeApplyInitData.value = s.completeApplyInitData ?? null
    completeApplyInitStatus.value = s.completeApplyInitStatus ?? null
    if (s.completeDetailRow) completeDetailRow.value = s.completeDetailRow
    if (s.completePolicyType) completePolicyType.value = s.completePolicyType
  } catch {}
})

function switchTab(key: string) {
  activeTabKey.value = key
}

function openTab(key: string, label: string, closable = true) {
  if (!tabs.value.some(t => t.key === key)) {
    tabs.value.push({ key, label, closable })
  }
  activeTabKey.value = key
}

function closeTab(key: string) {
  const idx = tabs.value.findIndex(t => t.key === key)
  if (idx === -1) return
  tabs.value.splice(idx, 1)
  if (activeTabKey.value === key) {
    const fallback = tabs.value[idx] ?? tabs.value[idx - 1]
    activeTabKey.value = fallback?.key ?? 'list'
  }
}

// ── 菜单数据（1:1 参考） ──
const menuGroups = [
  {
    domain: '基础',
    icon: NavIconBasic,
    items: [
      { key: 'nav-公告通知', label: '公告通知' },
      { key: 'nav-我的工作台', label: '我的工作台' },
      { key: 'nav-系统管理', label: '系统管理' },
      { key: 'nav-数据权限管理', label: '数据权限管理' },
      { key: 'nav-数据分析中心', label: '数据分析中心' },
      { key: 'nav-工具模块', label: '工具模块' },
    ],
  },
  {
    domain: '营销',
    icon: NavIconMarketing,
    items: [
      { key: 'nav-品牌营销', label: '品牌营销' },
      { key: 'nav-客户中心', label: '客户中心' },
    ],
  },
  {
    domain: '电站管理',
    icon: NavIconStation,
    items: [
      { key: 'nav-电站工作台', label: '电站工作台' },
      { key: 'nav-电站列表', label: '电站列表' },
      { key: 'nav-电站详情', label: '电站详情' },
    ],
  },
  {
    domain: '工商业电站管理',
    icon: NavIconStation,
    items: [
      { key: 'biz-dashboard', label: '电站工作台' },
      { key: 'biz-list',      label: '电站列表' },
    ],
  },
  {
    domain: '运营',
    icon: NavIconOperation,
    items: [
      { key: 'nav-电站建档', label: '电站建档' },
      { key: 'nav-完工登记序列号', label: '完工登记（序列号录入）' },
      { key: 'nav-完工登记工程资料', label: '完工登记（工程资料）' },
      { key: 'nav-电站交付', label: '电站交付' },
      { key: 'nav-变更并网前', label: '电站变更(并网前)' },
      { key: 'nav-变更并网后', label: '电站变更(并网后)' },
      { key: 'nav-工程资料配置', label: '工程资料配置' },
      { key: 'nav-财务管理', label: '财务管理' },
      { key: 'nav-整改中心', label: '整改中心' },
      { key: 'nav-审核中心', label: '审核中心' },
      { key: 'nav-电站项目管理', label: '电站项目管理' },
      { key: 'nav-施工安全管理', label: '施工安全管理' },
      { key: 'nav-施工资源管理', label: '施工资源管理' },
      { key: 'nav-电站项目管控', label: '电站项目管控' },
      { key: 'nav-电站项目管理设置', label: '电站项目管理设置' },
      { key: 'nav-电站收益与EPC价格', label: '电站收益与EPC价格' },
    ],
  },
  {
    domain: '供应链',
    icon: NavIconSupply,
    items: [
      { key: 'nav-齐套管理', label: '齐套管理' },
      { key: 'nav-到货管理', label: '到货管理' },
      { key: 'nav-计划管理', label: '计划管理' },
      { key: 'nav-安能物料采购管理', label: '安能物料采购管理' },
      { key: 'nav-供应商结算', label: '供应商结算' },
      { key: 'nav-运维返修管理', label: '运维返修管理' },
      { key: 'nav-供应商仓库管理', label: '供应商仓库管理' },
      { key: 'nav-采购数据分析中心', label: '采购数据分析中心' },
      { key: 'nav-调度管理', label: '调度管理' },
      { key: 'nav-安能仓库管理', label: '安能仓库管理' },
      { key: 'nav-代理商仓库管理', label: '代理商仓库管理' },
      { key: 'nav-价格管理', label: '价格管理' },
      { key: 'nav-物料管理', label: '物料管理' },
    ],
  },
  {
    domain: '金融财务',
    icon: NavIconFinance,
    items: [
      { key: 'nav-电站销售回款', label: '电站销售回款' },
      { key: 'nav-供应链金融管理', label: '供应链金融管理' },
      { key: 'nav-综合服务办理', label: '综合服务办理' },
    ],
  },
  {
    domain: '其他',
    icon: NavIconOther,
    items: [
      { key: 'nav-智慧运维商城', label: '智慧运维商城' },
    ],
  },
]

function getMenuGroupDomain(key: string): string {
  return menuGroups.find((g) => g.items.some((i) => i.key === key))?.domain ?? ''
}

const activeMenuKey = computed(() => {
  if (['list-b', 'list', 'start-apply', 'start-detail', 'stock-apply-b', 'stock-detail-b', 'detail', 'filing-standard', 'filing-non-standard'].includes(page.value)) return 'biz-list'
  return ''
})

const activeMenuGroupDomain = computed(() =>
  menuGroups.find(g => g.items.some(i => i.key === activeMenuKey.value))?.domain ?? null
)

const menuOpenKeys = ref<string[]>(['工商业电站管理'])
const sidebarCollapsed = ref(false)
const sidebarSearch = ref('')

const searchResults = computed(() => {
  const q = sidebarSearch.value.trim().toLowerCase()
  if (!q) return []
  const results: Array<{ key: string; label: string; domain: string }> = []
  for (const group of menuGroups) {
    for (const item of group.items) {
      if (item.label.toLowerCase().includes(q) || group.domain.toLowerCase().includes(q)) {
        results.push({ key: item.key, label: item.label, domain: group.domain })
      }
    }
  }
  return results
})

function handleMenuClick({ key }: { key: string }) {
  if (key === 'biz-list') openTab('list-b', '电站列表', false)
  else if (key === 'biz-dashboard') openTab('list-b', '电站列表', false)
  const domain = getMenuGroupDomain(key)
  if (domain && !menuOpenKeys.value.includes(domain)) {
    menuOpenKeys.value = [domain]
  }
}

// ── 导航 ──
const handleNavigate = (target: string, payload?: any) => {
  editingId.value = payload?.editId ?? null
  if (target === 'detail') {
    if (payload?.filingStatus) detailStatus.value = payload.filingStatus
    if (payload?.policyType) detailPolicyType.value = payload.policyType
    detailRow.value = payload ?? {}
    openTab('detail', '建档详情')
  } else if (target === 'filing-standard') {
    if (payload?.editId) {
      filingInitData.value = null
      filingInitStatus.value = payload?.initStatus ?? null
      openTab('filing-standard', '编辑建档')
    } else {
      filingInitData.value = payload ?? null
      filingInitStatus.value = null
      openTab('filing-standard', payload?.tabLabel ?? '新增建档')
    }
  } else if (target === 'filing-non-standard') {
    if (payload?.editId) {
      filingInitData.value = null
      filingInitStatus.value = payload?.initStatus ?? null
      openTab('filing-non-standard', '编辑建档')
    } else {
      filingInitData.value = payload ?? null
      filingInitStatus.value = null
      openTab('filing-non-standard', payload?.tabLabel ?? '非标政策建档')
    }
  } else if (target === 'start-apply') {
    previousListTab.value = activeTabKey.value
    editingId.value = payload?.editId ?? null
    startApplyInitStatus.value = payload?.initStatus ?? null
    startApplyInitData.value = payload ?? null
    openTab('start-apply', payload?.editId ? '编辑开工申请' : '开工申请')
  } else if (target === 'start-detail') {
    previousListTab.value = activeTabKey.value
    startDetailRow.value = payload ?? {}
    openTab('start-detail', '开工详情')
  } else if (target === 'start-apply-b') {
    editingId.value = payload?.editId ?? null
    startApplyBInitStatus.value = payload?.initStatus ?? null
    startApplyBInitData.value = payload ?? null
    openTab('start-apply-b', payload?.editId ? '编辑开工申请（B）' : '开工申请（B）')
  } else if (target === 'start-detail-b') {
    startDetailBRow.value = payload ?? {}
    openTab('start-detail-b', '开工详情（B）')
  } else if (target === 'stock-apply') {
    editingId.value = payload?.editId ?? null
    stockApplyInitStatus.value = payload?.initStatus ?? null
    stockApplyInitData.value = payload ?? null
    openTab('stock-apply', payload?.editId ? '编辑到货申请' : '到货申请')
  } else if (target === 'stock-detail') {
    stockDetailRow.value = payload ?? {}
    openTab('stock-detail', '到货详情')
  } else if (target === 'complete-apply') {
    editingId.value = payload?.editId ?? null
    completeApplyInitStatus.value = payload?.initStatus ?? null
    completeApplyInitData.value = payload ?? null
    if (payload?.policyType) completePolicyType.value = payload.policyType
    openTab('complete-apply', payload?.editId ? '编辑完工申请' : '完工申请')
  } else if (target === 'complete-detail') {
    completeDetailRow.value = payload ?? {}
    if (payload?.policyType) completePolicyType.value = payload.policyType
    openTab('complete-detail', '完工详情')
  } else if (target === 'stock-apply-b') {
    stockApplyBInitStatus.value = payload?.initStatus ?? payload?.filingStatus ?? null
    stockApplyBInitData.value = payload ?? null
    openTab('stock-apply-b', '编辑到货（B）')
  } else if (target === 'stock-detail-b') {
    stockDetailBRow.value = payload ?? {}
    openTab('stock-detail-b', '到货详情（B）')
  } else if (target === 'dispatch-apply') {
    dispatchApplyInitStatus.value = payload?.initStatus ?? payload?.filingStatus ?? null
    dispatchApplyInitData.value = payload ?? null
    openTab('dispatch-apply', '派工领料')
  } else if (target === 'dispatch-detail') {
    dispatchDetailRow.value = payload ?? {}
    openTab('dispatch-detail', '派工详情')
  }
}

const handleBackFromStockApplyB = () => closeTab('stock-apply-b')
const handleBackFromDispatchApply = () => closeTab('dispatch-apply')
const handleBackFromDispatchDetail = () => closeTab('dispatch-detail')
const handleEditFromDispatchDetail = (id: string) => {
  dispatchApplyInitData.value = { ...dispatchDetailRow.value, id }
  dispatchApplyInitStatus.value = dispatchDetailRow.value?.filingStatus ?? null
  openTab('dispatch-apply', '派工领料')
}
const handleBackFromStockDetailB = () => closeTab('stock-detail-b')
const handleEditFromStockDetailB = () => {
  const row = stockDetailBRow.value
  stockApplyBInitData.value = row
  stockApplyBInitStatus.value = row?.filingStatus ?? null
  openTab('stock-apply-b', '编辑到货')
}

const handleEditFromDetail = (id: string) => {
  editingId.value = id
  const tab = detailPolicyType.value === 'nonstandard' ? 'filing-non-standard' : 'filing-standard'
  openTab(tab, '编辑建档')
}

const handleBackFromFiling = () => {
  editingId.value = null
  closeTab('filing-standard')
}

const handleBackFromNonStandardFiling = () => {
  editingId.value = null
  closeTab('filing-non-standard')
}

const handleBackFromDetail = () => {
  closeTab('detail')
}

const handleBackFromStartApply = () => {
  editingId.value = null
  closeTab('start-apply')
  if (activeTabKey.value !== 'start-detail') activeTabKey.value = previousListTab.value
}

const handleBackFromStartDetail = () => {
  closeTab('start-detail')
  activeTabKey.value = previousListTab.value
}

const handleEditFromStartDetail = (id: string) => {
  editingId.value = id
  startApplyInitStatus.value = startDetailRow.value.filingStatus ?? null
  startApplyInitData.value = { ...startDetailRow.value }
  openTab('start-apply', '编辑开工申请')
}

const handleBackFromStartApplyB = () => {
  editingId.value = null
  closeTab('start-apply-b')
}

const handleBackFromStartDetailB = () => {
  closeTab('start-detail-b')
}

const handleEditFromStartDetailB = (id: string) => {
  editingId.value = id
  startApplyBInitStatus.value = startDetailBRow.value.filingStatus ?? null
  startApplyBInitData.value = { ...startDetailBRow.value }
  openTab('start-apply-b', '编辑开工申请（B）')
}

const handleBackFromStockApply = () => {
  editingId.value = null
  closeTab('stock-apply')
}

const handleBackFromStockDetail = () => {
  closeTab('stock-detail')
}

const handleEditFromStockDetail = (id: string) => {
  editingId.value = id
  stockApplyInitStatus.value = stockDetailRow.value.filingStatus ?? null
  stockApplyInitData.value = { ...stockDetailRow.value }
  openTab('stock-apply', '编辑到货申请')
}

const handleBackFromCompleteApply = () => {
  editingId.value = null
  closeTab('complete-apply')
}

const handleBackFromCompleteDetail = () => {
  closeTab('complete-detail')
}

const handleEditFromCompleteDetail = (id: string) => {
  editingId.value = id
  completeApplyInitStatus.value = completeDetailRow.value.filingStatus ?? null
  completeApplyInitData.value = { ...completeDetailRow.value }
  openTab('complete-apply', '编辑完工申请')
}
</script>

<style>
*, *::before, *::after { box-sizing: border-box; }

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── 顶栏 ── */
.app-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 20px;
  background: #1677ff;
  user-select: none;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.topbar-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.tool-btn:hover { background: rgba(255,255,255,0.15); }

.tool-icon-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.tool-icons-group {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 6px;
}

.tool-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.9);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.tool-icon-btn:hover { background: rgba(255,255,255,0.15); }

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.user-info:hover { background: rgba(255,255,255,0.15); }

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

/* ── 主体 ── */
.app-body {
  display: flex;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 52px;
}

.sidebar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 220px;
  transition: width 0.2s ease;
}

.sidebar-wrap.collapsed {
  width: 44px;
}

.app-sidebar {
  width: 100%;
  height: 100%;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.sidebar-nav-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-search-wrap {
  padding: 10px 10px 6px;
}
.sidebar-search-box {
  display: flex;
  align-items: center;
  height: 30px;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 0 8px;
  gap: 6px;
  transition: background 0.15s;
}
.sidebar-search-box:focus-within {
  background: #ebebeb;
}
.sidebar-search-icon {
  font-size: 13px;
  color: #bfbfbf;
  flex-shrink: 0;
}
.sidebar-search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #262626;
}
.sidebar-search-input::placeholder {
  color: #bfbfbf;
}
.sidebar-search-clear {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #bfbfbf;
  cursor: pointer;
  user-select: none;
  border-radius: 50%;
  position: relative;
  top: -1px;
}
.sidebar-search-clear:hover {
  background: rgba(0,0,0,0.08);
  color: #8c8c8c;
}
.sidebar-search-results {
  overflow-y: auto;
  max-height: calc(100vh - 120px);
  padding: 4px 0;
}
.sidebar-search-empty {
  padding: 20px 16px;
  font-size: 13px;
  color: #bfbfbf;
  text-align: center;
}
.sidebar-search-item {
  display: flex;
  flex-direction: column;
  padding: 7px 16px;
  cursor: pointer;
  transition: background 0.12s;
}
.sidebar-search-item:hover { background: #f5f5f5; }
.sidebar-search-item.active { background: #e6f4ff; }
.sidebar-search-item-label { font-size: 13px; color: #262626; line-height: 1.4; }
.sidebar-search-item-domain { font-size: 11px; color: #8c8c8c; margin-top: 1px; }

.sidebar-icon-list {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.sidebar-icon-item {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: rgba(0,0,0,0.55);
  cursor: pointer;
  font-size: 16px;
  transition: background 0.15s, color 0.15s;
}
.sidebar-icon-item:hover {
  background: rgba(0,0,0,0.04);
  color: #1677ff;
}
.sidebar-icon-item.active {
  background: #e6f4ff;
  color: #1677ff;
}

.sidebar-collapse-btn {
  flex-shrink: 0;
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
  border-top: 1px solid #f0f0f0;
  color: rgba(0,0,0,0.35);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.sidebar-collapse-btn:hover {
  background: rgba(0,0,0,0.03);
  color: rgba(0,0,0,0.65);
}

/* ── 内容区 ── */
.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.app-tabbar {
  height: 30px;
  flex-shrink: 0;
  background: #fff;
  padding: 0 16px;
  border-bottom: 1px solid #e8e8e8;
}

.tabbar-inner {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.chrome-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  background: transparent;
  border: none;
  color: rgba(0,0,0,0.65);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
  min-width: 80px;
  max-width: 220px;
}
.chrome-tab:not(:first-child)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  bottom: 7px;
  width: 1px;
  background: #e0e0e0;
}
.chrome-tab:hover {
  background: #e6e6e6;
  color: rgba(0,0,0,0.85);
}
.chrome-tab.active {
  background: transparent;
  color: #1677ff;
  font-weight: 500;
}

.tab-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  position: relative;
  top: -2px;
  flex-shrink: 0;
  font-size: 15px;
  line-height: 1;
  opacity: 0.6;
  border-radius: 3px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chrome-tab:hover .tab-close,
.chrome-tab.active .tab-close {
  opacity: 0.8;
}
.tab-close:hover {
  background: rgba(0,0,0,0.1);
  opacity: 1 !important;
}

.app-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #f5f5f5;
}
</style>
