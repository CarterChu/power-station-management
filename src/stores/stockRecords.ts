import { reactive, ref } from 'vue'

// true = sharedStockRecords 里是用户真实提交的数据，不应被清除或覆盖
export const hasUserSubmittedRecords = ref(false)

export type StockItem = {
  type: string; code: string; name: string; unit: string
  designQty: number; pendingQty: number; arrivedQty: number | null
}

export type StockRecord = {
  id: string; orderNo: string; materialType: string; arrivalType: string
  status: string | null; creator: string; createTime: string
  items: StockItem[]
  rejectReasons?: string[]
  rejectComment?: string
  reviewTime?: string
}

export const sharedStockRecords = reactive<StockRecord[]>([])

type BomItem = { type: string; code: string; name: string; unit: string; quantity: number }

// 根据 filingStatus 预填 demo 记录（路径2：状态驱动数据）
// 只在 sharedStockRecords 为空时执行，避免重复注入
export function initDemoStockRecords(filingStatus: string, bom: BomItem[]) {
  if (sharedStockRecords.length > 0) return

  const fullItems: StockItem[] = bom.map(b => ({
    type: b.type, code: b.code, name: b.name, unit: b.unit,
    designQty: b.quantity, pendingQty: b.quantity, arrivedQty: b.quantity,
  }))

  // 部分到货：第一项只到一半，其余全到
  const partialItems: StockItem[] = bom.map((b, i) => ({
    type: b.type, code: b.code, name: b.name, unit: b.unit,
    designQty: b.quantity, pendingQty: b.quantity,
    arrivedQty: i === 0 ? Math.max(1, Math.floor(b.quantity / 2)) : b.quantity,
  }))

  const DEMO: Partial<Record<string, StockRecord[]>> = {
    reviewing_stock: [{
      id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '全部到货',
      status: 'reviewing', creator: '张三', createTime: '2026-08-14 09:00',
      items: fullItems,
    }],
    partial_stock: [{
      id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '部分到货',
      status: 'approved', creator: '张三', createTime: '2026-08-14 09:00', reviewTime: '2026-08-15 10:00',
      items: partialItems,
    }],
    partial_stock_rejected: [{
      id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '部分到货',
      status: 'rejected', creator: '张三', createTime: '2026-08-14 09:00', reviewTime: '2026-08-15 10:30',
      rejectReasons: ['到货数量与计划不符'], rejectComment: '部分物料到货数量不足，请补充',
      items: partialItems,
    }],
    full_stock_rejected: [{
      id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '全部到货',
      status: 'rejected', creator: '张三', createTime: '2026-08-14 09:00', reviewTime: '2026-08-15 10:30',
      rejectReasons: ['到货数量与计划不符'], rejectComment: '到货数量与计划不符，请核实后重新提交',
      items: fullItems,
    }],
    full_stock: [{
      id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '全部到货',
      status: 'approved', creator: '张三', createTime: '2026-08-14 09:00', reviewTime: '2026-08-15 10:00',
      items: fullItems,
    }],
    stocked: [{
      id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '全部到货',
      status: 'approved', creator: '张三', createTime: '2026-08-14 09:00', reviewTime: '2026-08-15 10:00',
      items: fullItems,
    }],
  }

  const records = DEMO[filingStatus]
  if (records) sharedStockRecords.push(...records)
}
