# 🚓 CONTROLE DE ÓLEO E AVARIAS - FROTA 1ª CIA DO 1º BPTRAN

Sistema web progressivo, autônomo e em tempo real para gerenciamento de odômetro, histórico de trocas de óleo, inspeção veicular (com fotos de referência) e registro de avarias das viaturas da 1ª Cia do 1º BPTran.

---

## 📁 Estrutura do Repositório (Pronto para GitHub e Vercel)



---

## ❓ Para que servem as Planilhas Excel (.xlsx)?

- **Origem dos Dados:** As planilhas na pasta  contêm o levantamento original da frota (prefixos, modelos, placas e quilometragens). Elas serviram como base inicial de cadastro e continuam disponíveis para consulta manual no Excel ou caso o encarregado do P4/Reserva queira importar/exportar relatórios locais.
- **Funcionamento no Vercel/Firebase:** O aplicativo web () **não precisa das planilhas para funcionar**. Ele é 100% autossuficiente e sincroniza dados diretamente com a nuvem do **Firebase Realtime Database**. Por isso, as planilhas foram organizadas dentro da pasta , mantendo a raiz limpa e padronizada para o GitHub e o Vercel.

---

## 🚀 Como Postar no GitHub

1. Extraia o conteúdo deste arquivo ZIP em uma pasta do seu computador.
2. Abra o terminal (ou Git Bash) na pasta do projeto e execute:
   Reinitialized existing Git repository in /working_dir/c_5577b297b8b9d96e/artifacts/file_generation/ttl=63d/output/.git/
3. Crie um novo repositório no seu GitHub (exemplo: ).
4. Conecte seu repositório local ao GitHub e envie os arquivos:
   

---

## ⚡ Como Publicar no Vercel (1 Clique com Deploy Contínuo)

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique no botão **"Add New..."** ➔ **"Project"**.
3. Selecione o repositório  recém-criado.
4. O Vercel detectará automaticamente as configurações através do .
5. Clique em **"Deploy"**.
6. Em menos de 30 segundos, o link de produção estará ativo (ex: ).
7. **Atualizações futuras:** Qualquer alteração enviada ao GitHub () atualizará o site no Vercel automaticamente.

---

## ☁️ Integração com o Firebase Realtime Database

O sistema já vem configurado com a URL padrão do Firebase:


### Regras do Firebase Realtime Database:
Para que todos os policiais e viaturas consigam enviar leituras e fotos instantaneamente, acesse o Console do Firebase ➔ **Realtime Database** ➔ aba **Rules (Regras)** e certifique-se de configurar:



---

## 🔐 Senha e Acesso de Administrador

- **Senha Padrão:** 
- **Funcionalidades de Administrador:**
  - Edição de KM Alvo Fixo e especificação de óleo;
  - Visualização e exclusão do histórico de avarias relatadas;
  - Adição, exclusão e reordenação das viaturas cadastradas;
  - Conexão e backup com conta Google Drive / Gmail.

---
Telemática - 1ª Cia do 1º BPTran
