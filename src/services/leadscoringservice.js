function calculateScore(lead) {
  let score = 0;

  // Status do lead
  if (lead.status === 'novo') score += 10;
  if (lead.status === 'contato') score += 30;
  if (lead.status === 'visita') score += 50;
  if (lead.status === 'proposta') score += 80;
  if (lead.status === 'fechado') score += 100;

  // Dados preenchidos
  if (lead.email) score += 10;
  if (lead.phone) score += 10;

  return score;
}

function getTemperature(score) {
  if (score >= 70) return 'quente';
  if (score >= 40) return 'morno';

  return 'frio';
}

module.exports = {
  calculateScore,
  getTemperature
};