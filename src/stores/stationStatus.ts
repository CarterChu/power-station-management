import { reactive } from 'vue'

// 电站状态覆盖表：key = 电站 id，value = 操作后的新 filingStatus
export const stationStatusOverrides = reactive<Record<string, string>>({})

type ReviewAction = 'pass' | 'reject'
type RoleProgress = { biz: ReviewAction | null; tech: ReviewAction | null; eng: ReviewAction | null }
type BizTechProgress = { biz: ReviewAction | null; tech: ReviewAction | null }

// ─── 开工并行审核进度（key = 'b:' + 电站 id）────────────────────────────────
export const startReviewProgress = reactive<Record<string, RoleProgress>>({})

export function submitStartReview(id: string, role: string, action: ReviewAction) {
  const key = 'b:' + id
  if (!startReviewProgress[key]) {
    startReviewProgress[key] = { biz: null, tech: null, eng: null }
  }
  startReviewProgress[key][role as keyof RoleProgress] = action

  const p = startReviewProgress[key]
  if (p.biz !== null && p.tech !== null && p.eng !== null) {
    const anyRejected = (['biz', 'tech', 'eng'] as const).some(r => p[r] === 'reject')
    stationStatusOverrides[key] = anyRejected ? 'start_rejected' : 'started'
  }
}

// ─── 建档审核进度（key = 电站 id）───────────────────────────────────────────
export const filingReviewProgress = reactive<Record<string, {
  self: BizTechProgress
  platform: BizTechProgress
}>>({})

function ensureFilingProgress(id: string) {
  if (!filingReviewProgress[id]) {
    filingReviewProgress[id] = { self: { biz: null, tech: null }, platform: { biz: null, tech: null } }
  }
}

export function submitFilingSelfReview(id: string, role: string, action: ReviewAction) {
  ensureFilingProgress(id)
  filingReviewProgress[id].self[role as 'biz' | 'tech'] = action
  const s = filingReviewProgress[id].self
  if (s.biz === 'pass' && s.tech === 'pass') {
    stationStatusOverrides[id] = 'pending_review'
    filingReviewProgress[id].platform = { biz: null, tech: null }
  } else if (s.biz === 'reject' && s.tech === 'reject') {
    stationStatusOverrides[id] = 'filing_self_rejected'
  }
}

export function resetFilingSelfReview(id: string, role: string) {
  ensureFilingProgress(id)
  filingReviewProgress[id].self[role as 'biz' | 'tech'] = null
  // 重置后电站状态回到 self_reviewing（如果当前是 pending_review 且尚未平台审核）
  if (stationStatusOverrides[id] === 'pending_review') {
    const p = filingReviewProgress[id].platform
    if (p.biz === null && p.tech === null) {
      stationStatusOverrides[id] = 'self_reviewing'
    }
  }
}

export function submitFilingPlatformReview(id: string, role: string, action: ReviewAction) {
  ensureFilingProgress(id)
  filingReviewProgress[id].platform[role as 'biz' | 'tech'] = action
  const p = filingReviewProgress[id].platform
  if (p.biz === 'pass' && p.tech === 'pass') {
    stationStatusOverrides[id] = 'filing_approved'
  } else if (p.biz === 'reject' && p.tech === 'reject') {
    stationStatusOverrides[id] = 'filing_platform_rejected'
  }
}

export function resetFilingPlatformReview(id: string, role: string) {
  ensureFilingProgress(id)
  filingReviewProgress[id].platform[role as 'biz' | 'tech'] = null
}
