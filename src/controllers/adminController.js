const Usuario = require('../models/Usuario');
const Chamado = require('../models/Chamado');
const { gerarToken } = require('../middleware/auth');
const path = require('path');

class AdminController {
    /**
     * Renderiza a página de login
     */
    static loginPage(req, res) {
        // Se já estiver logado, redirecionar para dashboard
        if (req.session && req.session.usuario) {
            return res.redirect('/admin/dashboard');
        }
        res.sendFile(path.join(__dirname, '../views/login.html'));
    }

    /**
     * Processa o login
     */
    static async login(req, res) {
        try {
            const { email, senha } = req.body;

            const usuario = await Usuario.buscarPorEmail(email);
            
            if (!usuario) {
                return res.status(401).json({ erro: 'Email ou senha inválidos' });
            }

            if (!usuario.ativo) {
                return res.status(401).json({ erro: 'Usuário desativado' });
            }

            const senhaValida = await Usuario.verificarSenha(senha, usuario.senha);
            
            if (!senhaValida) {
                return res.status(401).json({ erro: 'Email ou senha inválidos' });
            }

            // Criar sessão
            req.session.usuario = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role
            };

            // Gerar token JWT também (para chamadas API)
            const token = gerarToken(usuario);

            res.json({ 
                sucesso: true, 
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
            res.status(500).json({ erro: 'Erro ao processar login' });
        }
    }

    /**
     * Logout
     */
    static logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Erro ao destruir sessão:', err);
            }
            res.redirect('/admin/login');
        });
    }

    /**
     * Renderiza o dashboard
     */
    static dashboardPage(req, res) {
        res.sendFile(path.join(__dirname, '../views/dashboard.html'));
    }

    /**
     * Renderiza a página de chamados
     */
    static chamadosPage(req, res) {
        res.sendFile(path.join(__dirname, '../views/chamados.html'));
    }

    /**
     * Renderiza a página de usuários
     */
    static usuariosPage(req, res) {
        res.sendFile(path.join(__dirname, '../views/usuarios.html'));
    }

    /**
     * Retorna dados do usuário logado
     */
    static async usuarioLogado(req, res) {
        res.json({ usuario: req.usuario });
    }
}

module.exports = AdminController;
