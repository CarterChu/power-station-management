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

// 从到货单记录集合推算电站到货状态（与详情页 syncFilingStatus 共用同一套逻辑）
export function computeFilingStatusFromRecords(records: StockRecord[], bom: BomItem[]): string {
  const active = records.filter(r => r.status !== null && r.status !== 'voided')
  if (active.length === 0) return 'waiting_stock'

  const hasRejected  = active.some(r => r.status === 'rejected')
  const hasApproved  = active.some(r => r.status === 'approved')
  const hasReviewing = active.some(r => r.status === 'reviewing')

  if (hasReviewing && !hasRejected) return 'reviewing_stock'

  const approvedRecords = hasRejected ? active.filter(r => r.status === 'approved') : active
  const allCovered = bom.every(b => {
    const total = approvedRecords.reduce((sum, r) => {
      const item = r.items.find(i => i.code === b.code)
      return sum + (item?.arrivedQty ?? 0)
    }, 0)
    return total >= b.quantity
  })

  if (hasRejected) return allCovered ? 'full_stock_rejected' : 'partial_stock_rejected'
  return allCovered ? 'full_stock' : 'partial_stock'
}

// 根据 filingStatus 预填 demo 记录，返回从记录推算出的实际电站状态
export function initDemoStockRecords(filingStatus: string, bom: BomItem[]): string {
  if (sharedStockRecords.length > 0) return computeFilingStatusFromRecords(sharedStockRecords, bom)

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
  // 0001 已通过 halfItems 后，0002 的 pendingQty = 剩余量，arrivedQty 也恰好补齐（用于正常完成的第二批）
  const remainAfterHalf: StockItem[] = bom.map(b => {
    const remain = b.quantity - Math.max(1, Math.floor(b.quantity / 2))
    return { type: b.type, code: b.code, name: b.name, unit: b.unit, designQty: b.quantity, pendingQty: remain, arrivedQty: remain }
  })
  // 0001 已通过 halfItems 后，0002 整批被退回（arrivedQty=0）—— 剩余 = 各项仍欠量
  const partialRejectAfterHalf: StockItem[] = bom.map(b => {
    const remain = b.quantity - Math.max(1, Math.floor(b.quantity / 2))
    return { type: b.type, code: b.code, name: b.name, unit: b.unit, designQty: b.quantity, pendingQty: remain, arrivedQty: 0 }
  })
  // 0001 已通过 fullItems 后，0002 pendingQty = 0（BOM 已全量到货，此批为多余补充）
  const partialAfterFull: StockItem[] = bom.map((b, i) => ({
    type: b.type, code: b.code, name: b.name, unit: b.unit,
    designQty: b.quantity, pendingQty: 0,
    arrivedQty: i === 0 ? b.quantity : 0,
  }))
  const DEMO: Partial<Record<string, StockRecord[]>> = {
    // 0001 第一批通过（半量），0002 第二批补齐剩余量、审核中
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
        items: remainAfterHalf,
      },
    ],
    // 0001 第一批通过（半量），尚未提交第二批 —— approved 合计未覆盖全部 BOM
    partial_stock: [
      {
        id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'approved', creator: '张三', createTime: '2026-08-12 09:00', reviewTime: '2026-08-13 10:00',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-12',
        items: halfItems,
      },
    ],
    // 0001 第一批通过（半量），0002 第二批补齐剩余量但被驳回
    partial_stock_rejected: [
      {
        id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'approved', creator: '张三', createTime: '2026-08-12 09:00', reviewTime: '2026-08-13 10:00',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-12',
        items: halfItems,
      },
      {
        id: '_demo_2', orderNo: 'DH-2026-0002', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'rejected', creator: '张三', createTime: '2026-08-14 14:00', reviewTime: '2026-08-15 10:30',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-14',
        rejectReasons: ['物料不符合规格'], rejectComment: '本批次物料不符合规格，已全部退回，请重新提交',
        items: partialRejectAfterHalf,
      },
    ],
    // 0001 一次性全量到货且通过，0002 为补充批次（部分物料）被驳回
    full_stock_rejected: [
      {
        id: '_demo_1', orderNo: 'DH-2026-0001', materialType: '中高压、低压', arrivalType: '全部到货',
        status: 'approved', creator: '张三', createTime: '2026-08-12 09:00', reviewTime: '2026-08-13 10:00',
        receiver: '李四', receiverPhone: '13812345678', signStatus: 'signed', signTime: '2026-08-12',
        items: fullItems,
      },
      {
        id: '_demo_2', orderNo: 'DH-2026-0002', materialType: '中高压、低压', arrivalType: '部分到货',
        status: 'rejected', creator: '张三', createTime: '2026-08-14 14:00', reviewTime: '2026-08-15 10:30',
        receiver: '王五', receiverPhone: '13987654321', signStatus: 'signed', signTime: '2026-08-14',
        rejectReasons: ['到货数量与计划不符'], rejectComment: '物料已足量到货，此批次无需补充',
        rejectImages: ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2I4YzhkOCIgcng9IjQiLz48dGV4dCB4PSIxMDAiIHk9IjgwIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7lrqHmoLjlm77niYc8L3RleHQ+PC9zdmc+'],
        items: partialAfterFull,
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
        items: remainAfterHalf,
      },
    ],
  }

  const records = DEMO[filingStatus]
  if (records) sharedStockRecords.push(...records)
  return computeFilingStatusFromRecords(sharedStockRecords, bom)
}
