import { db } from '../src/db'
import { planos, lojas, usuarios } from '../src/db/schema'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Iniciando seed...')

  // Planos
  const [planBasico, planPro, planPremium] = await db.insert(planos).values([
    {
      nome: 'Básico',
      tipo: 'basico',
      descricao: 'Ideal para quem está começando',
      preco: '99.90',
      limiteAgendamentosMes: 100,
      limiteOperadores: 2,
      permiteRelatorios: false,
      permiteWhatsapp: false,
      permiteIA: false,
    },
    {
      nome: 'Profissional',
      tipo: 'profissional',
      descricao: 'Para estéticas em crescimento',
      preco: '197.90',
      limiteAgendamentosMes: 500,
      limiteOperadores: 5,
      permiteRelatorios: true,
      permiteWhatsapp: true,
      permiteIA: false,
    },
    {
      nome: 'Premium',
      tipo: 'premium',
      descricao: 'Tudo incluso para grandes operações',
      preco: '397.90',
      limiteAgendamentosMes: 9999,
      limiteOperadores: 20,
      permiteRelatorios: true,
      permiteWhatsapp: true,
      permiteIA: true,
    },
  ]).returning()

  console.log('✅ Planos criados')

  // Loja demo
  const [loja] = await db.insert(lojas).values({
    nome: 'TRUXZ Demo',
    slug: 'truxz-demo',
    email: 'demo@truxz.com.br',
    telefone: '(11) 99999-9999',
    cidade: 'São Paulo',
    estado: 'SP',
    planoId: planPro.id,
    status: 'ativa',
    configuracoes: {
      horarioAbertura: '08:00',
      horarioFechamento: '18:00',
      diasFuncionamento: [1, 2, 3, 4, 5, 6],
      intervaloAgendamento: 60,
      mensagemBoasVindas: 'Bem-vindo à TRUXZ!',
      notificacaoWhatsapp: false,
    },
  }).returning()

  console.log('✅ Loja demo criada')

  // Usuário master
  const masterHash = await bcrypt.hash('Win7830@', 10)
  await db.insert(usuarios).values({
    nome: 'Administrador Master',
    email: 'master@truxz.com.br',
    senhaHash: masterHash,
    role: 'master',
    lojaId: null,
  })

  // Admin da loja demo
  const adminHash = await bcrypt.hash('Win7830@', 10)
  await db.insert(usuarios).values({
    lojaId: loja.id,
    nome: 'Admin Demo',
    email: 'admin@demo.com',
    senhaHash: adminHash,
    role: 'admin_loja',
  })

  // Operador demo
  const operadorHash = await bcrypt.hash('Win7830@', 10)
  await db.insert(usuarios).values({
    lojaId: loja.id,
    nome: 'Operador Demo',
    email: 'operador@demo.com',
    senhaHash: operadorHash,
    role: 'operador',
  })

  // Cliente demo
  const clienteHash = await bcrypt.hash('Win7830@', 10)
  await db.insert(usuarios).values({
    lojaId: loja.id,
    nome: 'Cliente Demo',
    email: 'cliente@demo.com',
    telefone: '(11) 98888-7777',
    senhaHash: clienteHash,
    role: 'cliente',
  })

  console.log('✅ Usuários criados')
  console.log('')
  console.log('═══════════════════════════════════════')
  console.log('  🚀 Seed concluído! Credenciais:')
  console.log('═══════════════════════════════════════')
  console.log('  Master:   master@truxz.com.br')
  console.log('  Admin:    admin@demo.com')
  console.log('  Operador: operador@demo.com')
  console.log('  Cliente:  cliente@demo.com')
  console.log('  Senha:    Win7830@')
  console.log('═══════════════════════════════════════')

  process.exit(0)
}

seed().catch(e => {
  console.error('❌ Erro no seed:', e)
  process.exit(1)
})
