import type { TaskType } from '@/types'

/**
 * Checklist padrão por tipo de task.
 * Cada task criada recebe esses itens automaticamente.
 */
export const CHECKLISTS: Record<TaskType, string[]> = {
  CHECK_IN: [
    'Verificar chaves / acesso (código, fechadura, chaveiro)',
    'Receber hóspede no local',
    'Apresentar a propriedade e ambientes',
    'Demonstrar uso dos equipamentos (ar, TV, fogão, etc)',
    'Confirmar todos os equipamentos funcionando',
    'Informar regras da casa (barulho, lixo, animais)',
    'Passar dados de wi-fi e senhas',
    'Informar contato de emergência',
    'Confirmar check-out com hóspede',
  ],
  CHECK_OUT: [
    'Receber chaves / confirmar acesso encerrado',
    'Vistoria geral: sala, quartos, banheiros, cozinha',
    'Verificar danos ou avarias — fotografar se houver',
    'Verificar itens do inventário (toalhas, utensílios)',
    'Recolher itens esquecidos pelo hóspede',
    'Registrar estado final com fotos',
    'Fechar janelas, portas e portões',
    'Acionar limpeza pós-checkout',
  ],
  CLEANING: [
    'Limpar e desinfetar banheiros',
    'Limpar cozinha e eletrodomésticos',
    'Lavar louça / esvaziar lava-louça',
    'Aspirar e passar pano nos pisos',
    'Limpar superfícies, bancadas e espelhos',
    'Trocar roupas de cama em todos os quartos',
    'Trocar toalhas de banho e rosto',
    'Verificar e repor itens de higiene (sabonete, papel)',
    'Remover lixo de todos os ambientes',
    'Verificar e repor itens de cozinha (óleo, sal, etc)',
    'Limpar vidros e janelas se necessário',
    'Registrar qualquer dano ou item faltante',
  ],
  INSPECTION: [
    'Verificar instalações elétricas (tomadas, disjuntores)',
    'Verificar instalações hidráulicas (torneiras, descargas)',
    'Testar alarmes de fumaça e CO',
    'Verificar extintor de incêndio (validade, carga)',
    'Verificar estado estrutural (paredes, teto, piso)',
    'Verificar sistemas de climatização (filtros, drenagem)',
    'Verificar fechaduras e sistemas de acesso',
    'Verificar iluminação interna e externa',
    'Verificar portões, grades e segurança perimetral',
    'Documentar anomalias com fotos e descrição',
    'Encaminhar itens críticos para manutenção corretiva',
  ],
  MAINTENANCE_PREVENTIVE: [
    'Limpar filtros do ar-condicionado',
    'Verificar e lubrificar dobradiças e fechaduras',
    "Limpar caixa d'água (se aplicável)",
    'Verificar mangueiras e conexões hidráulicas',
    'Testar GFCI/disjuntores',
    'Verificar vedações de janelas e portas',
    'Limpar ralos e verificar escoamento',
    'Verificar telhas / telhado (se aplicável)',
    'Realizar dedetização preventiva',
    'Registrar serviços realizados e materiais usados',
  ],
  MAINTENANCE_CORRECTIVE: [
    'Diagnosticar e descrever o problema',
    'Fotografar o defeito antes do reparo',
    'Verificar materiais disponíveis / adquirir insumos',
    'Executar o reparo',
    'Testar a solução aplicada',
    'Fotografar após o reparo',
    'Registrar serviço, data, custo e garantia',
    'Comunicar conclusão ao admin',
  ],
}

/**
 * Notas padrão por tipo de task.
 */
export const DEFAULT_NOTES: Record<TaskType, string> = {
  CHECK_IN:
    'Chegue com 15 min de antecedência. Confirme pelo app ao concluir cada item.',
  CHECK_OUT:
    'Documente qualquer dano com fotos antes de acionar a limpeza.',
  CLEANING:
    'Use os produtos de limpeza do kit padrão. Reponha o estoque após o serviço.',
  INSPECTION:
    'Inspeção preventiva periódica. Encaminhe qualquer item crítico como manutenção corretiva.',
  MAINTENANCE_PREVENTIVE:
    'Manutenção preventiva agendada. Registre todos os materiais usados.',
  MAINTENANCE_CORRECTIVE:
    'Informe estimativa de custo ao admin antes de adquirir materiais acima de R$ 100.',
}
