const Chamado = require('../models/Chamado');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const { gerarToken } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');
const path = require('path');

/**
 * Renderiza página de login
 */
const renderLogin = (req, res) => {
    // Se já está logado, redirecionar
    if (req.session && req.session.usuario) {
        return res.redirect('/admin/dashboard');
    }
    res.sendFile(path.join(__dirname, '../views/login.html'));
};

/**
 * Processa login
 */
const processarLogin = async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        const usuario = await Usuario.autenticar(email, senha);
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha inválidos'
            });
        }
        
        // Criar sessão
        req.session.usuario = usuario;
        
        // Gerar token JWT também
        const token = gerarToken(usuario);
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role
            }
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Logout
 */
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao fazer logout:', err);
        }
        res.redirect('/admin/login');
    });
};

/**
 * Renderiza dashboard
 */
const renderDashboard = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
};

/**
 * Renderiza página de chamados
 */
const renderChamados = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/chamados.html'));
};

/**
 * Renderiza página de usuários
 */
const renderUsuarios = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/usuarios.html'));
};

/**
 * Retorna dados do dashboard
 */
const getDashboard = async (req, res) => {
    try {
        const stats = await Chamado.estatisticas();
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas'
        });
    }
};

/**
 * Lista chamados com filtros
 */
const listarChamados = async (req, res) => {
    try {
        const filtros = {
            status: req.query.status,
            urgencia: req.query.urgencia,
            categoria: req.query.categoria,
            atribuido_a: req.query.atribuido_a ? parseInt(req.query.atribuido_a) : null,
            data_inicio: req.query.data_inicio,
            data_fim: req.query.data_fim,
            telefone: req.query.telefone,
            limite: req.query.limite ? parseInt(req.query.limite) : null
        };
        
        // Remover filtros undefined
        Object.keys(filtros).forEach(key => {
            if (filtros[key] === undefined || filtros[key] === null || filtros[key] === '') {
                delete filtros[key];
            }
        });
        
        const chamados = await Chamado.listar(filtros);
        
        res.json({
            success: true,
            data: chamados
        });
        
    } catch (error) {
        console.error('Erro ao listar chamados:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar chamados'
        });
    }
};

/**
 * Busca chamado por ID
 */
const getChamado = async (req, res) => {
    try {
        const { id } = req.params;
        const chamado = await Chamado.buscarPorId(id);
        
        if (!chamado) {
            return res.status(404).json({
                success: false,
                message: 'Chamado não encontrado'
            });
        }
        
        // Buscar notas
        const notas = await Chamado.buscarNotas(id);
        chamado.notas = notas;
        
        res.json({
            success: true,
            data: chamado
        });
        
    } catch (error) {
        console.error('Erro ao buscar chamado:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar chamado'
        });
    }
};

/**
 * Atualiza chamado
 */
const atualizarChamado = async (req, res) => {
    try {
        const { id } = req.params;
        const dados = req.body;
        
        // Verificar se chamado existe
        const chamado = await Chamado.buscarPorId(id);
        if (!chamado) {
            return res.status(404).json({
                success: false,
                message: 'Chamado não encontrado'
            });
        }
        
        await Chamado.atualizar(id, dados);
        
        // Buscar chamado atualizado
        const chamadoAtualizado = await Chamado.buscarPorId(id);
        
        // Notificar usuário se o status mudou
        if (dados.status && dados.status !== chamado.status) {
            try {
                await whatsappService.notificarAtualizacao(
                    chamado.telefone_usuario,
                    chamadoAtualizado,
                    dados.mensagem_notificacao
                );
            } catch (notifyError) {
                console.error('Erro ao notificar usuário:', notifyError);
            }
        }
        
        res.json({
            success: true,
            message: 'Chamado atualizado com sucesso',
            data: chamadoAtualizado
        });
        
    } catch (error) {
        console.error('Erro ao atualizar chamado:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar chamado'
        });
    }
};

/**
 * Atribui chamado a técnico
 */
const atribuirChamado = async (req, res) => {
    try {
        const { id } = req.params;
        const { tecnico_id } = req.body;
        
        if (!tecnico_id) {
            return res.status(400).json({
                success: false,
                message: 'ID do técnico é obrigatório'
            });
        }
        
        // Verificar se chamado existe
        const chamado = await Chamado.buscarPorId(id);
        if (!chamado) {
            return res.status(404).json({
                success: false,
                message: 'Chamado não encontrado'
            });
        }
        
        // Verificar se técnico existe
        const tecnico = await Usuario.buscarPorId(tecnico_id);
        if (!tecnico) {
            return res.status(404).json({
                success: false,
                message: 'Técnico não encontrado'
            });
        }
        
        await Chamado.atribuir(id, tecnico_id);
        
        const chamadoAtualizado = await Chamado.buscarPorId(id);
        
        res.json({
            success: true,
            message: `Chamado atribuído a ${tecnico.nome}`,
            data: chamadoAtualizado
        });
        
    } catch (error) {
        console.error('Erro ao atribuir chamado:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atribuir chamado'
        });
    }
};

/**
 * Adiciona nota ao chamado
 */
const adicionarNota = async (req, res) => {
    try {
        const { id } = req.params;
        const { conteudo, tipo = 'interna' } = req.body;
        
        // Verificar se chamado existe
        const chamado = await Chamado.buscarPorId(id);
        if (!chamado) {
            return res.status(404).json({
                success: false,
                message: 'Chamado não encontrado'
            });
        }
        
        const notaId = await Chamado.adicionarNota(
            id,
            req.usuario.id,
            conteudo,
            tipo
        );
        
        const notas = await Chamado.buscarNotas(id);
        
        res.json({
            success: true,
            message: 'Nota adicionada com sucesso',
            data: notas
        });
        
    } catch (error) {
        console.error('Erro ao adicionar nota:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao adicionar nota'
        });
    }
};

/**
 * Lista usuários
 */
const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.listarTodos();
        
        res.json({
            success: true,
            data: usuarios
        });
        
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar usuários'
        });
    }
};

/**
 * Lista técnicos
 */
const listarTecnicos = async (req, res) => {
    try {
        const tecnicos = await Usuario.listarTecnicos();
        
        res.json({
            success: true,
            data: tecnicos
        });
        
    } catch (error) {
        console.error('Erro ao listar técnicos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar técnicos'
        });
    }
};

/**
 * Busca usuário por ID
 */
const getUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.buscarPorId(id);
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: usuario
        });
        
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuário'
        });
    }
};

/**
 * Cria novo usuário
 */
const criarUsuario = async (req, res) => {
    try {
        const { nome, email, senha, role = 'tecnico' } = req.body;
        
        // Verificar se email já existe
        const existente = await Usuario.buscarPorEmail(email);
        if (existente) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado'
            });
        }
        
        const id = await Usuario.criar({ nome, email, senha, role });
        const usuario = await Usuario.buscarPorId(id);
        
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: usuario
        });
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar usuário'
        });
    }
};

/**
 * Atualiza usuário
 */
const atualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const dados = req.body;
        
        // Verificar se usuário existe
        const usuario = await Usuario.buscarPorId(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        // Se está alterando email, verificar se já existe
        if (dados.email && dados.email !== usuario.email) {
            const existente = await Usuario.buscarPorEmail(dados.email);
            if (existente) {
                return res.status(400).json({
                    success: false,
                    message: 'Email já cadastrado'
                });
            }
        }
        
        // Remover senha vazia
        if (dados.senha === '') {
            delete dados.senha;
        }
        
        await Usuario.atualizar(id, dados);
        const usuarioAtualizado = await Usuario.buscarPorId(id);
        
        res.json({
            success: true,
            message: 'Usuário atualizado com sucesso',
            data: usuarioAtualizado
        });
        
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar usuário'
        });
    }
};

/**
 * Deleta usuário (soft delete)
 */
const deletarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Não permitir excluir o próprio usuário
        if (parseInt(id) === req.usuario.id) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir seu próprio usuário'
            });
        }
        
        // Verificar se usuário existe
        const usuario = await Usuario.buscarPorId(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        await Usuario.deletar(id);
        
        res.json({
            success: true,
            message: 'Usuário desativado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar usuário'
        });
    }
};

/**
 * Lista categorias
 */
const listarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.listarTodas();
        
        res.json({
            success: true,
            data: categorias
        });
        
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar categorias'
        });
    }
};

/**
 * Retorna dados do usuário logado
 */
const getUsuarioLogado = (req, res) => {
    res.json({
        success: true,
        data: req.usuario
    });
};

module.exports = {
    renderLogin,
    processarLogin,
    logout,
    renderDashboard,
    renderChamados,
    renderUsuarios,
    getDashboard,
    listarChamados,
    getChamado,
    atualizarChamado,
    atribuirChamado,
    adicionarNota,
    listarUsuarios,
    listarTecnicos,
    getUsuario,
    criarUsuario,
    atualizarUsuario,
    deletarUsuario,
    listarCategorias,
    getUsuarioLogado
};
