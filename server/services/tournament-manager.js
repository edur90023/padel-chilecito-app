// padel-chilecito-app/server/services/tournament-manager.js

class TournamentManager {

    generateZones(teams, categorySettings = {}) {
        const totalTeams = teams.length;
        if (totalTeams <= 5) {
            return [{
                zoneName: 'Zona A',
                teams: teams,
                matches: this._generateZoneMatches(teams, categorySettings)
            }];
        }
        let zonesOf4 = 0;
        let zonesOf3 = 0;
        if (totalTeams % 4 === 0) {
            zonesOf4 = totalTeams / 4;
        } else if (totalTeams % 4 === 1) {
            zonesOf3 = 3;
            zonesOf4 = (totalTeams - 9) / 4;
        } else if (totalTeams % 4 === 2) {
            zonesOf3 = 2;
            zonesOf4 = (totalTeams - 6) / 4;
        } else {
            zonesOf3 = 1;
            zonesOf4 = (totalTeams - 3) / 4;
        }
        const totalZones = zonesOf4 + zonesOf3;
        return this._distributeInZones(teams, totalZones, categorySettings);
    }

    _distributeInZones(teams, numZones, categorySettings = {}) {
        const { useSeedings, avoidClubConflicts } = categorySettings;

        const zones = Array.from({ length: numZones }, (_, i) => ({
            zoneName: `Zona ${String.fromCharCode(65 + i)}`,
            teams: [],
            matches: []
        }));

        let unassignedTeams = [...teams];

        if (useSeedings) {
            const seededTeams = unassignedTeams.splice(0, numZones);
            seededTeams.forEach((team, index) => {
                zones[index].teams.push(team);
            });
        }

        for (let i = 0; i < unassignedTeams.length; i++) {
            const team = unassignedTeams[i];
            const round = Math.floor(i / numZones);
            let zoneIndex = (round % 2 === 0) ? (i % numZones) : (numZones - 1 - (i % numZones));
            zones[zoneIndex].teams.push(team);
        }

        if (avoidClubConflicts) {
            let swapped;
            let attempts = 0;
            const maxAttempts = zones.length * 2;

            do {
                swapped = false;
                attempts++;
                for (let i = 0; i < zones.length; i++) {
                    const sourceZone = zones[i];
                    const clubCounts = sourceZone.teams.reduce((acc, t) => {
                        if (t.club) acc[t.club] = (acc[t.club] || 0) + 1;
                        return acc;
                    }, {});

                    const conflictingClub = Object.keys(clubCounts).find(club => clubCounts[club] > 1);
                    if (!conflictingClub) continue;

                    const teamToMoveIndex = sourceZone.teams.findIndex(t => t.club === conflictingClub);
                    const teamToMove = sourceZone.teams[teamToMoveIndex];

                    for (let j = 0; j < zones.length; j++) {
                        if (i === j) continue;
                        const targetZone = zones[j];
                        if (targetZone.teams.some(t => t.club === teamToMove.club)) continue;

                        for (let k = 0; k < targetZone.teams.length; k++) {
                            const teamToSwap = targetZone.teams[k];
                            if (sourceZone.teams.some(t => t.club && t.club === teamToSwap.club && t._id !== teamToMove._id)) continue;

                            sourceZone.teams[teamToMoveIndex] = teamToSwap;
                            targetZone.teams[k] = teamToMove;
                            swapped = true;
                            break;
                        }
                        if (swapped) break;
                    }
                    if (swapped) break;
                }
            } while (swapped && attempts < maxAttempts);
        }

        zones.forEach(zone => {
            zone.matches = this._generateZoneMatches(zone.teams, categorySettings);
        });
        return zones;
    }

    _generateZoneMatches(teams, categorySettings = {}) {
        const { zonePlaySystem } = categorySettings;
        const matches = [];

        // Sistema "APA Oficial para 4 equipos"
        if (zonePlaySystem && teams.length === 4) {
            const [team1, team2, team3, team4] = teams;

            // Partido 1: 1 vs 3
            matches.push({
                teamA: team1, teamB: team3,
                scoreA: [], scoreB: [], status: 'Pendiente', matchOrder: 1
            });
            // Partido 2: 2 vs 4
            matches.push({
                teamA: team2, teamB: team4,
                scoreA: [], scoreB: [], status: 'Pendiente', matchOrder: 2
            });
            // Partido 3: Ganadores vs Ganadores
            matches.push({
                placeholderA: 'Ganador P1', placeholderB: 'Ganador P2',
                scoreA: [], scoreB: [], status: 'Pendiente', matchOrder: 3
            });
            // Partido 4: Perdedores vs Perdedores
            matches.push({
                placeholderA: 'Perdedor P1', placeholderB: 'Perdedor P2',
                scoreA: [], scoreB: [], status: 'Pendiente', matchOrder: 4
            });

            return matches;
        }

        // Sistema "Todos contra todos" (por defecto)
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                matches.push({
                    teamA: teams[i],
                    teamB: teams[j],
                    scoreA: [],
                    scoreB: [],
                    status: 'Pendiente',
                    matchOrder: i * teams.length + j
                });
            }
        }
        return matches;
    }

    _getRoundName(numTeams) {
        if (numTeams === 2) return 'Final';
        if (numTeams === 4) return 'Semifinales';
        if (numTeams > 4 && numTeams <= 8) return 'Cuartos de Final';
        if (numTeams > 8 && numTeams <= 16) return 'Octavos de Final';
        if (numTeams > 16 && numTeams <= 32) return '16avos de Final';
        return `Ronda de ${numTeams}`;
    }

    generatePlayoffs(qualifiedTeams) {
        const numTeams = qualifiedTeams.length;
        if (numTeams < 2) return [];

        const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
        const byes = bracketSize - numTeams;

        const teamsWithByes = qualifiedTeams.slice(0, byes).map(qt => qt.team);
        const teamsInFirstRound = qualifiedTeams.slice(byes);

        const matches = [];
        const numMatches = teamsInFirstRound.length / 2;
        for (let i = 0; i < numMatches; i++) {
            matches.push({
                teamA: teamsInFirstRound[i].team,
                teamB: teamsInFirstRound[teamsInFirstRound.length - 1 - i].team,
                scoreA: [],
                scoreB: [],
                status: 'Pendiente'
            });
        }

        const firstRound = {
            roundName: this._getRoundName(bracketSize),
            matches: matches,
            teamsWithByes: teamsWithByes
        };
        
        return [firstRound];
    }
    
    advancePlayoffs(category) {
        const lastRound = category.playoffRounds[category.playoffRounds.length - 1];
        if (!lastRound.matches.every(m => m.status === 'Finalizado')) {
            throw new Error("No todos los partidos de la ronda actual han finalizado.");
        }

        if (lastRound.roundName === 'Final' || lastRound.roundName === 'Tercer y Cuarto Puesto') {
             throw new Error("La llave ya ha finalizado, no se puede avanzar.");
        }

        if (lastRound.roundName === 'Semifinales' && lastRound.matches.length === 2) {
            const winners = [];
            const losers = [];
            lastRound.matches.forEach(match => {
                let setsA = 0;
                match.scoreA.forEach((s, i) => { if (s > match.scoreB[i]) setsA++; });
                const winner = setsA >= Math.ceil(match.scoreA.length / 2) ? match.teamA : match.teamB;
                // --- ¡ESTA ES LA CORRECCIÓN! ---
                // Se convierte el _id a string para una comparación segura, ya sea un ObjectId o un string.
                const loser = String(winner._id) === String(match.teamA._id) ? match.teamB : match.teamA;
                winners.push(winner);
                losers.push(loser);
            });

            const finalRound = {
                roundName: 'Final',
                matches: [{ teamA: winners[0], teamB: winners[1], scoreA: [], scoreB: [], status: 'Pendiente' }],
                teamsWithByes: []
            };
            const thirdPlaceRound = {
                roundName: 'Tercer y Cuarto Puesto',
                matches: [{ teamA: losers[0], teamB: losers[1], scoreA: [], scoreB: [], status: 'Pendiente' }],
                teamsWithByes: []
            };
            return [finalRound, thirdPlaceRound];
        }

        const getMatchWinnerTeam = (match) => {
            let setsA = 0;
            match.scoreA.forEach((s, i) => { if (s > match.scoreB[i]) setsA++; });
            return setsA >= Math.ceil(match.scoreA.length / 2) ? match.teamA : match.teamB;
        };

        const winners = lastRound.matches.map(getMatchWinnerTeam);
        const teamsForNextRound = [...(lastRound.teamsWithByes || []), ...winners];

        if (teamsForNextRound.length < 2) {
            throw new Error("No hay suficientes equipos para la siguiente ronda.");
        }
        
        teamsForNextRound.sort((a, b) => a.teamName.localeCompare(b.teamName));
        
        const nextRoundMatches = [];
        for (let i = 0; i < teamsForNextRound.length; i += 2) {
            if (teamsForNextRound[i] && teamsForNextRound[i + 1]) {
                nextRoundMatches.push({
                    teamA: teamsForNextRound[i], teamB: teamsForNextRound[i + 1],
                    scoreA: [], scoreB: [], status: 'Pendiente'
                });
            }
        }
        
        return [{
            roundName: this._getRoundName(teamsForNextRound.length),
            matches: nextRoundMatches,
            teamsWithByes: []
        }];
    }
}

module.exports = new TournamentManager();