// padel-chilecito-app/server/services/tournament-manager.js

class TournamentManager {

    generateZones(teams) {
        const totalTeams = teams.length;
        if (totalTeams <= 5) {
            return [{
                zoneName: 'Zona A',
                teams: teams,
                matches: this._generateZoneMatches(teams)
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
        return this._distributeInZones(teams, totalZones);
    }

    _distributeInZones(teams, numZones) {
        const zones = Array.from({ length: numZones }, (_, i) => ({
            zoneName: `Zona ${String.fromCharCode(65 + i)}`,
            teams: [],
            matches: []
        }));
        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            const round = Math.floor(i / numZones);
            let zoneIndex;
            if (round % 2 === 0) {
                zoneIndex = i % numZones;
            } else {
                zoneIndex = numZones - 1 - (i % numZones);
            }
            zones[zoneIndex].teams.push(team);
        }
        zones.forEach(zone => {
            zone.matches = this._generateZoneMatches(zone.teams);
        });
        return zones;
    }

    _generateZoneMatches(teams) {
        const matches = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                matches.push({
                    teamA: teams[i],
                    teamB: teams[j],
                    scoreA: [],
                    scoreB: [],
                    status: 'Pendiente'
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