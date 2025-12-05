const Chamado = require('../models/Chamado');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const UrgenciaService = require('../services/urgenciaService');

class ApiController {
    // ============== CHAMADOS ==============
    
    /**
     * Lista todos os chamados com filtros
     * GET /api/chamados
     */
    static async listarChamados(req, res) {
        try {
            const filtros = {
                status: req.query.status,
                urgencia: req.query.urgencia,
                categoria: req.query.categoria,
                atribuido_a: req.query.atribuido_a,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined
            };

            const chamados = await Chamado.listarTodos(filtros);
            res.json({ chamados });
        } catch (error) {
            console.error('Erro ao listar chamados:', error);
            res.status(500).json({ erro: 'Erro ao listar chamados' });
        }
    }

    /**
     * Busca um chamado específico
     * GET /api/chamados/:id
     */
    static async buscarChamado(req, res) {
        try {
            const chamado = await Chamado.buscarPorId(req.params.id);
            
            if (!chamado) {
                return res.status(404).json({ erro: 'Chamado não encontrado' });
            }

            const notas = await Chamado.buscarNotas(chamado.id);
            
            res.json({ chamado, notas });
        } catch (error) {
            console.error('Erro ao buscar chamado:', error);
            res.status(500).json({ erro: 'Erro ao buscar chamado' });
        }
    }

    /**
     * Atualiza status do chamado
     * PATCH /api/chamados/:id/status
     */
    static async atualizarStatusChamado(req, res) {
        try {
            const { status } = req.body;
            const chamadoId = req.params.id;
            const usuarioId = req.usuario.id;

            const chamado = await Chamado.buscarPorId(chamadoId);
            
            if (!chamado) {
                return res.status(404).json({ erro: 'Chamado não encontrado' });
            }

            await Chamado.atualizarStatus(chamadoId, status, usuarioId);

            // Enviar notificação por WhatsApp (opcional)
            // await this.notificarUsuario(chamado.telefone_usuario, status, chamado.numero);

            res.json({ sucesso: true, mensagem: 'Status atualizado com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            res.status(500).json({ erro: 'Erro ao atualizar status' });
        }
    }

    /**
     * Atribui chamado a um técnico
     * PATCH /api/chamados/:id/atribuir
     */
    static async atribuirChamado(req, res) {
        try {
            const { tecnico_id } = req.body;
            const chamadoId = req.params.id;
            const usuarioId = req.usuario.id;

            const chamado = await Chamado.buscarPorId(chamadoId);
            
            if (!chamado) {
                return res.status(404).json({ erro: 'Chamado não encontrado' });
            }

            await Chamado.atribuir(chamadoId, tecnico_id, usuarioId);

            // Atualizar status para EM_ANDAMENTO se estiver ABERTO
            if (chamado.status === 'ABERTO') {
                await Chamado.atualizarStatus(chamadoId, 'EM_ANDAMENTO', usuarioId);
            }

            res.json({ sucesso: true, mensagem: 'Chamado atribuído com sucesso' });
        } catch (error) {
            console.error('Erro ao atribuir chamado:', error);
            res.status(500).json({ erro: 'Erro ao atribuir chamado' });
        }
    }

    /**
     * Adiciona nota ao chamado
     * POST /api/chamados/:id/notas
     */
    static async adicionarNota(req, res) {
        try {
            const { conteudo } = req.body;
            const chamadoId = req.params.id;
            const usuarioId = req.usuario.id;

            const chamado = await Chamado.buscarPorId(chamadoId);
            
            if (!chamado) {
                return res.status(404).json({ erro: 'Chamado não encontrado' });
            }

            await Chamado.adicionarNota(chamadoId, usuarioId, conteudo);

            res.json({ sucesso: true, mensagem: 'Nota adicionada com sucesso' });
        } catch (error) {
            console.error('Erro ao adicionar nota:', error);
            res.status(500).json({ erro: 'Erro ao adicionar nota' });
        }
    }

    // ============== DASHBOARD / ESTATÍSTICAS ==============

    /**
     * Retorna estatísticas gerais do dashboard
     * GET /api/dashboard/estatisticas
     */
    static async estatisticasDashboard(req, res) {
        try {
            const [
                porStatus,
                porUrgencia,
                porCategoria,
                porData,
                tempoMedio,
                porTecnico,
                maisFrequentes,
                total
            ] = await Promise.all([
                Chamado.contarPorStatus(),
                Chamado.contarPorUrgencia(),
                Chamado.contarPorCategoria(),
                Chamado.contarPorData(30),
                Chamado.tempoMedioResolucao(),
                Chamado.resolucaoPorTecnico(),
                Chamado.subcategoriasMaisFrequentes(10),
                Chamado.totalChamados()
            ]);

            // Processar dados para o frontend
            const statusData = {
                ABERTO: 0,
                EM_ANDAMENTO: 0,
                RESOLVIDO: 0,
                FECHADO: 0
            };
            porStatus.forEach(item => {
                statusData[item.status] = item.total;
            });

            const urgenciaData = {
                CRITICA: 0,
                ALTA: 0,
                MEDIA: 0,
                BAIXA: 0
            };
            porUrgencia.forEach(item => {
                urgenciaData[item.urgencia] = item.total;
            });

            res.json({
                total,
                porStatus: statusData,
                porUrgencia: urgenciaData,
                porCategoria,
                porData,
                tempoMedioResolucao: tempoMedio ? tempoMedio.toFixed(1) : '0',
                resolucaoPorTecnico: porTecnico,
                maisFrequentes
            });
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ erro: 'Erro ao buscar estatísticas' });
        }
    }

    // ============== USUÁRIOS ==============

    /**
     * Lista todos os usuários
     * GET /api/usuarios
     */
    static async listarUsuarios(req, res) {
        try {
            const usuarios = await Usuario.listarTodos();
            res.json({ usuarios });
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            res.status(500).json({ erro: 'Erro ao listar usuários' });
        }
    }

    /**
     * Lista técnicos (para dropdown de atribuição)
     * GET /api/tecnicos
     */
    static async listarTecnicos(req, res) {
        try {
            const tecnicos = await Usuario.listarTecnicos();
            res.json({ tecnicos });
        } catch (error) {
            console.error('Erro ao listar técnicos:', error);
            res.status(500).json({ erro: 'Erro ao listar técnicos' });
        }
    }

    /**
     * Cria um novo usuário
     * POST /api/usuarios
     */
    static async criarUsuario(req, res) {
        try {
            const { nome, email, senha, role } = req.body;

            // Verificar se email já existe
            const existente = await Usuario.buscarPorEmail(email);
            if (existente) {
                return res.status(400).json({ erro: 'Email já cadastrado' });
            }

            const id = await Usuario.criar({ nome, email, senha, role });

            res.status(201).json({ 
                sucesso: true, 
                mensagem: 'Usuário criado com sucesso',
                id 
            });
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            res.status(500).json({ erro: 'Erro ao criar usuário' });
        }
    }

    /**
     * Atualiza um usuário
     * PUT /api/usuarios/:id
     */
    static async atualizarUsuario(req, res) {
        try {
            const { nome, email, senha, role, ativo } = req.body;
            const id = req.params.id;

            // Verificar se usuário existe
            const usuario = await Usuario.buscarPorId(id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            // Se mudando email, verificar se já existe
            if (email && email !== usuario.email) {
                const existente = await Usuario.buscarPorEmail(email);
                if (existente) {
                    return res.status(400).json({ erro: 'Email já cadastrado' });
                }
            }

            await Usuario.atualizar(id, { nome, email, senha, role, ativo });

            res.json({ sucesso: true, mensagem: 'Usuário atualizado com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            res.status(500).json({ erro: 'Erro ao atualizar usuário' });
        }
    }

    /**
     * Deleta (desativa) um usuário
     * DELETE /api/usuarios/:id
     */
    static async deletarUsuario(req, res) {
        try {
            const id = req.params.id;

            // Não permitir auto-exclusão
            if (req.usuario.id === parseInt(id)) {
                return res.status(400).json({ erro: 'Não é possível desativar seu próprio usuário' });
            }

            const usuario = await Usuario.buscarPorId(id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            await Usuario.deletar(id);

            res.json({ sucesso: true, mensagem: 'Usuário desativado com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            res.status(500).json({ erro: 'Erro ao deletar usuário' });
        }
    }

    // ============== CATEGORIAS ==============

    /**
     * Lista todas as categorias com subcategorias
     * GET /api/categorias
     */
    static async listarCategorias(req, res) {
        try {
            const categorias = await Categoria.listarTodas();
            
            // Buscar subcategorias para cada categoria
            for (const cat of categorias) {
                cat.subcategorias = await Categoria.listarSubcategorias(cat.id);
            }

            res.json({ categorias });
        } catch (error) {
            console.error('Erro ao listar categorias:', error);
            res.status(500).json({ erro: 'Erro ao listar categorias' });
        }
    }
}

module.exports = ApiController;
