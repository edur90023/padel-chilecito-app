// server/services/tournament-manager.js

class TournamentManager {

    /**
     * Genera la distribución de zonas bajo el Reglamento Oficial APA 2025.
     * Prioridad absoluta: Zonas de 3 parejas.
     * Art. 5 Inc. e:
     * - Si sobra 1 pareja: Se conforma 1 zona de 4 parejas, siendo la ÚLTIMA zona confeccionada.
     *   (Opcionalmente el organizador puede optar por pase directo).
     * - Si sobran 2 parejas: Se confeccionan 2 zonas de 4 parejas (las dos últimas zonas).
     *   (Opcionalmente en torneos de fin de semana reducidos: 1 zona de 2 parejas al final).
     */
    generateZones(teams, categorySettings = {}) {
        const totalTeams = teams.length;
        if (totalTeams === 0) return [];

        const {
            leftoverOption = 'apa_four', // 'apa_four' | 'two_pair_zone' | 'direct_bye'
            zonePlaySystem = false,
            useSeedings = false,
            avoidClubConflicts = false
        } = categorySettings;

        // Casos con muy pocas parejas
        if (totalTeams === 2) {
            const z = [{
                zoneName: 'Zona A',
                teams: [...teams],
                matches: []
            }];
            z[0].matches = this._generateZoneMatches(z[0].teams, categorySettings);
            return z;
        }

        if (totalTeams === 3) {
            const z = [{
                zoneName: 'Zona A',
                teams: [...teams],
                matches: []
            }];
            z[0].matches = this._generateZoneMatches(z[0].teams, categorySettings);
            return z;
        }

        if (totalTeams === 4) {
            const z = [{
                zoneName: 'Zona A',
                teams: [...teams],
                matches: []
            }];
            z[0].matches = this._generateZoneMatches(z[0].teams, categorySettings);
            return z;
        }

        if (totalTeams === 5) {
            // Con 5 parejas: Zona A de 3 y Zona B de 2
            const zones = [
                { zoneName: 'Zona A', teams: [teams[0], teams[2], teams[4]], matches: [] },
                { zoneName: 'Zona B', teams: [teams[1], teams[3]], matches: [] }
            ];
            zones.forEach(zone => {
                zone.matches = this._generateZoneMatches(zone.teams, categorySettings);
            });
            return zones;
        }

        // Para N >= 6: Determinar la cantidad y tamaño de cada zona
        let zoneSizes = [];
        const remainder = totalTeams % 3;
        let activeTeams = [...teams];
        let byeTeam = null;

        if (remainder === 0) {
            // Múltiplo exacto de 3: Todas zonas de 3 parejas
            const count = totalTeams / 3;
            zoneSizes = Array(count).fill(3);
        } else if (remainder === 1) {
            if (leftoverOption === 'direct_bye') {
                // Una pareja pasa directo a la siguiente instancia (Playoffs / Bye)
                byeTeam = activeTeams.shift(); // El mejor sembrado toma el Bye
                const count = activeTeams.length / 3;
                zoneSizes = Array(count).fill(3);
            } else {
                // APA Art. 5 Inc. e: 1 zona de 4 al final, el resto de 3
                const countOf3 = (totalTeams - 4) / 3;
                zoneSizes = [...Array(countOf3).fill(3), 4];
            }
        } else if (remainder === 2) {
            if (leftoverOption === 'two_pair_zone') {
                // Modalidad reducida: 1 zona de 2 al final, el resto de 3
                const countOf3 = (totalTeams - 2) / 3;
                zoneSizes = [...Array(countOf3).fill(3), 2];
            } else {
                // APA Art. 5 Inc. e: 2 zonas de 4 como las dos últimas zonas
                const countOf3 = (totalTeams - 8) / 3;
                if (countOf3 >= 0) {
                    zoneSizes = [...Array(countOf3).fill(3), 4, 4];
                } else {
                    // Para 8 parejas: 2 zonas de 4
                    zoneSizes = [4, 4];
                }
            }
        }

        const numZones = zoneSizes.length;
        const zones = Array.from({ length: numZones }, (_, i) => ({
            zoneName: `Zona ${String.fromCharCode(65 + i)}`,
            teams: [],
            matches: []
        }));

        // Reparto oficial tipo APA / Serpiente según ranking o cabezas de serie
        let unassignedTeams = [...activeTeams];

        // Llenado respetando la capacidad de cada zona
        // Ronda 1: Posición 1 de cada zona (de izquierda a derecha: 0 a numZones - 1)
        for (let z = 0; z < numZones && unassignedTeams.length > 0; z++) {
            if (zones[z].teams.length < zoneSizes[z]) {
                zones[z].teams.push(unassignedTeams.shift());
            }
        }

        // Ronda 2: Posición 2 de cada zona (en reversa: numZones - 1 hacia 0)
        for (let z = numZones - 1; z >= 0 && unassignedTeams.length > 0; z--) {
            if (zones[z].teams.length < zoneSizes[z]) {
                zones[z].teams.push(unassignedTeams.shift());
            }
        }

        // Ronda 3: Posición 3 de cada zona (de izquierda a derecha)
        for (let z = 0; z < numZones && unassignedTeams.length > 0; z++) {
            if (zones[z].teams.length < zoneSizes[z]) {
                zones[z].teams.push(unassignedTeams.shift());
            }
        }

        // Ronda 4: Posición 4 para las últimas zonas que sean de 4 parejas (en reversa)
        for (let z = numZones - 1; z >= 0 && unassignedTeams.length > 0; z--) {
            if (zones[z].teams.length < zoneSizes[z]) {
                zones[z].teams.push(unassignedTeams.shift());
            }
        }

        // Por si queda algún remanente (casos excepcionales)
        while (unassignedTeams.length > 0) {
            const availableZone = zones.find((z, idx) => z.teams.length < zoneSizes[idx]) || zones[zones.length - 1];
            availableZone.teams.push(unassignedTeams.shift());
        }

        // Lógica para evitar choques del mismo club
        if (avoidClubConflicts) {
            let swapped;
            let attempts = 0;
            const maxAttempts = zones.length * 5;

            do {
                swapped = false;
                attempts++;
                for (let i = 0; i < zones.length; i++) {
                    const sourceZone = zones[i];
                    const clubCounts = sourceZone.teams.reduce((acc, t) => {
                        if (t && t.club) acc[t.club] = (acc[t.club] || 0) + 1;
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

        // Generar los partidos correspondientes para cada zona
        zones.forEach(zone => {
            zone.matches = this._generateZoneMatches(zone.teams, categorySettings);
        });

        // Si hubo una pareja que pasó directo por Bye, la adjuntamos como propiedad
        if (byeTeam) {
            zones.directByeTeam = byeTeam;
        }

        return zones;
    }

    /**
     * Confecciona los partidos de la zona.
     * En zonas de 4 con Sistema APA activo:
     * - Partido 1: 1 vs 3
     * - Partido 2: 2 vs 4
     * - Partido 3: Ganador P1 vs Ganador P2 (define 1º y 2º)
     * - Partido 4: Perdedor P1 vs Perdedor P2 (define 3º y 4º)
     */
    _generateZoneMatches(teams, categorySettings = {}) {
        const { zonePlaySystem } = categorySettings;
        const matches = [];

        // Zona de 2 parejas
        if (teams.length === 2) {
            matches.push({
                teamA: teams[0],
                teamB: teams[1],
                scoreA: [],
                scoreB: [],
                status: 'Pendiente',
                matchOrder: 1
            });
            return matches;
        }

        // Zona de 4 equipos con Sistema Oficial APA
        if (zonePlaySystem && teams.length === 4) {
            const [t1, t2, t3, t4] = teams;
            matches.push({ teamA: t1, teamB: t3, scoreA: [], scoreB: [], status: 'Pendiente', matchOrder: 1 });
            matches.push({ teamA: t2, teamB: t4, scoreA: [], scoreB: [], status: 'Pendiente', matchOrder: 2 });
            matches.push({ placeholderA: 'Ganador P1', placeholderB: 'Ganador P2', scoreA: [], scoreB: [], status: 'Pendiente', matchOrder: 3 });
            matches.push({ placeholderA: 'Perdedor P1', placeholderB: 'Perdedor P2', scoreA: [], scoreB: [], status: 'Pendiente', matchOrder: 4 });
            return matches;
        }

        // Round Robin (Todos contra todos) para zonas de 3 o zonas de 4 sin APA
        let order = 1;
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                matches.push({
                    teamA: teams[i],
                    teamB: teams[j],
                    scoreA: [],
                    scoreB: [],
                    status: 'Pendiente',
                    matchOrder: order++
                });
            }
        }
        return matches;
    }

    /**
     * Calcula la tabla de posiciones bajo el Reglamento Oficial APA Art. 6 Inc. f:
     * - Puntos: 2 ptos por ganado, 1 pto por jugado-perdido, 0 por W.O.
     * - Desempate entre 2 parejas: Enfrentamiento directo.
     * - Desempate entre 3 parejas: 1) Dif. sets, 2) Dif. games, 3) Games a favor.
     */
    calculateZoneStandings(zone) {
        const stats = {};
        zone.teams.forEach(t => {
            if (t && t._id) {
                stats[t._id.toString()] = { 
                    team: t, 
                    teamName: t.teamName, 
                    p: 0, 
                    w: 0, 
                    l: 0, 
                    sf: 0, 
                    sc: 0, 
                    gf: 0, 
                    gc: 0, 
                    pts: 0 
                };
            }
        });

        // Mapeo de enfrentamientos directos: directMap[idA][idB] = 1 si A ganó, -1 si B ganó
        const directMap = {};

        zone.matches.forEach(m => {
            if (m.status !== 'Finalizado' || !m.teamA?._id || !m.teamB?._id) return;
            const idA = m.teamA._id.toString();
            const idB = m.teamB._id.toString();
            if (!stats[idA] || !stats[idB]) return;

            const sA = stats[idA];
            const sB = stats[idB];
            sA.p++; sB.p++;

            let setsA = 0, setsB = 0;
            m.scoreA.forEach((score, i) => {
                const scB = m.scoreB[i] || 0;
                if (score > scB) setsA++;
                else if (scB > score) setsB++;
            });

            sA.sf += setsA; sA.sc += setsB;
            sB.sf += setsB; sB.sc += setsA;

            const gamesA = m.scoreA.reduce((a, b) => a + b, 0);
            const gamesB = m.scoreB.reduce((a, b) => a + b, 0);
            sA.gf += gamesA; sA.gc += gamesB;
            sB.gf += gamesB; sB.gc += gamesA;

            if (!directMap[idA]) directMap[idA] = {};
            if (!directMap[idB]) directMap[idB] = {};

            if (setsA > setsB) {
                sA.w++; sA.pts += 2;
                sB.l++; sB.pts += 1;
                directMap[idA][idB] = 1;
                directMap[idB][idA] = -1;
            } else {
                sB.w++; sB.pts += 2;
                sA.l++; sA.pts += 1;
                directMap[idA][idB] = -1;
                directMap[idB][idA] = 1;
            }
        });

        const list = Object.values(stats);

        list.sort((a, b) => {
            // 1. Mayor puntuación
            if (b.pts !== a.pts) return b.pts - a.pts;

            const idA = a.team._id.toString();
            const idB = b.team._id.toString();

            // 2. Si hay 2 parejas empatadas en puntos: Enfrentamiento directo (Art. 6 Inc. f)
            const samePointsCount = list.filter(item => item.pts === a.pts).length;
            if (samePointsCount === 2 && directMap[idA] && directMap[idA][idB] !== undefined) {
                return directMap[idA][idB] === 1 ? -1 : 1;
            }

            // 3. Diferencia de sets (Art. 6 Inc. f1)
            const diffSetsA = a.sf - a.sc;
            const diffSetsB = b.sf - b.sc;
            if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA;

            // 4. Diferencia de games
            const diffGamesA = a.gf - a.gc;
            const diffGamesB = b.gf - b.gc;
            if (diffGamesB !== diffGamesA) return diffGamesB - diffGamesA;

            // 5. Games a favor
            if (b.gf !== a.gf) return b.gf - a.gf;

            // 6. Si quedaron 2 tras desempate de sets/games, aplicar enfrentamiento directo
            if (directMap[idA] && directMap[idA][idB] !== undefined) {
                return directMap[idA][idB] === 1 ? -1 : 1;
            }

            return 0;
        });

        return list;
    }

    /**
     * Generación de la Llave de Eliminación (Playoffs) siguiendo los Draws Oficiales APA (páginas 11 a 18).
     */
    generatePlayoffs(qualifiedTeams) {
        const numTeams = qualifiedTeams.length;
        if (numTeams < 2) return [];

        const findTeam = (zoneLetter, rankNum) => {
            const found = qualifiedTeams.find(qt => qt.sourceZone === zoneLetter && qt.rank === rankNum);
            return found ? found.team : null;
        };

        // 1. Caso 4 clasificados (2 zonas A y B) -> Semifinales cruzadas Oficial APA (pág. 11)
        // 1ºA vs 2ºB y 1ºB vs 2ºA
        const zonesPresent = [...new Set(qualifiedTeams.map(qt => qt.sourceZone))].sort();
        if (zonesPresent.length === 2 && numTeams === 4) {
            const t1A = findTeam('A', 1);
            const t2B = findTeam('B', 2);
            const t2A = findTeam('A', 2);
            const t1B = findTeam('B', 1);

            return [{
                roundName: 'Semifinales',
                matches: [
                    { teamA: t1A, teamB: t2B, scoreA: [], scoreB: [], status: 'Pendiente' },
                    { teamA: t2A, teamB: t1B, scoreA: [], scoreB: [], status: 'Pendiente' }
                ],
                teamsWithByes: []
            }];
        }

        // 2. Caso 6 clasificados (3 zonas A, B, C) -> Cuartos con Byes Oficial APA (pág. 11)
        // 1ºA (Bye), 2ºB vs 2ºC, 1ºC vs 2ºA, 1ºB (Bye)
        if (zonesPresent.length === 3 && numTeams === 6) {
            const t1A = findTeam('A', 1);
            const t2B = findTeam('B', 2);
            const t2C = findTeam('C', 2);
            const t1C = findTeam('C', 1);
            const t2A = findTeam('A', 2);
            const t1B = findTeam('B', 1);

            return [{
                roundName: 'Cuartos de Final',
                matches: [
                    { teamA: t2B, teamB: t2C, scoreA: [], scoreB: [], status: 'Pendiente' },
                    { teamA: t1C, teamB: t2A, scoreA: [], scoreB: [], status: 'Pendiente' }
                ],
                teamsWithByes: [t1A, t1B]
            }];
        }

        // 3. Caso 8 clasificados (4 zonas A, B, C, D) -> Cuartos de Final Oficial APA (pág. 12)
        // 1ºA vs 2ºC, 2ºB vs 1ºD, 1ºC vs 2ºA, 2ºD vs 1ºB
        if (zonesPresent.length === 4 && numTeams === 8) {
            const t1A = findTeam('A', 1);
            const t2C = findTeam('C', 2);
            const t2B = findTeam('B', 2);
            const t1D = findTeam('D', 1);
            const t1C = findTeam('C', 1);
            const t2A = findTeam('A', 2);
            const t2D = findTeam('D', 2);
            const t1B = findTeam('B', 1);

            return [{
                roundName: 'Cuartos de Final',
                matches: [
                    { teamA: t1A, teamB: t2C, scoreA: [], scoreB: [], status: 'Pendiente' },
                    { teamA: t2B, teamB: t1D, scoreA: [], scoreB: [], status: 'Pendiente' },
                    { teamA: t1C, teamB: t2A, scoreA: [], scoreB: [], status: 'Pendiente' },
                    { teamA: t2D, teamB: t1B, scoreA: [], scoreB: [], status: 'Pendiente' }
                ],
                teamsWithByes: []
            }];
        }

        // Algoritmo general balanceado para otras cantidades (árbol con Byes tradicionales)
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

        return [{
            roundName: this._getRoundName(bracketSize),
            matches: matches,
            teamsWithByes: teamsWithByes
        }];
    }

    advancePlayoffs(category) {
        const lastRound = category.playoffRounds[category.playoffRounds.length - 1];
        if (!lastRound.matches.every(m => m.status === 'Finalizado')) {
            throw new Error("Hay partidos pendientes en la ronda actual.");
        }

        if (lastRound.roundName === 'Final') {
            throw new Error("El torneo ya está en la ronda final.");
        }

        const getMatchWinner = (match) => {
            let setsA = 0;
            match.scoreA.forEach((s, i) => { if (s > match.scoreB[i]) setsA++; });
            return setsA >= Math.ceil(match.scoreA.length / 2) ? match.teamA : match.teamB;
        };

        const winners = lastRound.matches.map(getMatchWinner);
        const teamsForNextRound = [...(lastRound.teamsWithByes || []), ...winners];

        // Semifinales a Final + 3er puesto
        if (lastRound.roundName === 'Semifinales') {
            const losers = lastRound.matches.map(m => {
                const w = getMatchWinner(m);
                return String(w._id) === String(m.teamA._id) ? m.teamB : m.teamA;
            });

            return [
                { roundName: 'Final', matches: [{ teamA: winners[0], teamB: winners[1], scoreA: [], scoreB: [], status: 'Pendiente' }], teamsWithByes: [] },
                { roundName: 'Tercer y Cuarto Puesto', matches: [{ teamA: losers[0], teamB: losers[1], scoreA: [], scoreB: [], status: 'Pendiente' }], teamsWithByes: [] }
            ];
        }

        const nextRoundMatches = [];
        for (let i = 0; i < teamsForNextRound.length; i += 2) {
            if (teamsForNextRound[i] && teamsForNextRound[i + 1]) {
                nextRoundMatches.push({ teamA: teamsForNextRound[i], teamB: teamsForNextRound[i + 1], scoreA: [], scoreB: [], status: 'Pendiente' });
            }
        }

        return [{
            roundName: this._getRoundName(teamsForNextRound.length),
            matches: nextRoundMatches,
            teamsWithByes: []
        }];
    }

    _getRoundName(numTeams) {
        if (numTeams === 2) return 'Final';
        if (numTeams === 4) return 'Semifinales';
        if (numTeams <= 8) return 'Cuartos de Final';
        if (numTeams <= 16) return 'Octavos de Final';
        return `Ronda de ${numTeams}`;
    }
}

module.exports = new TournamentManager();
