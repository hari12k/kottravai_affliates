/**
 * Kottravai Analytics Service — Schema v1.0
 *
 * Sends events to Google Apps Script doPost() which writes to
 * MASTER_EVENT_LOG_V2 (22-column frozen schema).
 *
 * IMPLEMENTATION DETAILS for CORS:
 *   - Uses mode: 'no-cors' because Google Apps Script Web Apps do not support
 *     CORS preflight (OPTIONS) requests. 
 *   - With 'no-cors', the request is sent as a "simple request".
 *   - The payload is sent as stringified JSON in the body.
 *   - The response will be 'opaque' (status 0), which is normal.
 *   - The data successfully reaches Apps Script e.postData.contents.
 */

// ── ACTIVE DEPLOYMENT URL ────────────────────────────────────────
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyP2DTMncQ6C9KcbyCUTRUR09eWD_uuQi28fz3Njrlq5NFN6PADpHXu5ZCB6MMiagHhFQ/exec';

// ── TYPES ────────────────────────────────────────────────────────

export interface AnalyticsPayload {
    visitor_id: string;
    session_id: string;
    event_name: string;
    page_url: string;
    page_title?: string;
    product_name?: string | null;
    device_type?: string;
    browser?: string;
    traffic_source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    timestamp?: string;
    ip_address?: string;
    metadata?: string;
    sheet_name?: string;
    [key: string]: any;
}

// ── CORE REUSABLE SEND FUNCTION ──────────────────────────────────

/**
 * Clean reusable function to send analytics payload to GAS.
 * Add this to window for manual testing if needed.
 */
export async function sendAnalyticsEvent(payload: AnalyticsPayload): Promise<void> {
    const url = GOOGLE_SCRIPT_URL;

    console.log("CALLING WEB APP URL:", GOOGLE_SCRIPT_URL);
    console.log('[Analytics] 🚀 Preparing to fetch:', payload.event_name);

    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload),
            keepalive: true
        });

        console.log('[Analytics] ✅ Fetch initiated successfully for:', payload.event_name);
    } catch (error) {
        console.error('[Analytics] ❌ Fetch error:', error);
    }
}

// ── ANALYTICS SERVICE CLASS (SINGLETON) ──────────────────────────

class AnalyticsService {
    private sessionId: string;
    private visitorId: string;
    private ipAddress: string = 'Pending';
    private trafficSourceData = {
        source: 'direct',
        utm_source: '',
        utm_medium: '',
        utm_campaign: ''
    };

    constructor() {
        this.sessionId = this.getOrGenerateSessionId();
        this.visitorId = this.getOrGenerateVisitorId();

        // fetch IP (independent of Supabase)
        this.fetchIpAddress();

        // Resolve traffic source
        this.trafficSourceData = this.resolveTrafficSource();

        console.log('[Analytics] Service Ready. Visitor:', this.visitorId);
    }

    private getOrGenerateVisitorId(): string {
        let vid = localStorage.getItem('analytics_visitor_id');
        if (!vid) {
            vid = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
            localStorage.setItem('analytics_visitor_id', vid);
        }
        return vid;
    }

    private getOrGenerateSessionId(): string {
        let sid = sessionStorage.getItem('analytics_session_id');
        if (!sid) {
            sid = 'sid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
            sessionStorage.setItem('analytics_session_id', sid);
        }
        return sid;
    }

    private async fetchIpAddress() {
        try {
            const resp = await fetch('https://api.ipify.org?format=json');
            const data = await resp.json();
            this.ipAddress = data.ip;
        } catch (e) {
            this.ipAddress = 'Unknown';
        }
    }

    private getDeviceType(): string {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
        return 'desktop';
    }

    private getBrowser(): string {
        const ua = navigator.userAgent;
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        if (ua.indexOf('Chrome') > -1) return 'Chrome';
        if (ua.indexOf('Safari') > -1) return 'Safari';
        if (ua.indexOf('Edge') > -1) return 'Edge';
        return 'Other';
    }

    private resolveTrafficSource() {
        const params = new URLSearchParams(window.location.search);
        return {
            source: params.get('utm_source') ? 'campaign' : (document.referrer ? 'referral' : 'direct'),
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || ''
        };
    }

    public setUserId(uid: string | null) {
        if (uid) localStorage.setItem('user_id', uid);
        else localStorage.removeItem('user_id');
    }

    /**
     * Reusable tracking method used by components.
     */
    public trackEvent(eventName: string, metadata: Record<string, any> = {}, sheetName?: string) {
        const payload: AnalyticsPayload = {
            visitor_id: this.visitorId,
            session_id: this.sessionId,
            event_name: eventName,
            page_url: window.location.href,
            page_title: document.title,
            product_name: metadata.product_name || null,
            device_type: this.getDeviceType(),
            browser: this.getBrowser(),
            traffic_source: this.trafficSourceData.source,
            utm_source: this.trafficSourceData.utm_source,
            utm_medium: this.trafficSourceData.utm_medium,
            utm_campaign: this.trafficSourceData.utm_campaign,
            ip_address: this.ipAddress,
            timestamp: new Date().toISOString(),
            sheet_name: sheetName
        };

        // Attach extra metadata
        payload.metadata = JSON.stringify(metadata);

        sendAnalyticsEvent(payload);
    }
}

// ── EXPORTS ──────────────────────────────────────────────────────

export const analytics = new AnalyticsService();

// Attach to window for easy manual testing
if (typeof window !== 'undefined') {
    (window as any).sendAnalyticsEvent = sendAnalyticsEvent;
    (window as any).analytics = analytics;
}

export default analytics;
