module.exports = (req, res, next) => {

    if (req.user.role === 'admin') {
        return next();
    }

    if (req.user.access_scope === 'aluguel' || req.user.access_scope === 'ambos') {
        return next();
    }

    return res.status(403).json({
        error: 'Voce nao tem acesso ao modulo de alugueis.'
    });

};