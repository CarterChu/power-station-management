<template>
  <div class="reject-card">
    <div class="reject-strip" />
    <div class="reject-content">
      <div class="reject-header" @click="expanded = !expanded">
        <div class="reject-header-left">
          <CloseCircleFilled class="reject-icon" />
          <span class="reject-title">{{ title ?? '审核不通过' }}</span>
        </div>
        <DownOutlined class="section-toggle-icon" :class="{ rotated: expanded }" />
      </div>
      <div v-if="expanded" class="reject-body">
        <!-- 多段模式 -->
        <template v-if="info.sections?.length">
          <template v-for="(section, i) in info.sections" :key="i">
            <a-divider v-if="i > 0" style="margin: 0" />
            <div class="reject-section">
              <p class="reject-section-title">{{ section.title }}</p>
              <p class="reject-reason" style="white-space:pre-line">{{ section.reason }}</p>
              <a-image-preview-group v-if="section.images?.length">
                <div class="reject-images">
                  <div v-for="(src, j) in section.images" :key="j" class="reject-thumb">
                    <a-image :src="src" :preview="{ maskClassName: 'reject-img-mask' }" />
                  </div>
                </div>
              </a-image-preview-group>
            </div>
          </template>
        </template>
        <!-- 单段模式 -->
        <template v-else>
          <p class="reject-reason" style="white-space:pre-line">{{ info.reason }}</p>
          <a-image-preview-group v-if="info.images?.length">
            <div class="reject-images">
              <div v-for="(src, i) in info.images" :key="i" class="reject-thumb">
                <a-image :src="src" :preview="{ maskClassName: 'reject-img-mask' }" />
              </div>
            </div>
          </a-image-preview-group>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CloseCircleFilled, DownOutlined } from '@ant-design/icons-vue'

export interface RejectSection {
  title: string
  reason: string
  images?: string[]
}

export interface RejectInfo {
  reason?: string
  images?: string[]
  sections?: RejectSection[]
}

withDefaults(defineProps<{ info: RejectInfo; title?: string }>(), { info: () => ({}) })

const expanded = ref(true)
</script>

<style scoped>
.reject-card {
  position: relative;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}
.reject-strip {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #f5222d;
}
.reject-content {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.reject-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}
.reject-header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}
.reject-icon {
  font-size: 18px;
  color: #f5222d;
  flex-shrink: 0;
}
.reject-title {
  font-size: 16px;
  font-weight: 600;
  color: #f5222d;
  line-height: 24px;
}
.section-toggle-icon {
  font-size: 12px;
  color: #8c8c8c;
  background: #f0f0f0;
  padding: 7px 6px 5px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s;
}
.section-toggle-icon.rotated { transform: rotate(180deg); }
.reject-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.reject-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.reject-section-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  margin: 0;
  line-height: 22px;
}
.reject-reason {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.6;
  margin: 0;
}
.reject-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.reject-thumb {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  overflow: hidden;
  flex-shrink: 0;
}
</style>

<style>
.reject-img-mask .ant-image-mask-info {
  font-size: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0 !important;
}
.reject-img-mask .ant-image-mask-info .anticon {
  font-size: 16px !important;
}
.reject-thumb .ant-image,
.reject-thumb .ant-image-img {
  width: 44px !important;
  height: 44px !important;
  object-fit: cover;
  display: block;
}
</style>
