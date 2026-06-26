import { db } from '../src/db'
import { conquistas } from '../src/db/schema'
import { sql } from 'drizzle-orm'

const CONQUISTAS = [
  {
    codigo: 'primeira_os',
    nome: 'Primeiros Passos',
    descricao: 'Concluiu sua primeira Ordem de Serviço',
    icone: 'star',
    cor: '#F59E0B',
    pontosRecompensa: 100,
  },
  {
    codigo: 'os_10',
    nome: 'Mão na Massa',
    descricao: 'Concluiu 10 Ordens de Serviço',
    icone: 'wrench',
    cor: '#9D4EDD',
    pontosRecompensa: 200,
  },
  {
    codigo: 'os_50',
    nome: 'Veterano',
    descricao: 'Concluiu 50 Ordens de Serviço',
    icone: 'shield',
    cor: '#3B82F6',
    pontosRecompensa: 500,
  },
  {
    codigo: 'os_100',
    nome: 'Mestre da Oficina',
    descricao: 'Concluiu 100 Ordens de Serviço',
    icone: 'trophy',
    cor: '#F59E0B',
    pontosRecompensa: 1000,
  },
  {
    codigo: 'avaliacao_5',
    nome: 'Cliente Feliz',
    descricao: 'Recebeu uma avaliação de 5 estrelas',
    icone: 'heart',
    cor: '#EF4444',
    pontosRecompensa: 150,
  },
  {
    codigo: 'streak_7',
    nome: 'Semana Perfeita',
    descricao: 'Ficou ativo por 7 dias consecutivos',
    icone: 'zap',
    cor: '#10B981',
    pontosRecompensa: 250,
  },
  {
    codigo: 'nivel_5',
    nome: 'Especialista',
    descricao: 'Atingiu o nível 5 no ranking',
    icone: 'award',
    cor: '#8B5CF6',
    pontosRecompensa: 500,
  },
  {
    codigo: 'meta_mes',
    nome: 'Meta Batida',
    descricao: 'Atingiu a meta mensal de OS concluídas',
    icone: 'target',
    cor: '#F97316',
    pontosRecompensa: 300,
  },
  {
    codigo: 'assinatura_coletada',
    nome: 'Profissional',
    descricao: 'Coletou a assinatura digital do cliente em uma OS',
    icone: 'pen-line',
    cor: '#06B6D4',
    pontosRecompensa: 75,
  },
]

async function seedConquistas() {
  console.log('🏆 Populando conquistas...')

  for (const c of CONQUISTAS) {
    await db.insert(conquistas).values(c).onConflictDoUpdate({
      target: conquistas.codigo,
      set: {
        nome: c.nome,
        descricao: c.descricao,
        icone: c.icone,
        cor: c.cor,
        pontosRecompensa: c.pontosRecompensa,
      },
    })
    console.log(`  ✅ ${c.codigo} — ${c.nome}`)
  }

  console.log(`\n✅ ${CONQUISTAS.length} conquistas inseridas/atualizadas.`)
  process.exit(0)
}

seedConquistas().catch(e => { console.error(e); process.exit(1) })
