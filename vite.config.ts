import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    // Vue 3.5.x shouldUpdateComponent null bug：AnfeProTable loading→有数据 状态切换时
    // 先 unmount 内部组件把 n1.component 置为 null，patch 再读 emitsOptions 就崩。
    // 注入 null guard，不改页面代码。
    {
      name: 'patch-vue-null-guard',
      transform(code: string, id: string) {
        if (!id.includes('@vue/runtime-core') && !id.includes('vue/dist')) return
        const target = `const instance = n2.component = n1.component;\n  if (shouldUpdateComponent`
        const patched = `const instance = n2.component = n1.component;\n  if (!instance) return;\n  if (shouldUpdateComponent`
        if (code.includes(target)) {
          return { code: code.replace(target, patched), map: null }
        }
      },
    },
    // AnfeProTable CustomColumnsModal 列设置弹窗 key bug：
    // b() 函数取消勾选时会把列移到数组末尾（分组排序），但列项渲染没有 key prop，
    // Vue 按位置 patch 而非按列标识，导致视觉上"最后一列被取消勾选"而非点击的列。
    // 注入 key: C.dataIndex，让 Vue 正确追踪每一列的 DOM 节点。
    {
      name: 'patch-anfe-column-modal-key',
      transform(code: string, id: string) {
        if (!id.includes('@anfe/vue-pro-components')) return
        const target = `U("div", {\n            class: {\n              disabled: C.disabled,\n              "drag-handle": !!C.checked,`
        const patched = `U("div", {\n            key: C.dataIndex,\n            class: {\n              disabled: C.disabled,\n              "drag-handle": !!C.checked,`
        if (code.includes(target)) {
          return { code: code.replace(target, patched), map: null }
        }
      },
    },
  ],
  server: {
    port: 5173,
  },
})
