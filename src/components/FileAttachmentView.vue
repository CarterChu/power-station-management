<template>
  <div class="fav">
    <div v-for="name in files" :key="name" class="fav__item">
      <FileTypeIcon :filename="name" />
      <div class="fav__text">
        <span class="fav__name">{{ name }}</span>
        <span v-if="uploadInfo" class="fav__meta">{{ uploadInfo }}</span>
      </div>
      <div class="fav__actions">
        <EyeOutlined class="fav__btn" title="预览" @click.stop="onPreview(name)" />
        <DownloadOutlined class="fav__btn" title="下载" @click.stop="onDownload(name)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import FileTypeIcon from './FileTypeIcon.vue'

const props = withDefaults(defineProps<{
  files: string[]
  uploadInfo?: string
}>(), { files: () => [] })

const emit = defineEmits<{
  preview: [name: string]
  download: [name: string]
}>()

function onPreview(name: string) { emit('preview', name) }
function onDownload(name: string) { emit('download', name) }
</script>

<style scoped>
.fav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fav__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.15s;
  cursor: default;
}

.fav__item:hover {
  background: #f0f5ff;
}

.fav__item:hover .fav__actions {
  opacity: 1;
}

.fav__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 18px;
}

.fav__name {
  font-size: 14px;
  color: #1f1f1f;
  font-family: 'PingFang SC', -apple-system, sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav__meta {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.fav__btn {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  display: flex;
}

.fav__btn:hover {
  color: rgba(0, 0, 0, 0.72);
}
</style>
