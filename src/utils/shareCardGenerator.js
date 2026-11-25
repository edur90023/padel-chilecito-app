// Generador de placas PNG de alta calidad visual para WhatsApp e Instagram (100% cliente)
import { API_BASE_URL } from '../api/axiosConfig';
import { resolveMediaUrl } from './mediaUrl';

const loadDirectCorsImage = (src, timeoutMs = 4500) => {
    return new Promise((resolve) => {
        if (!src) {
            resolve(null);
            return;
        }
        const img = new Image();
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                resolve(null);
            }
        }, timeoutMs);

        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                resolve(img);
            }
        };
        img.onerror = () => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                resolve(null);
            }
        };
        img.src = src;
    });
};

const loadImageSafe = async (src) => {
    const resolved = resolveMediaUrl(src);
    if (!resolved) return null;

    const directImg = await loadDirectCorsImage(resolved);
    if (directImg) return directImg;

    // Si es externa y falló por CORS, reintentar vía proxy same-origin/backend
    if (/^https?:\/\//i.test(resolved)) {
        const proxyBase = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';
        const proxiedUrl = `${proxyBase}/tournaments/proxy-image?url=${encodeURIComponent(resolved)}`;
        return loadDirectCorsImage(proxiedUrl, 6000);
    }
    return null;
};

const drawImageContained = (ctx, img, x, y, boxW, boxH) => {
    if (!img || !img.width || !img.height) return;
    const scale = Math.min(boxW / img.width, boxH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const dx = x + (boxW - drawW) / 2;
    const dy = y + (boxH - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
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

const drawBackgroundAndHeader = async (ctx, width, height, { subtitle, title, badge, organizerName, organizerLogoUrl }) => {
    drawPadelCourtTexture(ctx, width, height);

    // Banda superior del encabezado
    drawRoundedRect(ctx, 56, 54, width - 112, 114, 24);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Logo circular con halo (prioriza logo del complejo/organizador, sino fallback /logo.png)
    const customLogo = organizerLogoUrl ? await loadImageSafe(organizerLogoUrl) : null;
    const logo = customLogo || await loadImageSafe('/logo.png');
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
        if (customLogo) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
            ctx.fillRect(lx - 38, ly - 38, 76, 76);
            drawImageContained(ctx, logo, lx - 33, ly - 33, 66, 66);
        } else {
            ctx.drawImage(logo, lx - 38, ly - 38, 76, 76);
        }
        ctx.restore();

        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(lx, ly, 39, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Pill badge derecha (medir primero para no pisar nombres largos de organizadores)
    let badgeWidthReserved = 0;
    if (badge) {
        ctx.font = '800 17px system-ui, -apple-system, Segoe UI, sans-serif';
        const bw = ctx.measureText(badge.toUpperCase()).width + 42;
        badgeWidthReserved = bw + 28;
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

    // Marca y complejo / organizador
    ctx.textAlign = 'left';
    const textX = logo ? 172 : 84;
    const maxBrandW = Math.max(260, width - 80 - badgeWidthReserved - textX);
    const cleanOrgName = typeof organizerName === 'string' ? organizerName.trim() : '';
    const brandTitle = cleanOrgName ? cleanOrgName.toUpperCase() : 'RED PADEL LR';
    const brandSub = cleanOrgName ? 'TORNEO OFICIAL • RED PADEL LR' : 'GRUPO PADEL CHILECITO • LA RIOJA';

    let brandFontSize = 30;
    while (brandFontSize > 19) {
        ctx.font = `900 ${brandFontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
        if (ctx.measureText(brandTitle).width <= maxBrandW) break;
        brandFontSize -= 2;
    }

    const brandGrad = ctx.createLinearGradient(textX, 80, textX + 260, 110);
    brandGrad.addColorStop(0, '#34d399');
    brandGrad.addColorStop(1, '#22d3ee');
    ctx.fillStyle = brandGrad;
    ctx.fillText(brandTitle, textX, 105, maxBrandW);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 15px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText(brandSub, textX, 134, maxBrandW);

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

const loadSponsorImages = async (sponsorLogos) => {
    if (!Array.isArray(sponsorLogos) || sponsorLogos.length === 0) return [];
    const unique = [...new Set(sponsorLogos.map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean))].slice(0, 6);
    if (unique.length === 0) return [];
    const loaded = await Promise.all(unique.map((url) => loadImageSafe(url)));
    return loaded.filter(Boolean);
};

const drawSponsorStripAndFooter = (ctx, width, height, sponsorImages) => {
    if (Array.isArray(sponsorImages) && sponsorImages.length > 0) {
        const stripX = 56;
        const stripW = width - 112;
        const stripH = 122;
        const stripY = height - 234;

        drawRoundedRect(ctx, stripX, stripY, stripW, stripH, 20);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '800 13px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText('ORGANIZAN Y AUSPICIAN', width / 2, stripY + 23);

        const count = sponsorImages.length;
        const gap = 16;
        const innerPadX = 24;
        const usableW = stripW - innerPadX * 2 - gap * (count - 1);
        const tileW = Math.min(185, Math.floor(usableW / count));
        const tileH = 74;
        const totalRowW = tileW * count + gap * (count - 1);
        let startX = Math.round((width - totalRowW) / 2);
        const tileY = stripY + 34;

        sponsorImages.forEach((img) => {
            drawRoundedRect(ctx, startX, tileY, tileW, tileH, 14);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            drawImageContained(ctx, img, startX + 10, tileY + 8, tileW - 20, tileH - 16);
            startX += tileW + gap;
        });
    }

    drawFooter(ctx, width, height);
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

export async function shareOrDownloadCourtCard({
    tournamentName,
    courtLabel,
    matches,
    organizerName,
    organizerLogoUrl,
    sponsorLogos
}) {
    const sponsorImages = await loadSponsorImages(sponsorLogos);
    const sponsorExtraH = sponsorImages.length > 0 ? 136 : 0;

    const visibleMatches = (matches || []).slice(0, 7);
    const extraCount = Math.max(0, (matches || []).length - visibleMatches.length);
    const width = 1080;
    const cardHeight = 148;
    const startEst = 360;
    const height = Math.max(1180 + sponsorExtraH, startEst + visibleMatches.length * (cardHeight + 20) + (extraCount > 0 ? 54 : 0) + 130 + sponsorExtraH);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let y = await drawBackgroundAndHeader(ctx, width, height, {
        subtitle: tournamentName || 'Torneo Oficial',
        title: courtLabel || 'Cronograma de Cancha',
        badge: `${matches.length} ${matches.length === 1 ? 'Partido' : 'Partidos'}`,
        organizerName,
        organizerLogoUrl
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

    drawSponsorStripAndFooter(ctx, width, height, sponsorImages);

    const slug = (courtLabel || 'cancha').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return deliverCanvasImage(
        canvas,
        `horarios-${slug}.png`,
        `${courtLabel} — ${tournamentName || 'Red Padel LR'}`,
        `Cronograma de partidos en ${courtLabel}`
    );
}

export async function shareOrDownloadPodiumCard({
    tournamentName,
    categoryName,
    finishers,
    organizerName,
    organizerLogoUrl,
    sponsorLogos
}) {
    const sponsorImages = await loadSponsorImages(sponsorLogos);
    const sponsorExtraH = sponsorImages.length > 0 ? 136 : 0;

    const sorted = [...(finishers || [])].sort((a, b) => a.position - b.position).slice(0, 4);
    const width = 1080;

    // Medir altura dinámica para que nombres + apodos entren sin cortes
    const cardHeights = sorted.map(({ team }) => {
        const players = extractPlayerNames(team);
        return players.length > 1 ? 216 : 168;
    });
    const totalCardsH = cardHeights.reduce((sum, h) => sum + h + 26, 0);
    const height = Math.max(1220 + sponsorExtraH, 390 + totalCardsH + 140 + sponsorExtraH);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let y = await drawBackgroundAndHeader(ctx, width, height, {
        subtitle: tournamentName || 'Torneo Oficial',
        title: categoryName || 'Categoría',
        badge: 'Cuadro de Honor',
        organizerName,
        organizerLogoUrl
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

    drawSponsorStripAndFooter(ctx, width, height, sponsorImages);

    const slug = (categoryName || 'categoria').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return deliverCanvasImage(
        canvas,
        `podio-${slug}.png`,
        `Podio ${categoryName} — ${tournamentName || 'Red Padel LR'}`,
        `Cuadro de honor de ${categoryName} en ${tournamentName || 'Red Padel LR'}`
    );
}

const resolveWinnerSide = (match) => {
    if (!match || match.status !== 'Finalizado') return null;
    const scoreA = Array.isArray(match.scoreA) ? match.scoreA : [];
    const scoreB = Array.isArray(match.scoreB) ? match.scoreB : [];
    if (scoreA.length === 0) return null;
    let setsA = 0;
    let setsB = 0;
    scoreA.forEach((s, i) => {
        const sb = Number(scoreB[i] ?? 0);
        const sa = Number(s ?? 0);
        if (sa > sb) setsA++;
        else if (sb > sa) setsB++;
    });
    if (setsA === setsB) return null;
    return setsA > setsB ? 'A' : 'B';
};

const fitPlayerLinesCentered = (ctx, text, cx, startY, maxWidth, color = '#ffffff') => {
    let size = 30;
    let lines = [text];
    while (size >= 20) {
        ctx.font = `800 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
        lines = wrapLines(ctx, text, maxWidth);
        if (lines.length <= 2) break;
        size -= 2;
    }
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    const step = Math.round(size * 1.18);
    lines.slice(0, 2).forEach((line, idx) => {
        ctx.fillText(line, cx, startY + idx * step, maxWidth);
    });
    return lines.slice(0, 2).length * step;
};

export async function shareOrDownloadMatchCard({
    tournamentName,
    categoryName,
    stageLabel,
    match,
    fallbackPlace,
    organizerName,
    organizerLogoUrl,
    sponsorLogos
}) {
    const m = match || {};
    const sponsorImages = await loadSponsorImages(sponsorLogos);
    const sponsorExtraH = sponsorImages.length > 0 ? 136 : 0;

    const width = 1080;
    const height = 1080 + sponsorExtraH;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const subtitleParts = [tournamentName || 'Torneo Oficial', stageLabel].filter(Boolean);
    const headerBottomY = await drawBackgroundAndHeader(ctx, width, height, {
        subtitle: subtitleParts.join('  •  '),
        title: categoryName || 'Partido del Torneo',
        badge: m.status === 'Finalizado' ? 'Resultado Final' : m.status === 'En Juego' ? 'En Vivo' : 'Partido',
        organizerName,
        organizerLogoUrl
    });

    const bottomBound = sponsorImages.length > 0 ? height - 252 : height - 116;
    const cardH = Math.min(470, Math.max(410, bottomBound - headerBottomY - 24));
    const cardY = Math.round(headerBottomY + Math.max(12, (bottomBound - headerBottomY - cardH) / 2));
    const cardX = 56;
    const cardW = width - 112;

    const isFinished = m.status === 'Finalizado';
    const isLive = m.status === 'En Juego';
    const winner = resolveWinnerSide(m);
    const playersA = extractPlayerNames(m.teamA, m.placeholderA || 'A definir');
    const playersB = extractPlayerNames(m.teamB, m.placeholderB || 'A definir');
    const scoreA = Array.isArray(m.scoreA) ? m.scoreA : [];
    const scoreB = Array.isArray(m.scoreB) ? m.scoreB : [];
    const hasScores = scoreA.length > 0 && (isFinished || isLive);

    // Tarjeta central del partido
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, 'rgba(15, 29, 54, 0.90)');
    cardGrad.addColorStop(1, 'rgba(7, 15, 32, 0.94)');
    ctx.fillStyle = cardGrad;
    ctx.fill();
    ctx.strokeStyle = isLive
        ? 'rgba(52, 211, 153, 0.65)'
        : isFinished
            ? 'rgba(56, 189, 248, 0.45)'
            : 'rgba(148, 163, 184, 0.30)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Franja superior de estado y ronda
    const topBarY = cardY + 24;
    if (stageLabel) {
        ctx.font = '800 17px system-ui, -apple-system, Segoe UI, sans-serif';
        const stgText = stageLabel.toUpperCase();
        const stgW = Math.min(420, ctx.measureText(stgText).width + 32);
        drawRoundedRect(ctx, cardX + 28, topBarY, stgW, 36, 10);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#67e8f9';
        ctx.fillText(stgText, cardX + 44, topBarY + 24, stgW - 32);
    }

    const statusTxt = isFinished ? 'FINALIZADO' : isLive ? '● EN JUEGO' : 'PROGRAMADO';
    ctx.font = '900 16px system-ui, -apple-system, Segoe UI, sans-serif';
    const statW = ctx.measureText(statusTxt).width + 32;
    drawRoundedRect(ctx, cardX + cardW - 28 - statW, topBarY, statW, 36, 10);
    ctx.fillStyle = isFinished
        ? 'rgba(16, 185, 129, 0.20)'
        : isLive
            ? 'rgba(16, 185, 129, 0.28)'
            : 'rgba(245, 158, 11, 0.18)';
    ctx.fill();
    ctx.strokeStyle = isFinished || isLive ? 'rgba(52, 211, 153, 0.55)' : 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillStyle = isFinished || isLive ? '#6ee7b7' : '#fde68a';
    ctx.fillText(statusTxt, cardX + cardW - 44, topBarY + 24);

    // Zona principal: Pareja A | Marcador / VS | Pareja B
    const boxY = cardY + 80;
    const boxH = cardH - 168;
    const sidePad = 28;
    const centerColW = hasScores ? 186 : 112;
    const boxW = Math.floor((cardW - sidePad * 2 - centerColW - 24) / 2);
    const leftBoxX = cardX + sidePad;
    const rightBoxX = cardX + cardW - sidePad - boxW;
    const centerX = width / 2;

    const drawTeamBox = (bx, players, isWinner) => {
        drawRoundedRect(ctx, bx, boxY, boxW, boxH, 22);
        const tGrad = ctx.createLinearGradient(bx, boxY, bx, boxY + boxH);
        if (isWinner) {
            tGrad.addColorStop(0, 'rgba(16, 185, 129, 0.24)');
            tGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
        } else {
            tGrad.addColorStop(0, 'rgba(30, 41, 59, 0.58)');
            tGrad.addColorStop(1, 'rgba(15, 23, 42, 0.82)');
        }
        ctx.fillStyle = tGrad;
        ctx.fill();
        ctx.strokeStyle = isWinner ? 'rgba(52, 211, 153, 0.78)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isWinner ? 2.5 : 1.5;
        ctx.stroke();

        const cx = bx + boxW / 2;
        if (isWinner) {
            ctx.font = '900 14px system-ui, -apple-system, Segoe UI, sans-serif';
            const badgeTxt = '★ GANADORES';
            const bw = ctx.measureText(badgeTxt).width + 24;
            drawRoundedRect(ctx, cx - bw / 2, boxY + 18, bw, 28, 8);
            ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fde047';
            ctx.fillText(badgeTxt, cx, boxY + 37);
        }

        const shownPlayers = players.slice(0, 2);
        const startOffset = shownPlayers.length === 1 ? boxH * 0.52 : boxH * 0.39;
        let py = boxY + startOffset + (isWinner && shownPlayers.length > 1 ? 10 : 0);
        shownPlayers.forEach((playerName, idx) => {
            const drawnH = fitPlayerLinesCentered(
                ctx,
                playerName,
                cx,
                py,
                boxW - 32,
                isWinner ? '#ffffff' : '#e2e8f0'
            );
            if (idx === 0 && shownPlayers.length > 1) {
                py += Math.max(46, drawnH + 14);
            }
        });
    };

    drawTeamBox(leftBoxX, playersA, winner === 'A');
    drawTeamBox(rightBoxX, playersB, winner === 'B');

    // Columna central: Marcador por sets o medallón VS
    const midY = boxY + boxH / 2;
    if (hasScores) {
        const setsToShow = scoreA.slice(0, 3);
        const rowH = 54;
        const rowGap = 12;
        const totalScoreH = setsToShow.length * rowH + (setsToShow.length - 1) * rowGap;
        let sy = midY - totalScoreH / 2 + 12;

        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '800 13px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(isFinished ? 'RESULTADO' : 'MARCADOR', centerX, sy - 16);

        setsToShow.forEach((saRaw, idx) => {
            const sa = Number(saRaw ?? 0);
            const sb = Number(scoreB[idx] ?? 0);
            const pillW = centerColW - 18;
            const px = centerX - pillW / 2;

            drawRoundedRect(ctx, px, sy, pillW, rowH, 14);
            ctx.fillStyle = 'rgba(2, 8, 23, 0.85)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.40)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = '900 30px monospace';
            ctx.textAlign = 'right';
            ctx.fillStyle = sa > sb ? '#34d399' : '#cbd5e1';
            ctx.fillText(String(sa), centerX - 16, sy + 37);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#64748b';
            ctx.font = '900 22px system-ui, -apple-system, Segoe UI, sans-serif';
            ctx.fillText('-', centerX, sy + 35);

            ctx.font = '900 30px monospace';
            ctx.textAlign = 'left';
            ctx.fillStyle = sb > sa ? '#34d399' : '#cbd5e1';
            ctx.fillText(String(sb), centerX + 16, sy + 37);

            sy += rowH + rowGap;
        });
    } else {
        const vsGlow = ctx.createRadialGradient(centerX, midY, 10, centerX, midY, 54);
        vsGlow.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
        vsGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = vsGlow;
        ctx.beginPath();
        ctx.arc(centerX, midY, 54, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, midY, 36, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(2, 8, 23, 0.88)';
        ctx.fill();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText('VS', centerX, midY + 9);
    }

    // Barra inferior de horario y sede/cancha dentro de la tarjeta
    const metaY = cardY + cardH - 64;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cardX + 28, metaY - 12);
    ctx.lineTo(cardX + cardW - 28, metaY - 12);
    ctx.stroke();

    const timeText = (m.matchTime || 'Horario a confirmar').trim();
    const placeText = (m.matchPlace || fallbackPlace || 'Sede a confirmar').trim();

    ctx.font = '700 18px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(`🕒 ${timeText}`, cardX + 32, metaY + 24, cardW * 0.45);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText(`📍 ${placeText}`, cardX + cardW - 32, metaY + 24, cardW * 0.48);

    drawSponsorStripAndFooter(ctx, width, height, sponsorImages);

    const teamASlug = (playersA[0] || 'pareja-a').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const teamBSlug = (playersB[0] || 'pareja-b').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return deliverCanvasImage(
        canvas,
        `partido-${teamASlug}-vs-${teamBSlug}.png`,
        `${formatPlayersText(m.teamA, m.placeholderA)} vs ${formatPlayersText(m.teamB, m.placeholderB)}`,
        `${tournamentName || 'Red Padel LR'} • ${categoryName || ''}`
    );
}
