-- Schema do banco de dados para o Sistema de Chamados T.I
-- Usando SQLite

-- Tabela de usuários (técnicos e administradores)
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

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    emoji TEXT,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1
);

-- Tabela de subcategorias
CREATE TABLE IF NOT EXISTS subcategorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    palavras_chave_urgencia TEXT,
    urgencia_padrao TEXT DEFAULT 'media' CHECK(urgencia_padrao IN ('critica', 'alta', 'media', 'baixa')),
    ativo INTEGER DEFAULT 1,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

-- Tabela de chamados
CREATE TABLE IF NOT EXISTS chamados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    telefone_usuario TEXT NOT NULL,
    nome_usuario TEXT,
    categoria TEXT NOT NULL,
    subcategoria TEXT NOT NULL,
    sistema TEXT,
    descricao TEXT,
    urgencia TEXT DEFAULT 'media' CHECK(urgencia IN ('critica', 'alta', 'media', 'baixa')),
    status TEXT DEFAULT 'aberto' CHECK(status IN ('aberto', 'em_andamento', 'resolvido', 'fechado')),
    atribuido_a INTEGER,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolvido_em DATETIME,
    FOREIGN KEY (atribuido_a) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabela de notas/comentários dos chamados
CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chamado_id INTEGER NOT NULL,
    usuario_id INTEGER,
    conteudo TEXT NOT NULL,
    tipo TEXT DEFAULT 'interna' CHECK(tipo IN ('interna', 'publica')),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabela de sessões do WhatsApp (para gerenciar o fluxo de conversação)
CREATE TABLE IF NOT EXISTS sessoes_whatsapp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telefone TEXT UNIQUE NOT NULL,
    categoria_selecionada INTEGER,
    subcategoria_selecionada INTEGER,
    passo_atual TEXT DEFAULT 'inicio',
    dados_temporarios TEXT,
    nome_usuario TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_chamados_status ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_urgencia ON chamados(urgencia);
CREATE INDEX IF NOT EXISTS idx_chamados_categoria ON chamados(categoria);
CREATE INDEX IF NOT EXISTS idx_chamados_criado_em ON chamados(criado_em);
CREATE INDEX IF NOT EXISTS idx_chamados_atribuido_a ON chamados(atribuido_a);
CREATE INDEX IF NOT EXISTS idx_notas_chamado ON notas(chamado_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_telefone ON sessoes_whatsapp(telefone);

-- Inserir categorias padrão
INSERT OR IGNORE INTO categorias (id, nome, emoji, descricao, ordem) VALUES
(1, 'Computador / Notebook', '🖥️', 'Problemas com computadores e notebooks', 1),
(2, 'Rede / Internet', '🌐', 'Problemas de conectividade e rede', 2),
(3, 'Impressoras', '🖨️', 'Problemas com impressoras e impressão', 3),
(4, 'Acessos e Usuários', '🔐', 'Problemas de login, senha e permissões', 4),
(5, 'Sistemas', '💻', 'Problemas com sistemas internos', 5),
(6, 'E-mail', '📧', 'Problemas com e-mail corporativo', 6),
(7, 'Equipamentos (Periféricos)', '🧰', 'Problemas com teclado, mouse, monitor, etc', 7),
(8, 'Telefonia / Ramal', '☎️', 'Problemas com telefone e ramais', 8),
(9, 'Pastas, Servidores e Permissões', '📁', 'Acesso a pastas de rede e servidores', 9),
(10, 'Solicitações Gerais', '🛠️', 'Instalações, atualizações e outros', 10),
(11, 'Outros', '❓', 'Outros problemas não listados', 11);

-- Inserir subcategorias padrão
-- Categoria 1: Computador / Notebook
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(1, 'Computador lento', 'media', 'lento,demora,travando'),
(1, 'Computador travando', 'alta', 'travando,trava,congela'),
(1, 'Tela azul (BSOD)', 'critica', 'azul,bsod,erro critico'),
(1, 'Computador não liga', 'critica', 'não liga,desligado,sem energia'),
(1, 'Computador liga, mas não inicia o Windows', 'alta', 'não inicia,boot,windows'),
(1, 'Falha no HD/SSD', 'alta', 'hd,ssd,disco,falha'),
(1, 'Sem som', 'baixa', 'som,audio,mudo'),
(1, 'USB não reconhece', 'baixa', 'usb,pendrive,dispositivo'),
(1, 'Sem vídeo no monitor', 'alta', 'monitor,video,tela preta'),
(1, 'Superaquecimento', 'alta', 'quente,aquecimento,temperatura');

-- Categoria 2: Rede / Internet
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(2, 'Sem internet', 'critica', 'sem internet,desconectado,offline'),
(2, 'Internet lenta', 'alta', 'lenta,lento,demora'),
(2, 'Wi-Fi instável', 'media', 'instavel,caindo,oscilando'),
(2, 'Wi-Fi não conecta', 'alta', 'não conecta,wifi,wireless'),
(2, 'Sem acesso ao servidor', 'alta', 'servidor,acesso,rede'),
(2, 'Queda de conexão frequente', 'media', 'queda,frequente,caindo');

-- Categoria 3: Impressoras
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(3, 'Impressora não imprime', 'alta', 'não imprime,parou,travou'),
(3, 'Impressora offline', 'media', 'offline,desconectada'),
(3, 'Impressão com falhas', 'media', 'falha,borrada,cortada'),
(3, 'Impressora de etiquetas não imprime', 'alta', 'etiqueta,não imprime'),
(3, 'Etiqueta fora do padrão', 'media', 'etiqueta,padrão,desalinhada'),
(3, 'Erro de spooler de impressão', 'media', 'spooler,fila,erro');

-- Categoria 4: Acessos e Usuários
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(4, 'Reset de senha', 'media', 'senha,reset,esqueci'),
(4, 'Criação de usuário', 'baixa', 'criar,novo,usuario'),
(4, 'Alteração de permissões', 'baixa', 'permissao,acesso,liberar'),
(4, 'Conta bloqueada', 'alta', 'bloqueada,bloqueio,travada'),
(4, 'Usuário desativado', 'media', 'desativado,inativo'),
(4, 'Erro de login', 'alta', 'login,erro,autenticacao');

-- Categoria 5: Sistemas
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(5, 'Sistema não abre', 'alta', 'não abre,erro,travou'),
(5, 'Erro ao acessar o sistema', 'alta', 'erro,acesso,falha'),
(5, 'Sistema lento', 'media', 'lento,demora,travando'),
(5, 'Erro em cadastro', 'media', 'cadastro,salvar,erro'),
(5, 'Erro em relatório', 'media', 'relatorio,erro,gerar'),
(5, 'Erro em integração', 'alta', 'integracao,api,erro'),
(5, 'Solicitação de acesso ao sistema', 'baixa', 'acesso,solicitar,liberar'),
(5, 'Solicitação de permissão no sistema', 'baixa', 'permissao,solicitar'),
(5, 'Sistema fora do ar', 'critica', 'fora do ar,indisponivel,down'),
(5, 'Atualização de sistema', 'baixa', 'atualizar,atualizacao,versao'),
(5, 'Problema após atualização', 'alta', 'atualizacao,problema,erro');

-- Categoria 6: E-mail
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(6, 'Não recebe e-mails', 'alta', 'não recebe,recebimento'),
(6, 'Não envia e-mails', 'alta', 'não envia,envio'),
(6, 'Caixa de e-mail cheia', 'media', 'cheia,lotada,espaco'),
(6, 'Configuração de e-mail', 'baixa', 'configurar,configuracao'),
(6, 'E-mail suspeito / possível vírus', 'alta', 'virus,suspeito,phishing'),
(6, 'Solicitação de criação de e-mail', 'baixa', 'criar,novo,email');

-- Categoria 7: Equipamentos (Periféricos)
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(7, 'Teclado não funciona', 'media', 'teclado,tecla,digitando'),
(7, 'Mouse não funciona', 'media', 'mouse,cursor,clique'),
(7, 'Monitor sem imagem', 'alta', 'monitor,imagem,tela'),
(7, 'Câmera não funciona', 'media', 'camera,webcam,video'),
(7, 'Microfone não funciona', 'media', 'microfone,audio,som'),
(7, 'Leitor de código de barras com falha', 'alta', 'leitor,codigo,barras');

-- Categoria 8: Telefonia / Ramal
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(8, 'Telefone sem linha', 'alta', 'sem linha,mudo,não liga'),
(8, 'Telefone mudo', 'alta', 'mudo,não ouve,audio'),
(8, 'Alteração de ramal', 'baixa', 'alterar,ramal,mudar'),
(8, 'Novo ramal', 'baixa', 'novo,ramal,criar'),
(8, 'Problema no PABX', 'alta', 'pabx,central,telefonia');

-- Categoria 9: Pastas, Servidores e Permissões
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(9, 'Sem acesso à pasta de rede', 'alta', 'pasta,rede,acesso'),
(9, 'Permissão negada', 'media', 'permissao,negada,acesso'),
(9, 'Pasta sumiu', 'alta', 'sumiu,desapareceu,pasta'),
(9, 'Arquivo corrompido', 'media', 'corrompido,danificado,erro'),
(9, 'Lentidão no servidor de arquivos', 'media', 'lento,servidor,arquivos');

-- Categoria 10: Solicitações Gerais
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(10, 'Instalação de software', 'baixa', 'instalar,software,programa'),
(10, 'Atualização de software', 'baixa', 'atualizar,software,versao'),
(10, 'Troca de equipamento', 'baixa', 'trocar,equipamento,substituir'),
(10, 'Novo equipamento', 'baixa', 'novo,equipamento,solicitar'),
(10, 'Formatação de computador', 'baixa', 'formatar,formatacao,limpar'),
(10, 'Backup de arquivos', 'media', 'backup,copia,arquivos'),
(10, 'Restauração de backup', 'media', 'restaurar,backup,recuperar');

-- Categoria 11: Outros
INSERT OR IGNORE INTO subcategorias (categoria_id, nome, urgencia_padrao, palavras_chave_urgencia) VALUES
(11, 'Outro problema não listado', 'media', 'outro,diferente,especifico'),
(11, 'Dúvida técnica', 'baixa', 'duvida,pergunta,ajuda'),
(11, 'Solicitação especial', 'baixa', 'especial,solicitacao,outro');

-- Inserir usuário admin padrão (senha: admin123)
-- Hash bcrypt para 'admin123'
INSERT OR IGNORE INTO usuarios (id, nome, email, senha, role) VALUES
(1, 'Administrador', 'admin@admin.com', '$2a$10$YhK8GRh1zqD6FaI9AgMjyexpuDQlGie/fG3v3.aZIX7rwy/cz5ymW', 'admin');
