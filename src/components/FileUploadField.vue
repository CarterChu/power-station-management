<template>
  <div class="fuf">
    <a-upload
      v-bind="$attrs"
      :show-upload-list="false"
      :before-upload="handleBeforeUpload"
      :accept="accept"
      :multiple="multiple"
      :max-count="maxCount"
      :disabled="disabled"
    >
      <slot />
    </a-upload>

    <div v-if="fileList?.length" class="fuf__list">
      <div
        v-for="file in fileList"
        :key="file.uid"
        class="fuf__item"
      >
        <FileTypeIcon :filename="file.name" />
        <div class="fuf__text">
          <span class="fuf__name">{{ file.name }}</span>
        </div>
        <span class="fuf__del" title="删除" @click.stop="removeFile(file)">
          <DeleteOutlined />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Upload } from 'ant-design-vue'
import { DeleteOutlined } from '@ant-design/icons-vue'
import type { UploadFile } from 'ant-design-vue'
import FileTypeIcon from './FileTypeIcon.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  fileList?: UploadFile[]
  accept?: string
  multiple?: boolean
  maxCount?: number
  disabled?: boolean
}>(), {
  fileList: () => [],
})

const emit = defineEmits<{
  (e: 'update:fileList', list: UploadFile[]): void
}>()

function handleBeforeUpload(file: File) {
  const newFile: UploadFile = {
    uid: file.uid,
    name: file.name,
    status: 'done',
    size: file.size,
    type: file.type,
    percent: 100,
    originFileObj: file,
  }
  const current = props.fileList ?? []
  const maxCount = props.maxCount ?? (props.multiple ? Infinity : 1)
  const next = [...current, newFile].slice(-maxCount)
  emit('update:fileList', next)
  return Upload.LIST_IGNORE
}

function removeFile(file: UploadFile) {
  emit('update:fileList', (props.fileList ?? []).filter(f => f.uid !== file.uid))
}
</script>

<style scoped>
.fuf__list {
  margin-top: 4px;
}

.fuf__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.15s;
  cursor: default;
}

.fuf__item:hover {
  background: #f0f5ff;
}

.fuf__item:hover .fuf__del {
  opacity: 1;
}

.fuf__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 18px;
}

.fuf__name {
  font-size: 14px;
  color: #1f1f1f;
  font-family: 'PingFang SC', -apple-system, sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fuf__del {
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.fuf__del:hover {
  color: rgba(0, 0, 0, 0.72);
}
</style>
