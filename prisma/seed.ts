import { PrismaClient } from '@prisma/client'
import { addDays, addHours } from 'date-fns'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const hash = (pwd: string) => bcrypt.hash(pwd, 12)

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@central.app' },
    update: { passwordHash: await hash('admin123') },
    create: {
      id: 'admin-001',
      email: 'admin@central.app',
      name: 'Admin Sistema',
      role: 'ADMIN',
      passwordHash: await hash('admin123'),
    },
  })

  // Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@central.app' },
    update: { passwordHash: await hash('manager123') },
    create: {
      id: 'demo-manager-id',
      email: 'manager@central.app',
      name: 'João Manager',
      role: 'MANAGER',
      passwordHash: await hash('manager123'),
    },
  })

  // Crew members
  const crew1 = await prisma.user.upsert({
    where: { email: 'crew1@central.app' },
    update: {},
    create: {
      id: 'demo-crew-id',
      email: 'crew1@central.app',
      name: 'Ana Lima',
      role: 'CREW',
      managerId: manager.id,
      passwordHash: await hash('crew123'),
    },
  })

  const crew2 = await prisma.user.upsert({
    where: { email: 'crew2@central.app' },
    update: { passwordHash: await hash('crew123') },
    create: {
      id: 'crew-002',
      email: 'crew2@central.app',
      name: 'Carlos Santos',
      role: 'CREW',
      managerId: manager.id,
      passwordHash: await hash('crew123'),
    },
  })

  // Propriedades
  const prop1 = await prisma.property.upsert({
    where: { id: 'prop-001' },
    update: {},
    create: {
      id: 'prop-001',
      name: 'Apartamento Beira-Mar',
      address: 'Av. Beira Mar, 1200 — Florianópolis, SC',
      city: 'Florianópolis',
      country: 'BR',
      planType: 'PREMIUM',
      billingType: 'ANNUAL',
      status: 'ACTIVE',
      planStartDate: new Date('2024-01-01'),
      managerId: manager.id,
    },
  })

  const prop2 = await prisma.property.upsert({
    where: { id: 'prop-002' },
    update: {},
    create: {
      id: 'prop-002',
      name: 'Casa da Montanha',
      address: 'Estrada Geral, km 12 — Urubici, SC',
      city: 'Urubici',
      country: 'BR',
      planType: 'MID',
      billingType: 'MONTHLY',
      status: 'ACTIVE',
      planStartDate: new Date('2024-03-01'),
      managerId: manager.id,
    },
  })

  const now = new Date()

  // Reserva demo
  const reservation = await prisma.reservation.create({
    data: {
      id: 'res-001',
      propertyId: prop1.id,
      guestName: 'Maria Oliveira',
      guestEmail: 'maria@email.com',
      guestPhone: '+55 48 99999-0000',
      checkInDate: addDays(now, 3),
      checkOutDate: addDays(now, 7),
      externalId: 'airbnb-abc123',
    },
  }).catch(() => null)  // Ignora se já existe

  if (reservation) {
    // CHECK_IN task
    await prisma.task.create({
      data: {
        title: 'Check-in — Maria Oliveira',
        type: 'CHECK_IN',
        dueDate: addDays(now, 3),
        propertyId: prop1.id,
        reservationId: reservation.id,
        assigneeId: crew1.id,
        notes: 'Chegue com 15 min de antecedência. Confirme pelo app ao concluir cada item.',
        checklistItems: {
          create: [
            { text: 'Verificar chaves / acesso', order: 0 },
            { text: 'Receber hóspede no local', order: 1 },
            { text: 'Apresentar a propriedade e ambientes', order: 2 },
            { text: 'Demonstrar uso dos equipamentos', order: 3 },
            { text: 'Confirmar todos os equipamentos funcionando', order: 4 },
            { text: 'Informar regras da casa', order: 5 },
            { text: 'Passar dados de wi-fi e senhas', order: 6 },
            { text: 'Informar contato de emergência', order: 7 },
          ],
        },
      },
    })

    // CHECK_OUT task
    await prisma.task.create({
      data: {
        title: 'Check-out — Maria Oliveira',
        type: 'CHECK_OUT',
        dueDate: addDays(now, 7),
        propertyId: prop1.id,
        reservationId: reservation.id,
        assigneeId: crew2.id,
        notes: 'Documente qualquer dano com fotos antes de acionar a limpeza.',
        checklistItems: {
          create: [
            { text: 'Receber chaves / confirmar acesso encerrado', order: 0 },
            { text: 'Vistoria geral: sala, quartos, banheiros, cozinha', order: 1 },
            { text: 'Verificar danos ou avarias — fotografar se houver', order: 2 },
            { text: 'Verificar itens do inventário', order: 3 },
            { text: 'Recolher itens esquecidos pelo hóspede', order: 4 },
            { text: 'Registrar estado final com fotos', order: 5 },
            { text: 'Fechar janelas, portas e portões', order: 6 },
            { text: 'Acionar limpeza pós-checkout', order: 7 },
          ],
        },
      },
    })

    // Limpeza pós-checkout
    await prisma.task.create({
      data: {
        title: 'Limpeza pós-checkout — Maria Oliveira',
        type: 'CLEANING',
        dueDate: addHours(addDays(now, 7), 2),
        propertyId: prop1.id,
        reservationId: reservation.id,
        assigneeId: crew1.id,
        notes: 'Use os produtos de limpeza do kit padrão. Reponha o estoque após o serviço.',
        checklistItems: {
          create: [
            { text: 'Limpar e desinfetar banheiros', order: 0 },
            { text: 'Limpar cozinha e eletrodomésticos', order: 1 },
            { text: 'Aspirar e passar pano nos pisos', order: 2 },
            { text: 'Trocar roupas de cama em todos os quartos', order: 3 },
            { text: 'Trocar toalhas de banho e rosto', order: 4 },
            { text: 'Verificar e repor itens de higiene', order: 5 },
            { text: 'Remover lixo de todos os ambientes', order: 6 },
          ],
        },
      },
    })
  }

  // Task de inspeção no próximo mês
  await prisma.task.create({
    data: {
      title: `Inspeção geral — ${prop1.name}`,
      type: 'INSPECTION',
      dueDate: addDays(now, 30),
      propertyId: prop1.id,
      assigneeId: crew2.id,
      notes: 'Inspeção preventiva periódica. Encaminhe qualquer item crítico como manutenção corretiva.',
      checklistItems: {
        create: [
          { text: 'Verificar instalações elétricas', order: 0 },
          { text: 'Verificar instalações hidráulicas', order: 1 },
          { text: 'Testar alarmes de fumaça e CO', order: 2 },
          { text: 'Verificar extintor de incêndio', order: 3 },
          { text: 'Verificar estado estrutural', order: 4 },
          { text: 'Verificar sistemas de climatização', order: 5 },
          { text: 'Documentar anomalias com fotos', order: 6 },
        ],
      },
    },
  })

  // Task de manutenção corretiva em aberto
  await prisma.task.create({
    data: {
      title: 'Reparo — torneira cozinha com vazamento',
      type: 'MAINTENANCE_CORRECTIVE',
      dueDate: addDays(now, 1),
      propertyId: prop2.id,
      assigneeId: crew1.id,
      status: 'IN_PROGRESS',
      notes: 'Informe estimativa de custo ao admin antes de adquirir materiais acima de R$ 100.',
      checklistItems: {
        create: [
          { text: 'Diagnosticar e descrever o problema', order: 0, completed: true },
          { text: 'Fotografar o defeito antes do reparo', order: 1, completed: true },
          { text: 'Verificar materiais disponíveis / adquirir insumos', order: 2 },
          { text: 'Executar o reparo', order: 3 },
          { text: 'Testar a solução aplicada', order: 4 },
          { text: 'Registrar serviço, data, custo e garantia', order: 5 },
          { text: 'Comunicar conclusão ao admin', order: 6 },
        ],
      },
    },
  })

  // Leads de demo
  const leadsData = [
    { id: 'lead-001', name: 'Pedro Alves', email: 'pedro@email.com', phone: '+55 48 99111-2222', source: 'AIRBNB', status: 'NEW', managerId: manager.id, propertyInterest: 'Apartamento Beira-Mar' },
    { id: 'lead-002', name: 'Sofia Rocha', email: 'sofia@email.com', phone: '+55 11 98222-3333', source: 'INSTAGRAM', status: 'CONTACTED', managerId: manager.id, propertyInterest: 'Casa da Montanha' },
    { id: 'lead-003', name: 'Tomás Ferreira', source: 'WHATSAPP', status: 'QUALIFIED', managerId: manager.id, notes: 'Interessado em contrato anual' },
  ]
  for (const lead of leadsData) {
    await prisma.lead.upsert({ where: { id: lead.id }, update: {}, create: lead })
  }

  console.log('✅ Seed concluído!')
  console.log(`   Admin:   ${admin.email}  / admin123`)
  console.log(`   Manager: ${manager.email} / manager123`)
  console.log(`   Crew:    crew1@central.app / crew123`)
  console.log(`   Propriedades: ${prop1.name}, ${prop2.name}`)
  console.log(`   Leads: 3 criados`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
