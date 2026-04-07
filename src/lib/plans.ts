/**
 * Definição central dos planos HostMasters.
 * Única fonte de verdade — usada no pricing, payout, geração de tasks e UI.
 */

export type PlanType = 'STARTER' | 'BASIC' | 'MID' | 'PREMIUM'
export type BillingType = 'MONTHLY' | 'ANNUAL'

// ─── Comissões ───────────────────────────────────────────────────────────────

export const COMMISSION_RATES: Record<PlanType, number> = {
  STARTER: 0.20,
  BASIC:   0.20,
  MID:     0.18,
  PREMIUM: 0.15,
}

// ─── Preços ──────────────────────────────────────────────────────────────────

export const MONTHLY_PRICES: Record<PlanType, number> = {
  STARTER: 0,
  BASIC:   89,
  MID:     139,
  PREMIUM: 199,
}

export const ANNUAL_PRICES: Record<PlanType, number> = {
  STARTER: 0,
  BASIC:   890,   // 2 meses grátis vs mensal
  MID:     1390,
  PREMIUM: 1990,
}

// ─── Features por plano ───────────────────────────────────────────────────────

export interface PlanFeature {
  label: string
  included: boolean
  highlight?: boolean
}

export const PLAN_FEATURES: Record<PlanType, PlanFeature[]> = {
  STARTER: [
    { label: 'Listagens Airbnb + Booking + VRBO', included: true },
    { label: 'Fechadura inteligente', included: true },
    { label: 'Comunicação com hóspedes 24/7', included: true },
    { label: 'Relatório mensal (EN ou DE)', included: true },
    { label: 'Dashboard online', included: true },
    { label: 'Manutenção preventiva e preditiva', included: false },
    { label: 'Inspeção pré e pós-estadia', included: false },
    { label: 'Análise de concorrência com IA', included: false },
    { label: 'Recomendação automática de preços', included: false },
    { label: 'Transfer aeroporto Málaga/Granada', included: false },
    { label: 'Lavandaria e roupa de cama premium', included: false },
  ],
  BASIC: [
    { label: 'Tudo do Starter', included: true },
    { label: 'Manutenção preventiva e preditiva', included: true, highlight: true },
    { label: 'Gestão de documentação', included: true },
    { label: 'Inspeção pré e pós-estadia', included: true, highlight: true },
    { label: 'Análise de concorrência com IA', included: false },
    { label: 'Recomendação automática de preços', included: false },
    { label: 'Transfer aeroporto Málaga/Granada', included: false },
    { label: 'Lavandaria e roupa de cama premium', included: false },
  ],
  MID: [
    { label: 'Tudo do Basic', included: true },
    { label: 'Análise de concorrência com IA', included: true, highlight: true },
    { label: 'Recomendação automática de preços', included: true, highlight: true },
    { label: 'Resposta prioritária owner (<12h)', included: true },
    { label: 'Resposta prioritária hóspede (<2h)', included: true },
    { label: 'Emergências (<24h)', included: true },
    { label: 'Transfer aeroporto Málaga/Granada', included: false },
    { label: 'Lavandaria e roupa de cama premium', included: false },
  ],
  PREMIUM: [
    { label: 'Tudo do Mid', included: true },
    { label: 'Transfer aeroporto Málaga/Granada', included: true, highlight: true },
    { label: 'Lavandaria e roupa de cama premium', included: true, highlight: true },
    { label: 'Compras antes da chegada do hóspede', included: true, highlight: true },
    { label: 'Todos os upsells futuros activos', included: true, highlight: true },
    { label: 'Emergências (<4h)', included: true, highlight: true },
  ],
}

// ─── Metadados de UI ─────────────────────────────────────────────────────────

export const PLAN_LABELS: Record<PlanType, string> = {
  STARTER: 'Starter',
  BASIC:   'Basic',
  MID:     'Mid',
  PREMIUM: 'Premium',
}

export const PLAN_COLORS: Record<PlanType, { badge: string; card: string; accent: string }> = {
  STARTER: {
    badge: 'bg-gray-100 text-gray-700',
    card:  'border-gray-200',
    accent: 'text-gray-700',
  },
  BASIC: {
    badge: 'bg-blue-100 text-blue-700',
    card:  'border-blue-200',
    accent: 'text-blue-700',
  },
  MID: {
    badge: 'bg-violet-100 text-violet-700',
    card:  'border-violet-300 ring-2 ring-violet-200',  // destaque
    accent: 'text-violet-700',
  },
  PREMIUM: {
    badge: 'bg-amber-100 text-amber-700',
    card:  'border-amber-200',
    accent: 'text-amber-700',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Planos que geram tasks preventivas (CLEANING + INSPECTION) */
export function hasPreventiveMaintenance(plan: PlanType): boolean {
  return plan === 'BASIC' || plan === 'MID' || plan === 'PREMIUM'
}

/** Planos com análise de concorrência / IA pricing */
export function hasAIPricing(plan: PlanType): boolean {
  return plan === 'MID' || plan === 'PREMIUM'
}

/** Calcula comissão sobre valor líquido */
export function calculateCommission(netAmount: number, plan: PlanType) {
  const rate = COMMISSION_RATES[plan]
  const commissionAmount = parseFloat((netAmount * rate).toFixed(2))
  const ownerAmount = parseFloat((netAmount - commissionAmount).toFixed(2))
  return { rate, commissionAmount, ownerAmount }
}

/** Desconto anual em % */
export function annualDiscount(plan: PlanType): number {
  if (MONTHLY_PRICES[plan] === 0) return 0
  const monthly12 = MONTHLY_PRICES[plan] * 12
  const annual = ANNUAL_PRICES[plan]
  return Math.round(((monthly12 - annual) / monthly12) * 100)
}

export const ALL_PLANS: PlanType[] = ['STARTER', 'BASIC', 'MID', 'PREMIUM']
