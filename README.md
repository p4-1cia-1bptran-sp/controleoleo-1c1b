# 🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN

Sistema de alta disponibilidade para controle de manutenção preventiva de lubrificantes, registro de troca de óleo, inspeção fotográfica de viaturas, fluxo assistido de relato de avarias e acompanhamento mensal de rodagem da frota. Conta com sincronização bidirecional em tempo real entre múltiplos computadores e smartphones via Firebase Realtime Database e servidor Node.js/Express.

---

## 📋 Fluxo Completo de Inspeção e Relato de Avarias (Passo a Passo)

O sistema segue exatamente a sequência operacional padrão:

1. **Abertura do Card da Viatura:**
   - Ao tocar no card da viatura (ou no botão `⏱️ KM`), abre-se a janela **"Atualizar Odômetro (KM)"**.
   - Na janela, há o botão **`🔍 Inspecionar Viatura`**.

2. **Janela de Inspeção das Fotos:**
   - Ao clicar em `🔍 Inspecionar Viatura`, a janela de fotos da viatura é exibida com as 6 posições (Dianteira, Traseira, Lateral Direita, Lateral Esquerda, Painel e Motor).
   - Qualquer policial pode visualizar qualquer foto em tela cheia tocando nela.
   - O Administrador (`PATRULHEIRO1`) pode adicionar, trocar ou excluir fotos.

3. **Fechamento da Inspeção e Pergunta de Avaria:**
   - Ao clicar no botão **`✖ Fechar`**, a janela de inspeção se fecha e surge a caixa:
     > **"Encontrou alguma avaria?"**
     > `[ Não ]`  `[ Sim ]`
   - Se clicar em **`Não`**: A caixa fecha e retorna imediatamente para a janela **"Atualizar Odômetro (KM)"** para inserir a quilometragem.
   - Se clicar em **`Sim`**: Abre a janela de texto para relatar a avaria.

4. **Janela de Texto da Avaria:**
   - Título: **"Selecione a foto que onde pode ser observado a avaria e a descreva abaixo:"**
   - Campo para descrever em detalhes a alteração observada na viatura.
   - Botão **`✉️ Enviar`**.

5. **Janela de Seleção da Foto com Ticks:**
   - Ao clicar em `Enviar`, abre-se a janela com o texto:
     > **"selecione a foto onde onde consta a alteração"**
   - Exibe a miniatura das 6 fotos com seus títulos:
     - **Dianteira**
     - **Traseira**
     - **Lateral direita**
     - **Lateral esquerda**
     - **Painel**
     - **Motor**
   - Abaixo de cada foto há o **tick de seleção** (`✔ Selecionar`).
   - O operador pode selecionar uma ou quantas fotos quiser onde a avaria pode ser observada.
   - Botão de confirmação: **`Finalizar observação`**.

6. **Aviso Imediato à Reserva de Armas:**
   - Ao clicar em `Finalizar observação`, os dados são registrados no banco e surge a janela de alerta:
     > **"informações inseridas, informe a reserva imediatamente!"**
   - Botão **`OK`**.
   - Ao clicar em **`OK`**, o aviso fecha e retorna automaticamente para a janela **"Atualizar Odômetro (KM) / Inspecionar Viatura"** para concluir o lançamento do odômetro.

---

## ⚡ Correção da Sincronização em Tempo Real (Exclusão no PC refletida no Celular)

O problema no qual uma foto apagada no PC continuava aparecendo no celular foi 100% solucionado com as seguintes medidas arquiteturais:

1. **Exclusão Atômica e Direta no Firebase REST API:**
   - Ao clicar na lixeira no PC, o sistema não envia mais o arquivo pesado com todas as fotos. Em vez disso, dispara uma requisição HTTP `DELETE` direta no nó exato (`/vehiclePhotos/{viatura}/{posição}.json`).
   - Esse comando leva menos de 50 milissegundos e apaga a foto instantaneamente na nuvem.

2. **Captura de Subcaminho no Fluxo de Tempo Real (SSE - Server-Sent Events):**
   - O ouvinte contínuo no smartphone agora monitora alterações pontuais nos subcaminhos de fotos (`/vehiclePhotos/...`).
   - Quando o Firebase emite `data: null` para aquele nó, o celular remove a foto da memória e do `localStorage` no mesmo instante, atualizando a tela sem que o policial precise recarregar o navegador.

3. **Bloqueio de Cache HTTP em Celulares (`_nocache`):**
   - Navegadores móveis (Safari no iOS e Chrome no Android) costumam reter respostas HTTP em cache de disco.
   - Todas as requisições `GET` agora contam com o parâmetro dinâmico `_nocache=${Date.now()}` e cabeçalhos `Cache-Control: no-cache, no-store, must-revalidate`, impedindo que o celular sirva fotos antigas do cache.

4. **Atualização Automática ao Abrir a Inspeção:**
   - Ao tocar em `🔍 Inspecionar Viatura`, o sistema dispara uma verificação em segundo plano na nuvem, garantindo que o policial veja o estado mais recente mesmo que tenha acabado de destrancar o aparelho.

---

## 📱 Otimizações e Correções para Dispositivos Móveis (Smartphones)

- **Áreas Seguras (Safe Area Insets):** Margens inferiores de até 60px (`env(safe-area-inset-bottom)`) para garantir que os botões de ação nunca fiquem escondidos atrás da barra inicial do iPhone ou barra de navegação do Android.
- **Prevenção de Zoom Automático:** Fontes de inputs ajustadas para 16px para impedir que o Safari do iOS dê zoom indesejado ao tocar nos campos.
- **Alvos de Toque Ergonômicos:** Botões com altura mínima de 44px e caixas de seleção ampliadas para toque confortável com o polegar.
- **Visualizador em Tela Cheia Aprimorado:** O modal de fotos agora possui barra flutuante superior com botões de rotação 90°, preenchimento e botão de fechar proeminente. Ao deitar o celular, a foto se expande para 100% da tela.

---

## 📦 Conteúdo do Pacote do Projeto

- **`index.html`**: Aplicação web completa e autônoma com o novo fluxo de avarias, sincronização em tempo real e interface responsiva.
- **`index_backup.html`**: Cópia de segurança preservada sem os modais de avaria.
- **`CONTROLE_DE_OLEO_1CIA_1BPTRAN_OFICIAL.xlsx`**: Planilha oficial formatada da frota do 1º BPTran.
- **`PLANILHA_CONTROLE_OLEO_FROTA_1CIA_1BPTRAN.xlsx`**: Planilha complementar de controle.
- **`server.js`**: Servidor Node.js backend com suporte nativo a rotas `DELETE /api/oleo/photos/...`.
- **`package.json`**, **`vercel.json`**, **`render.yaml`**: Configurações prontas para deploy local ou em nuvem.
- **Pasta `api/`**: Módulos serverless para nuvem (`index.js`, `oleo.js`, `dados.js`, `database.js`, `frota.js`, `status.js`).
- **`database.json`**: Base de dados inicial da frota.
- **`fleet-manager.js`**: Utilitário auxiliar de gerenciamento.
- **`INSTRUCOES_GOOGLE_DRIVE.md`** e **`README.md`**: Documentações e guias de instalação.
