// Generador de placas PNG de alta calidad visual para WhatsApp e Instagram (100% cliente)

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

const fitFontAndDrawLines = (ctx, text, x, y, maxWidth, { startSize = 36, minSize = 24, weight = '800', color = '#ffffff', lineHeightFactor = 1.25 }) => {
    let size = startSize;
    let lines = [text];
    while (size >= minSize) {
        ctx.font = `${weight} ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
        lines = wrapLines(ctx, text, maxWidth);
        if (lines.length <= 2) break;
        size -= 2;
    }
    ctx.fillStyle = color;
    const step = Math.round(size * lineHeightFactor);
    lines.slice(0, 2).forEach((line, idx) => {
        ctx.fillText(line, x, y + idx * step);
    });
    return lines.slice(0, 2).length * step;
};

const drawPadelCourtTexture = (ctx, width, height) => {
    // Fondo degradado profundo
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#020815');
    bgGrad.addColorStop(0.48, '#06162e');
    bgGrad.addColorStop(1, '#020b1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Franjas diagonales sutiles
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 36;
    for (let i = -height; i < width + height; i += 140) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i - height * 0.45, height);
        ctx.stroke();
    }
    ctx.restore();

    // Resplandores ambientales esmeralda y cyan
    const glowTop = ctx.createRadialGradient(width * 0.88, height * 0.08, 10, width * 0.88, height * 0.08, 420);
    glowTop.addColorStop(0, 'rgba(16, 185, 129, 0.26)');
    glowTop.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
    glowTop.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glowTop;
    ctx.fillRect(0, 0, width, height);

    const glowBottom = ctx.createRadialGradient(width * 0.14, height * 0.9, 10, width * 0.14, height * 0.9, 440);
    glowBottom.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
    glowBottom.addColorStop(0.5, 'rgba(6, 182, 212, 0.06)');
    glowBottom.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = glowBottom;
    ctx.fillRect(0, 0, width, height);

    // Silueta arquitectónica sutil de cancha de pádel
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.08)';
    ctx.lineWidth = 2.5;
    const cw = width - 160;
    const ch = height - 260;
    const cx = 80;
    const cy = 130;
    ctx.strokeRect(cx, cy, cw, ch);

    // Línea de red central
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(cx, cy + ch / 2);
    ctx.lineTo(cx + cw, cy + ch / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Líneas de saque
    ctx.beginPath();
    ctx.moveTo(cx, cy + ch * 0.24);
    ctx.lineTo(cx + cw, cy + ch * 0.24);
    ctx.moveTo(cx, cy + ch * 0.76);
    ctx.lineTo(cx + cw, cy + ch * 0.76);
    ctx.moveTo(cx + cw / 2, cy + ch * 0.24);
    ctx.lineTo(cx + cw / 2, cy + ch * 0.76);
    ctx.stroke();
    ctx.restore();

    // Marco exterior premium
    drawRoundedRect(ctx, 26, 26, width - 52, height - 52, 32);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.26)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Acentos esquineros
    const accent = ctx.createLinearGradient(0, 0, width, 0);
    accent.addColorStop(0, '#10b981');
    accent.addColorStop(0.5, '#22d3ee');
    accent.addColorStop(1, '#10b981');
    ctx.fillStyle = accent;
    drawRoundedRect(ctx, 26, 24, width - 52, 6, 3);
    ctx.fill();
};

const drawBackgroundAndHeader = async (ctx, width, height, { subtitle, title, badge }) => {
    drawPadelCourtTexture(ctx, width, height);

    // Banda superior del encabezado
    drawRoundedRect(ctx, 56, 54, width - 112, 114, 24);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Logo circular con halo
    const logo = await loadLogoImage();
    if (logo) {
        const lx = 114;
        const ly = 111;
        const glow = ctx.createRadialGradient(lx, ly, 20, lx, ly, 58);
        glow.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
        glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lx, ly, 58, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, 38, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, lx - 38, ly - 38, 76, 76);
        ctx.restore();

        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(lx, ly, 39, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Marca y club
    ctx.textAlign = 'left';
    const textX = logo ? 172 : 84;
    const brandGrad = ctx.createLinearGradient(textX, 80, textX + 260, 110);
    brandGrad.addColorStop(0, '#34d399');
    brandGrad.addColorStop(1, '#22d3ee');
    ctx.fillStyle = brandGrad;
    ctx.font = '900 30px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('RED PADEL LR', textX, 105);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 16px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('GRUPO PADEL CHILECITO • LA RIOJA', textX, 134);

    // Pill badge derecha
    if (badge) {
        ctx.font = '800 17px system-ui, -apple-system, Segoe UI, sans-serif';
        const bw = ctx.measureText(badge.toUpperCase()).width + 42;
        const bx = width - 80 - bw;
        drawRoundedRect(ctx, bx, 86, bw, 48, 14);
        const bGrad = ctx.createLinearGradient(bx, 86, bx + bw, 134);
        bGrad.addColorStop(0, 'rgba(16, 185, 129, 0.24)');
        bGrad.addColorStop(1, 'rgba(6, 182, 212, 0.24)');
        ctx.fillStyle = bGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#a7f3d0';
        ctx.textAlign = 'center';
        ctx.fillText(badge.toUpperCase(), bx + bw / 2, 116);
    }

    // Subtítulo del torneo + título principal
    ctx.textAlign = 'left';
    let y = 216;
    if (subtitle) {
        ctx.fillStyle = '#22d3ee';
        ctx.font = '800 20px system-ui, -apple-system, Segoe UI, sans-serif';
        const subLines = wrapLines(ctx, subtitle.toUpperCase(), width - 120);
        subLines.slice(0, 2).forEach((line) => {
            ctx.fillText(line, 64, y);
            y += 28;
        });
        y += 8;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 46px system-ui, -apple-system, Segoe UI, sans-serif';
    const titleLines = wrapLines(ctx, title, width - 128);
    titleLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, 64, y);
        y += 56;
    });

    // Barra decorativa degradada bajo el título
    const barGrad = ctx.createLinearGradient(64, y, width - 64, y);
    barGrad.addColorStop(0, '#10b981');
    barGrad.addColorStop(0.4, '#22d3ee');
    barGrad.addColorStop(1, 'rgba(34, 211, 238, 0.05)');
    ctx.fillStyle = barGrad;
    drawRoundedRect(ctx, 64, y - 6, width - 128, 4, 2);
    ctx.fill();

    return y + 32;
};

const drawTrophyEmblem = (ctx, cx, cy, position, accent) => {
    ctx.save();
    // Círculo medallón
    drawRoundedRect(ctx, cx - 36, cy - 36, 72, 72, 20);
    ctx.fillStyle = 'rgba(2, 8, 23, 0.65)';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (position === 1) {
        // Copa de campeón vectorial
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy - 16);
        ctx.lineTo(cx + 14, cy - 16);
        ctx.lineTo(cx + 10, cy + 2);
        ctx.quadraticCurveTo(cx, cy + 12, cx - 10, cy + 2);
        ctx.closePath();
        ctx.fill();

        // Asas
        ctx.beginPath();
        ctx.arc(cx - 14, cy - 9, 6, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 14, cy - 9, 6, Math.PI * 1.5, Math.PI * 0.5);
        ctx.stroke();

        // Base
        ctx.beginPath();
        ctx.moveTo(cx, cy + 8);
        ctx.lineTo(cx, cy + 16);
        ctx.moveTo(cx - 10, cy + 17);
        ctx.lineTo(cx + 10, cy + 17);
        ctx.stroke();
    } else {
        // Medalla con número
        ctx.beginPath();
        ctx.arc(cx, cy + 2, 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - 9, cy - 19);
        ctx.lineTo(cx - 4, cy - 12);
        ctx.moveTo(cx + 9, cy - 19);
        ctx.lineTo(cx + 4, cy - 12);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = '900 18px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(String(position), cx, cy + 8);
    }
    ctx.restore();
};

const drawFooter = (ctx, width, height) => {
    drawRoundedRect(ctx, 56, height - 96, width - 112, 52, 16);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 18px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('FIXTURE, LLAVES Y RESULTADOS EN VIVO', 80, height - 64);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#34d399';
    ctx.font = '800 18px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('RED PADEL LR', width - 80, height - 64);
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

const extractPlayerNames = (team, fallback = 'A definir') => {
    if (!team) return [fallback];
    const raw = (team.teamName || '').trim();
    if (raw.includes('/')) {
        const parts = raw.split('/').map((s) => s.trim()).filter(Boolean);
        if (parts.length > 0) return parts;
    }
    if (Array.isArray(team.players) && team.players.length > 0) {
        const names = team.players.map((p) => (p?.playerName || '').trim()).filter(Boolean);
        if (names.length > 0) return names;
    }
    return [raw || fallback];
};

const formatPlayersText = (team, fallback = 'A definir') => {
    return extractPlayerNames(team, fallback).join(' / ');
};

export async function shareOrDownloadCourtCard({ tournamentName, courtLabel, matches }) {
    const visibleMatches = (matches || []).slice(0, 7);
    const extraCount = Math.max(0, (matches || []).length - visibleMatches.length);
    const width = 1080;
    const cardHeight = 148;
    const startEst = 360;
    const height = Math.max(1180, startEst + visibleMatches.length * (cardHeight + 20) + (extraCount > 0 ? 54 : 0) + 130);

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
        const isLive = m.status === 'En Juego';

        const cardX = 58;
        const cardW = width - 116;

        drawRoundedRect(ctx, cardX, y, cardW, cardHeight, 22);
        const cardGrad = ctx.createLinearGradient(cardX, y, cardX + cardW, y + cardHeight);
        if (isLive) {
            cardGrad.addColorStop(0, 'rgba(6, 78, 59, 0.55)');
            cardGrad.addColorStop(1, 'rgba(15, 23, 42, 0.88)');
        } else if (isFinished) {
            cardGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
            cardGrad.addColorStop(1, 'rgba(30, 41, 59, 0.65)');
        } else {
            cardGrad.addColorStop(0, 'rgba(15, 34, 62, 0.88)');
            cardGrad.addColorStop(1, 'rgba(11, 22, 44, 0.92)');
        }
        ctx.fillStyle = cardGrad;
        ctx.fill();
        ctx.strokeStyle = isLive
            ? 'rgba(52, 211, 153, 0.65)'
            : isFinished
                ? 'rgba(148, 163, 184, 0.26)'
                : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Franja lateral izquierda
        ctx.save();
        drawRoundedRect(ctx, cardX, y, 10, cardHeight, 6);
        ctx.fillStyle = isLive ? '#34d399' : isFinished ? '#64748b' : '#38bdf8';
        ctx.fill();
        ctx.restore();

        // Pill horario
        const timeText = (item.timeStr || 'Horario a confirmar').toUpperCase();
        ctx.font = '800 18px system-ui, -apple-system, Segoe UI, sans-serif';
        const timeW = Math.min(340, ctx.measureText(timeText).width + 32);
        drawRoundedRect(ctx, cardX + 28, y + 18, timeW, 34, 10);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#bfdbfe';
        ctx.fillText(timeText, cardX + 44, y + 41);

        // Categoría y fase arriba derecha
        ctx.textAlign = 'right';
        ctx.fillStyle = '#34d399';
        ctx.font = '800 19px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(`${item.categoryName}  •  ${item.stageLabel}`, cardX + cardW - 28, y + 41);

        // Línea divisoria interna
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + 28, y + 62);
        ctx.lineTo(cardX + cardW - 28, y + 62);
        ctx.stroke();

        // Parejas enfrentadas
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 24px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(teamA, cardX + 28, y + 96);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 18px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText('vs', cardX + 28, y + 126);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '800 24px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(teamB, cardX + 62, y + 127);

        // Estado o marcador a la derecha
        ctx.textAlign = 'right';
        if (isFinished && Array.isArray(m.scoreA) && m.scoreA.length > 0) {
            const scoreStr = m.scoreA.map((s, idx) => `${s}-${m.scoreB?.[idx] ?? 0}`).join('  ');
            ctx.font = '800 21px monospace';
            const sw = ctx.measureText(scoreStr).width + 30;
            drawRoundedRect(ctx, cardX + cardW - 28 - sw, y + 84, sw, 42, 12);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#6ee7b7';
            ctx.fillText(scoreStr, cardX + cardW - 43, y + 112);
        } else {
            const statusTxt = isLive ? 'EN JUEGO' : 'PENDIENTE';
            ctx.font = '800 16px system-ui, -apple-system, Segoe UI, sans-serif';
            const stW = ctx.measureText(statusTxt).width + 28;
            drawRoundedRect(ctx, cardX + cardW - 28 - stW, y + 86, stW, 38, 10);
            ctx.fillStyle = isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.15)';
            ctx.fill();
            ctx.strokeStyle = isLive ? 'rgba(52, 211, 153, 0.5)' : 'rgba(251, 191, 36, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = isLive ? '#6ee7b7' : '#fde68a';
            ctx.fillText(statusTxt, cardX + cardW - 42, y + 111);
        }

        y += cardHeight + 20;
    });

    if (extraCount > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 21px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(`+ ${extraCount} partido(s) más en el cronograma completo de la app`, width / 2, y + 26);
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

    // Medir altura dinámica para que nombres + apodos entren sin cortes
    const cardHeights = sorted.map(({ team }) => {
        const players = extractPlayerNames(team);
        return players.length > 1 ? 216 : 168;
    });
    const totalCardsH = cardHeights.reduce((sum, h) => sum + h + 26, 0);
    const height = Math.max(1220, 390 + totalCardsH + 140);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let y = await drawBackgroundAndHeader(ctx, width, height, {
        subtitle: tournamentName || 'Torneo Oficial',
        title: categoryName || 'Categoría',
        badge: 'Cuadro de Honor'
    });

    y += 14;

    const positionLabels = {
        1: {
            label: 'CAMPEONES',
            watermark: '01',
            accent: '#facc15',
            gradA: 'rgba(250, 204, 21, 0.22)',
            gradB: 'rgba(15, 23, 42, 0.88)',
            border: 'rgba(250, 204, 21, 0.65)'
        },
        2: {
            label: 'SUBCAMPEONES',
            watermark: '02',
            accent: '#e2e8f0',
            gradA: 'rgba(148, 163, 184, 0.20)',
            gradB: 'rgba(15, 23, 42, 0.88)',
            border: 'rgba(203, 213, 225, 0.5)'
        },
        3: {
            label: '3° PUESTO',
            watermark: '03',
            accent: '#fb923c',
            gradA: 'rgba(251, 146, 60, 0.20)',
            gradB: 'rgba(15, 23, 42, 0.88)',
            border: 'rgba(251, 146, 60, 0.5)'
        },
        4: {
            label: '4° PUESTO',
            watermark: '04',
            accent: '#38bdf8',
            gradA: 'rgba(56, 189, 248, 0.18)',
            gradB: 'rgba(15, 23, 42, 0.88)',
            border: 'rgba(56, 189, 248, 0.45)'
        }
    };

    sorted.forEach(({ position, team }, idx) => {
        const meta = positionLabels[position] || {
            label: `${position}° PUESTO`,
            watermark: `0${position}`,
            accent: '#34d399',
            gradA: 'rgba(16, 185, 129, 0.18)',
            gradB: 'rgba(15, 23, 42, 0.88)',
            border: 'rgba(52, 211, 153, 0.45)'
        };

        const players = extractPlayerNames(team);
        const cardX = 58;
        const cardW = width - 116;
        const cardH = cardHeights[idx];

        // Sombra / Fondo degradado
        drawRoundedRect(ctx, cardX, y, cardW, cardH, 26);
        const cGrad = ctx.createLinearGradient(cardX, y, cardX + cardW, y + cardH);
        cGrad.addColorStop(0, meta.gradA);
        cGrad.addColorStop(1, meta.gradB);
        ctx.fillStyle = cGrad;
        ctx.fill();
        ctx.strokeStyle = meta.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Barra lateral acentuada
        ctx.save();
        drawRoundedRect(ctx, cardX, y, 12, cardH, 8);
        ctx.fillStyle = meta.accent;
        ctx.fill();
        ctx.restore();

        // Marca de agua numérica grande a la derecha
        ctx.save();
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.font = '900 116px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(meta.watermark, cardX + cardW - 34, y + cardH - 30);
        ctx.restore();

        // Medallón trofeo a la izquierda
        drawTrophyEmblem(ctx, cardX + 76, y + cardH / 2, position, meta.accent);

        // Pill de puesto
        const contentX = cardX + 140;
        ctx.textAlign = 'left';
        ctx.font = '900 18px system-ui, -apple-system, Segoe UI, sans-serif';
        const pillW = ctx.measureText(meta.label).width + 32;
        drawRoundedRect(ctx, contentX, y + 24, pillW, 34, 10);
        ctx.fillStyle = 'rgba(2, 8, 23, 0.55)';
        ctx.fill();
        ctx.strokeStyle = meta.border;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = meta.accent;
        ctx.fillText(meta.label, contentX + 16, y + 47);

        // Nombres de los jugadores (soporta apodos cómodamente)
        let py = y + 104;
        const maxTextWidth = cardW - 220;
        players.slice(0, 2).forEach((player) => {
            const drawnH = fitFontAndDrawLines(ctx, player, contentX, py, maxTextWidth, {
                startSize: 38,
                minSize: 24,
                weight: '800',
                color: '#ffffff',
                lineHeightFactor: 1.15
            });
            py += Math.max(48, drawnH + 8);
        });

        y += cardH + 26;
    });

    drawFooter(ctx, width, height);

    const slug = (categoryName || 'categoria').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return deliverCanvasImage(
        canvas,
        `podio-${slug}.png`,
        `Podio ${categoryName} — ${tournamentName || 'Red Padel LR'}`,
        `Cuadro de honor de ${categoryName} en ${tournamentName || 'Red Padel LR'}`
    );
}
