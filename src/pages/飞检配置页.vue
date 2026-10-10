<template>
  <div class="fj-config-page">
    <a-tabs v-model:active-key="activeTab" class="config-tabs">
      <!-- ── Tab 1：允收标准 ── -->
      <a-tab-pane key="accept" tab="允收标准">
        <div class="config-section">
          <div class="section-title">允收标准</div>
          <div class="config-section-desc">设置各缺陷等级的允收上限，系统将根据此标准自动计算验收结论。</div>
          <div class="accept-toolbar">
            <a-space v-if="!editingAccept">
              <a-button type="primary" @click="editingAccept = true">编辑</a-button>
            </a-space>
            <a-space v-else>
              <a-button type="primary" :loading="savingAccept" @click="saveAccept">保存</a-button>
              <a-button @click="editingAccept = false">取消</a-button>
            </a-space>
          </div>
          <a-table
            :columns="acceptColumns"
            :data-source="acceptStandards"
            :pagination="false"
            size="small"
            row-key="level"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'levelTag'">
                <a-tag :color="{ cr: 'red', ma: 'orange', mi: 'gold' }[record.level]" style="margin:0;font-weight:600">
                  {{ record.level.toUpperCase() }}
                </a-tag>
              </template>
              <template v-if="column.key === 'threshold'">
                <template v-if="editingAccept">
                  <a-input-number v-model:value="record.threshold" :min="1" :max="10" size="small" style="width:80px" />
                </template>
                <span v-else>{{ record.threshold }} 个</span>
              </template>
              <template v-if="column.key === 'weight'">
                {{ (1 / record.threshold).toFixed(2) }}
              </template>
              <template v-if="column.key === 'status'">
                <a-switch :checked="record.enabled" :disabled="!editingAccept" size="small" @change="(val: boolean) => record.enabled = val" />
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- ── Tab 2：检查项 ── -->
      <a-tab-pane key="items" tab="检查项配置">
        <div class="config-section">
          <a-tabs v-model:active-key="checkItemTab" type="card" size="small">
            <!-- 分类管理 -->
            <a-tab-pane key="categories" tab="检查项分类">
              <div class="check-item-toolbar">
                <a-button type="primary" @click="addCategory">
                  <template #icon><PlusOutlined /></template>
                  新增分类
                </a-button>
              </div>
              <a-table
                :columns="catColumns"
                :data-source="categories"
                :pagination="false"
                size="small"
                row-key="id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'name'">
                    <a-input v-if="record._editing" v-model:value="record.name" size="small" style="width:160px"  />
                    <span v-else>{{ record.name }}</span>
                  </template>
                  <template v-if="column.key === 'sortNo'">
                    <a-input-number v-if="record._editing" v-model:value="record.sortNo" size="small" :min="1" style="width:70px" />
                    <span v-else>{{ record.sortNo }}</span>
                  </template>
                  <template v-if="column.key === 'enabled'">
                    <a-switch v-model:checked="record.enabled" size="small" @change="(val: boolean) => onCategoryEnabledChange(record.id, val)" />
                  </template>
                  <template v-if="column.key === 'action'">
                    <a-space :size="0">
                      <a-button v-if="!record._editing" type="link" size="small" @click="record._editing = true">编辑</a-button>
                      <a-button v-else type="link" size="small" @click="saveCategory(record)">保存</a-button>
                      <a-popconfirm title="确认删除此分类？" @confirm="deleteCategory(record.id)">
                        <a-button type="link" size="small" danger>删除</a-button>
                      </a-popconfirm>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>

            <!-- 检查项列表 -->
            <a-tab-pane key="checkItems" tab="检查项">
              <div class="check-item-toolbar">
                <a-button type="primary" @click="addItemModalVisible = true">
                  <template #icon><PlusOutlined /></template>
                  新增检查项
                </a-button>
              </div>
              <a-table
                :columns="checkItemColumns"
                :data-source="checkItems"
                :pagination="{ pageSize: 10, size: 'small' }"
                size="small"
                row-key="id"
                :scroll="{ x: 800 }"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'defaultLevel'">
                    <a-tag :color="{ cr: 'red', ma: 'orange', mi: 'gold' }[record.defaultLevel]" style="margin:0">
                      {{ record.defaultLevel?.toUpperCase() }}
                    </a-tag>
                  </template>
                  <template v-if="column.key === 'enabled'">
                    <a-switch v-model:checked="record.enabled" size="small" @change="() => syncCategoryFromItems(record.categoryId)" />
                  </template>
                  <template v-if="column.key === 'action'">
                    <a-space :size="0">
                      <a-button type="link" size="small" @click="editItem(record)">编辑</a-button>
                      <a-popconfirm title="确认删除此检查项？" @confirm="deleteItem(record.id)">
                        <a-button type="link" size="small" danger>删除</a-button>
                      </a-popconfirm>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>
          </a-tabs>
        </div>
      </a-tab-pane>

      <!-- ── Tab 3：抽验规则 ── -->
      <a-tab-pane key="rules" tab="抽验规则">
        <div class="config-section">
          <div class="section-title">抽验规则</div>
          <div class="config-section-desc">配置自动生成飞检批次的抽验规则，命中规则的电站将在指定时间自动生成草稿批次并发送通知。</div>
          <div class="rule-toolbar">
            <a-button type="primary" @click="openAddRule">
              <template #icon><PlusOutlined /></template>
              新增规则
            </a-button>
          </div>
          <a-table
            :columns="ruleColumns"
            :data-source="rules"
            :pagination="false"
            size="small"
            row-key="id"
            :scroll="{ x: 1000 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'region'">{{ record.region || '全部' }}</template>
              <template v-if="column.key === 'ratio'">
                {{ record.ratio != null ? record.ratio + '%' : record.count + '个固定' }}
              </template>
              <template v-if="column.key === 'enabled'">
                <a-switch v-model:checked="record.enabled" size="small" />
              </template>
              <template v-if="column.key === 'action'">
                <a-space :size="0">
                  <a-button type="link" size="small" @click="editRule(record)">编辑</a-button>
                  <a-popconfirm title="确认删除此规则？" @confirm="deleteRule(record.id)">
                    <a-button type="link" size="small" danger>删除</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 新增/编辑规则弹窗 -->
    <a-modal
      v-model:open="addRuleModalVisible"
      :title="editingRule ? '编辑规则' : '新增规则'"
      width="560px"
      ok-text="保存"
      @ok="saveRule"
      @cancel="cancelRule"
      destroy-on-close
    >
      <a-form :model="ruleForm" layout="vertical" style="margin-top:8px">
        <a-form-item label="省/市/区">
          <a-cascader
            v-model:value="ruleForm.regionArr"
            :options="REGION_OPTIONS"
            placeholder="请选择省/市/区（不选则为全部）"
            :display-render="({ labels }: any) => labels.join(' / ')"
            change-on-select
            allowClear
          />
        </a-form-item>
        <a-form-item label="代理商">
          <a-select
            v-model:value="ruleForm.agent"
            placeholder="请选择代理商（不选则为全部）"
            allowClear
            show-search
            :options="AGENT_OPTIONS"
          />
        </a-form-item>
        <a-form-item label="电站状态">
          <a-select v-model:value="ruleForm.stationStatus" :options="[{ label: '全部', value: '全部' }, { label: '并网', value: '并网' }, { label: '待并网', value: '待并网' }]" />
        </a-form-item>
        <a-form-item label="抽验方式" required>
          <div class="fake-radio-group" style="margin-bottom:10px">
            <label class="fake-radio" :class="{ checked: ruleForm.ratioType === 'ratio' }" @click="ruleForm.ratioType = 'ratio'">
              <span class="fake-radio-dot" :class="{ checked: ruleForm.ratioType === 'ratio' }"><span class="fake-radio-inner"></span></span>
              按比例
            </label>
            <label class="fake-radio" :class="{ checked: ruleForm.ratioType === 'count' }" @click="ruleForm.ratioType = 'count'">
              <span class="fake-radio-dot" :class="{ checked: ruleForm.ratioType === 'count' }"><span class="fake-radio-inner"></span></span>
              固定数量
            </label>
          </div>
          <a-input-number v-if="ruleForm.ratioType === 'ratio'" v-model:value="ruleForm.ratio" :min="1" :max="100" addon-after="%" style="width:160px" placeholder="请输入比例" />
          <a-input-number v-else v-model:value="ruleForm.count" :min="1" addon-after="个" style="width:160px" placeholder="请输入数量" />
        </a-form-item>
        <a-form-item label="频次" required>
          <a-select v-model:value="ruleForm.frequency" :options="[{ label: '每月', value: '每月' }, { label: '每季度', value: '每季度' }, { label: '每半年', value: '每半年' }, { label: '每年', value: '每年' }]" placeholder="请选择频次" />
        </a-form-item>
        <a-form-item label="首次触发时间" required>
          <a-date-picker v-model:value="ruleForm.nextTimeDayjs" style="width:100%" placeholder="请选择首次触发时间" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 新增检查项弹窗 -->
    <a-modal
      v-model:open="addItemModalVisible"
      :title="editingItem ? '编辑检查项' : '新增检查项'"
      width="480px"
      ok-text="保存"
      @ok="saveItem"
      @cancel="cancelItem"
    >
      <a-form :model="itemForm" layout="vertical">
        <a-form-item label="检查项名称" required>
          <a-input v-model:value="itemForm.name" placeholder="请输入检查项名称" />
        </a-form-item>
        <a-form-item label="所属分类" required>
          <a-select v-model:value="itemForm.categoryId" placeholder="请选择分类" :options="categories.map(c => ({ label: c.name, value: c.id }))" />
        </a-form-item>
        <a-form-item label="输入类型">
          <div class="fake-radio-group">
            <label class="fake-radio" :class="{ checked: itemForm.inputType === 'select' }" @click="itemForm.inputType = 'select'">
              <span class="fake-radio-dot" :class="{ checked: itemForm.inputType === 'select' }"><span class="fake-radio-inner"></span></span>
              选择（合格/不合格）
            </label>
            <label class="fake-radio" :class="{ checked: itemForm.inputType === 'input' }" @click="itemForm.inputType = 'input'">
              <span class="fake-radio-dot" :class="{ checked: itemForm.inputType === 'input' }"><span class="fake-radio-inner"></span></span>
              文本输入
            </label>
          </div>
        </a-form-item>
        <a-form-item label="默认缺陷等级">
          <a-select v-model:value="itemForm.defaultLevel" placeholder="请选择默认缺陷等级" :options="[{ label: 'CR（严重）', value: 'cr' }, { label: 'MA（主要）', value: 'ma' }, { label: 'MI（次要）', value: 'mi' }]" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import dayjs from 'dayjs'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const activeTab = ref('accept')
const checkItemTab = ref('categories')

// ── 允收标准 ────────────────────────────────────────────────────────────
const editingAccept = ref(false)
const savingAccept = ref(false)
const acceptStandards = reactive([
  { level: 'cr', label: '严重缺陷（CR）', description: '严重影响安全或性能，须立即整改', threshold: 1, enabled: true },
  { level: 'ma', label: '主要缺陷（MA）', description: '影响正常运行，须在限期内完成整改', threshold: 2, enabled: true },
  { level: 'mi', label: '次要缺陷（MI）', description: '轻微问题，建议整改', threshold: 3, enabled: true },
])
const acceptColumns = [
  { title: '缺陷等级', key: 'levelTag', width: 120 },
  { title: '说明', dataIndex: 'description', key: 'description', width: 280 },
  { title: '允收上限（个）', key: 'threshold', width: 140 },
  { title: '权重（自动）', key: 'weight', width: 130 },
  { title: '启用', key: 'status', width: 80 },
]
async function saveAccept() {
  savingAccept.value = true
  await new Promise(r => setTimeout(r, 400))
  savingAccept.value = false
  editingAccept.value = false
  message.success('允收标准已保存')
}

// ── 分类管理 ────────────────────────────────────────────────────────────
const categories = reactive([
  { id: 'cat01', name: '支架系统',    code: 'CAT-01', sortNo: 1, enabled: true, _editing: false },
  { id: 'cat02', name: '组件检查',    code: 'CAT-02', sortNo: 2, enabled: true, _editing: false },
  { id: 'cat03', name: '线缆与汇流', code: 'CAT-03', sortNo: 3, enabled: true, _editing: false },
  { id: 'cat04', name: '逆变器',      code: 'CAT-04', sortNo: 4, enabled: true, _editing: false },
  { id: 'cat05', name: '配电箱',      code: 'CAT-05', sortNo: 5, enabled: true, _editing: false },
  { id: 'cat06', name: '用电安全',    code: 'CAT-06', sortNo: 6, enabled: true, _editing: false },
  { id: 'cat07', name: '并网计量',    code: 'CAT-07', sortNo: 7, enabled: true, _editing: false },
  { id: 'cat08', name: '外部环境',    code: 'CAT-08', sortNo: 8, enabled: true, _editing: false },
])
const catColumns = [
  { title: '分类编号', dataIndex: 'code', key: 'code', width: 120 },
  { title: '分类名称', key: 'name', width: 160 },
  { title: '排序号',   key: 'sortNo', width: 90 },
  { title: '检查项数', dataIndex: 'itemCount', key: 'itemCount', width: 90, customRender: ({ record }: any) => checkItems.filter((i: any) => i.categoryId === record.id).length },
  { title: '启用',    key: 'enabled', width: 80 },
  { title: '操作',    key: 'action', width: 130 },
]
let catIdSeq = 9
function addCategory() {
  categories.push({ id: `cat0${catIdSeq++}`, name: '新分类', code: `CAT-0${catIdSeq}`, sortNo: categories.length + 1, enabled: true, _editing: true })
}
function deleteCategory(id: string) {
  const idx = categories.findIndex(c => c.id === id)
  if (idx !== -1) categories.splice(idx, 1)
  message.success('已删除')
}
function saveCategory(record: any) {
  if (!record.name?.trim()) { message.error('分类名称不能为空'); return }
  record._editing = false
  message.success('已保存')
}
function onCategoryEnabledChange(categoryId: string, enabled: boolean) {
  checkItems.filter((i: any) => i.categoryId === categoryId).forEach((i: any) => { i.enabled = enabled })
}
function syncCategoryFromItems(categoryId: string) {
  const items = checkItems.filter((i: any) => i.categoryId === categoryId)
  const cat = categories.find(c => c.id === categoryId)
  if (!cat) return
  const anyEnabled = items.some((i: any) => i.enabled)
  cat.enabled = anyEnabled
}

// ── 检查项 ────────────────────────────────────────────────────────────
const checkItems = reactive([
  { id: 'ci01', categoryId: 'cat01', name: '支架固定螺栓紧固情况', inputType: 'select', defaultLevel: 'ma', enabled: true },
  { id: 'ci02', categoryId: 'cat01', name: '支架腐蚀锈蚀情况', inputType: 'select', defaultLevel: 'ma', enabled: true },
  { id: 'ci03', categoryId: 'cat01', name: '支架倾斜角度偏差', inputType: 'select', defaultLevel: 'mi', enabled: true },
  { id: 'ci04', categoryId: 'cat02', name: '组件外观破损情况', inputType: 'select', defaultLevel: 'ma', enabled: true },
  { id: 'ci05', categoryId: 'cat02', name: '组件接地线连接', inputType: 'select', defaultLevel: 'cr', enabled: true },
  { id: 'ci06', categoryId: 'cat02', name: '组件背板气泡/发黄情况', inputType: 'select', defaultLevel: 'mi', enabled: true },
  { id: 'ci07', categoryId: 'cat03', name: '直流线缆绝缘层完整性', inputType: 'select', defaultLevel: 'cr', enabled: true },
  { id: 'ci08', categoryId: 'cat03', name: '汇流箱密封情况', inputType: 'select', defaultLevel: 'ma', enabled: true },
  { id: 'ci09', categoryId: 'cat03', name: 'MC4接头紧固情况', inputType: 'select', defaultLevel: 'ma', enabled: true },
  { id: 'ci10', categoryId: 'cat04', name: '逆变器运行状态', inputType: 'select', defaultLevel: 'cr', enabled: true },
  { id: 'ci11', categoryId: 'cat04', name: '逆变器散热风扇', inputType: 'select', defaultLevel: 'ma', enabled: true },
  { id: 'ci12', categoryId: 'cat04', name: '逆变器接线端子', inputType: 'select', defaultLevel: 'ma', enabled: true },
])
const checkItemColumns = [
  { title: '所属分类', key: 'category', width: 120, customRender: ({ record }: any) => categories.find(c => c.id === record.categoryId)?.name ?? '—' },
  { title: '检查项名称', dataIndex: 'name', key: 'name', width: 220, ellipsis: true },
  { title: '输入类型', dataIndex: 'inputType', key: 'inputType', width: 130, customRender: ({ text }: any) => text === 'select' ? '选择（合格/不合格）' : '文本输入' },
  { title: '默认缺陷等级', key: 'defaultLevel', width: 130 },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '操作', key: 'action', width: 120 },
]
const addItemModalVisible = ref(false)
const editingItem = ref<any>(null)
const itemForm = reactive({ name: '', categoryId: '' as string | undefined, inputType: 'select', defaultLevel: 'ma' as string | undefined })
function editItem(record: any) { Object.assign(itemForm, record); editingItem.value = record; addItemModalVisible.value = true }
function cancelItem() { editingItem.value = null; addItemModalVisible.value = false; Object.assign(itemForm, { name: '', categoryId: undefined, inputType: 'select', defaultLevel: 'ma' }) }
function saveItem() {
  if (!itemForm.name) { message.error('请输入检查项名称'); return }
  if (editingItem.value) { Object.assign(editingItem.value, itemForm) } else { checkItems.push({ id: `ci${Date.now()}`, ...itemForm, enabled: true } as any) }
  addItemModalVisible.value = false; editingItem.value = null; message.success('已保存')
}
function deleteItem(id: string) {
  const idx = checkItems.findIndex((i: any) => i.id === id)
  if (idx !== -1) checkItems.splice(idx, 1)
  message.success('已删除')
}

// ── 抽验规则 ────────────────────────────────────────────────────────────
const addRuleModalVisible = ref(false)
const editingRule = ref<any>(null)
const ruleForm = reactive({
  regionArr: [] as string[],
  agent: undefined as string | undefined,
  stationStatus: '并网',
  ratioType: 'ratio' as 'ratio' | 'count',
  ratio: 20 as number | null,
  count: null as number | null,
  frequency: '每季度' as string | undefined,
  nextTimeDayjs: null as any,
})
function resetRuleForm() {
  ruleForm.regionArr = []
  ruleForm.agent = undefined
  ruleForm.stationStatus = '并网'
  ruleForm.ratioType = 'ratio'
  ruleForm.ratio = 20
  ruleForm.count = null
  ruleForm.frequency = '每季度'
  ruleForm.nextTimeDayjs = null
}
function openAddRule() { resetRuleForm(); editingRule.value = null; addRuleModalVisible.value = true }
function openEditRule(row: any) {
  editingRule.value = row
  ruleForm.regionArr = row.region && row.region !== '全部' ? row.region.split(' / ').filter((s: string) => s !== '全部') : []
  ruleForm.agent = row.agent === '全部' ? undefined : row.agent
  ruleForm.stationStatus = row.stationStatus
  ruleForm.ratioType = row.ratio != null ? 'ratio' : 'count'
  ruleForm.ratio = row.ratio
  ruleForm.count = row.count
  ruleForm.frequency = row.frequency
  ruleForm.nextTimeDayjs = row.nextTime ? dayjs(row.nextTime) : null
  addRuleModalVisible.value = true
}
function cancelRule() { addRuleModalVisible.value = false; editingRule.value = null }
function saveRule() {
  if (!ruleForm.frequency) { message.error('请选择频次'); return }
  if (ruleForm.ratioType === 'ratio' && !ruleForm.ratio) { message.error('请输入抽验比例'); return }
  if (ruleForm.ratioType === 'count' && !ruleForm.count) { message.error('请输入固定数量'); return }
  if (!ruleForm.nextTimeDayjs) { message.error('请选择首次触发时间'); return }
  const regionLabel = ruleForm.regionArr.length ? ruleForm.regionArr.join(' / ') + (ruleForm.regionArr.length < 3 ? ' / 全部'.repeat(3 - ruleForm.regionArr.length) : '') : '全部'
  const data = {
    region: regionLabel,
    agent: ruleForm.agent ?? '全部',
    stationStatus: ruleForm.stationStatus,
    scene: '全部',
    ratio: ruleForm.ratioType === 'ratio' ? ruleForm.ratio : null,
    count: ruleForm.ratioType === 'count' ? ruleForm.count : null,
    frequency: ruleForm.frequency,
    nextTime: ruleForm.nextTimeDayjs.format('YYYY-MM-DD'),
  }
  if (editingRule.value) {
    Object.assign(editingRule.value, data)
  } else {
    rules.push({ id: 'rule' + Date.now(), enabled: true, ...data } as any)
  }
  addRuleModalVisible.value = false
  editingRule.value = null
  message.success('规则已保存')
}

const AGENT_OPTIONS = [
  { label: '全部', value: '全部' },
  { label: '杭州阳光新能源科技有限公司', value: '杭州阳光新能源科技有限公司' },
  { label: '宁波绿能电力安装有限公司', value: '宁波绿能电力安装有限公司' },
  { label: '苏州工业光伏集成商', value: '苏州工业光伏集成商' },
  { label: '合肥绿色能源技术有限公司', value: '合肥绿色能源技术有限公司' },
  { label: '温州光能工程技术有限公司', value: '温州光能工程技术有限公司' },
  { label: '南京太阳能科技有限公司', value: '南京太阳能科技有限公司' },
]
const REGION_OPTIONS = [
  { label: '浙江省', value: '浙江省', children: [
    { label: '杭州市', value: '杭州市', children: [{ label: '余杭区', value: '余杭区' }, { label: '萧山区', value: '萧山区' }] },
    { label: '宁波市', value: '宁波市' },
    { label: '温州市', value: '温州市' },
    { label: '金华市', value: '金华市' },
  ]},
  { label: '江苏省', value: '江苏省', children: [
    { label: '南京市', value: '南京市' },
    { label: '苏州市', value: '苏州市' },
  ]},
  { label: '安徽省', value: '安徽省', children: [
    { label: '合肥市', value: '合肥市' },
    { label: '芜湖市', value: '芜湖市' },
  ]},
]

const rules = reactive([
  { id: 'rule01', region: '浙江省 / 全部 / 全部', agent: '全部', stationStatus: '并网', scene: '全部', ratio: 20, count: null, frequency: '每季度', nextTime: '2026-10-01', enabled: true },
  { id: 'rule02', region: '江苏省 / 苏州市 / 全部', agent: '全部', stationStatus: '并网', scene: '全部', ratio: 30, count: null, frequency: '每月', nextTime: '2026-10-10', enabled: true },
  { id: 'rule03', region: '安徽省 / 全部 / 全部', agent: '合肥绿色能源技术有限公司', stationStatus: '并网', scene: '全部', ratio: null, count: 5, frequency: '每季度', nextTime: '2026-10-15', enabled: false },
])
const ruleColumns = [
  { title: '省/市/区', key: 'region', dataIndex: 'region', width: 200, ellipsis: true },
  { title: '代理商', dataIndex: 'agent', key: 'agent', width: 180, ellipsis: true },
  { title: '电站状态', dataIndex: 'stationStatus', key: 'stationStatus', width: 100 },
  { title: '应用场景', dataIndex: 'scene', key: 'scene', width: 100 },
  { title: '抽验方式', key: 'ratio', width: 120 },
  { title: '频次', dataIndex: 'frequency', key: 'frequency', width: 100 },
  { title: '下次触发时间', dataIndex: 'nextTime', key: 'nextTime', width: 130 },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '操作', key: 'action', width: 110 },
]
function editRule(row: any) { openEditRule(row) }
function deleteRule(id: string) {
  const idx = rules.findIndex((r: any) => r.id === id)
  if (idx !== -1) rules.splice(idx, 1)
  message.success('已删除')
}
</script>

<style scoped>
.fj-config-page { padding: 16px; }
.config-tabs :deep(.ant-tabs-nav) { background: #fff; padding: 0 20px; border-radius: 8px 8px 0 0; margin-bottom: 0; }
.config-section { background: #fff; padding: 20px 24px; border-radius: 0 0 8px 8px; }
.section-title { font-size: 16px; font-weight: 600; color: #262626; margin-bottom: 6px; }
.accept-toolbar { margin-bottom: 12px; }
.config-section-desc { font-size: 13px; color: #8c8c8c; margin-bottom: 20px; line-height: 1.6; }
.check-item-toolbar { margin-top: 16px; margin-bottom: 14px; }
.config-section :deep(.ant-tabs-nav) { margin-left: 0; padding-left: 0; }
.rule-toolbar { margin-bottom: 12px; }
.config-section :deep(.ant-table-tbody > tr > td) { height: 56px; padding-top: 0; padding-bottom: 0; }
/* fake-radio */
.fake-radio-group { display: flex; gap: 20px; }
.fake-radio { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; color: #262626; cursor: pointer; user-select: none; }
.fake-radio-dot { width: 14px; height: 14px; border-radius: 50%; border: 3px solid #d9d9d9; background: #fff; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.fake-radio-inner { width: 6px; height: 6px; border-radius: 50%; background: transparent; }
.fake-radio-dot.checked { border-color: #3060FF; }
</style>
