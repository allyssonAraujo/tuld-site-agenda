-- ============================================
-- SCHEMA DO BANCO DE DADOS - T.U.L.D.
-- Sistema de Agendamento Profissional
-- ============================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    senha VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo',
    bloqueado_ate DATETIME NULL,
    faltas_consecutivas INTEGER DEFAULT 0,
    total_faltas INTEGER DEFAULT 0,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso DATETIME,
    CONSTRAINT chk_status CHECK (status IN ('ativo', 'bloqueado', 'suspenso'))
);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_evento DATE NOT NULL,
    hora_evento TIME NOT NULL,
    vagas_totais INTEGER DEFAULT 50,
    vagas_disponiveis INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'ativo',
    abertura_portao TIME DEFAULT '19:20:00',
    local VARCHAR(200),
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_evento_status CHECK (status IN ('ativo', 'inativo', 'cancelado', 'finalizado'))
);

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    evento_id INTEGER NOT NULL,
    numero_senha INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmado',
    confirmacao_presenca VARCHAR(20) DEFAULT 'pendente',
    data_agendamento DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_cancelamento DATETIME NULL,
    data_presenca DATETIME NULL,
    observacoes TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT chk_agend_status CHECK (status IN ('confirmado', 'cancelado', 'presente', 'ausente')),
    CONSTRAINT chk_presenca CHECK (confirmacao_presenca IN ('pendente', 'confirmado', 'ausente')),
    UNIQUE(usuario_id, evento_id)
);

-- Tabela de Histórico
CREATE TABLE IF NOT EXISTS historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario ON agendamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_evento ON agendamentos(evento_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_historico_usuario ON historico(usuario_id);

-- Inserir usuário admin padrão (email: admin@tuld.com, senha: Admin@123)
INSERT OR IGNORE INTO usuarios (id, nome, email, telefone, senha, status)
VALUES (1, 'Administrador', 'admin@tuld.com', '11999999999', 
    '$2a$10$DVV7aCD0DLuMfsqA.7VJveLuAeS6lPrw.TsqKDqP6/W3D4vKXv7Oy', 'ativo');

-- Inserir eventos de exemplo
INSERT OR IGNORE INTO eventos (id, titulo, descricao, data_evento, hora_evento, vagas_totais, vagas_disponiveis, local)
VALUES 
(1, 'Palestra de Tecnologia', 'Palestra sobre tendências em tecnologia 2026', DATE('now', '+7 days'), '19:30:00', 50, 50, 'Auditório Principal'),
(2, 'Workshop NodeJS', 'Workshop prático sobre desenvolvimento com Node.js', DATE('now', '+14 days'), '18:00:00', 30, 30, 'Sala de Treinamento'),
(3, 'Networking Profissional', 'Encontro para networking entre profissionais', DATE('now', '+21 days'), '20:00:00', 100, 100, 'Salão de Eventos'),
(4, 'Certificação JavaScript', 'Preparação para certificação em JavaScript', DATE('now', '+5 days'), '19:00:00', 25, 25, 'Sala 1');
