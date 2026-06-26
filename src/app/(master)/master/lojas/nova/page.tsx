import { redirect } from 'next/navigation'

// Redireciona para /master/lojas — o botão "+ Nova Loja" está na página da lista
export default function NovaLojaPage() {
  redirect('/master/lojas')
}
