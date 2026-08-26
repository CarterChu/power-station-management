import { reactive } from 'vue'

// 电站状态覆盖表：key = 电站 id，value = 操作后的新 filingStatus
// 列表 fetch 时应用此覆盖，保证返回列表时状态与详情操作一致
export const stationStatusOverrides = reactive<Record<string, string>>({})
