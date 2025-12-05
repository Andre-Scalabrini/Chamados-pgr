-- Schema do Banco de Dados SQLite para Sistema de Chamados T.I

-- Tabela de Usuários (Técnicos e Admins)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    role TEXT DEFAULT 'tecnico' CHECK(role IN ('admin', 'tecnico')),
    ativo INTEGER DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    emoji TEXT,
    descricao TEXT,
    ordem INTEGER DEFAULT 0
);

-- Tabela de Subcategorias
CREATE TABLE IF NOT EXISTS subcategorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    palavras_chave_urgencia TEXT,
    urgencia_padrao TEXT DEFAULT 'MEDIA' CHECK(urgencia_padrao IN ('CRITICA', 'ALTA', 'MEDIA', 'BAIXA')),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabela de Chamados
CREATE TABLE IF NOT EXISTS chamados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    telefone_usuario TEXT NOT NULL,
    nome_usuario TEXT,
    categoria TEXT NOT NULL,
    subcategoria TEXT NOT NULL,
    sistema TEXT,
    descricao TEXT,
    urgencia TEXT DEFAULT 'MEDIA' CHECK(urgencia IN ('CRITICA', 'ALTA', 'MEDIA', 'BAIXA')),
    status TEXT DEFAULT 'ABERTO' CHECK(status IN ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO')),
    atribuido_a INTEGER,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolvido_em DATETIME,
    FOREIGN KEY (atribuido_a) REFERENCES usuarios(id)
);

-- Tabela de Notas (Histórico do Chamado)
CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chamado_id INTEGER NOT NULL,
    usuario_id INTEGER,
    conteudo TEXT NOT NULL,
    tipo TEXT DEFAULT 'NOTA' CHECK(tipo IN ('NOTA', 'STATUS', 'ATRIBUICAO')),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chamado_id) REFERENCES chamados(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de Sessões do WhatsApp (Estado da Conversa)
CREATE TABLE IF NOT EXISTS sessoes_whatsapp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telefone TEXT UNIQUE NOT NULL,
    passo_atual TEXT DEFAULT 'MENU_INICIAL',
    categoria_selecionada INTEGER,
    subcategoria_selecionada INTEGER,
    sistema_informado TEXT,
    dados_temporarios TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_chamados_status ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_urgencia ON chamados(urgencia);
CREATE INDEX IF NOT EXISTS idx_chamados_categoria ON chamados(categoria);
CREATE INDEX IF NOT EXISTS idx_chamados_telefone ON chamados(telefone_usuario);
CREATE INDEX IF NOT EXISTS idx_chamados_criado_em ON chamados(criado_em);
CREATE INDEX IF NOT EXISTS idx_notas_chamado ON notas(chamado_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_telefone ON sessoes_whatsapp(telefone);

-- Inserir categorias padrão
INSERT OR IGNORE INTO categorias (id, nome, emoji, descricao, ordem) VALUES
(1, 'Computador / Notebook', '🖥️', 'Problemas com computadores e notebooks', 1),
(2, 'Rede / Internet', '🌐', 'Problemas de conectividade e rede', 2),
(3, 'Impressoras', '🖨️', 'Problemas com impressoras e etiquetas', 3),
(4, 'Acessos e Usuários', '🔐', 'Reset de senha, permissões e contas', 4),
(5, 'Sistemas', '💻', 'Problemas com sistemas - OBRIGATÓRIO INFORMAR SISTEMA', 5),
(6, 'E-mail', '📧', 'Problemas com e-mail', 6),
(7, 'Equipamentos (Periféricos)', '🧰', 'Teclado, mouse, monitor e outros', 7),
(8, 'Telefonia / Ramal', '☎️', 'Problemas com telefone e PABX', 8),
(9, 'Pastas, Servidores e Permissões', '📁', 'Acesso a pastas e servidores', 9),
(10, 'Solicitações Gerais', '🛠️', 'Instalação, formatação e backup', 10),
(11, 'Outros', '❓', 'Outros problemas e dúvidas', 11);

-- Inserir subcategorias
-- Categoria 1: Computador / Notebook
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(1, 'Computador lento', 'MEDIA'),
(1, 'Computador travando', 'ALTA'),
(1, 'Tela azul (BSOD)', 'CRITICA'),
(1, 'Computador não liga', 'CRITICA'),
(1, 'Computador liga, mas não inicia o Windows', 'ALTA'),
(1, 'Falha no HD/SSD', 'ALTA'),
(1, 'Sem som', 'BAIXA'),
(1, 'USB não reconhece', 'MEDIA'),
(1, 'Sem vídeo no monitor', 'ALTA'),
(1, 'Superaquecimento', 'ALTA');

-- Categoria 2: Rede / Internet
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(2, 'Sem internet', 'CRITICA'),
(2, 'Internet lenta', 'ALTA'),
(2, 'Wi-Fi instável', 'MEDIA'),
(2, 'Wi-Fi não conecta', 'ALTA'),
(2, 'Sem acesso ao servidor', 'ALTA'),
(2, 'Queda de conexão frequente', 'ALTA');

-- Categoria 3: Impressoras
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(3, 'Impressora não imprime', 'ALTA'),
(3, 'Impressora offline', 'MEDIA'),
(3, 'Impressão com falhas', 'MEDIA'),
(3, 'Impressora de etiquetas não imprime', 'ALTA'),
(3, 'Etiqueta fora do padrão', 'MEDIA'),
(3, 'Erro de spooler de impressão', 'MEDIA');

-- Categoria 4: Acessos e Usuários
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(4, 'Reset de senha', 'MEDIA'),
(4, 'Criação de usuário', 'BAIXA'),
(4, 'Alteração de permissões', 'MEDIA'),
(4, 'Conta bloqueada', 'ALTA'),
(4, 'Usuário desativado', 'MEDIA'),
(4, 'Erro de login', 'ALTA');

-- Categoria 5: Sistemas
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(5, 'Sistema não abre', 'CRITICA'),
(5, 'Erro ao acessar o sistema', 'ALTA'),
(5, 'Sistema lento', 'MEDIA'),
(5, 'Erro em cadastro', 'ALTA'),
(5, 'Erro em relatório', 'MEDIA'),
(5, 'Erro em integração', 'ALTA'),
(5, 'Solicitação de acesso ao sistema', 'BAIXA'),
(5, 'Solicitação de permissão no sistema', 'BAIXA'),
(5, 'Sistema fora do ar', 'CRITICA'),
(5, 'Atualização de sistema', 'BAIXA'),
(5, 'Problema após atualização', 'ALTA');

-- Categoria 6: E-mail
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(6, 'Não recebe e-mails', 'ALTA'),
(6, 'Não envia e-mails', 'ALTA'),
(6, 'Caixa de e-mail cheia', 'MEDIA'),
(6, 'Configuração de e-mail', 'MEDIA'),
(6, 'E-mail suspeito / possível vírus', 'ALTA'),
(6, 'Solicitação de criação de e-mail', 'BAIXA');

-- Categoria 7: Equipamentos (Periféricos)
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(7, 'Teclado não funciona', 'ALTA'),
(7, 'Mouse não funciona', 'ALTA'),
(7, 'Monitor sem imagem', 'ALTA'),
(7, 'Câmera não funciona', 'MEDIA'),
(7, 'Microfone não funciona', 'MEDIA'),
(7, 'Leitor de código de barras com falha', 'ALTA');

-- Categoria 8: Telefonia / Ramal
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(8, 'Telefone sem linha', 'ALTA'),
(8, 'Telefone mudo', 'ALTA'),
(8, 'Alteração de ramal', 'BAIXA'),
(8, 'Novo ramal', 'BAIXA'),
(8, 'Problema no PABX', 'CRITICA');

-- Categoria 9: Pastas, Servidores e Permissões
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(9, 'Sem acesso à pasta de rede', 'ALTA'),
(9, 'Permissão negada', 'MEDIA'),
(9, 'Pasta sumiu', 'ALTA'),
(9, 'Arquivo corrompido', 'MEDIA'),
(9, 'Lentidão no servidor de arquivos', 'MEDIA');

-- Categoria 10: Solicitações Gerais
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(10, 'Instalação de software', 'BAIXA'),
(10, 'Atualização de software', 'BAIXA'),
(10, 'Troca de equipamento', 'MEDIA'),
(10, 'Novo equipamento', 'BAIXA'),
(10, 'Formatação de computador', 'MEDIA'),
(10, 'Backup de arquivos', 'MEDIA'),
(10, 'Restauração de backup', 'ALTA');

-- Categoria 11: Outros
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao) VALUES
(11, 'Outro problema não listado', 'MEDIA'),
(11, 'Dúvida técnica', 'BAIXA'),
(11, 'Solicitação especial', 'BAIXA');

-- Inserir usuário admin padrão (senha: admin123)
INSERT OR IGNORE INTO usuarios (id, nome, email, senha, role) VALUES
(1, 'Administrador', 'admin@empresa.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
