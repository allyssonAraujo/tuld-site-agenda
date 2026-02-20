/**
 * Middleware de Autenticação
 */

function verificarSessao(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    next();
}

function permitirApenasAutenticado(req, res, next) {
    if (req.session.usuario) {
        return res.redirect('/dashboard.html');
    }
    next();
}

module.exports = {
    verificarSessao,
    permitirApenasAutenticado
};
