# Sistema de Chamados T.I via WhatsApp

Sistema completo de chamados para o setor de T.I que funciona via WhatsApp usando a biblioteca open source Whatsapp-Web.js, com categorização automática, definição de urgência e painel administrativo com dashboard de relatórios.

## 🚀 Tecnologias

- **Backend**: Node.js + Express
- **Integração WhatsApp**: Whatsapp-Web.js (Open Source)
- **Banco de Dados**: SQLite
- **Frontend Admin**: HTML5, CSS3, JavaScript
- **Dashboard**: Chart.js para gráficos

## 📋 Funcionalidades

### Bot WhatsApp
- Menu interativo com 11 categorias de problemas
- Subcategorias dinâmicas para cada categoria
- Campo obrigatório de sistema para categoria "Sistemas"
- Captura de descrição detalhada do problema
- Definição automática de urgência baseada em palavras-chave
- Notificações de atualização de status

### Painel Administrativo
- **Dashboard**: Gráficos e métricas em tempo real
- **Gestão de Chamados**: Lista, filtros, detalhes e atualização
- **Gestão de Usuários**: CRUD completo de técnicos e admins
- **Notas**: Histórico de anotações internas por chamado
- **Relatórios**: Estatísticas por categoria, urgência, técnico, etc.

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos

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
# Edite o arquivo .env com suas configurações
```

**⚠️ IMPORTANTE para Produção:**
- Defina `JWT_SECRET` com uma chave segura e única
- Defina `SESSION_SECRET` com uma chave segura e única
- Altere as credenciais do administrador padrão após o primeiro login

4. Inicie o servidor:
```bash
npm start
```

5. Acesse o painel em: http://localhost:3000/admin

### Credenciais Padrão (Apenas Desenvolvimento)
- **Email**: admin@admin.com
- **Senha**: admin123

> ⚠️ **Segurança**: Altere essas credenciais imediatamente após o primeiro login em ambiente de produção.

## 📱 Conectando o WhatsApp

1. Ao iniciar o servidor, um QR Code será exibido no terminal
2. Abra o WhatsApp no seu celular
3. Vá em Configurações → Dispositivos Conectados → Conectar Dispositivo
4. Escaneie o QR Code
5. Pronto! O bot está conectado

## 📂 Estrutura do Projeto

```
Chamados-pgr/
├── src/
│   ├── config/           # Configurações (banco, whatsapp, env)
│   ├── models/           # Modelos de dados
│   ├── routes/           # Rotas da API
│   ├── controllers/      # Controladores
│   ├── services/         # Serviços de negócio
│   ├── middleware/       # Middlewares (auth, validação)
│   ├── views/            # Páginas HTML do admin
│   ├── public/           # Assets públicos (CSS, JS)
│   └── app.js            # Configuração do Express
├── database/
│   └── schema.sql        # Schema do banco de dados
├── .env.example          # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
├── server.js             # Entry point
└── README.md
```

## 📊 Categorias de Chamados

1. 🖥️ Computador / Notebook
2. 🌐 Rede / Internet
3. 🖨️ Impressoras
4. 🔐 Acessos e Usuários
5. 💻 Sistemas (requer nome do sistema)
6. 📧 E-mail
7. 🧰 Equipamentos (Periféricos)
8. ☎️ Telefonia / Ramal
9. 📁 Pastas, Servidores e Permissões
10. 🛠️ Solicitações Gerais
11. ❓ Outros

## ⚡ Níveis de Urgência

- 🔴 **CRÍTICA**: Computador não liga, Sem internet, Sistema fora do ar
- 🟠 **ALTA**: Travamento, Internet lenta, Impressora parada
- 🟡 **MÉDIA**: Lentidão, Wi-Fi instável, Arquivo corrompido
- 🟢 **BAIXA**: Dúvidas, Solicitações gerais

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login via JWT

### Chamados
- `GET /api/chamados` - Listar chamados
- `GET /api/chamados/:id` - Detalhes do chamado
- `PUT /api/chamados/:id` - Atualizar chamado

### Outros
- `GET /api/estatisticas` - Dashboard stats
- `GET /api/categorias` - Listar categorias
- `GET /api/tecnicos` - Listar técnicos
- `GET /api/whatsapp/status` - Status da conexão

## 🔒 Segurança

- Autenticação via JWT para API
- Sessões para painel admin
- Senhas hasheadas com bcrypt
- Validação e sanitização de inputs

## 📝 Licença

MIT License

## 👥 Contribuição

Contribuições são bem-vindas! Abra uma issue ou pull request.