/**
 * API Utilities - Funções compartilhadas de chamadas HTTP
 */

const API = {
    // Usa sempre o mesmo host em que o front está sendo servido
    // (localhost em desenvolvimento, domínio do Render em produção)
    baseURL: window.location.origin || '',
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const raw = await response.text();
            let data;

            try {
                data = raw ? JSON.parse(raw) : {};
            } catch {
                data = {
                    error: raw ? raw.slice(0, 250) : `Resposta inesperada do servidor (${response.status})`
                };
            }
            
            return {
                ok: response.ok,
                status: response.status,
                data
            };
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    },
    
    get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    },
    
    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            ...options
        });
    },
    
    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
            ...options
        });
    },
    
    delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }
};

// Verificar se usuário está autenticado
async function verificarAutenticacao() {
    try {
        const response = await fetch('/api/usuario');
        return response.ok;
    } catch {
        return false;
    }
}

// Redirecionar para login se não estiver autenticado
async function garantirAutenticacao() {
    const autenticado = await verificarAutenticacao();
    if (!autenticado) {
        window.location.href = '/index.html';
    }
}

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'success', elementoId = 'loginMessage') {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;
    
    elemento.textContent = texto;
    elemento.className = `form-message show ${tipo}`;
    
    // Remover mensagem após 5 segundos
    setTimeout(() => {
        elemento.classList.remove('show');
    }, 5000);
}

/**
 * Funções de Autenticação
 */

// Login
async function fazerLogin(email, senha) {
    try {
        const res = await API.post('/api/login', { email, senha });
        
        if (!res.ok) {
            mostrarMensagem(res.data.error, 'error');
            return false;
        }
        
        // Redirecionar para dashboard
        window.location.href = '/dashboard.html';
        return true;
        
    } catch (error) {
        mostrarMensagem('Erro ao fazer login. Tente novamente.', 'error');
        return false;
    }
}

// Cadastro
async function fazerCadastro(nome, email, telefone, senha, confirmar_senha) {
    try {
        const res = await API.post('/api/cadastro', {
            nome,
            email,
            telefone,
            senha,
            confirmar_senha
        });
        
        if (!res.ok) {
            mostrarMensagem(res.data.error, 'error', 'cadastroMessage');
            return false;
        }
        
        mostrarMensagem(res.data.message, 'success', 'cadastroMessage');
        
        // Limpar form
        document.getElementById('cadastroForm').reset();
        
        // Mudar para aba de login
        setTimeout(() => {
            document.querySelector('[data-tab="login"]').click();
        }, 1500);
        
        return true;
        
    } catch (error) {
        mostrarMensagem('Erro ao criar conta. Tente novamente.', 'error', 'cadastroMessage');
        return false;
    }
}

// Sair/Logout
async function fazerLogout() {
    try {
        const res = await API.get('/api/sair');
        
        if (res.ok) {
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Erro ao sair:', error);
        window.location.href = '/index.html';
    }
}
