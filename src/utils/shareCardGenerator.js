// Utilidad 100% cliente para generar placas PNG de horarios por cancha y podios
// listas para compartir por WhatsApp / Instagram sin depender de librerías externas.

const loadLogoImage = () => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = '/logo.png';
    });
};

const drawRoundedRect = (ctx, x, y, w, h, r) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
};

const wrapLines = (ctx, text, maxWidth) => {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    if (words.length === 0) return [''];
    const lines = [];
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
        const test = `${current} ${words[i]}`;
        if (ctx.measureText(test).width <= maxWidth) {
            current = test;
        } else {
            lines.push(current);
            current = words[i];
        }
    }
    lines.push(current);
    return lines;
};

const drawBackgroundAndHeader = async (ctx, width, height, { subtitle, title, badge }) => {
    // Fondo degradado oscuro Red Padel LR
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#020b1c');
    bgGrad.addColorStop(0.55, '#07172f');
    bgGrad.addColorStop(1, '#041224');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Acentos luminosos sutiles
    const glowTop = ctx.createRadialGradient(width * 0.85, height * 0.08, 20, width * 0.85, height * 0.08, 360);
    glowTop.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
    glowTop.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glowTop;
    ctx.fillRect(0, 0, width, height);

    const glowBottom = ctx.createRadialGradient(width * 0.15, height * 0.92, 20, width * 0.15, height * 0.92, 340);
    glowBottom.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
    glowBottom.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = glowBottom;
    ctx.fillRect(0, 0, width, height);

    // Logo circular
    const logo = await loadLogoImage();
    if (logo) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(108, 94, 44, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, 64, 50, 88, 88);
        ctx.restore();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(108, 94, 45, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Marca
    ctx.textAlign = 'left';
    ctx.fillStyle = '#34d399';
    ctx.font = '800 30px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('RED PADEL LR', logo ? 174 : 64, 86);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('GRUPO PADEL CHILECITO', logo ? 174 : 64, 118);

    // Badge derecha
    if (badge) {
        ctx.font = '700 19px system-ui, -apple-system, Segoe UI, sans-serif';
        const badgeWidth = ctx.measureText(badge).width + 38;
        const bx = width - 64 - badgeWidth;
        drawRoundedRect(ctx, bx, 68, badgeWidth, 48, 14);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#6ee7b7';
        ctx.textAlign = 'center';
        ctx.fillText(badge, bx + badgeWidth / 2, 99);
    }

    // Título principal
    ctx.textAlign = 'left';
    let y = 195;
    if (subtitle) {
        ctx.fillStyle = '#22d3ee';
        ctx.font = '700 22px system-ui, -apple-system, Segoe UI, sans-serif';
        const subLines = wrapLines(ctx, subtitle.toUpperCase(), width - 128);
        subLines.slice(0, 2).forEach((line) => {
            ctx.fillText(line, 64, y);
            y += 30;
        });
        y += 6;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 44px system-ui, -apple-system, Segoe UI, sans-serif';
    const titleLines = wrapLines(ctx, title, width - 128);
    titleLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, 64, y);
        y += 54;
    });

    // Línea divisoria
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, y + 6);
    ctx.lineTo(width - 64, y + 6);
    ctx.stroke();

    return y + 34;
};

const drawFooter = (ctx, width, height) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, height - 86);
    ctx.lineTo(width - 64, height - 86);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('Resultados y llaves en vivo • Red Padel LR', 64, height - 42);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#34d399';
    ctx.font = '700 20px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('La Rioja, Argentina', width - 64, height - 42);
};

const deliverCanvasImage = async (canvas, filename, shareTitle, shareText) => {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('No se pudo generar la imagen.');

    const file = new File([blob], filename, { type: 'image/png' });
    if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
    ) {
        try {
            await navigator.share({
                files: [file],
                title: shareTitle,
                text: shareText
            });
            return { mode: 'shared' };
        } catch (err) {
            if (err?.name === 'AbortError') {
                return { mode: 'cancelled' };
            }
            // Si falla share, cae a descarga directa
        }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { mode: 'downloaded' };
};

const formatPlayersText = (team, fallback = 'A definir') => {
    if (!team) return fallback;
    const raw = (team.teamName || '').trim();
    if (raw) return raw;
    if (Array.isArray(team.players) && team.players.length > 0) {
        return team.players.map((p) => p?.playerName).filter(Boolean).join(' / ') || fallback;
    }
    return fallback;
};

export async function shareOrDownloadCourtCard({ tournamentName, courtLabel, matches }) {
    const visibleMatches = (matches || []).slice(0, 8);
    const extraCount = Math.max(0, (matches || []).length - visibleMatches.length);
    const width = 1080;
    const cardHeight = 128;
    const startEst = 330;
    const height = Math.max(1080, startEst + visibleMatches.length * (cardHeight + 18) + (extraCount > 0 ? 50 : 0) + 120);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let y = await drawBackgroundAndHeader(ctx, width, height, {
        subtitle: tournamentName || 'Torneo Oficial',
        title: courtLabel || 'Cronograma de Cancha',
        badge: `${matches.length} ${matches.length === 1 ? 'Partido' : 'Partidos'}`
    });

    visibleMatches.forEach((item) => {
        const m = item.match || {};
        const teamA = formatPlayersText(m.teamA, m.placeholderA || 'A definir');
        const teamB = formatPlayersText(m.teamB, m.placeholderB || 'A definir');
        const isFinished = m.status === 'Finalizado';

        drawRoundedRect(ctx, 64, y, width - 128, cardHeight, 20);
        ctx.fillStyle = isFinished ? 'rgba(15, 23, 42, 0.72)' : 'rgba(16, 36, 62, 0.85)';
        ctx.fill();
        ctx.strokeStyle = isFinished ? 'rgba(148, 163, 184, 0.28)' : 'rgba(52, 211, 153, 0.42)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hora + Categoría + Fase
        ctx.textAlign = 'left';
        ctx.fillStyle = '#93c5fd';
        ctx.font = '800 22px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(item.timeStr || 'Horario a confirmar', 92, y + 40);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#34d399';
        ctx.font = '700 21px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(`${item.categoryName} • ${item.stageLabel}`, width - 92, y + 40);

        // Equipos y marcador
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 25px system-ui, -apple-system, Segoe UI, sans-serif';
        const matchLine = `${teamA}   vs   ${teamB}`;
        const wrapped = wrapLines(ctx, matchLine, width - 310);
        ctx.fillText(wrapped[0], 92, y + 84);
        if (wrapped[1]) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '600 21px system-ui, -apple-system, Segoe UI, sans-serif';
            ctx.fillText(wrapped[1], 92, y + 112);
        }

        // Estado o resultado a la derecha
        ctx.textAlign = 'right';
        if (isFinished && Array.isArray(m.scoreA) && m.scoreA.length > 0) {
            ctx.fillStyle = '#6ee7b7';
            ctx.font = '800 22px monospace';
            const scoreStr = m.scoreA.map((s, idx) => `${s}-${m.scoreB?.[idx] ?? 0}`).join(' ');
            ctx.fillText(scoreStr, width - 92, y + 88);
        } else {
            ctx.fillStyle = m.status === 'En Juego' ? '#34d399' : '#fbbf24';
            ctx.font = '700 20px system-ui, -apple-system, Segoe UI, sans-serif';
            ctx.fillText(m.status || 'Pendiente', width - 92, y + 88);
        }

        y += cardHeight + 18;
    });

    if (extraCount > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 22px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(`+ ${extraCount} partido(s) más — Ver listado completo en la app`, width / 2, y + 26);
    }

    drawFooter(ctx, width, height);

    const slug = (courtLabel || 'cancha').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return deliverCanvasImage(
        canvas,
        `horarios-${slug}.png`,
        `${courtLabel} — ${tournamentName || 'Red Padel LR'}`,
        `Cronograma de partidos en ${courtLabel}`
    );
}

export async function shareOrDownloadPodiumCard({ tournamentName, categoryName, finishers }) {
    const sorted = [...(finishers || [])].sort((a, b) => a.position - b.position).slice(0, 4);
    const width = 1080;
    const height = 1220;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let y = await drawBackgroundAndHeader(ctx, width, height, {
        subtitle: tournamentName || 'Torneo Oficial',
        title: `Podio • ${categoryName || 'Categoría'}`,
        badge: 'Cuadro de Honor'
    });

    y += 18;

    const positionLabels = {
        1: { label: 'CAMPEONES', accent: '#facc15', bg: 'rgba(250, 204, 21, 0.14)', border: 'rgba(250, 204, 21, 0.55)' },
        2: { label: 'SUBCAMPEONES', accent: '#cbd5e1', bg: 'rgba(148, 163, 184, 0.14)', border: 'rgba(148, 163, 184, 0.45)' },
        3: { label: '3° PUESTO', accent: '#fb923c', bg: 'rgba(251, 146, 60, 0.14)', border: 'rgba(251, 146, 60, 0.45)' },
        4: { label: '4° PUESTO', accent: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.45)' }
    };

    sorted.forEach(({ position, team }) => {
        const meta = positionLabels[position] || {
            label: `${position}° PUESTO`,
            accent: '#34d399',
            bg: 'rgba(16, 185, 129, 0.14)',
            border: 'rgba(52, 211, 153, 0.4)'
        };
        const rawPlayers = (team?.teamName || '').includes('/')
            ? team.teamName.split('/').map((s) => s.trim()).filter(Boolean)
            : Array.isArray(team?.players) && team.players.length > 0
                ? team.players.map((p) => p?.playerName).filter(Boolean)
                : [formatPlayersText(team)];

        const cardH = rawPlayers.length > 1 ? 180 : 148;
        drawRoundedRect(ctx, 64, y, width - 128, cardH, 24);
        ctx.fillStyle = meta.bg;
        ctx.fill();
        ctx.strokeStyle = meta.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = meta.accent;
        ctx.font = '800 24px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(meta.label, 98, y + 48);

        let py = y + 98;
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 36px system-ui, -apple-system, Segoe UI, sans-serif';
        rawPlayers.slice(0, 2).forEach((player) => {
            ctx.fillText(player, 98, py);
            py += 46;
        });

        y += cardH + 26;
    });

    drawFooter(ctx, width, height);

    const slug = (categoryName || 'categoria').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return deliverCanvasImage(
        canvas,
        `podio-${slug}.png`,
        `Podio ${categoryName} — ${tournamentName || 'Red Padel LR'}`,
        `Resultados finales de ${categoryName} en ${tournamentName || 'Red Padel LR'}`
    );
}
