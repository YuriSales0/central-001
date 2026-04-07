import { addBusinessDays, endOfMonth, addDays } from 'date-fns'
import { calculateCommission as calcByPlan, COMMISSION_RATES, type PlanType } from './plans'

export type PayoutPlatform = 'AIRBNB' | 'BOOKING' | 'MANUAL'

/** @deprecated use calculateCommission(amount, planType) */
export const COMMISSION_RATE = 0.18

/**
 * Regras de estimativa de payout por plataforma.
 *
 * AIRBNB:
 *   - Payout iniciado ~24h após check-in
 *   - Chega na conta em +2 dias úteis (estimativa conservadora)
 *   - Total: checkInDate + 1 dia + 2 dias úteis
 *
 * BOOKING (modelo VCC — Virtual Credit Card):
 *   - Paga no dia do check-in com VCC liberada no checkout
 *   - Ou transferência bancária no final do mês do checkout
 *   - Usamos: último dia do mês do checkout
 *
 * MANUAL:
 *   - Sem estimativa automática; admin define a data
 */
export function estimatePayoutDate(
  platform: PayoutPlatform,
  checkInDate: Date,
  checkOutDate: Date,
): Date {
  switch (platform) {
    case 'AIRBNB': {
      // Airbnb: inicia 24h após check-in → +2 dias úteis de processamento
      const initiated = addDays(checkInDate, 1)
      return addBusinessDays(initiated, 2)
    }
    case 'BOOKING': {
      // Booking: final do mês do checkout
      return endOfMonth(checkOutDate)
    }
    case 'MANUAL':
    default:
      // Sem estimativa — admin define
      return addDays(new Date(), 7)
  }
}

/**
 * Calcula comissão com base no plano da propriedade.
 * grossAmount = valor líquido recebido da plataforma (já descontadas as taxas da plataforma).
 * A comissão HostMasters é aplicada sobre esse valor.
 */
export function calculateCommission(grossAmount: number, planType: PlanType = 'MID') {
  const { commissionAmount, ownerAmount } = calcByPlan(grossAmount, planType)
  return {
    rate: COMMISSION_RATES[planType],
    commissionAmount,
    netAmount: ownerAmount,  // valor que vai para o owner
  }
}

export const PLATFORM_LABELS: Record<PayoutPlatform, string> = {
  AIRBNB: 'Airbnb',
  BOOKING: 'Booking.com',
  MANUAL: 'Manual',
}

export const PLATFORM_RULES: Record<PayoutPlatform, { title: string; description: string; detail: string }> = {
  AIRBNB: {
    title: 'Airbnb',
    description: 'Check-in + 1 dia + 2 dias úteis',
    detail:
      'O Airbnb libera o pagamento ~24h após o check-in do hóspede. ' +
      'O valor chega na sua conta em aproximadamente 1–3 dias úteis após a liberação, ' +
      'dependendo do método de recebimento (transferência bancária, PayPal, etc). ' +
      'Estimativa conservadora: check-in + 3 dias úteis.',
  },
  BOOKING: {
    title: 'Booking.com',
    description: 'Final do mês do checkout',
    detail:
      'O Booking.com opera majoritariamente com VCC (Virtual Credit Card): ' +
      'o cartão virtual é liberado no dia do check-in e pode ser cobrado a partir do checkout. ' +
      'Para transferências bancárias, o pagamento é processado no final do mês ' +
      'em que o checkout ocorreu. Estimativa: último dia do mês do checkout.',
  },
  MANUAL: {
    title: 'Manual',
    description: 'Data definida pelo admin',
    detail:
      'Pagamentos fora das plataformas (pix, transferência direta, dinheiro). ' +
      'O admin define a data esperada manualmente ao registrar o payout.',
  },
}
