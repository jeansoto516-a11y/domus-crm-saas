const MIN_MATCH_PERCENT = 40;

const normalize = (text) => (text || '').toString().trim().toLowerCase();

function calculateMatch(profile, leadType, property) {
    if (!profile) return null;

    let score = 0;
    let maxScore = 0;

    maxScore += 3;
    if (profile.property_type && normalize(profile.property_type) === normalize(property.property_type)) {
        score += 3;
    }

    maxScore += 2;
    if (profile.city && normalize(profile.city) === normalize(property.city)) {
        score += 2;
    }

    maxScore += 2;
    if (profile.region && normalize(profile.region) === normalize(property.region)) {
        score += 2;
    }

    if (profile.bedrooms) {
        maxScore += 1;
        if (property.bedrooms && Number(property.bedrooms) >= Number(profile.bedrooms)) {
            score += 1;
        }
    }

    if (profile.garage_spots) {
        maxScore += 1;
        if (property.garage_spots && Number(property.garage_spots) >= Number(profile.garage_spots)) {
            score += 1;
        }
    }

    const relevantPrice = leadType === 'aluguel' ? property.rent_price : property.price;

    if (profile.budget_max && relevantPrice) {
        maxScore += 3;
        if (Number(relevantPrice) <= Number(profile.budget_max) * 1.15) {
            score += 3;
        }
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : null;
}

module.exports = { calculateMatch, MIN_MATCH_PERCENT };