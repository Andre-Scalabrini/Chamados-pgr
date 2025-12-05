# Sistema de Chamados T.I via WhatsApp

Sistema completo de abertura e gerenciamento de chamados para o setor de T.I, com integração via WhatsApp (Twilio) e painel administrativo com dashboard de relatórios.

## 🚀 Funcionalidades

### Bot WhatsApp
- ✅ Menu interativo com 11 categorias de problemas
- ✅ Subcategorias dinâmicas para cada categoria
- ✅ Campo obrigatório de sistema para categoria "Sistemas"
- ✅ Captura de descrição do problema
- ✅ Definição automática de urgência baseada em palavras-chave
- ✅ Consulta de status dos chamados abertos

### Painel Administrativo
- ✅ Autenticação com sessão segura
- ✅ Dashboard com estatísticas e gráficos
- ✅ Lista de chamados com filtros
- ✅ Gerenciamento de status dos chamados
- ✅ Atribuição a técnicos
- ✅ Sistema de notas/histórico
- ✅ Gestão de usuários (admin)

### Categorias Disponíveis
1. 🖥️ Computador / Notebook
2. 🌐 Rede / Internet
3. 🖨️ Impressoras
4. 🔐 Acessos e Usuários
5. 💻 Sistemas (requer informar sistema)
6. 📧 E-mail
7. 🧰 Equipamentos (Periféricos)
8. ☎️ Telefonia / Ramal
9. 📁 Pastas, Servidores e Permissões
10. 🛠️ Solicitações Gerais
11. ❓ Outros

## 📋 Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Conta Twilio (para integração WhatsApp)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Andre-Scalabrini/Chamados-pgr.git
cd Chamados-pgr
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas configurações:
```env
PORT=3000
NODE_ENV=development

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Segurança
JWT_SECRET=sua_chave_secreta_jwt
SESSION_SECRET=sua_chave_secreta_sessao

# Banco de dados
DATABASE_PATH=./database/chamados.db
```

5. Inicie o servidor:
```bash
npm start
```

6. Acesse o painel em: http://localhost:3000/admin

## 🔐 Credenciais Padrão

- **Email:** admin@empresa.com
- **Senha:** admin123

> ⚠️ Altere a senha padrão após o primeiro acesso!

## 📁 Estrutura do Projeto

```
Chamados-pgr/
├── src/
│   ├── config/          # Configurações (database, twilio, env)
│   ├── models/          # Modelos de dados
│   ├── routes/          # Rotas Express
│   ├── controllers/     # Controladores
│   ├── services/        # Serviços de negócio
│   ├── middleware/      # Middlewares (auth, validation)
│   ├── views/           # Templates HTML
│   ├── public/          # Assets estáticos (CSS, JS)
│   └── app.js           # Configuração do Express
├── database/
│   └── schema.sql       # Schema do banco de dados
├── .env.example         # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
├── server.js            # Ponto de entrada
└── README.md
```

## 🔌 API Endpoints

### Autenticação
- `POST /admin/login` - Login
- `GET /admin/logout` - Logout
- `GET /admin/me` - Usuário logado

### Chamados
- `GET /api/chamados` - Listar chamados (com filtros)
- `GET /api/chamados/:id` - Detalhes do chamado
- `PATCH /api/chamados/:id/status` - Atualizar status
- `PATCH /api/chamados/:id/atribuir` - Atribuir técnico
- `POST /api/chamados/:id/notas` - Adicionar nota

### Dashboard
- `GET /api/dashboard/estatisticas` - Estatísticas gerais

### Usuários
- `GET /api/usuarios` - Listar usuários (admin)
- `POST /api/usuarios` - Criar usuário (admin)
- `PUT /api/usuarios/:id` - Atualizar usuário (admin)
- `DELETE /api/usuarios/:id` - Desativar usuário (admin)

### WhatsApp
- `POST /webhook/whatsapp` - Webhook Twilio
- `POST /api/whatsapp/simular` - Simular mensagem (testes)

## 🎯 Níveis de Urgência

| Urgência | Exemplos de Problemas |
|----------|----------------------|
| 🔴 CRÍTICA | Computador não liga, Sem internet, Sistema fora do ar |
| 🟠 ALTA | Computador travando, Internet lenta, Impressora não imprime |
| 🟡 MÉDIA | Computador lento, Wi-Fi instável, Arquivo corrompido |
| 🟢 BAIXA | Dúvida técnica, Instalação de software, Novo equipamento |

## 📱 Configurando Twilio

1. Crie uma conta no [Twilio](https://www.twilio.com/)
2. Ative o WhatsApp Sandbox
3. Configure o webhook para: `https://seu-dominio.com/webhook/whatsapp`
4. Copie o Account SID e Auth Token para o `.env`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.