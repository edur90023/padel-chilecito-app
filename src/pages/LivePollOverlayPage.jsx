import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLivePoll } from '../hooks/useLivePoll';
import LivePollOverlayCard from '../components/LivePollOverlayCard';

const POSITION_CLASSES = {
    bl: 'bottom-7 left-7 items-end justify-start',
    br: 'bottom-7 right-7 items-end justify-end',
    bc: 'bottom-7 inset-x-7 items-end justify-center',
    tl: 'top-7 left-7 items-start justify-start',
    tr: 'top-7 right-7 items-start justify-end'
};

function LivePollOverlayPage() {
    const [searchParams] = useSearchParams();
    const { activePoll } = useLivePoll({ skipWakeupBanner: true });
    const [renderPoll, setRenderPoll] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const posKey = searchParams.get('pos') || 'bl';
    const positionClasses = POSITION_CLASSES[posKey] || POSITION_CLASSES.bl;

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

    // Mantener el último snapshot brevemente durante la animación de salida
    useEffect(() => {
        const shouldShow = Boolean(activePoll && activePoll.showOverlay);
        if (shouldShow && activePoll) {
            setRenderPoll(activePoll);
            const raf = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(raf);
        }

        setIsVisible(false);
        const timer = setTimeout(() => {
            setRenderPoll(null);
        }, 550);
        return () => clearTimeout(timer);
    }, [activePoll]);

    return (
        <div className="fixed inset-0 bg-transparent overflow-hidden pointer-events-none select-none">
            <div className={`fixed ${positionClasses} flex pointer-events-none`}>
                <div
                    className={`transition-all duration-500 will-change-transform ${
                        isVisible
                            ? 'opacity-100 translate-y-0 scale-100'
                            : 'opacity-0 translate-y-8 scale-95'
                    }`}
                    style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                    {renderPoll && <LivePollOverlayCard poll={renderPoll} />}
                </div>
            </div>
        </div>
    );
}

export default LivePollOverlayPage;
