<template>
  <div class="log-card">
    <div class="log-card-header">
      <div class="section-title">流转日志</div>
    </div>
    <div class="log-card-body">
      <div class="approval-list">
        <div v-for="group in groupedLogs" :key="group.date" class="approval-date-group">
          <div class="approval-date-header">
            <CalendarOutlined class="approval-date-icon" />
            <span class="approval-date-text">{{ group.date }}</span>
          </div>
          <div class="approval-items">
            <div v-for="(log, idx) in group.logs" :key="log.id" class="approval-item">
              <div class="approval-connector">
                <div class="connector-line connector-line--top" />
                <component :is="LOG_ICON[log.type]" class="connector-icon" :class="`connector-icon--${log.type}`" />
                <div v-if="!(group === groupedLogs[groupedLogs.length-1] && idx === group.logs.length-1)" class="connector-line connector-line--bottom" />
              </div>
              <div class="approval-card-wrap">
                <div class="approval-card">
                  <div class="approval-card-header">
                    <span class="approval-card-title">{{ log.event }}</span>
                    <span :class="['approval-tag', `approval-tag--${log.type}`]">
                      {{ LOG_TAG_LABEL[log.type] }}
                    </span>
                  </div>
                  <div class="approval-card-body">
                    <div class="approval-field">
                      <span class="field-label">操作人</span>
                      <span class="field-value field-value--truncate">{{ log.operator }}</span>
                    </div>
                    <div v-if="log.note" class="approval-field approval-field--note">
                      <span class="field-label field-label--wide">备注</span>
                      <div class="field-note-wrap">
                        <span :class="['field-value', log.type === 'reject' ? 'field-value--red' : '']" style="white-space:pre-line">{{ log.note }}</span>
                        <div v-if="log.images?.length" class="field-note-images">
                          <a-image-preview-group>
                            <div v-for="(img, i) in log.images" :key="i" class="field-note-thumb">
                              <a-image
                                :src="img"
                                :width="44"
                                :height="44"
                                :preview="{ maskClassName: 'flow-log-img-mask' }"
                              />
                            </div>
                          </a-image-preview-group>
                        </div>
                      </div>
                    </div>
                    <div class="approval-field">
                      <span class="field-label field-label--wide">时间</span>
                      <span class="field-value field-value--truncate">{{ log.time }}</span>
                    </div>
                  </div>
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
import { computed } from 'vue'
import { CalendarOutlined, FileAddOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined } from '@ant-design/icons-vue'

export interface LogEntry {
  id: number
  type: string
  event: string
  operator: string
  time: string
  note: string | null
  images?: string[]
}

const props = defineProps<{ logs: LogEntry[] }>()

const LOG_ICON: Record<string, any> = {
  create:  FileAddOutlined,
  submit:  CheckCircleOutlined,
  reject:  CloseCircleOutlined,
  approve: CheckCircleOutlined,
  void:    EditOutlined,
}

const LOG_TAG_LABEL: Record<string, string> = {
  create:  '创建',
  submit:  '已提交',
  reject:  '不通过',
  approve: '已通过',
  void:    '已作废',
}

const groupedLogs = computed(() => {
  const map = new Map<string, LogEntry[]>()
  for (const log of props.logs) {
    const date = log.time.split(' ')[0]
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(log)
  }
  return Array.from(map.entries()).map(([date, logs]) => ({ date, logs }))
})

</script>

<style scoped>
/* ── 流转日志 ── */
.log-card { background: #fff; border-radius: 8px; height: 100%; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; }
.log-card-header { padding: 20px 20px 12px; flex-shrink: 0; border-bottom: 1px solid #f0f0f0; }
.log-card-header .section-title { margin-bottom: 0; }
.log-card-body { flex: 1; overflow-y: auto; padding: 16px 20px 20px; box-sizing: border-box; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
.log-card-body::-webkit-scrollbar { width: 4px; }
.log-card-body::-webkit-scrollbar-track { background: transparent; }
.log-card-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }

.approval-list       { display: flex; flex-direction: column; gap: 16px; }
.approval-date-group { display: flex; flex-direction: column; gap: 8px; }
.approval-date-header { display: flex; align-items: center; gap: 8px; padding: 0 4px; }
.approval-date-icon   { font-size: 14px; color: rgba(0,0,0,.45); }
.approval-date-text   { font-size: 14px; font-weight: 500; color: rgba(0,0,0,.88); }

.approval-items { display: flex; flex-direction: column; padding-left: 4px; }
.approval-item  { display: flex; gap: 12px; align-items: flex-start; }

.approval-connector { display: flex; flex-direction: column; align-items: center; gap: 4px; align-self: stretch; flex-shrink: 0; }
.connector-line         { width: 1px; background: #e6e6eb; flex-shrink: 0; }
.connector-line--top    { height: 8px; }
.connector-line--bottom { flex: 1 0 0; min-height: 1px; }
.connector-icon         { font-size: 15px; flex-shrink: 0; }
.connector-icon--create  { color: #8c8c8c; }
.connector-icon--submit  { color: #1677ff; }
.connector-icon--reject  { color: #f5222d; }
.connector-icon--approve { color: #52c41a; }
.connector-icon--void    { color: #8c8c8c; }

.approval-card-wrap { flex: 1; padding-bottom: 12px; }
.approval-card {
  background: #fff;
  border: 1px solid #e6e6eb;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.approval-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.approval-card-title  { font-size: 14px; font-weight: 500; color: #1f1f1f; line-height: 22px; }
.approval-tag {
  font-size: 12px; font-weight: 400;
  padding: 0 6px; height: 22px; line-height: 20px;
  border-radius: 4px; border: 1px solid;
  white-space: nowrap; flex-shrink: 0;
}
.approval-tag--create  { background: rgba(0,0,0,.02); border-color: #d9d9d9; color: rgba(0,0,0,.45); }
.approval-tag--submit  { background: #e8f7ff; border-color: #8bceff; color: #007bfe; }
.approval-tag--reject  { background: #ffe9e7; border-color: #ffaca7; color: #f5222d; }
.approval-tag--approve { background: #e8fbd6; border-color: #b7eb8f; color: #52c41a; }
.approval-tag--void    { background: rgba(0,0,0,.02); border-color: #d9d9d9; color: rgba(0,0,0,.45); }

.approval-card-body  { display: flex; flex-direction: column; gap: 4px; }
.approval-field      { display: flex; gap: 4px; align-items: center; font-size: 13px; line-height: 20px; }
.approval-field--note { align-items: flex-start; }

.field-label       { color: #8c8c8c; flex-shrink: 0; }
.field-label--wide { width: 42px; }

.field-value           { color: #1f1f1f; flex: 1 0 0; min-width: 1px; }
.field-value--truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.field-value--muted    { color: rgba(0,0,0,.45); }
.field-value--red      { color: #1a1a1a; }

.field-note-wrap   { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 4px; }
.field-note-images { display: flex; flex-wrap: wrap; gap: 4px; }
.field-note-thumb {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  flex-shrink: 0;
  cursor: pointer;
}

.section-title { font-size: 15px; font-weight: 600; color: #1f1f1f; margin-bottom: 16px; }
</style>

<style>
.flow-log-img-mask .ant-image-mask-info {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0 !important;
  gap: 0 !important;
}
.flow-log-img-mask .ant-image-mask-info .anticon {
  font-size: 16px !important;
}
/* 缩略图尺寸和裁切 */
.field-note-thumb .ant-image,
.field-note-thumb .ant-image-img {
  width: 44px !important;
  height: 44px !important;
  object-fit: cover;
  display: block;
}
</style>
