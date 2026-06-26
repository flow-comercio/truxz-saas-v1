---
name: deploy
description: Build completo + cópia obrigatória de assets estáticos + restart PM2 para produção TRUXZ. Usar sempre que qualquer arquivo for alterado.
disable-model-invocation: true
---

Execute o deploy completo do TRUXZ na ordem EXATA abaixo. Não pule nenhum passo.

```bash
cd /var/www/truxz

# 1. Build
npm run build

# 2. Copiar assets estáticos (OBRIGATÓRIO - sem isso CSS/imagens quebram em produção)
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# 3. Reiniciar PM2
pm2 restart truxz --update-env

# 4. Aguardar e confirmar
sleep 3 && pm2 status
```

Se o build falhar: reporte o erro completo e NÃO continue para os passos seguintes.
Se o PM2 mostrar status diferente de `online`: reporte imediatamente.

Após sucesso, confirme com: "Deploy concluído. Ambas instâncias PM2 online."
