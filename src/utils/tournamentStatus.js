const getCategoryMatches = (cat) => {
    const zoneMatches = Array.isArray(cat?.zones)
        ? cat.zones.flatMap(z => (Array.isArray(z?.matches) ? z.matches : []))
        : [];
    const playoffMatches = Array.isArray(cat?.playoffRounds)
        ? cat.playoffRounds.flatMap(r => (Array.isArray(r?.matches) ? r.matches : []))
        : [];
    return { zoneMatches, playoffMatches };
};

export const isCategoryCompleted = (cat) => {
    if (!cat) return false;
    if (cat.status === 'Finalizado') return true;
    if (cat.status === 'Inscripciones Abiertas') return false;

    const { zoneMatches, playoffMatches } = getCategoryMatches(cat);
    if (zoneMatches.length + playoffMatches.length === 0) return false;

    const finalRound = Array.isArray(cat.playoffRounds)
        ? cat.playoffRounds.find(r => r.roundName === 'Final')
        : null;
    if (!finalRound || !Array.isArray(finalRound.matches) || finalRound.matches.length === 0) {
        return false;
    }

    return (
        zoneMatches.every(m => m.status === 'Finalizado') &&
        playoffMatches.every(m => m.status === 'Finalizado')
    );
};

const isCategoryUnplayedEmpty = (cat) => {
    if (!cat || cat.status === 'Inscripciones Abiertas') return false;
    const { zoneMatches, playoffMatches } = getCategoryMatches(cat);
    if (zoneMatches.length + playoffMatches.length > 0) return false;

    const zTeams = Array.isArray(cat.zones)
        ? cat.zones.reduce((sum, z) => sum + (Array.isArray(z?.teams) ? z.teams.length : 0), 0)
        : 0;
    const regTeams = Array.isArray(cat.registeredPlayers) ? cat.registeredPlayers.length : 0;
    const pairsCount = typeof cat.pairsCount === 'number' ? cat.pairsCount : Math.max(zTeams, regTeams);

    return cat.status === 'Configuración Manual' || pairsCount < 2;
};

export const isTournamentCompleted = (tournament) => {
    if (!tournament) return false;
    if (tournament.status === 'Finalizado') return true;
    if (tournament.status === 'Cancelado') return false;

    const categories = Array.isArray(tournament.categories) ? tournament.categories : [];
    if (categories.length === 0) return false;
    if (categories.some(cat => cat.status === 'Inscripciones Abiertas')) return false;

    const hasCompletedCategory = categories.some(cat => isCategoryCompleted(cat));
    if (!hasCompletedCategory) return false;

    return categories.every(cat => isCategoryCompleted(cat) || isCategoryUnplayedEmpty(cat));
};
