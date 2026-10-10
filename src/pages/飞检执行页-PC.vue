<template>
  <div class="fj-check-page">
    <!-- 顶部栏 -->
    <div class="page-header">
      <a-button type="text" @click="emit('back')" style="padding:0 8px">
        <LeftOutlined /> 返回
      </a-button>
      <span class="page-title">执行飞检 · {{ sheet.sheetNo }}</span>
      <div style="margin-left:auto;display:flex;align-items:center;gap:14px">
        <span class="progress-label">{{ filledCount }} / {{ totalCount }} 项已完成</span>
        <a-progress :percent="progressPct" :show-info="false" style="width:140px;margin-bottom:0" status="active" />
        <a-button
          type="primary"
          :disabled="filledCount < totalCount"
          :loading="submitting"
          @click="handleSubmit"
        >提交检查结果</a-button>
      </div>
    </div>

    <div class="page-body">
      <!-- 左栏：基本信息 -->
      <div class="sidebar-info">
        <div class="info-card">
          <div class="info-card-title">基本信息</div>
          <div class="info-row"><span class="il">飞检单号</span><span class="iv">{{ sheet.sheetNo }}</span></div>
          <div class="info-row"><span class="il">所属批次</span><span class="iv">{{ sheet.batchNo }}</span></div>
          <div class="info-row"><span class="il">电站编号</span><span class="iv">{{ sheet.stationNo }}</span></div>
          <div class="info-row"><span class="il">业主</span><span class="iv">{{ sheet.owner }}</span></div>
          <div class="info-row"><span class="il">代理商</span><span class="iv ellipsis">{{ sheet.agent }}</span></div>
          <div class="info-row"><span class="il">飞检工程师</span><span class="iv">{{ sheet.engineer }}</span></div>
          <div class="info-row"><span class="il">飞检日期</span><span class="iv">{{ sheet.checkDate }}</span></div>
        </div>
        <!-- 缺陷实时统计 -->
        <div class="info-card defect-live">
          <div class="info-card-title">缺陷统计（实时）</div>
          <div class="defect-stat-row">
            <div class="ds-item cr"><div class="dsi-num">{{ crLive }}</div><div class="dsi-label">CR 严重</div></div>
            <div class="ds-item ma"><div class="dsi-num">{{ maLive }}</div><div class="dsi-label">MA 主要</div></div>
            <div class="ds-item mi"><div class="dsi-num">{{ miLive }}</div><div class="dsi-label">MI 次要</div></div>
          </div>
        </div>
      </div>

      <!-- 右栏：检查项 -->
      <div class="check-content">
        <div v-for="cat in categories" :key="cat.name" class="check-cat-block">
          <div class="cat-header" @click="cat.expanded = !cat.expanded">
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-count">{{ cat.items.filter((i:any) => i.result !== null).length }} / {{ cat.items.length }}</span>
            <DownOutlined :class="['cat-arrow', { rotated: cat.expanded }]" />
          </div>
          <div v-show="cat.expanded" class="cat-items">
            <div
              v-for="item in cat.items" :key="item.id"
              class="check-item-row"
              :class="{ 'is-fail': item.result === 'fail', 'is-pass': item.result === 'pass' }"
            >
              <div class="item-main">
                <span class="item-name">{{ item.name }}</span>
                <div class="item-result-btns">
                  <button
                    class="result-btn pass-btn"
                    :class="{ active: item.result === 'pass' }"
                    @click="setResult(item, 'pass')"
                  >✓ 合格</button>
                  <button
                    class="result-btn fail-btn"
                    :class="{ active: item.result === 'fail' }"
                    @click="setResult(item, 'fail')"
                  >✗ 不合格</button>
                </div>
              </div>
              <!-- 不合格展开区 -->
              <div v-if="item.result === 'fail'" class="item-fail-form">
                <div class="fail-form-row">
                  <span class="fail-form-label">缺陷等级</span>
                  <div class="level-btns">
                    <button v-for="lv in ['cr','ma','mi']" :key="lv"
                      class="level-btn" :class="[lv, { active: item.level === lv }]"
                      @click="item.level = lv"
                    >{{ lv.toUpperCase() }}</button>
                  </div>
                </div>
                <div class="fail-form-row align-top">
                  <span class="fail-form-label">缺陷描述</span>
                  <div class="fail-form-right">
                    <div class="desc-templates">
                      <span
                        v-for="tpl in DEFECT_TEMPLATES[item.name] ?? DEFECT_TEMPLATES['default']"
                        :key="tpl"
                        class="desc-tpl"
                        @click="item.reason = tpl"
                      >{{ tpl }}</span>
                    </div>
                    <a-textarea
                      v-model:value="item.reason"
                      :rows="2"
                      placeholder="请描述缺陷情况"
                      style="resize:none"
                    />
                  </div>
                </div>
                <div class="fail-form-row align-top">
                  <span class="fail-form-label">现场照片</span>
                  <a-upload
                    list-type="picture-card"
                    :file-list="item.photos"
                    :before-upload="() => false"
                    @change="({ fileList }) => item.photos = fileList"
                  >
                    <div v-if="item.photos.length < 3"><PlusOutlined /><div style="margin-top:4px;font-size:12px">上传</div></div>
                  </a-upload>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { LeftOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons-vue'

const props = defineProps<{ initRow?: any }>()
const emit = defineEmits<{ back: []; submitted: [sheet: any] }>()

const sheet = props.initRow ?? {
  sheetNo: 'FJD-2026-001005', batchNo: 'FJB-2026-005',
  stationNo: 'FJZ-2025-001005', owner: '孙七', agent: '温州光能工程技术有限公司',
  engineer: '赵飞', checkDate: '2026-10-12',
}

const DEFECT_TEMPLATES: Record<string, string[]> = {
  '支架腐蚀锈蚀情况': ['支架出现明显锈蚀，已影响承载力', '支架轻微表面锈蚀，需防腐处理', '螺栓周围锈蚀严重'],
  '组件背板气泡/发黄情况': ['组件背板出现气泡，面积约5cm²', '组件背板轻微发黄，需持续观察', '组件背板局部鼓包，存在安全隐患'],
  '直流线缆绝缘层完整性': ['绝缘层老化开裂，存在破损段', '绝缘层局部磨损，风险较低', '线缆弯折处绝缘层破损'],
  'default': ['存在明显缺陷，需立即处理', '轻微缺陷，建议尽快整改', '潜在问题，需持续跟踪'],
}

const submitting = ref(false)

const categories = reactive([
  { name: '支架系统', expanded: true, items: [
    { id: 'c1i1', name: '支架固定螺栓紧固情况', result: null as string|null, level: null as string|null, reason: '', photos: [] as any[] },
    { id: 'c1i2', name: '支架腐蚀锈蚀情况', result: null, level: null, reason: '', photos: [] },
    { id: 'c1i3', name: '支架倾斜角度偏差', result: null, level: null, reason: '', photos: [] },
  ]},
  { name: '组件检查', expanded: true, items: [
    { id: 'c2i1', name: '组件外观破损情况', result: null, level: null, reason: '', photos: [] },
    { id: 'c2i2', name: '组件接地线连接', result: null, level: null, reason: '', photos: [] },
    { id: 'c2i3', name: '组件背板气泡/发黄情况', result: null, level: null, reason: '', photos: [] },
  ]},
  { name: '线缆与汇流', expanded: true, items: [
    { id: 'c3i1', name: '直流线缆绝缘层完整性', result: null, level: null, reason: '', photos: [] },
    { id: 'c3i2', name: '汇流箱密封情况', result: null, level: null, reason: '', photos: [] },
    { id: 'c3i3', name: 'MC4接头紧固情况', result: null, level: null, reason: '', photos: [] },
  ]},
  { name: '逆变器', expanded: true, items: [
    { id: 'c4i1', name: '逆变器运行状态', result: null, level: null, reason: '', photos: [] },
    { id: 'c4i2', name: '逆变器散热风扇', result: null, level: null, reason: '', photos: [] },
    { id: 'c4i3', name: '逆变器接线端子', result: null, level: null, reason: '', photos: [] },
  ]},
])

const allItems = computed(() => categories.flatMap(c => c.items))
const totalCount = computed(() => allItems.value.length)
const filledCount = computed(() => allItems.value.filter(i => i.result !== null).length)
const progressPct = computed(() => Math.round((filledCount.value / totalCount.value) * 100))
const crLive = computed(() => allItems.value.filter(i => i.result === 'fail' && i.level === 'cr').length)
const maLive = computed(() => allItems.value.filter(i => i.result === 'fail' && i.level === 'ma').length)
const miLive = computed(() => allItems.value.filter(i => i.result === 'fail' && i.level === 'mi').length)

function setResult(item: any, val: string) {
  item.result = val
  if (val === 'pass') { item.level = null; item.reason = ''; item.photos = [] }
  if (val === 'fail' && !item.level) item.level = 'ma'
}

async function handleSubmit() {
  const failItems = allItems.value.filter(i => i.result === 'fail')
  const noLevel = failItems.filter(i => !i.level)
  const noReason = failItems.filter(i => !i.reason?.trim())
  if (noLevel.length) { message.error('请为所有不合格项选择缺陷等级'); return }
  if (noReason.length) { message.error('请为所有不合格项填写缺陷描述'); return }
  submitting.value = true
  await new Promise(r => setTimeout(r, 800))
  submitting.value = false
  const passed = failItems.length === 0
  message.success(passed ? '飞检完成，电站验收通过' : `飞检完成，发现 ${failItems.length} 项缺陷，已生成整改单`)
  emit('submitted', {
    ...sheet,
    checkStatus: passed ? 'passed' : 'failed',
    crCount: crLive.value, maCount: maLive.value, miCount: miLive.value,
  })
}
</script>

<style scoped>
.fj-check-page { display: flex; flex-direction: column; height: 100%; background: #f5f5f5; }

.page-header {
  display: flex; align-items: center; gap: 14px; padding: 10px 20px;
  background: #fff; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.page-title { font-size: 15px; font-weight: 600; color: #262626; }
.progress-label { font-size: 13px; color: #8c8c8c; white-space: nowrap; }

.page-body { display: flex; gap: 14px; padding: 14px; flex: 1; overflow: hidden; }

/* 左栏 */
.sidebar-info { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.info-card { background: #fff; border-radius: 8px; padding: 14px 16px; }
.info-card-title { font-size: 14px; font-weight: 600; color: #262626; margin-bottom: 12px; }
.info-row { display: flex; gap: 8px; font-size: 13px; margin-bottom: 8px; }
.il { color: rgba(0,0,0,.45); white-space: nowrap; width: 72px; flex-shrink: 0; }
.iv { color: #262626; flex: 1; }
.iv.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.defect-stat-row { display: flex; gap: 8px; }
.ds-item { flex: 1; text-align: center; padding: 8px 4px; border-radius: 6px; border: 1px solid; }
.ds-item.cr { background: rgba(255,77,79,.05); border-color: rgba(255,77,79,.2); }
.ds-item.ma { background: rgba(250,140,22,.05); border-color: rgba(250,140,22,.2); }
.ds-item.mi { background: rgba(250,219,20,.06); border-color: rgba(250,219,20,.3); }
.dsi-num { font-size: 22px; font-weight: 800; line-height: 1; }
.ds-item.cr .dsi-num { color: #ff4d4f; }
.ds-item.ma .dsi-num { color: #fa8c16; }
.ds-item.mi .dsi-num { color: #d48806; }
.dsi-label { font-size: 11px; color: #8c8c8c; margin-top: 4px; }

/* 右栏 */
.check-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }

.check-cat-block { background: #fff; border-radius: 8px; overflow: hidden; }
.cat-header {
  display: flex; align-items: center; padding: 14px 16px;
  background: #fafafa; cursor: pointer; user-select: none; border-bottom: 1px solid #f0f0f0;
}
.cat-name { font-size: 14px; font-weight: 600; color: #262626; }
.cat-count { font-size: 13px; color: #8c8c8c; margin-left: 10px; }
.cat-arrow { margin-left: auto; color: #8c8c8c; transition: transform .2s; }
.cat-arrow.rotated { transform: rotate(180deg); }

.check-item-row { border-bottom: 1px solid #f5f5f5; transition: background .15s; }
.check-item-row.is-pass { background: rgba(82,196,26,.03); }
.check-item-row.is-fail { background: rgba(255,77,79,.03); }

.item-main { display: flex; align-items: center; padding: 12px 16px; gap: 12px; }
.item-name { font-size: 14px; color: #262626; flex: 1; }

.item-result-btns { display: flex; gap: 8px; flex-shrink: 0; }
.result-btn {
  padding: 5px 16px; border-radius: 4px; border: 1.5px solid; font-size: 13px;
  cursor: pointer; background: #fff; transition: all .15s; font-weight: 500;
}
.pass-btn { border-color: #d9d9d9; color: #595959; }
.pass-btn.active { border-color: #52c41a; color: #52c41a; background: rgba(82,196,26,.06); }
.fail-btn { border-color: #d9d9d9; color: #595959; }
.fail-btn.active { border-color: #ff4d4f; color: #ff4d4f; background: rgba(255,77,79,.06); }

.item-fail-form { padding: 0 16px 14px 44px; display: flex; flex-direction: column; gap: 10px; }
.fail-form-row { display: flex; align-items: center; gap: 12px; }
.fail-form-row.align-top { align-items: flex-start; }
.fail-form-label { font-size: 13px; color: rgba(0,0,0,.45); width: 60px; flex-shrink: 0; padding-top: 2px; }
.fail-form-right { flex: 1; display: flex; flex-direction: column; gap: 6px; }

.level-btns { display: flex; gap: 8px; }
.level-btn {
  padding: 4px 16px; border-radius: 4px; border: 1.5px solid #d9d9d9;
  font-size: 12px; font-weight: 700; cursor: pointer; background: #fff; transition: all .15s;
}
.level-btn.cr.active { border-color: #ff4d4f; color: #ff4d4f; background: rgba(255,77,79,.08); }
.level-btn.ma.active { border-color: #fa8c16; color: #fa8c16; background: rgba(250,140,22,.08); }
.level-btn.mi.active { border-color: #d48806; color: #d48806; background: rgba(250,219,20,.1); }
.level-btn:not(.active) { color: #8c8c8c; }

.desc-templates { display: flex; flex-wrap: wrap; gap: 6px; }
.desc-tpl {
  font-size: 12px; color: #1677ff; background: rgba(22,119,255,.06);
  border: 1px solid rgba(22,119,255,.2); border-radius: 4px; padding: 2px 8px;
  cursor: pointer; transition: background .12s;
}
.desc-tpl:hover { background: rgba(22,119,255,.12); }
</style>
