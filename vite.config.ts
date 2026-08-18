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
  ],
  server: {
    port: 5173,
  },
})
