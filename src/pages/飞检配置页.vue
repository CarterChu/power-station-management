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
              <div class="deadline-hint">
                <span class="deadline-hint-item"><a-tag color="blue" style="margin:0">3 天</a-tag> 表单资料类 / 系统填写类 / 图纸类 / 照片类或其他 MI 缺陷项</span>
                <span class="deadline-hint-sep">·</span>
                <span class="deadline-hint-item"><a-tag color="orange" style="margin:0">7 天</a-tag> 施工类 / 发电类</span>
                <span class="deadline-hint-sep">·</span>
                <span class="deadline-hint-item"><a-tag color="red" style="margin:0">30 天</a-tag> 政府交涉 / 结构整改难度较大异常</span>
              </div>
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
                  <template v-if="column.key === 'deadline'">
                    <a-select
                      v-if="record._editing"
                      v-model:value="record.deadline"
                      size="small"
                      style="width:90px"
                      :options="[{ label: '3 天', value: 3 }, { label: '7 天', value: 7 }, { label: '30 天', value: 30 }]"
                    />
                    <a-tag
                      v-else
                      :color="record.deadline === 3 ? 'blue' : record.deadline === 30 ? 'red' : 'orange'"
                      style="margin:0"
                    >{{ record.deadline }} 天</a-tag>
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
              <template v-if="column.key === 'region'">
                <template v-if="!record.regionPaths?.length">全部</template>
                <a-space v-else :size="[4, 4]" wrap>
                  <a-tag v-for="(path, pi) in record.regionPaths.slice(0, 2)" :key="pi" style="margin:0;font-size:12px">{{ formatPath(path) }}</a-tag>
                  <span v-if="record.regionPaths.length > 2" style="color:#8c8c8c;font-size:12px">+{{ record.regionPaths.length - 2 }}</span>
                </a-space>
              </template>
              <template v-if="column.key === 'scenes'">
                <template v-if="!record.scenes?.length">全部</template>
                <a-space v-else :size="[4, 4]" wrap>
                  <a-tag v-for="(s, si) in record.scenes.slice(0, 2)" :key="si" style="margin:0;font-size:12px">{{ s }}</a-tag>
                  <span v-if="record.scenes.length > 2" style="color:#8c8c8c;font-size:12px">+{{ record.scenes.length - 2 }}</span>
                </a-space>
              </template>
              <template v-if="column.key === 'racking'">
                <template v-if="!record.racking?.length">全部</template>
                <a-space v-else :size="[4, 4]" wrap>
                  <a-tag v-for="(r, ri) in record.racking.slice(0, 2)" :key="ri" style="margin:0;font-size:12px">{{ r }}</a-tag>
                  <span v-if="record.racking.length > 2" style="color:#8c8c8c;font-size:12px">+{{ record.racking.length - 2 }}</span>
                </a-space>
              </template>
              <template v-if="column.key === 'ratio'">
                {{ record.ratio != null ? record.ratio + '%' : record.count + '个固定' }}
              </template>
              <template v-if="column.key === 'scheduleTime'">
                {{ formatSchedule(record) }}
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
      width="640px"
      ok-text="保存"
      @ok="saveRule"
      @cancel="cancelRule"
      destroy-on-close
    >
      <a-form :model="ruleForm" layout="vertical" style="margin-top:8px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
          <a-form-item label="省/市/区" style="grid-column:1/-1">
            <a-cascader
              v-model:value="ruleForm.regionArr"
              :options="REGION_OPTIONS"
              multiple
              :max-tag-count="3"
              placeholder="请选择省/市/区（可多选，不选则为全部）"
              change-on-select
              allowClear
            />
          </a-form-item>
          <a-form-item label="一级代理商">
            <a-select
              v-model:value="ruleForm.agent"
              placeholder="不选则为全部"
              allowClear
              show-search
              :options="AGENT_OPTIONS"
            />
          </a-form-item>
          <a-form-item label="抽检电站状态">
            <a-select v-model:value="ruleForm.stationStatus" :options="[{ label: '全部', value: '全部' }, { label: '已派工', value: '已派工' }, { label: '已完工', value: '已完工' }, { label: '已并网', value: '已并网' }]" />
          </a-form-item>
          <a-form-item label="应用场景">
            <a-select
              v-model:value="ruleForm.scenes"
              mode="multiple"
              :max-tag-count="2"
              placeholder="不选则为全部"
              allowClear
              :options="SCENE_OPTIONS"
            />
          </a-form-item>
          <a-form-item label="支架方案">
            <a-select
              v-model:value="ruleForm.racking"
              mode="multiple"
              :max-tag-count="2"
              placeholder="不选则为全部"
              allowClear
              :options="RACKING_OPTIONS"
            />
          </a-form-item>
        </div>
        <a-form-item label="抽检比例" required>
          <div class="fake-radio-group" style="margin-bottom:10px">
            <label class="fake-radio" :class="{ checked: ruleForm.ratioType === 'ratio' }" @click="ruleForm.ratioType = 'ratio'">
              <span class="fake-radio-dot" :class="{ checked: ruleForm.ratioType === 'ratio' }"><span class="fake-radio-inner"></span></span>
              百分比
            </label>
            <label class="fake-radio" :class="{ checked: ruleForm.ratioType === 'count' }" @click="ruleForm.ratioType = 'count'">
              <span class="fake-radio-dot" :class="{ checked: ruleForm.ratioType === 'count' }"><span class="fake-radio-inner"></span></span>
              数量
            </label>
          </div>
          <a-input-number v-if="ruleForm.ratioType === 'ratio'" v-model:value="ruleForm.ratio" :min="1" :max="100" addon-after="%" style="width:160px" placeholder="请输入比例" />
          <a-input-number v-else v-model:value="ruleForm.count" :min="1" addon-after="个" style="width:160px" placeholder="请输入数量" />
        </a-form-item>
        <a-form-item label="抽检频次" required>
          <a-select v-model:value="ruleForm.frequency" :options="[{ label: '每周', value: '每周' }, { label: '每月', value: '每月' }]" placeholder="请选择频次" style="width:160px" @change="() => { ruleForm.scheduleDay = undefined }" />
        </a-form-item>
        <a-form-item label="批次自动生成时间" required>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:13px;color:#595959">{{ ruleForm.frequency || '——' }}</span>
            <template v-if="ruleForm.frequency === '每周'">
              <a-select v-model:value="ruleForm.scheduleDay" style="width:90px" :options="WEEKDAY_OPTIONS" placeholder="周几" />
            </template>
            <template v-else-if="ruleForm.frequency === '每月'">
              <a-select v-model:value="ruleForm.scheduleDay" style="width:80px" :options="MONTHDAY_OPTIONS" placeholder="几号" />
              <span style="font-size:13px;color:#595959">号</span>
            </template>
            <a-select v-model:value="ruleForm.scheduleHour" style="width:88px" :options="HOUR_OPTIONS" placeholder="时间" />
            <span style="font-size:13px;color:#595959">点</span>
          </div>
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
  { id: 'cat01', name: '支架系统',    code: 'CAT-01', sortNo: 1, deadline: 7,  enabled: true, _editing: false },
  { id: 'cat02', name: '组件检查',    code: 'CAT-02', sortNo: 2, deadline: 7,  enabled: true, _editing: false },
  { id: 'cat03', name: '线缆与汇流', code: 'CAT-03', sortNo: 3, deadline: 7,  enabled: true, _editing: false },
  { id: 'cat04', name: '逆变器',      code: 'CAT-04', sortNo: 4, deadline: 7,  enabled: true, _editing: false },
  { id: 'cat05', name: '配电箱',      code: 'CAT-05', sortNo: 5, deadline: 7,  enabled: true, _editing: false },
  { id: 'cat06', name: '用电安全',    code: 'CAT-06', sortNo: 6, deadline: 7,  enabled: true, _editing: false },
  { id: 'cat07', name: '并网计量',    code: 'CAT-07', sortNo: 7, deadline: 3,  enabled: true, _editing: false },
  { id: 'cat08', name: '外部环境',    code: 'CAT-08', sortNo: 8, deadline: 3,  enabled: true, _editing: false },
])
const catColumns = [
  { title: '分类编号', dataIndex: 'code', key: 'code', width: 120 },
  { title: '分类名称', key: 'name', width: 160 },
  { title: '排序号',   key: 'sortNo', width: 90 },
  { title: '检查项数', dataIndex: 'itemCount', key: 'itemCount', width: 90, customRender: ({ record }: any) => checkItems.filter((i: any) => i.categoryId === record.id).length },
  { title: '整改时限', key: 'deadline', width: 120 },
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
  regionArr: [] as string[][],
  agent: undefined as string | undefined,
  stationStatus: '全部',
  scenes: [] as string[],
  racking: [] as string[],
  ratioType: 'ratio' as 'ratio' | 'count',
  ratio: 20 as number | null,
  count: null as number | null,
  frequency: '每月' as string | undefined,
  scheduleDay: undefined as number | undefined,
  scheduleHour: 9 as number,
})
function formatPath(path: string[]): string {
  return path.length ? path.join(' / ') : '全部'
}
function formatSchedule(rule: any): string {
  if (rule.scheduleDay == null) return '—'
  const h = String(rule.scheduleHour ?? 9).padStart(2, '0') + ':00'
  if (rule.frequency === '每周') {
    const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return `每周${days[rule.scheduleDay] ?? ''}  ${h}`
  }
  return `每月${rule.scheduleDay}号  ${h}`
}
function resetRuleForm() {
  ruleForm.regionArr = []
  ruleForm.agent = undefined
  ruleForm.stationStatus = '全部'
  ruleForm.scenes = []
  ruleForm.racking = []
  ruleForm.ratioType = 'ratio'
  ruleForm.ratio = 20
  ruleForm.count = null
  ruleForm.frequency = '每月'
  ruleForm.scheduleDay = undefined
  ruleForm.scheduleHour = 9
}
function openAddRule() { resetRuleForm(); editingRule.value = null; addRuleModalVisible.value = true }
function openEditRule(row: any) {
  editingRule.value = row
  ruleForm.regionArr = row.regionPaths?.length ? row.regionPaths.map((p: string[]) => [...p]) : []
  ruleForm.agent = row.agent === '全部' ? undefined : row.agent
  ruleForm.stationStatus = row.stationStatus ?? '全部'
  ruleForm.scenes = row.scenes ? [...row.scenes] : []
  ruleForm.racking = row.racking ? [...row.racking] : []
  ruleForm.ratioType = row.ratio != null ? 'ratio' : 'count'
  ruleForm.ratio = row.ratio
  ruleForm.count = row.count
  ruleForm.frequency = row.frequency
  ruleForm.scheduleDay = row.scheduleDay
  ruleForm.scheduleHour = row.scheduleHour ?? 9
  addRuleModalVisible.value = true
}
function cancelRule() { addRuleModalVisible.value = false; editingRule.value = null }
function saveRule() {
  if (!ruleForm.frequency) { message.error('请选择抽检频次'); return }
  if (ruleForm.ratioType === 'ratio' && !ruleForm.ratio) { message.error('请输入抽检比例'); return }
  if (ruleForm.ratioType === 'count' && !ruleForm.count) { message.error('请输入固定数量'); return }
  if (ruleForm.scheduleDay == null) { message.error('请选择自动生成时间'); return }
  const data = {
    regionPaths: ruleForm.regionArr.length ? ruleForm.regionArr.map(p => [...p]) : [],
    agent: ruleForm.agent ?? '全部',
    stationStatus: ruleForm.stationStatus,
    scenes: [...ruleForm.scenes],
    racking: [...ruleForm.racking],
    ratio: ruleForm.ratioType === 'ratio' ? ruleForm.ratio : null,
    count: ruleForm.ratioType === 'count' ? ruleForm.count : null,
    frequency: ruleForm.frequency,
    scheduleDay: ruleForm.scheduleDay,
    scheduleHour: ruleForm.scheduleHour,
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

const SCENE_OPTIONS = [
  { label: '工商业屋顶', value: '工商业屋顶' },
  { label: '工业厂房屋顶', value: '工业厂房屋顶' },
  { label: '居民屋顶', value: '居民屋顶' },
  { label: '地面电站', value: '地面电站' },
  { label: 'BIPV', value: 'BIPV' },
  { label: '阳台壁挂', value: '阳台壁挂' },
]
const RACKING_OPTIONS = [
  { label: '固定支架', value: '固定支架' },
  { label: '可调支架', value: '可调支架' },
  { label: '跟踪支架', value: '跟踪支架' },
  { label: 'BIPV一体化', value: 'BIPV一体化' },
]
const WEEKDAY_OPTIONS = [
  { label: '周一', value: 1 }, { label: '周二', value: 2 }, { label: '周三', value: 3 },
  { label: '周四', value: 4 }, { label: '周五', value: 5 }, { label: '周六', value: 6 }, { label: '周日', value: 7 },
]
const MONTHDAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({ label: `${i + 1}号`, value: i + 1 }))
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ label: `${String(i).padStart(2, '0')}:00`, value: i }))

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
  { id: 'rule01', regionPaths: [['浙江省']], agent: '全部', stationStatus: '全部', scenes: ['工商业屋顶', '工业厂房屋顶'], racking: ['固定支架'], ratio: 20, count: null, frequency: '每月', scheduleDay: 1, scheduleHour: 9, enabled: true },
  { id: 'rule02', regionPaths: [['江苏省', '苏州市'], ['浙江省', '杭州市']], agent: '全部', stationStatus: '已并网', scenes: [], racking: [], ratio: 30, count: null, frequency: '每周', scheduleDay: 3, scheduleHour: 10, enabled: true },
  { id: 'rule03', regionPaths: [['安徽省'], ['江苏省']], agent: '合肥绿色能源技术有限公司', stationStatus: '已并网', scenes: ['地面电站'], racking: ['跟踪支架', '可调支架'], ratio: null, count: 5, frequency: '每月', scheduleDay: 15, scheduleHour: 8, enabled: false },
])
const ruleColumns = [
  { title: '省/市/区', key: 'region', width: 200 },
  { title: '一级代理商', dataIndex: 'agent', key: 'agent', width: 160, ellipsis: true },
  { title: '电站状态', dataIndex: 'stationStatus', key: 'stationStatus', width: 90 },
  { title: '应用场景', key: 'scenes', width: 160 },
  { title: '支架方案', key: 'racking', width: 150 },
  { title: '抽检比例', key: 'ratio', width: 110 },
  { title: '频次', dataIndex: 'frequency', key: 'frequency', width: 70 },
  { title: '批次自动生成时间', key: 'scheduleTime', width: 150 },
  { title: '启用', key: 'enabled', width: 72 },
  { title: '操作', key: 'action', width: 100 },
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

/* 整改时限说明栏 */
.deadline-hint { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 10px 14px; background: #fafafa; border-radius: 6px; margin-top: 16px; margin-bottom: 10px; font-size: 13px; color: #595959; }
.deadline-hint-item { display: inline-flex; align-items: center; gap: 6px; }
.deadline-hint-sep { color: #d9d9d9; }
</style>
