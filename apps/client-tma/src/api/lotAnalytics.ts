import { apiClient } from '@tire-crm/shared';

export type LotAnalyticsEventType = 'VIEW' | 'FAVORITE_ADD' | 'FAVORITE_REMOVE';
export type LotAnalyticsSource = 'WEB' | 'TMA';

type TrackLotAnalyticsEventPayload = {
    lot_id: string;
    event_type: LotAnalyticsEventType;
    source: LotAnalyticsSource;
    session_id?: string;
};

const ANALYTICS_SESSION_STORAGE_KEY = 'client-lot-analytics-session-id';
const ANALYTICS_VIEW_STORAGE_PREFIX = 'client-lot-viewed';

const isBrowser = typeof window !== 'undefined';

const buildFallbackSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const getLotAnalyticsSource = (): LotAnalyticsSource => {
    if (!isBrowser) {
        return 'WEB';
    }

    const telegramWebApp = (window as Window & {
        Telegram?: { WebApp?: { initData?: string } };
    }).Telegram?.WebApp;

    return telegramWebApp?.initData ? 'TMA' : 'WEB';
};

export const getLotAnalyticsSessionId = (): string => {
    if (!isBrowser) {
        return 'server';
    }

    const existingSessionId = window.sessionStorage.getItem(ANALYTICS_SESSION_STORAGE_KEY);
    if (existingSessionId) {
        return existingSessionId;
    }

    const nextSessionId = globalThis.crypto?.randomUUID?.() ?? buildFallbackSessionId();
    window.sessionStorage.setItem(ANALYTICS_SESSION_STORAGE_KEY, nextSessionId);
    return nextSessionId;
};

export const shouldTrackLotView = (lotId: string): boolean => {
    if (!isBrowser) {
        return false;
    }

    const key = `${ANALYTICS_VIEW_STORAGE_PREFIX}:${lotId}`;
    if (window.sessionStorage.getItem(key)) {
        return false;
    }

    window.sessionStorage.setItem(key, '1');
    return true;
};

export const trackLotAnalyticsEvent = async (payload: Omit<TrackLotAnalyticsEventPayload, 'source' | 'session_id'> & {
    source?: LotAnalyticsSource;
    session_id?: string;
}) => {
    await apiClient.post('/lots/analytics/events', {
        ...payload,
        source: payload.source ?? getLotAnalyticsSource(),
        session_id: payload.session_id ?? getLotAnalyticsSessionId(),
    } satisfies TrackLotAnalyticsEventPayload);
};
