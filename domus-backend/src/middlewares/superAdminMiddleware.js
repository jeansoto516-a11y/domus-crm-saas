module.exports = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({
            error: 'Acesso negado. Apenas o administrador do sistema pode acessar isso.'
        });
    }

    next();
};