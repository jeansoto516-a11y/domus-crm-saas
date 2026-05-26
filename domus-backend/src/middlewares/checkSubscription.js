module.exports = async (req, res, next) => {

    try {

        // 🔥 MODO DESENVOLVIMENTO
        // libera acesso sem validar trial

        return next();

    } catch (error) {

        console.log(
            "Erro no checkSubscription:",
            error
        );

        return res.status(500).json({
            error: "Erro interno"
        });
    }
};