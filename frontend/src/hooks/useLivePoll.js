import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { API_BASE_URL } from '../api/axiosConfig';

const VOTER_ID_KEY = 'redpadel_live_poll_voter_id';
const VOTED_MAP_KEY = 'redpadel_live_poll_voted_map';

export const getOrCreateVoterId = () => {
    try {
        let existing = localStorage.getItem(VOTER_ID_KEY);
        if (!existing) {
            existing = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            localStorage.setItem(VOTER_ID_KEY, existing);
        }
        return existing;
    } catch {
        return `v_temp_${Date.now()}`;
    }
};

export const getVotedOptionForPoll = (pollId) => {
    if (!pollId) return null;
    try {
        const raw = localStorage.getItem(VOTED_MAP_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed[pollId] || null;
    } catch {
        return null;
    }
};

export const saveVotedOptionForPoll = (pollId, optionId) => {
    if (!pollId || !optionId) return;
    try {
        const raw = localStorage.getItem(VOTED_MAP_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const keys = Object.keys(parsed);
        // Mantener el mapa liviano (últimas 15 encuestas)
        if (keys.length > 15) {
            delete parsed[keys[0]];
        }
        parsed[pollId] = optionId;
        localStorage.setItem(VOTED_MAP_KEY, JSON.stringify(parsed));
    } catch {
        // Ignorar errores de almacenamiento privado
    }
};

export function useLivePoll({ skipWakeupBanner = false } = {}) {
    const [pollState, setPollState] = useState({
        activePoll: null,
        dailyHistory: [],
        serverTime: null
    });
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const fallbackTimerRef = useRef(null);

    const fetchState = useCallback(async () => {
        try {
            const response = await axios.get('/live-poll', {
                skipWakeupBanner
            });
            if (response?.data) {
                setPollState({
                    activePoll: response.data.activePoll || null,
                    dailyHistory: Array.isArray(response.data.dailyHistory) ? response.data.dailyHistory : [],
                    serverTime: response.data.serverTime || null
                });
            }
        } catch (err) {
            // Silencioso en reintentos de fondo
        } finally {
            setLoading(false);
        }
    }, [skipWakeupBanner]);

    useEffect(() => {
        let isMounted = true;
        fetchState();

        const stopFallbackPolling = () => {
            if (fallbackTimerRef.current) {
                clearInterval(fallbackTimerRef.current);
                fallbackTimerRef.current = null;
            }
        };

        const startFallbackPolling = () => {
            if (fallbackTimerRef.current) return;
            fallbackTimerRef.current = setInterval(() => {
                if (isMounted) {
                    fetchState();
                }
            }, 2500);
        };

        const streamUrl = API_BASE_URL
            ? `${API_BASE_URL}/api/live-poll/stream`
            : '/api/live-poll/stream';

        let eventSource = null;
        if (typeof EventSource !== 'undefined') {
            try {
                eventSource = new EventSource(streamUrl);

                eventSource.onopen = () => {
                    if (!isMounted) return;
                    setIsConnected(true);
                    stopFallbackPolling();
                };

                eventSource.addEventListener('poll_update', (event) => {
                    if (!isMounted) return;
                    try {
                        const data = JSON.parse(event.data);
                        setPollState({
                            activePoll: data.activePoll || null,
                            dailyHistory: Array.isArray(data.dailyHistory) ? data.dailyHistory : [],
                            serverTime: data.serverTime || null
                        });
                        setLoading(false);
                        setIsConnected(true);
                        stopFallbackPolling();
                    } catch {
                        // Ignorar payload malformado
                    }
                });

                eventSource.onerror = () => {
                    if (!isMounted) return;
                    setIsConnected(false);
                    startFallbackPolling();
                };
            } catch {
                startFallbackPolling();
            }
        } else {
            startFallbackPolling();
        }

        return () => {
            isMounted = false;
            stopFallbackPolling();
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [fetchState]);

    return {
        activePoll: pollState.activePoll,
        dailyHistory: pollState.dailyHistory,
        loading,
        isConnected,
        refresh: fetchState,
        setPollState
    };
}
