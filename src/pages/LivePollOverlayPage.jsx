import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLivePoll } from '../hooks/useLivePoll';
import LivePollOverlayCard from '../components/LivePollOverlayCard';

const POSITION_CONFIG = {
    bl: {
        container: 'bottom-7 left-7 items-end justify-start',
        hidden: '-translate-x-14 translate-y-2 scale-95 opacity-0',
        visible: 'translate-x-0 translate-y-0 scale-100 opacity-100'
    },
    br: {
        container: 'bottom-7 right-7 items-end justify-end',
        hidden: 'translate-x-14 translate-y-2 scale-95 opacity-0',
        visible: 'translate-x-0 translate-y-0 scale-100 opacity-100'
    },
    bc: {
        container: 'bottom-7 inset-x-7 items-end justify-center',
        hidden: 'translate-y-14 scale-95 opacity-0',
        visible: 'translate-y-0 scale-100 opacity-100'
    },
    tl: {
        container: 'top-7 left-7 items-start justify-start',
        hidden: '-translate-x-14 -translate-y-2 scale-95 opacity-0',
        visible: 'translate-x-0 translate-y-0 scale-100 opacity-100'
    },
    tr: {
        container: 'top-7 right-7 items-start justify-end',
        hidden: 'translate-x-14 -translate-y-2 scale-95 opacity-0',
        visible: 'translate-x-0 translate-y-0 scale-100 opacity-100'
    }
};

function LivePollOverlayPage() {
    const [searchParams] = useSearchParams();
    const { activePoll } = useLivePoll({ skipWakeupBanner: true });
    const [renderPoll, setRenderPoll] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [sweepTrigger, setSweepTrigger] = useState(0);
    const wasShowingRef = useRef(false);

    const posKey = searchParams.get('pos') || 'bl';
    const posCfg = POSITION_CONFIG[posKey] || POSITION_CONFIG.bl;

    // Forzar transparencia real del documento para OBS Browser Source
    useEffect(() => {
        const htmlEl = document.documentElement;
        const bodyEl = document.body;
        const rootEl = document.getElementById('root');

        const prevHtmlBg = htmlEl.style.background;
        const prevHtmlBgColor = htmlEl.style.backgroundColor;
        const prevBodyBg = bodyEl.style.background;
        const prevBodyBgColor = bodyEl.style.backgroundColor;
        const prevBodyBgImage = bodyEl.style.backgroundImage;
        const prevBodyOverflow = bodyEl.style.overflow;
        const prevRootBg = rootEl ? rootEl.style.background : '';

        htmlEl.style.setProperty('background', 'transparent', 'important');
        htmlEl.style.setProperty('background-color', 'transparent', 'important');
        bodyEl.style.setProperty('background', 'transparent', 'important');
        bodyEl.style.setProperty('background-color', 'transparent', 'important');
        bodyEl.style.setProperty('background-image', 'none', 'important');
        bodyEl.style.setProperty('overflow', 'hidden', 'important');
        if (rootEl) {
            rootEl.style.setProperty('background', 'transparent', 'important');
        }

        return () => {
            htmlEl.style.background = prevHtmlBg;
            htmlEl.style.backgroundColor = prevHtmlBgColor;
            bodyEl.style.background = prevBodyBg;
            bodyEl.style.backgroundColor = prevBodyBgColor;
            bodyEl.style.backgroundImage = prevBodyBgImage;
            bodyEl.style.overflow = prevBodyOverflow;
            if (rootEl) {
                rootEl.style.background = prevRootBg;
            }
        };
    }, []);

    // Animación direccional de entrada al encender (ON) y repliegue suave al cerrar (OFF)
    useEffect(() => {
        const shouldShow = Boolean(activePoll && activePoll.showOverlay);
        if (shouldShow && activePoll) {
            setRenderPoll(activePoll);
            if (!wasShowingRef.current) {
                wasShowingRef.current = true;
                setSweepTrigger((prev) => prev + 1);
            }
            let raf2 = 0;
            const raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(() => setIsVisible(true));
            });
            return () => {
                cancelAnimationFrame(raf1);
                if (raf2) cancelAnimationFrame(raf2);
            };
        }

        wasShowingRef.current = false;
        setIsVisible(false);
        const timer = setTimeout(() => {
            setRenderPoll(null);
        }, 550);
        return () => clearTimeout(timer);
    }, [activePoll]);

    return (
        <div className="fixed inset-0 bg-transparent overflow-hidden pointer-events-none select-none">
            <div className={`fixed ${posCfg.container} flex pointer-events-none`}>
                <div
                    className={`transition-all will-change-transform ${
                        isVisible
                            ? `duration-500 ${posCfg.visible}`
                            : `duration-[440ms] ${posCfg.hidden}`
                    }`}
                    style={{
                        transitionTimingFunction: isVisible
                            ? 'cubic-bezier(0.16, 1, 0.3, 1)'
                            : 'cubic-bezier(0.4, 0, 1, 1)'
                    }}
                >
                    {renderPoll && <LivePollOverlayCard poll={renderPoll} sweepTrigger={sweepTrigger} />}
                </div>
            </div>
        </div>
    );
}

export default LivePollOverlayPage;
