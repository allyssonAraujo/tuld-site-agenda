/**
 * Rotas de Autenticação
 */

const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const { run } = require('../config/helpers');

/**
 * POST /api/login - Processar login
 */
router.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }
    
    const resultado = await Usuario.login(email, senha);
    
    if (resultado.error) {
        return res.status(401).json({ error: resultado.error });
    }
    
    // Login bem-sucedido
    req.session.usuario = resultado;
    return res.json({ 
        success: true, 
        usuario: resultado 
    });
});

/**
 * POST /api/cadastro - Processar cadastro
 */
router.post('/api/cadastro', async (req, res) => {
    const { nome, email, telefone, senha, confirmar_senha } = req.body;
    
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }
    
    if (senha !== confirmar_senha) {
        return res.status(400).json({ error: 'As senhas não coincidem.' });
    }
    
    // Criar usuário
    const resultado = await Usuario.criar({ nome, email, telefone, senha });
    
    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }
    
    return res.json({ 
        success: true, 
        message: 'Cadastro realizado com sucesso! Faça login para continuar.' 
    });
});

/**
 * POST /api/alterar-senha - Alterar senha
 */
router.post('/api/alterar-senha', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const { senhaAtual, senhaNova, confirmarSenha } = req.body;
    
    if (!senhaAtual || !senhaNova || !confirmarSenha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }
    
    if (senhaNova !== confirmarSenha) {
        return res.status(400).json({ error: 'As senhas não coincidem.' });
    }
    
    Usuario.alterarSenha(req.session.usuario.id, senhaAtual, senhaNova).then(resultado => {
        if (resultado.error) {
            return res.status(400).json({ error: resultado.error });
        }
        
        return res.json({ success: true, message: 'Senha alterada com sucesso!' });
    }).catch(err => {
        console.error('Erro:', err);
        return res.status(500).json({ error: 'Erro ao alterar senha' });
    });
});

/**
 * POST /api/editar-perfil - Atualizar perfil
 */
router.post('/api/editar-perfil', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const { nome, telefone } = req.body;
    
    Usuario.atualizarPerfil(req.session.usuario.id, { nome, telefone }).then(resultado => {
        if (resultado.error) {
            return res.status(400).json({ error: resultado.error });
        }
        
        // Atualizar sessão
        req.session.usuario.nome = nome;
        req.session.usuario.telefone = telefone;
        
        return res.json({ 
            success: true, 
            message: 'Perfil atualizado com sucesso!',
            usuario: req.session.usuario 
        });
    }).catch(err => {
        console.error('Erro:', err);
        return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    });
});

/**
 * GET /api/usuario - Obter dados do usuário autenticado
 */
router.get('/api/usuario', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    Usuario.buscarPorId(req.session.usuario.id).then(usuario => {
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        delete usuario.senha;
        return res.json(usuario);
    }).catch(err => {
        console.error('Erro:', err);
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
    });
});

/**
 * GET /api/sair - Logout
 */
router.get('/api/sair', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao sair' });
        }
        return res.json({ success: true, redirect: '/' });
    });
});

/**
 * GET /api/debug/usuarios - DEBUG: Listar todos os usuários (remover em produção!)
 */
router.get('/api/debug/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.listarTodos();
        return res.json({ 
            total: usuarios.length,
            usuarios: usuarios
        });
    } catch (err) {
        console.error('Erro ao listar usuários:', err);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/debug/reset-admin - DEBUG: resetar senha do admin (remover em produção!)
 */
router.post('/api/debug/reset-admin', async (req, res) => {
    try {
        const novaSenha = (req.body && req.body.senha) ? String(req.body.senha) : 'Admin@123';
        const senhaHash = bcrypt.hashSync(novaSenha, 10);

        await run(
            `UPDATE usuarios
             SET senha = $1, status = 'ativo', bloqueado_ate = NULL, faltas_consecutivas = 0
             WHERE id = 1`,
            [senhaHash]
        );

        return res.json({
            success: true,
            message: 'Senha do admin resetada com sucesso.',
            email: 'admin@tuld.com'
        });
    } catch (err) {
        console.error('Erro ao resetar admin:', err);
        return res.status(500).json({ error: 'Erro ao resetar admin.' });
    }
});

module.exports = router;
