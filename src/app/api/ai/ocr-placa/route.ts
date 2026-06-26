import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Tesseract from 'tesseract.js'

// Regex para placas brasileiras: antigas (ABC-1234) e Mercosul (ABC1D23)
const PLACA_REGEX = /\b([A-Z]{3}[\s-]?(?:[0-9][A-Z][0-9]{2}|[0-9]{4}))\b/

function normalizarPlaca(raw: string): string | null {
  const limpo = raw.toUpperCase().replace(/[\s\-\.]/g, '')
  const match = limpo.match(/([A-Z]{3})([0-9][A-Z][0-9]{2}|[0-9]{4})/)
  return match ? `${match[1]}${match[2]}` : null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { imageBase64 } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 })

  try {
    const buffer = Buffer.from(imageBase64, 'base64')

    const result = await Tesseract.recognize(buffer, 'por', {
      // Limita caracteres válidos para placas
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      tessedit_pageseg_mode: '6', // Bloco uniforme de texto
    } as any)

    const textoOcr = result.data.text.replace(/\n/g, ' ').toUpperCase()

    // Tenta extrair placa com regex
    const match = textoOcr.match(PLACA_REGEX)
    const placaRaw = match ? match[1] : textoOcr.replace(/\s/g, '').substring(0, 8)
    const placa = normalizarPlaca(placaRaw)

    const confidence = result.data.confidence

    return NextResponse.json({
      placa,
      confianca: confidence > 80 ? 'alta' : confidence > 55 ? 'media' : 'baixa',
      formato: placa?.length === 7
        ? (/[A-Z]{3}[0-9][A-Z][0-9]{2}/.test(placa) ? 'mercosul' : 'antigo')
        : null,
      textoOcr,
    })
  } catch (err) {
    console.error('OCR erro:', err)
    return NextResponse.json({ placa: null, confianca: 'baixa', formato: null })
  }
}
