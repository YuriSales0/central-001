import { prisma } from './prisma'

/**
 * Retorna o ID do crew member com menos tasks PENDING/IN_PROGRESS.
 * Filtra apenas crew ativos. Lança erro se nenhum crew estiver disponível.
 */
export async function assignToLeastBusyCrew(): Promise<string> {
  const crewMembers = await prisma.user.findMany({
    where: { role: 'CREW', active: true },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          assignedTasks: {
            where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
          },
        },
      },
    },
    orderBy: {
      assignedTasks: { _count: 'asc' },
    },
  })

  if (crewMembers.length === 0) {
    throw new NoCrewAvailableError()
  }

  return crewMembers[0].id
}

export class NoCrewAvailableError extends Error {
  constructor() {
    super('Nenhum membro de crew disponível. Cadastre um crew member antes de criar reservas.')
    this.name = 'NoCrewAvailableError'
  }
}
