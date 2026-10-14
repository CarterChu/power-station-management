<template>
  <div class="fj-sheet-detail-page">
      <!-- 基本信息 -->
      <div class="detail-section">
        <div class="section-title">基本信息</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">飞检单号</div>
            <div class="info-value">{{ sheet.sheetNo }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">所属批次</div>
            <div class="info-value">{{ sheet.batchNo }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">飞检日期</div>
            <div class="info-value">{{ sheet.checkDate }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">检查状态</div>
            <div class="info-value">
              <a-tag v-if="sheet.checkStatus === 'pending'" color="warning" style="margin:0">待检查</a-tag>
              <a-tag v-else-if="sheet.checkStatus === 'passed'" color="success" style="margin:0">通过</a-tag>
              <a-tag v-else color="error" style="margin:0">不通过</a-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">电站编号</div>
            <div class="info-value">{{ sheet.stationNo }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">业主</div>
            <div class="info-value">{{ sheet.owner }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">电站类型</div>
            <div class="info-value">{{ sheet.stationType || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">电站地址</div>
            <div class="info-value">{{ sheet.address || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">一级代理商</div>
            <div class="info-value">{{ sheet.firstAgent || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">代理商</div>
            <div class="info-value">{{ sheet.agent }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">飞检工程师</div>
            <div class="info-value">{{ sheet.engineer }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">整改复验人</div>
            <div class="info-value">{{ sheet.rectifyEngineer || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">整改状态</div>
            <div class="info-value">
              <a-tag v-if="sheet.rectifyStatus === 'none'" color="default" style="margin:0">无需整改</a-tag>
              <a-tag v-else-if="sheet.rectifyStatus === 'pending'" color="warning" style="margin:0">待整改</a-tag>
              <a-tag v-else-if="sheet.rectifyStatus === 'reviewing'" color="processing" style="margin:0">待复验</a-tag>
              <a-tag v-else-if="sheet.rectifyStatus === 'passed'" color="success" style="margin:0">整改通过</a-tag>
              <span v-else style="color:#8c8c8c">—</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 缺陷汇总 + 检查项结果 -->
      <div class="detail-section">
        <!-- 缺陷汇总（检查后才展示） -->
        <template v-if="sheet.checkStatus !== 'pending'">
          <div class="section-title">缺陷汇总</div>
          <div class="defect-summary-row">
            <div class="defect-summary-card cr">
              <div class="ds-count">{{ sheet.crCount }}</div>
              <div class="ds-label">严重缺陷（CR）</div>
              <div class="ds-threshold">允收 ≤ 1</div>
            </div>
            <div class="defect-summary-card ma">
              <div class="ds-count">{{ sheet.maCount }}</div>
              <div class="ds-label">主要缺陷（MA）</div>
              <div class="ds-threshold">允收 ≤ 2</div>
            </div>
            <div class="defect-summary-card mi">
              <div class="ds-count">{{ sheet.miCount }}</div>
              <div class="ds-label">次要缺陷（MI）</div>
              <div class="ds-threshold">允收 ≤ 3</div>
            </div>
          </div>
        </template>

        <!-- 检查项结果 -->
        <div class="section-title">检查项结果</div>
        <div v-for="cat in checkCategories" :key="cat.name" class="check-category">
          <div class="check-cat-header" @click="cat.expanded = !cat.expanded">
            <span class="check-cat-name">{{ cat.name }}</span>
            <span class="check-cat-stats">
              <span class="cat-stat-pass">通过 {{ cat.items.filter((i: any) => i.result === 'pass').length }}</span>
              <span class="cat-stat-fail" v-if="cat.items.filter((i: any) => i.result === 'fail').length > 0">不合格 {{ cat.items.filter((i: any) => i.result === 'fail').length }}</span>
              <span class="cat-stat-pending" v-if="cat.items.filter((i: any) => !i.result).length > 0">未检查 {{ cat.items.filter((i: any) => !i.result).length }}</span>
            </span>
            <DownOutlined :class="{ rotated: cat.expanded }" style="margin-left:auto;transition:transform 0.2s;color:#8c8c8c" />
          </div>
          <div v-show="cat.expanded" class="check-items">
            <div v-for="item in cat.items" :key="item.name" class="check-item" :class="{ 'is-fail': item.result === 'fail' }">
              <div class="check-item-main">
                <span class="check-item-result-icon">
                  <CheckCircleFilled v-if="item.result === 'pass'" style="color:#52c41a" />
                  <CloseCircleFilled v-else-if="item.result === 'fail'" style="color:#ff4d4f" />
                  <MinusCircleOutlined v-else style="color:#bfbfbf" />
                </span>
                <span class="check-item-name">{{ item.name }}</span>
                <span v-if="item.result === 'fail'" class="defect-badge-small" :class="item.level">{{ item.level?.toUpperCase() }}</span>
              </div>
              <div v-if="item.result === 'fail'" class="check-item-fail-detail">
                <div class="fail-reason">{{ item.reason }}</div>
                <div v-if="item.photos?.length" class="fail-photos">
                  <img v-for="(p, i) in item.photos" :key="i" :src="p" class="fail-photo-thumb" alt="缺陷照片" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { DownOutlined, CheckCircleFilled, CloseCircleFilled, MinusCircleOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  initRow?: any
}>()


const MOCK_SHEET = {
  id: 'fj003', sheetNo: 'FJD-2026-001003', batchNo: 'FJB-20260901-001',
  stationNo: 'GFDZ-2025-001004', owner: '赵六',
  stationType: '工商业', address: '安徽省合肥市蜀山区科学大道128号',
  firstAgent: '安徽大区代理商', agent: '合肥绿色能源技术有限公司',
  engineer: '黄磊', rectifyEngineer: '吴杰', checkDate: '2026-09-10',
  crCount: 0, maCount: 1, miCount: 2, checkStatus: 'failed', rectifyStatus: 'reviewing',
}

const sheet = props.initRow ?? MOCK_SHEET

const checkCategories = reactive([
  {
    name: '支架系统', expanded: true, items: [
      { name: '支架固定螺栓紧固情况', result: 'pass', level: null, reason: '', photos: [] },
      { name: '支架腐蚀锈蚀情况', result: 'fail', level: 'ma', reason: '支架发现明显锈蚀，已影响承载力', photos: [] },
      { name: '支架倾斜角度偏差', result: 'pass', level: null, reason: '', photos: [] },
    ],
  },
  {
    name: '组件检查', expanded: true, items: [
      { name: '组件外观破损情况', result: 'pass', level: null, reason: '', photos: [] },
      { name: '组件接地线连接', result: 'pass', level: null, reason: '', photos: [] },
      { name: '组件背板气泡/发黄情况', result: 'fail', level: 'mi', reason: '2号组件背板轻微气泡，需观察', photos: [] },
    ],
  },
  {
    name: '线缆与汇流', expanded: true, items: [
      { name: '直流线缆绝缘层完整性', result: 'fail', level: 'mi', reason: '局部绝缘层老化，存在破损', photos: [] },
      { name: '汇流箱密封情况', result: 'pass', level: null, reason: '', photos: [] },
      { name: 'MC4接头紧固情况', result: 'pass', level: null, reason: '', photos: [] },
    ],
  },
  {
    name: '逆变器', expanded: true, items: [
      { name: '逆变器运行状态', result: 'pass', level: null, reason: '', photos: [] },
      { name: '逆变器散热风扇', result: 'pass', level: null, reason: '', photos: [] },
      { name: '逆变器接线端子', result: 'pass', level: null, reason: '', photos: [] },
    ],
  },
])

</script>

<style scoped>
.fj-sheet-detail-page { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
.fj-sheet-header {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  background: #fff; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.fj-sheet-title { font-size: 15px; font-weight: 600; color: #262626; }
.fj-sheet-no { font-size: 14px; color: #8c8c8c; }


.detail-section { background: #fff; border-radius: 8px; padding: 18px 20px; }
.section-title { font-size: 16px; font-weight: 600; color: #262626; margin-bottom: 14px; }

/* 基本信息网格 */
.info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 0; }
.info-label { font-size: 14px; color: rgba(0,0,0,0.45); line-height: 22px; padding-bottom: 8px; white-space: nowrap; }
.info-value { font-size: 14px; color: #262626; }

/* 缺陷汇总 */
.defect-summary-row { display: flex; gap: 10px; margin-bottom: 32px; }
.defect-summary-card {
  flex: 1; border-radius: 6px; padding: 10px 14px;
  border: 1px solid; text-align: center;
}
.defect-summary-card.cr { background: rgba(255,77,79,0.04); border-color: rgba(255,77,79,0.2); }
.defect-summary-card.ma { background: rgba(250,140,22,0.04); border-color: rgba(250,140,22,0.2); }
.defect-summary-card.mi { background: rgba(250,219,20,0.06); border-color: rgba(250,219,20,0.3); }
.ds-count { font-size: 22px; font-weight: 800; min-height: 32px; display: flex; align-items: center; justify-content: center; }
.defect-summary-card.cr .ds-count { color: #ff4d4f; }
.defect-summary-card.ma .ds-count { color: #fa8c16; }
.defect-summary-card.mi .ds-count { color: #d48806; }
.ds-label { font-size: 13px; color: #595959; margin-top: 3px; }
.ds-threshold { font-size: 12px; color: #bfbfbf; margin-top: 6px; }

/* 检查分类 */
.check-category { border: 1px solid #f0f0f0; border-radius: 6px; overflow: hidden; margin-bottom: 10px; }
.check-cat-header {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  background: #fafafa; cursor: pointer; user-select: none;
}
.check-cat-name { font-size: 14px; font-weight: 600; color: #262626; }
.check-cat-stats { display: flex; gap: 10px; margin-left: 8px; }
.cat-stat-pass { font-size: 13px; color: #52c41a; }
.cat-stat-fail { font-size: 13px; color: #ff4d4f; }
.cat-stat-pending { font-size: 13px; color: #fa8c16; }
.rotated { transform: rotate(180deg); }
.check-items { padding: 4px 0; }
.check-item { padding: 11px 16px; }
.check-item.is-fail { background: rgba(255,77,79,0.02); }
.check-item-main { display: flex; align-items: center; gap: 10px; }
.check-item-result-icon { font-size: 15px; flex-shrink: 0; }
.check-item-name { font-size: 14px; color: #262626; }
.defect-badge-small {
  font-size: 11px; font-weight: 700; padding: 1px 5px; border-radius: 3px; margin-left: auto;
}
.defect-badge-small.cr { background: rgba(255,77,79,0.1); color: #ff4d4f; }
.defect-badge-small.ma { background: rgba(250,140,22,0.1); color: #fa8c16; }
.defect-badge-small.mi { background: rgba(250,219,20,0.15); color: #d48806; }
.check-item-fail-detail { padding: 8px 0 0 26px; }
.fail-reason { font-size: 12px; color: #595959; line-height: 1.5; }
.fail-photos { display: flex; gap: 8px; margin-top: 6px; }
.fail-photo-thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; border: 1px solid #f0f0f0; }
</style>
