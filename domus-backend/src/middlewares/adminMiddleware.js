module.exports = (req, res, next) => {
    if (req.user.role !== 'admin') {
    return res.status(403).json({
        error: 'Acesso negado. Apenas administradores podem realizar esta ação.'
    });
    }

    next();
};