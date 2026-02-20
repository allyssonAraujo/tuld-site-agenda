# T.U.L.D. - Sistema de Agendamento Profissional v2.0

Sistema profissional de agendamento de eventos com controle de presença, bloqueio automático e interface moderna.

## 🚀 Características Principais

### ✅ Funcionalidades Implementadas

- **Autenticação Segura**
  - Login e Cadastro com validação robusta
  - Senhas criptografadas com bcrypt
  - Gerenciamento de sessão
  - Proteção contra acessos não autorizados

- **Dashboard Intuitivo**
  - Eventos disponíveis de forma visual
  - Agendamento rápido com um clique
  - Estatísticas em tempo real
  - Status da conta claramente exibido

- **Gestão de Agendamentos**
  - Agendar em eventos disponíveis
  - Geração automática de número de senha
  - Cancelamento com validação de prazo (24h)
  - Histórico completo de agendamentos

- **Perfil do Usuário**
  - Editar dados pessoais (nome, telefone)
  - Alterar senha com validação de força
  - Ver status de bloqueio
  - Visualizar estatísticas de presença

- **Sistema de Bloqueio Automático**
  - 3 faltas consecutivas = Bloqueio de 30 dias
  - Desbloqueio automático após período
  - Visualização clara do motivo do bloqueio
  - Prevenção de agendamentos enquanto bloqueado

- **Nomenclatura Profissional**
  - "Sair" em vez de "Deslogar"
  - Interface limpa e intuitiva
  - Mensagens de feedback claras
  - Design responsivo e moderno

## 📋 Requisitos

- Node.js >= 16.0.0
- npm ou yarn
- Navegador moderno com suporte a ES6

## 🔧 Instalação Rápida

### 1. Instalar Dependências

```bash
npm install
```

### 2. Iniciar o Servidor

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

O servidor iniciará em `http://localhost:3000`

### 3. Credenciais Padrão

Na primeira execução, o banco é criado automaticamente com um usuário admin para acesso inicial.

⚠️ **Por segurança, consulte as variáveis de ambiente/configuração local para definir as credenciais e altere a senha no primeiro login.**

## 📁 Estrutura do Projeto

```
tuld-site-nova/
├── src/
│   ├── server.js              # Servidor Express
│   ├── config/
│   │   └── database.js        # Configuração SQLite
│   ├── models/
│   │   ├── Usuario.js         # Model de Usuário
│   │   ├── Evento.js          # Model de Evento
│   │   └── Agendamento.js     # Model de Agendamento
│   ├── routes/
│   │   ├── auth.js            # Rotas de autenticação
│   │   ├── dashboard.js       # Rotas do dashboard
│   │   └── agendamento.js     # Rotas de agendamentos
│   └── middleware/
│       └── auth.js            # Middleware de autenticação
├── public/
│   ├── index.html             # Tela de Login/Cadastro
│   ├── dashboard.html         # Dashboard principal
│   ├── meus-agendamentos.html # Gerenciar agendamentos
│   ├── editar-perfil.html     # Perfil e configurações
│   ├── css/
│   │   └── style.css          # Estilos responsivos
│   └── js/
│       ├── api.js             # Funções HTTP
│       └── app.js             # Lógica principal
├── database/
│   ├── schema.sql             # Schema do banco
│   └── tuld.db               # Banco de dados SQLite (criado automaticamente)
├── package.json
├── .env
└── README.md
```

## 🎯 Fluxo de Uso

### Para Usuários Comum
1. Acessar `/index.html`
2. Fazer cadastro ou login
3. Visualizar eventos do dashboard
4. Agendar em um evento disponível
5. Gerenciar agendamentos em "Meus Agendamentos"
6. Editar perfil e alterar senha em "Perfil"
7. Sair do sistema quando terminar

### Regras de Negócio Implementadas
- ✅ Usuário pode agendar **apenas 1 vez por evento**
- ✅ Cancelamento requer **24h de antecedência**
- ✅ **3 faltas consecutivas** = bloqueio automático
- ✅ Bloqueio dura **30 dias** com desbloqueio automático
- ✅ Visualização clara do status da conta

## 🔐 Segurança

- Senhas criptografadas com bcrypt (10 rounds)
- Sessões HTTP-only e seguras
- Validação de entrada em todos os formulários
- Proteção contra SQL injection (prepared statements)
- CSRF protection via sessão
- Telefone não alterável diretamente

## 📱 Responsividade

- Totalmente responsivo para mobile
- Design adaptado para tablets
- Otimizado para desktops
- Menu colapsável em celulares

## 🛠️ Rotas da API

### Autenticação
- `POST /api/login` - Fazer login
- `POST /api/cadastro` - Registrar novo usuário
- `POST /api/alterar-senha` - Alterar senha
- `GET /api/sair` - Logout

### Perfil
- `GET /api/usuario` - Obter dados do usuário
- `POST /api/editar-perfil` - Atualizar perfil

### Dashboard
- `GET /api/dashboard/eventos` - Listar eventos disponíveis
- `GET /api/dashboard/meus-agendamentos` - Agendamentos do usuário
- `GET /api/dashboard/stats` - Estatísticas

### Agendamentos
- `POST /api/agendamento/criar` - Agendar em evento
- `POST /api/agendamento/cancelar` - Cancelar agendamento
- `GET /api/agendamento/:id` - Detalhes do agendamento

## 🚀 Deploy

### Heroku
```bash
heroku create seu-app-name
heroku config:set SESSION_SECRET=seu-secret-seguro
git push heroku main
```

### DigitalOcean / AWS / Azure
Altere em `.env`:
```
NODE_ENV=production
SESSION_SECRET=seu-secret-aleatorio-seguro
PORT=seu-puerto
```

## 📖 Documentação

Para mais informações sobre a API, consulte a documentação gerada automaticamente ou entre em contato com o suporte.

## 📄 Licença

ISC

## 👥 Autor

T.U.L.D. - Sistema Profissional de Agendamentos

---

**Versão:** 2.0.0  
**Última Atualização:** Fevereiro 2026
