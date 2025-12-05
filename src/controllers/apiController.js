const Chamado = require('../models/Chamado');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const { gerarToken } = require('../middleware/auth');

/**
 * API - Login
 */
const login = async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        const usuario = await Usuario.autenticar(email, senha);
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
        
        const token = gerarToken(usuario);
        
        res.json({
            success: true,
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
 * API - Listar chamados
 */
const listarChamados = async (req, res) => {
    try {
        const filtros = req.query;
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
 * API - Buscar chamado
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
 * API - Atualizar chamado
 */
const atualizarChamado = async (req, res) => {
    try {
        const { id } = req.params;
        
        const chamado = await Chamado.buscarPorId(id);
        if (!chamado) {
            return res.status(404).json({
                success: false,
                message: 'Chamado não encontrado'
            });
        }
        
        await Chamado.atualizar(id, req.body);
        const atualizado = await Chamado.buscarPorId(id);
        
        res.json({
            success: true,
            message: 'Chamado atualizado',
            data: atualizado
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
 * API - Dashboard stats
 */
const getEstatisticas = async (req, res) => {
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
 * API - Listar categorias
 */
const listarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.listarTodas();
        
        // Buscar subcategorias para cada categoria
        for (const cat of categorias) {
            cat.subcategorias = await Categoria.listarSubcategorias(cat.id);
        }
        
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
 * API - Listar técnicos
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
 * API - Health check
 */
const healthCheck = (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando',
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    login,
    listarChamados,
    getChamado,
    atualizarChamado,
    getEstatisticas,
    listarCategorias,
    listarTecnicos,
    healthCheck
};
