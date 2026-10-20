# 🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN

Sistema online de controle de manutenção preventiva de lubrificantes, registro de troca de óleo e acompanhamento mensal de rodagem da frota com sincronização instantânea em tempo real entre múltiplos computadores e celulares, integração com Google Drive e interface minimalista otimizada para smartphones.

---

## 📱 Mini Cards Minimalistas com Modelo e Placa

1. **Exibição Cadastral nos Cards:**
   - No setor **Registrar Óleo de Viatura**, cada mini card exibe o **Prefixo Oficial** em destaque e, logo abaixo, o **Modelo da Viatura** e a **Placa Oficial** de forma limpa e minimalista:
     - Exemplo: `T-01100` ➔ `TRAIL BLAZER` | `FSD-4079`
     - Exemplo: `T-01103` ➔ `DUSTER` | `FUG-7E96`
     - Exemplo: `19-167` ➔ `XT-660` | `FXS-5E25`
   - O ponto indicador colorido da situação do lubrificante permanece integrado de forma discreta (*Em Dia*, *Atenção*, *Vencido* ou *Sem Alvo*).
   - O painel de destaque superior da viatura selecionada também reflete o Modelo e Placa em tempo real.

2. **Navegação Estável:**
   - Disposição flexível lado a lado com transições suaves de cor de borda, sem saltos de tela (`scrollIntoView` desativado na seleção rápida).

---

## 🥚 Easter Egg: Entrar como Administrador (5x em "Sd PM Vagner")

- No rodapé da aplicação, foi configurado o acesso oculto por **Easter Egg**:
  - Basta tocar/clicar **5 vezes seguidas** no nome **`Sd PM Vagner`**.
  - O sistema reconhece a sequência e abre a solicitação da senha mestre (`PATRULHEIRO1`).
  - Ao confirmar, o modo **`🔓 ADM Ativo`** é ativado para toda a sessão, liberando a edição de metas, especificações de óleo e exibindo os controles avançados.

---

## ⚡ Transmissão em Tempo Real Multi-Dispositivos (Firebase Realtime Stream)

1. **Atualização Instantânea Entre Computadores (~80 ms):**
   - Ao registrar quilometragem, alterar meta ou editar qualquer viatura no PC 1, a alteração é transmitida instantaneamente para o **Firebase Realtime Database**.
   - O Firebase distribui o evento imediatamente via **Stream contínuo SSE (EventSource)** para todos os outros computadores e celulares conectados.
   - A tela do outro dispositivo atualiza automaticamente em menos de 100 milissegundos, **sem precisar recarregar a página (F5)**.

2. **Configuração da Conexão em Tempo Real:**
   - Link oficial configurado: `https://controlevtr-1c1b-default-rtdb.firebaseio.com/oleo_database.json`.
   - Compatível com Vercel (arquivos serverless em `api/`), Render (`server.js`) e execução local.

---

## 🔒 Conexão e Sincronização com o Google Drive (Exclusiva para Administrador)

- A opção de conectar e sincronizar com o Google / Google Drive fica **totalmente oculta** por padrão (`display: none`).
- O botão surge no cabeçalho **exclusivamente** após o login como Administrador (`🔓 ADM Ativo`).

---

## 🛡️ Regras Operacionais e Matriz de Acesso

1. **KM Atual Livre:** Qualquer operador pode registrar o KM Atual da viatura sem necessidade de senha.
2. **Data Protegida:** Padrão de hoje; alterações de data exigem senha de Administrador.
3. **KM Alvo Fixo:** Primeiro alvo livre; alterações subsequentes exigem senha de Administrador.
4. **Filtros Inteligentes:** Checkboxes inselecionáveis se o KM Alvo não for alterado; selecionáveis apenas em nova troca de óleo.
5. **Especificação do Óleo:** Ineditável para operadores comuns; liberada para Administrador.
6. **Tela do Bilão:** Frase oficial padronizada caso a senha de administrador seja cancelada.
7. **Bloqueios Anti-Inspeção:** Atalhos de DevTools (`F12`, etc.) e clique direito desativados, mantendo menu de contexto restrito (Copiar, Colar, Recortar).
8. **Prevenção de Fechamento Acidental de Modais:** Janelas só fecham ao clicar em "Fechar", "✖" ou "💾 Salvar Novo KM".

---

## 🚀 Como Executar Localmente
```bash
npm install
npm start
```
Acesse no navegador: `http://localhost:3000`
