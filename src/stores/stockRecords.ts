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
  receiver?: string; receiverPhone?: string; signStatus?: string | null; signTime?: string; remark?: string
  rejectReasons?: string[]
  rejectComment?: string
  rejectImages?: string[]
  reviewTime?: string
}

export const sharedStockRecords = reactive<StockRecord[]>([])

type BomItem = { type: string; code: string; name: string; unit: string; quantity: number }

// 根据 filingStatus 预填 demo 记录（路径2：状态驱动数据）
// 只在 sharedStockRecords 为空时执行，避免重复注入
export function initDemoStockRecords(filingStatus: string, bom: BomItem[]) {
  if (sharedStockRecords.length > 0) return

  // 全部物料足量到货
  const fullItems: StockItem[] = bom.map(b => ({
    type: b.type, code: b.code, name: b.name, unit: b.unit,
    designQty: b.quantity, pendingQty: b.quantity, arrivedQty: b.quantity,
  }))
  // 每种物料到一半
  const halfItems: StockItem[] = bom.map(b => ({
    type: b.type, code: b.code, name: b.name, unit: b.unit,
    designQty: b.quantity, pendingQty: b.quantity,
    arrivedQty: Math.max(1, Math.floor(b.quantity / 2)),
  }))
  // 剩余另一半（与 halfItems 合计恰好覆盖 BOM）
  const remainItems: StockItem[] = bom.map(b => ({
    type: b.type, code: b.code, name: b.name, unit: b.unit,
    designQty: b.quantity, pendingQty: b.quantity,
    arrivedQty: b.quantity - Math.max(1, Math.floor(b.quantity / 2)),
  }))
  // 只到第一种物料（全量），其余为 0 —— 确保合计不覆盖全部 BOM
  const firstOnlyItems: StockItem[] = bom.map((b, i) => ({
    type: b.type, code: b.code, name: b.name, unit: b.unit,
    designQty: b.quantity, pendingQty: b.quantity,
    arrivedQty: i === 0 ? b.quantity : 0,
  }))
  // 只到第二种物料（半量），第一种为 0
  const secondHalfItems: StockItem[] = bom.map((b, i) => ({
    type: b.type, code: b.code, name: b.name, unit: b.unit,
    designQty: b.quantity, pendingQty: b.quantity,
    arrivedQty: i === 1 ? Math.max(1, Math.floor(b.quantity / 2)) : 0,
  }))

  const DEMO: Partial<Record<string, StockRecord[]>> = {
    // 第1条已通过，第2条审核中
    reviewing_stock: [
      {
        id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'approved', creator: '张三', createTime: '2026-08-12 09:00', reviewTime: '2026-08-13 10:00',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-12',
        items: halfItems,
      },
      {
        id: '_demo_2', orderNo: 'DH-2026-0002', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'reviewing', creator: '张三', createTime: '2026-08-14 14:00',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-14',
        items: secondHalfItems,
      },
    ],
    // 两条均通过，Record1 只到第一种物料，Record2 只到第二种物料（半量）—— 合计未覆盖全部 BOM
    partial_stock: [
      {
        id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'approved', creator: '张三', createTime: '2026-08-12 09:00', reviewTime: '2026-08-13 10:00',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-12',
        items: firstOnlyItems,
      },
      {
        id: '_demo_2', orderNo: 'DH-2026-0002', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'approved', creator: '王五', createTime: '2026-08-14 14:00', reviewTime: '2026-08-15 09:30',
        receiver: '赵六', receiverPhone: '13987654321', signStatus: 'signed', signTime: '2026-08-14',
        items: secondHalfItems,
      },
    ],
    // 第1条通过，第2条被拒
    partial_stock_rejected: [
      {
        id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'approved', creator: '张三', createTime: '2026-08-12 09:00', reviewTime: '2026-08-13 10:00',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-12',
        items: firstOnlyItems,
      },
      {
        id: '_demo_2', orderNo: 'DH-2026-0002', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'rejected', creator: '张三', createTime: '2026-08-14 14:00', reviewTime: '2026-08-15 10:30',
        rejectReasons: ['到货数量与计划不符'], rejectComment: '部分物料到货数量不足，请补充',
        items: secondHalfItems,
      },
    ],
    // 第1条（部分）通过，第2条（全部）被拒
    full_stock_rejected: [
      {
        id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'approved', creator: '张三', createTime: '2026-08-12 09:00', reviewTime: '2026-08-13 10:00',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-12',
        items: halfItems,
      },
      {
        id: '_demo_2', orderNo: 'DH-2026-0002', materialType: '中高压、低压', arrivalType: '全部到货',
        status: 'rejected', creator: '张三', createTime: '2026-08-14 14:00', reviewTime: '2026-08-15 10:30',
        rejectReasons: ['到货数量与计划不符'], rejectComment: '到货数量与计划不符，请核实后重新提交',
        rejectImages: ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2I4YzhkOCIgcng9IjQiLz48dGV4dCB4PSIxMDAiIHk9IjgwIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7lrqHmoLjlm77niYc8L3RleHQ+PC9zdmc+'],
        items: fullItems,
      },
    ],
    // 两条均通过，合计 100% BOM
    full_stock: [
      {
        id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'approved', creator: '张三', createTime: '2026-08-12 09:00', reviewTime: '2026-08-13 10:00',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-12',
        items: halfItems,
      },
      {
        id: '_demo_2', orderNo: 'DH-2026-0002', materialType: '中高压、低压', arrivalType: '全部到货',
        status: 'approved', creator: '王五', createTime: '2026-08-14 14:00', reviewTime: '2026-08-15 09:30',
        receiver: '赵六', receiverPhone: '13987654321', signStatus: 'signed', signTime: '2026-08-14',
        items: remainItems,
      },
    ],
  }

  const records = DEMO[filingStatus]
  if (records) sharedStockRecords.push(...records)
}
