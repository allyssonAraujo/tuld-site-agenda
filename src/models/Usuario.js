/**
 * Model Usuario
 */

const { run, get, all } = require('../config/helpers');
const bcrypt = require('bcryptjs');

class Usuario {
    
    /**
     * Criar novo usuário
     */
    static async criar(dados) {
        const { nome, email, telefone, senha } = dados;
        
        // Validar password
        if (!this.validarSenha(senha)) {
            return { error: 'A senha deve conter: mínimo 8 caracteres, 1 letra, 1 número e 1 caractere especial.' };
        }
        
        // Hash da senha
        const senhaHash = bcrypt.hashSync(senha, 10);
        
        try {
            const result = await run(
                `INSERT INTO usuarios (nome, email, telefone, senha)
                 VALUES (?, ?, ?, ?)`,
                [nome, email, telefone || null, senhaHash]
            );
            
            return { success: true, id: result.lastID };
        } catch (err) {
            if (err.message.includes('UNIQUE')) {
                return { error: 'Este email já está cadastrado.' };
            }
            return { error: 'Erro ao criar usuário.' };
        }
    }
    
    /**
     * Login - validar credenciais
     */
    static async login(email, senha) {
        try {
            const usuario = await this.buscarPorEmail(email);
            
            if (!usuario) {
                return { error: 'Email ou senha inválidos.' };
            }
            
            // Verificar senha
            if (!bcrypt.compareSync(senha, usuario.senha)) {
                return { error: 'Email ou senha inválidos.' };
            }
            
            // Verificar bloqueio
            if (usuario.status === 'bloqueado' && usuario.bloqueado_ate) {
                const agora = new Date();
                const bloqueio = new Date(usuario.bloqueado_ate);
                
                if (agora < bloqueio) {
                    const dias = Math.ceil((bloqueio - agora) / (1000 * 60 * 60 * 24));
                    return { 
                        error: `Sua conta está bloqueada. Será desbloqueada em ${dias} dia(s).` 
                    };
                } else {
                    // Desbloquear automaticamente
                    await this.desbloquear(usuario.id);
                    usuario.status = 'ativo';
                    usuario.faltas_consecutivas = 0;
                }
            }
            
            // Atualizar último acesso
            await run(
                'UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?',
                [usuario.id]
            );
            
            // Remover senha do retorno
            delete usuario.senha;
            
            return usuario;
        } catch (err) {
            console.error('Erro no login:', err);
            return { error: 'Erro ao fazer login.' };
        }
    }
    
    /**
     * Buscar usuário por ID
     */
    static async buscarPorId(id) {
        try {
            const usuario = await get('SELECT * FROM usuarios WHERE id = ?', [id]);
            if (usuario) delete usuario.senha;
            return usuario;
        } catch (err) {
            console.error('Erro ao buscar usuário:', err);
            return null;
        }
    }
    
    /**
     * Buscar usuário por email
     */
    static async buscarPorEmail(email) {
        try {
            return await get('SELECT * FROM usuarios WHERE email = ?', [email]);
        } catch (err) {
            console.error('Erro ao buscar usuário por email:', err);
            return null;
        }
    }
    
    /**
     * Atualizar perfil do usuário
     */
    static async atualizarPerfil(id, dados) {
        const { nome, telefone } = dados;
        
        try {
            await run(
                `UPDATE usuarios 
                 SET nome = ?, telefone = ?
                 WHERE id = ?`,
                [nome, telefone || null, id]
            );
            
            return { success: true };
        } catch (err) {
            console.error('Erro ao atualizar perfil:', err);
            return { error: 'Erro ao atualizar perfil.' };
        }
    }
    
    /**
     * Alterar senha
     */
    static async alterarSenha(id, senhaAtual, senhaNova) {
        try {
            const usuario = await this.buscarPorId(id);
            
            if (!usuario) {
                return { error: 'Usuário não encontrado.' };
            }
            
            // Verificar senha atual
            const usuarioComSenha = await get(
                'SELECT senha FROM usuarios WHERE id = ?',
                [id]
            );
            
            if (!bcrypt.compareSync(senhaAtual, usuarioComSenha.senha)) {
                return { error: 'Senha atual incorreta.' };
            }
            
            // Validar nova senha
            if (!this.validarSenha(senhaNova)) {
                return { error: 'A senha deve conter: mínimo 8 caracteres, 1 letra, 1 número e 1 caractere especial.' };
            }
            
            const nohash = bcrypt.hashSync(senhaNova, 10);
            
            await run('UPDATE usuarios SET senha = ? WHERE id = ?', [nohash, id]);
            
            return { success: true };
        } catch (err) {
            console.error('Erro ao alterar senha:', err);
            return { error: 'Erro ao alterar senha.' };
        }
    }
    
    /**
     * Registrar falta
     */
    static async registrarFalta(usuarioId) {
        try {
            const usuario = await this.buscarPorId(usuarioId);
            
            if (!usuario) return { error: 'Usuário não encontrado.' };
            
            let novasFaltas = usuario.faltas_consecutivas + 1;
            let status = usuario.status;
            let bloqueadoAte = usuario.bloqueado_ate;
            
            // Bloquear se atingir 3 faltas
            if (novasFaltas >= 3) {
                status = 'bloqueado';
                const agora = new Date();
                agora.setDate(agora.getDate() + 30); // 30 dias
                bloqueadoAte = agora.toISOString();
                novasFaltas = 0; // Resetar contador
            }
            
            await run(
                `UPDATE usuarios 
                 SET faltas_consecutivas = ?, status = ?, bloqueado_ate = ?, total_faltas = total_faltas + 1
                 WHERE id = ?`,
                [novasFaltas, status, bloqueadoAte, usuarioId]
            );
            
            return { success: true };
        } catch (err) {
            console.error('Erro ao registrar falta:', err);
            return { error: 'Erro ao registrar falta.' };
        }
    }
    
    /**
     * Desbloquear usuário
     */
    static async desbloquear(usuarioId) {
        try {
            await run(
                `UPDATE usuarios 
                 SET status = 'ativo', bloqueado_ate = NULL, faltas_consecutivas = 0
                 WHERE id = ?`,
                [usuarioId]
            );
            
            return { success: true };
        } catch (err) {
            console.error('Erro ao desbloquear usuário:', err);
            return { error: 'Erro ao desbloquear usuário.' };
        }
    }
    
    /**
     * Registrar presença
     */
    static async registrarPresenca(usuarioId) {
        try {
            await run(
                `UPDATE usuarios 
                 SET faltas_consecutivas = 0
                 WHERE id = ?`,
                [usuarioId]
            );
            
            return { success: true };
        } catch (err) {
            console.error('Erro ao registrar presença:', err);
            return { error: 'Erro ao registrar presença.' };
        }
    }
    
    /**
     * Validar força da senha
     */
    static validarSenha(senha) {
        if (!senha) return false;
        
        // Mínimo 8 caracteres
        if (senha.length < 8) return false;
        
        // Deve ter pelo menos 1 letra
        if (!/[a-zA-Z]/.test(senha)) return false;
        
        // Deve ter pelo menos 1 número
        if (!/[0-9]/.test(senha)) return false;
        
        // Deve ter pelo menos 1 caractere especial
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) return false;
        
        return true;
    }
    
    /**
     * Listar todos os usuários (para admin)
     */
    static async listarTodos() {
        try {
            return await all(
                'SELECT id, nome, email, status, total_faltas, data_cadastro FROM usuarios'
            );
        } catch (err) {
            console.error('Erro ao listar usuários:', err);
            return [];
        }
    }
}

module.exports = Usuario;
