/**
 * App.js - Lógica Principal da Aplicação
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Garantir autenticação em páginas protegidas
    const paginasProtegidas = ['/dashboard.html', '/meus-agendamentos.html', '/editar-perfil.html'];
    const paginaAtual = window.location.pathname;
    
    if (paginasProtegidas.some(p => paginaAtual.includes(p))) {
        garantirAutenticacao();
    }
    
    // Configurar eventos globais
    configuraTogglePassword();
    configuraAbas();
    configuraModals();
    configuraSair();
    configuraEsqueceuSenha();
}

/**
 * Toggle de visibilidade de senha
 */
function configuraTogglePassword() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const inputId = btn.dataset.input;
            const input = document.getElementById(inputId);
            const icon = btn.querySelector('.eye-icon');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '👁️‍🗨️';
            } else {
                input.type = 'password';
                icon.textContent = '👁️';
            }
        });
    });
}

/**
 * Configurar abas de login/cadastro
 */
function configuraAbas() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Remover active de todos
            tabButtons.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            // Adicionar active ao clicado
            btn.classList.add('active');
            document.querySelector(`[data-form="${tab}"]`).classList.add('active');
        });
    });
    
    // Configurar submit dos formulários
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const senha = document.getElementById('loginSenha').value;
            
            await fazerLogin(email, senha);
        });
    }
    
    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nome = document.getElementById('cadastroNome').value;
            const email = document.getElementById('cadastroEmail').value;
            const telefone = document.getElementById('cadastroTelefone').value;
            const senha = document.getElementById('cadastroSenha').value;
            const confirmar_senha = document.getElementById('cadastroConfirmar').value;
            
            await fazerCadastro(nome, email, telefone, senha, confirmar_senha);
        });
    }
}

/**
 * Configurar modals
 */
function configuraModals() {
    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Fechar modal com botão close
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });
    
    // Fechar modal com botão "Fechar"
    document.querySelectorAll('[data-action="close"]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });
}

/**
 * Configurar botão Sair
 */
function configuraSair() {
    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            if (confirm('Deseja sair do sistema?')) {
                fazerLogout();
            }
        });
    }
}

/**
 * Link "Esqueceu a senha?" na tela de login
 */
function configuraEsqueceuSenha() {
    const btn = document.getElementById('btnEsqueceuSenha');
    if (!btn) return;

    btn.addEventListener('click', () => {
        Mensagens.info('Para redefinir sua senha, entre em contato com o responsável pelo terreiro.', 6000);
    });
}

/**
 * Utilidades de Validação
 */
const Validacao = {
    // Validar email
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    // Validar senha forte
    validarSenha(senha) {
        // Mínimo 8 caracteres
        if (senha.length < 8) return false;
        
        // Deve ter letra
        if (!/[a-zA-Z]/.test(senha)) return false;
        
        // Deve ter número
        if (!/[0-9]/.test(senha)) return false;
        
        // Deve ter caractere especial
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) return false;
        
        return true;
    },
    
    // Validar telefone
    validarTelefone(telefone) {
        // Aceita vários formatos
        const regex = /^[\d\s\-()]+$/;
        return regex.test(telefone) && telefone.replace(/\D/g, '').length >= 10;
    }
};

/**
 * Utilidades de Formatação
 */
const Formatacao = {
    // Formatar data
    formatarData(data) {
        if (typeof data === 'string') {
            data = new Date(data);
        }
        return data.toLocaleDateString('pt-BR');
    },
    
    // Formatar hora
    formatarHora(hora) {
        if (hora instanceof Date) {
            return hora.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        return hora;
    },
    
    // Formatar telefone
    formatarTelefone(telefone) {
        if (!telefone) return '';
        const apenasNumeros = telefone.replace(/\D/g, '');
        if (apenasNumeros.length === 11) {
            return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
        }
        return telefone;
    },
    
    // Formatar data e hora juntas
    formatarDataHora(data, hora) {
        return `${this.formatarData(data)} às ${hora}`;
    }
};

/**
 * Mensagens do Sistema
 */
const Mensagens = {
    sucesso(texto, delay = 3000) {
        this.mostrar(texto, 'success', delay);
    },
    
    erro(texto, delay = 5000) {
        this.mostrar(texto, 'error', delay);
    },
    
    aviso(texto, delay = 4000) {
        this.mostrar(texto, 'warning', delay);
    },
    
    info(texto, delay = 3000) {
        this.mostrar(texto, 'info', delay);
    },
    
    mostrar(texto, tipo = 'info', delay = 3000) {
        const div = document.createElement('div');
        div.className = `alert alert-${tipo}`;
        div.innerHTML = `<strong>${texto}</strong>`;
        div.style.position = 'fixed';
        div.style.top = '20px';
        div.style.right = '20px';
        div.style.zIndex = '10000';
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.3s ease-in-out';
        
        document.body.appendChild(div);
        
        // Animar entrada
        setTimeout(() => {
            div.style.opacity = '1';
        }, 10);
        
        // Remover após delay
        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 300);
        }, delay);
    }
};

/**
 * Utilitários de Estado Local
 */
const Storage = {
    set(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
        }
    },
    
    get(chave) {
        try {
            const item = localStorage.getItem(chave);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Erro ao ler do localStorage:', e);
            return null;
        }
    },
    
    remove(chave) {
        try {
            localStorage.removeItem(chave);
        } catch (e) {
            console.error('Erro ao remover do localStorage:', e);
        }
    },
    
    clear() {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('Erro ao limpar localStorage:', e);
        }
    }
};

/**
 * Loading visual
 */
const Loading = {
    show(elemento) {
        if (typeof elemento === 'string') {
            elemento = document.querySelector(elemento);
        }
        
        if (!elemento) return;
        
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.innerHTML = '<div class="spinner-border"></div>';
        elemento.appendChild(loader);
    },
    
    hide(elemento) {
        if (typeof elemento === 'string') {
            elemento = document.querySelector(elemento);
        }
        
        if (!elemento) return;
        
        const loader = elemento.querySelector('.loader');
        if (loader) loader.remove();
    }
};

/**
 * Exportar para uso global
 */
window.Validacao = Validacao;
window.Formatacao = Formatacao;
window.Mensagens = Mensagens;
window.Storage = Storage;
window.Loading = Loading;
