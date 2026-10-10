<template>
  <div class="rectify-input-page">
    <!-- 顶部栏 -->
    <div class="page-header">
      <a-button type="text" @click="emit('back')" style="padding:0 8px">
        <LeftOutlined /> 返回
      </a-button>
      <span class="page-title">整改录入 · {{ record.rectifyNo }}</span>
      <a-tag v-if="record.status === 'pending'" color="warning" style="margin:0 0 0 8px">待整改</a-tag>
      <a-tag v-else-if="record.status === 'rejected'" color="error" style="margin:0 0 0 8px">退回修改</a-tag>
      <div style="margin-left:auto;display:flex;align-items:center;gap:10px">
        <span class="deadline-tip">
          整改期限：{{ record.deadline }}
          <span v-if="record.remainDays > 0" :style="{ color: record.remainDays <= 3 ? '#fa8c16' : '#595959', fontWeight: record.remainDays <= 3 ? 600 : 400 }">
            （剩余 {{ record.remainDays }} 天）
          </span>
          <span v-else style="color:#ff4d4f;font-weight:600">（已逾期 {{ Math.abs(record.remainDays) }} 天）</span>
        </span>
        <a-button type="primary" :loading="submitting" @click="handleSubmit">提交整改</a-button>
      </div>
    </div>

    <div class="page-body">
      <!-- 左栏：基本信息 -->
      <div class="sidebar-info">
        <div class="info-card">
          <div class="info-card-title">基本信息</div>
          <div class="info-row"><span class="il">整改单号</span><span class="iv">{{ record.rectifyNo }}</span></div>
          <div class="info-row"><span class="il">关联飞检单</span><span class="iv">{{ record.sheetNo }}</span></div>
          <div class="info-row"><span class="il">关联电站</span><span class="iv">{{ record.stationNo }}</span></div>
          <div class="info-row"><span class="il">代理商</span><span class="iv ellipsis">{{ record.agent }}</span></div>
          <div class="info-row"><span class="il">整改工程师</span><span class="iv">{{ record.engineer }}</span></div>
        </div>
        <div v-if="record.status === 'rejected'" class="info-card reject-card">
          <div class="info-card-title" style="color:#ff4d4f">退回原因</div>
          <p class="reject-reason">{{ record.rejectReason ?? '整改内容描述不够详细，请补充现场照片及处理措施。' }}</p>
        </div>
      </div>

      <!-- 右栏：不合格项逐条录入 -->
      <div class="rectify-content">
        <div
          v-for="(defect, idx) in defects" :key="idx"
          class="defect-card"
          :class="`rs-${record.status}`"
        >
          <div class="defect-card-head">
            <span class="defect-idx">{{ idx + 1 }}</span>
            <span class="defect-badge-small" :class="defect.level">{{ defect.level?.toUpperCase() }}</span>
            <span class="defect-name">{{ defect.checkName }}</span>
          </div>
          <!-- 原缺陷描述 -->
          <div class="defect-origin">
            <span class="defect-origin-label">缺陷描述</span>
            <span class="defect-origin-text">{{ defect.reason }}</span>
          </div>
          <!-- 整改内容录入 -->
          <div class="defect-input-block">
            <div class="input-block-label">整改内容 <span class="required">*</span></div>
            <div class="rectify-templates">
              <span
                v-for="tpl in RECTIFY_TEMPLATES[defect.level ?? 'ma']"
                :key="tpl"
                class="r-tpl"
                @click="defect.rectifyContent = tpl"
              >{{ tpl }}</span>
            </div>
            <a-textarea
              v-model:value="defect.rectifyContent"
              :rows="3"
              :placeholder="`请描述针对「${defect.checkName}」的整改措施及结果`"
              style="resize:none"
            />
          </div>
          <!-- 整改照片 -->
          <div class="defect-input-block">
            <div class="input-block-label">整改照片</div>
            <a-upload
              list-type="picture-card"
              :file-list="defect.photos"
              :before-upload="() => false"
              @change="({ fileList }) => defect.photos = fileList"
            >
              <div v-if="(defect.photos?.length ?? 0) < 4">
                <PlusOutlined /><div style="margin-top:4px;font-size:12px">上传</div>
              </div>
            </a-upload>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { LeftOutlined, PlusOutlined } from '@ant-design/icons-vue'

const props = defineProps<{ initRow?: any }>()
const emit = defineEmits<{ back: []; submitted: [record: any] }>()

const MOCK_RECORD = {
  id: 'rct001', rectifyNo: 'ZGD-2026-00003',
  sheetNo: 'FJD-2026-001003', stationNo: 'FJZ-2025-001004',
  agent: '合肥绿色能源技术有限公司', engineer: '张磊',
  deadline: '2026-10-20', remainDays: 10,
  status: 'pending',
  defects: [
    { checkName: '支架腐蚀锈蚀情况', level: 'ma', reason: '支架发现明显锈蚀，已影响承载力', rectifyContent: '', photos: [] },
    { checkName: '组件背板气泡/发黄情况', level: 'mi', reason: '2号组件背板轻微气泡，需观察', rectifyContent: '', photos: [] },
    { checkName: '直流线缆绝缘层完整性', level: 'mi', reason: '局部绝缘层老化，存在破损', rectifyContent: '', photos: [] },
  ],
}

const RECTIFY_TEMPLATES: Record<string, string[]> = {
  cr: ['已联系专业团队更换损坏部件，现场完成整改并验收', '已紧急停机排查，更换故障模块，恢复正常运行'],
  ma: ['已完成除锈防腐处理，涂刷防锈漆，并更换受损螺栓', '已完成更换，整改后测试功能正常', '已清洁处理并重新紧固，防水密封恢复正常'],
  mi: ['已做标记，列入下次定期维护计划', '已进行临时防护处理，将在月度维护时彻底整改', '已清理并检测，性能未见明显下降'],
}

const record = reactive({ ...(props.initRow ?? MOCK_RECORD) })
const defects = reactive<any[]>((props.initRow?.defects ?? MOCK_RECORD.defects).map((d: any) => ({ ...d, photos: d.photos ?? [] })))
const submitting = ref(false)

async function handleSubmit() {
  const empty = defects.filter(d => !d.rectifyContent?.trim())
  if (empty.length) {
    message.error(`还有 ${empty.length} 项整改内容未填写`)
    return
  }
  submitting.value = true
  await new Promise(r => setTimeout(r, 800))
  submitting.value = false
  message.success('整改内容已提交，等待复核')
  emit('submitted', { ...record, status: 'submitted', defects })
}
</script>

<style scoped>
.rectify-input-page { display: flex; flex-direction: column; height: 100%; background: #f5f5f5; }

.page-header {
  display: flex; align-items: center; gap: 10px; padding: 10px 20px;
  background: #fff; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.page-title { font-size: 15px; font-weight: 600; color: #262626; }
.deadline-tip { font-size: 13px; color: #8c8c8c; }

.page-body { display: flex; gap: 14px; padding: 14px; flex: 1; overflow: hidden; }

/* 左栏 */
.sidebar-info { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.info-card { background: #fff; border-radius: 8px; padding: 14px 16px; }
.info-card-title { font-size: 14px; font-weight: 600; color: #262626; margin-bottom: 12px; }
.info-row { display: flex; gap: 8px; font-size: 13px; margin-bottom: 8px; }
.il { color: rgba(0,0,0,.45); white-space: nowrap; width: 72px; flex-shrink: 0; }
.iv { color: #262626; flex: 1; }
.iv.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.reject-card { border-left: 3px solid #ff4d4f; }
.reject-reason { font-size: 13px; color: #595959; line-height: 1.7; margin: 0; }

/* 右栏 */
.rectify-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }

.defect-card { background: #fff; border-radius: 8px; overflow: hidden; border-left: 4px solid; }
.defect-card.rs-pending { border-color: #fa8c16; }
.defect-card.rs-rejected { border-color: #ff4d4f; }
.defect-card.rs-submitted { border-color: #1677ff; }

.defect-card-head {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  background: #fafafa; border-bottom: 1px solid #f0f0f0;
}
.defect-idx { width: 22px; height: 22px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #8c8c8c; flex-shrink: 0; }
.defect-name { font-size: 14px; font-weight: 600; color: #262626; }

.defect-badge-small {
  font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 3px;
  flex-shrink: 0;
}
.defect-badge-small.cr { background: rgba(255,77,79,.1); color: #ff4d4f; }
.defect-badge-small.ma { background: rgba(250,140,22,.1); color: #fa8c16; }
.defect-badge-small.mi { background: rgba(250,219,20,.15); color: #d48806; }

.defect-origin { display: flex; gap: 10px; padding: 12px 16px; background: rgba(0,0,0,.02); font-size: 13px; }
.defect-origin-label { color: rgba(0,0,0,.45); white-space: nowrap; }
.defect-origin-text { color: #595959; flex: 1; }

.defect-input-block { padding: 12px 16px; border-top: 1px solid #f5f5f5; }
.input-block-label { font-size: 13px; font-weight: 600; color: #262626; margin-bottom: 8px; }
.required { color: #ff4d4f; margin-left: 2px; }

.rectify-templates { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.r-tpl {
  font-size: 12px; color: #1677ff; background: rgba(22,119,255,.06);
  border: 1px solid rgba(22,119,255,.2); border-radius: 4px; padding: 2px 8px;
  cursor: pointer; transition: background .12s;
}
.r-tpl:hover { background: rgba(22,119,255,.12); }
</style>
