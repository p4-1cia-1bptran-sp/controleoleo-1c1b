# 🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN

Sistema online de gerenciamento de troca de óleo, acompanhamento de quilometragem (KM) e controle mensal de rodagem da frota de viaturas da 1ª Companhia do 1º Batalhão de Polícia de Trânsito (1º BPTran).

Otimizado para **Vercel** (Serverless Edge de alta velocidade, sem hibernação ou erro de timeout) e 100% compatível com **Render** e execução local em **Node.js**.

---

## ⚡ Por que migrar do Render para a Vercel?

* **Fim do "Erro de Tempo" (Timeout)**: No plano gratuito do Render, os servidores entram em modo de suspensão (*spin down*) após 15 minutos sem uso. Ao reabrir a página, o Render leva de 30 a 50 segundos para inicializar. Como o sistema possui um limite de espera de 7 segundos no navegador, ocorria a mensagem de erro de tempo (*Tempo limite esgotado*).
* **Carregamento Instantâneo na Vercel**: Na Vercel, o frontend estático é distribuído pela CDN Edge mundial (carrega em milissegundos) e a API roda sob demanda via *Serverless Functions*, respondendo de forma imediata sem atrasos de inicialização.

---

## 📁 Estrutura do Projeto para Vercel e Render

```text
├── api/
│   ├── index.js      # Handler Serverless principal (CORS, leitura/gravação atômica, rotas de API)
│   ├── oleo.js       # Rota Serverless direta /api/oleo
│   ├── frota.js      # Rota Serverless direta /api/frota
│   ├── dados.js      # Rota Serverless direta /api/dados
│   └── status.js     # Health check /api/status
├── database.json     # Banco de dados inicial da frota com os prefixos cadastrados
├── index.html        # Interface completa (Dashboard, formulário, gráficos, exportações)
├── package.json      # Metadados e scripts de inicialização
├── render.yaml       # Configuração para deploy no Render
├── vercel.json       # Configuração de rotas e rewrites da Vercel
├── server.js         # Servidor HTTP nativo para execução local ou Render
└── README.md         # Documentação e instruções de implantação
```

---

## 🚀 Passo a Passo: Como Publicar na Vercel

### Opção 1: Pelo GitHub (Recomendado)

1. **Subir os arquivos para o GitHub**:
   - Descompacte o arquivo ZIP.
   - Crie um novo repositório no seu GitHub (ex: `controle-oleo-frota-1cia`).
   - Envie todos os arquivos para a branch principal (`main`).

2. **Importar na Vercel**:
   - Acesse o painel da [Vercel](https://vercel.com/) e faça login (pode usar sua conta GitHub).
   - Clique no botão **"Add New..."** e selecione **"Project"**.
   - Na lista de repositórios do GitHub, encontre o repositório `controle-oleo-frota-1cia` e clique em **"Import"**.
   - Na tela de configuração:
     - **Framework Preset**: Deixe em `Other`.
     - **Root Directory**: `./` (padrão).
     - **Build and Output Settings**: Pode deixar os padrões (não precisa alterar nada).
   - Clique em **"Deploy"**.

3. **Pronto!**
   - Em menos de 1 minuto, a Vercel gerará o link de produção (ex: `https://controle-oleo-frota-1cia.vercel.app`).
   - Ao abrir o link, o status da nuvem ficará verde (**🟢 Online**).

---

### Opção 2: Deploy Direto via Vercel CLI (Sem GitHub)

Se tiver o Node.js instalado no seu computador:
```bash
# 1. Instalar a CLI da Vercel globalmente
npm install -g vercel

# 2. Entrar na pasta do projeto
cd controle_oleo_frota_vercel

# 3. Fazer deploy em produção
vercel --prod
```
Basta confirmar as opções com `Enter` e o link será gerado imediatamente.

---

## 💻 Como Executar Localmente

```bash
# Iniciar o servidor local nativo
npm start
# ou diretamente:
node server.js
```
Abra o navegador em: `http://localhost:3000`

---

## 👮 Informações do Sistema
- **Unidade**: 1ª Cia do 1º BPTran - Polícia Militar do Estado de São Paulo
- **Desenvolvido por**: Sd Vagner - Telemática
- **Finalidade**: Controle de Óleo e Quilometragem da Frota Operacional
