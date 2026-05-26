function calculateScore(lead) {

    let score = 0;

    if (lead.name) score += 10;

    if (lead.email) score += 20;

    if (lead.phone) score += 20;

    switch (lead.status) {

        case "novo":
            score += 10;
            break;

        case "contato":
            score += 20;
            break;

        case "visita":
            score += 30;
            break;

        case "proposta":
            score += 40;
            break;

        case "fechado":
            score += 50;
            break;

        default:
            break;
    }

    return score;
}

function getTemperature(score) {

    if (score >= 70) {
        return "quente";
    }

    if (score >= 40) {
        return "morno";
    }

    return "frio";
}

module.exports = {
    calculateScore,
    getTemperature
};