<template>
  <div class="fti">
    <!-- 复合图标：ps / ai / ofd -->
    <template v-if="isComposite">
      <img class="fti__base" :src="baseUrl" alt="" />
      <img
        v-for="(overlay, i) in overlays"
        :key="i"
        class="fti__overlay"
        :style="overlay.style"
        :src="overlay.url"
        alt=""
      />
    </template>
    <!-- 单层图标 -->
    <img v-else class="fti__single" :src="iconUrl" alt="" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import wordIcon    from '../assets/file-icons/word.svg'
import excelIcon   from '../assets/file-icons/excel.svg'
import pdfIcon     from '../assets/file-icons/pdf.svg'
import pptIcon     from '../assets/file-icons/ppt.svg'
import imageIcon   from '../assets/file-icons/image.svg'
import otherIcon   from '../assets/file-icons/other.svg'
import psBase      from '../assets/file-icons/ps_base.svg'
import psLogo      from '../assets/file-icons/ps_logo.svg'
import aiBase      from '../assets/file-icons/ai_base.svg'
import aiLogo      from '../assets/file-icons/ai_logo.svg'
import ofdBase     from '../assets/file-icons/ofd_base.svg'
import ofdV1       from '../assets/file-icons/ofd_v1.svg'
import ofdV2       from '../assets/file-icons/ofd_v2.svg'
import ofdV3       from '../assets/file-icons/ofd_v3.svg'

const props = defineProps<{ filename: string }>()

const ext = computed(() => {
  const m = props.filename.match(/\.([^.]+)$/)
  return m ? m[1].toLowerCase() : ''
})

type OverlayDef = { url: string; style: Record<string, string> }
type IconDef =
  | { composite: false; url: string }
  | { composite: true; base: string; overlays: OverlayDef[] }

const iconDef = computed<IconDef>(() => {
  switch (ext.value) {
    case 'doc':
    case 'docx':
      return { composite: false, url: wordIcon }

    case 'xls':
    case 'xlsx':
    case 'csv':
      return { composite: false, url: excelIcon }

    case 'pdf':
      return { composite: false, url: pdfIcon }

    case 'ppt':
    case 'pptx':
      return { composite: false, url: pptIcon }

    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'tiff':
    case 'tif':
    case 'heic':
      return { composite: false, url: imageIcon }

    case 'ps':
      return {
        composite: true,
        base: psBase,
        overlays: [
          { url: psLogo, style: { top: '59.65%', right: '29.41%', bottom: '19.33%', left: '31.54%' } },
        ],
      }

    case 'ai':
      return {
        composite: true,
        base: aiBase,
        overlays: [
          { url: aiLogo, style: { top: '56.24%', right: '36.55%', bottom: '19.45%', left: '32.16%' } },
        ],
      }

    case 'ofd':
      return {
        composite: true,
        base: ofdBase,
        overlays: [
          { url: ofdV1, style: { top: '60.16%', right: '20.67%', bottom: '17.89%', left: '59.51%' } },
          { url: ofdV2, style: { top: '60.02%', right: '42.23%', bottom: '18.20%', left: '42.34%' } },
          { url: ofdV3, style: { top: '66.60%', right: '59.40%', bottom: '17.89%', left: '20.67%' } },
        ],
      }

    default:
      return { composite: false, url: otherIcon }
  }
})

const isComposite = computed(() => iconDef.value.composite)
const iconUrl     = computed(() => (!iconDef.value.composite ? iconDef.value.url : ''))
const baseUrl     = computed(() => (iconDef.value.composite  ? iconDef.value.base : ''))
const overlays    = computed(() => (iconDef.value.composite  ? iconDef.value.overlays : []))
</script>

<style scoped>
.fti {
  position: relative;
  width: 30px;
  height: 36px;
  flex-shrink: 0;
}

.fti__single {
  width: 100%;
  height: 100%;
}

.fti__base {
  width: 100%;
  height: 100%;
}

.fti__overlay {
  position: absolute;
}
</style>
