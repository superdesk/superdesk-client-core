import {gettext} from 'core/utils';

export type IPairingStatus = 'pending' | 'claimed' | 'approved' | 'completed' | 'denied' | 'failed';

export type IPairingDecision = 'approved' | 'denied';

/** `GET /mobile_pairing/<id>` */
export interface IPairingDoc {
    _id: string;
    _etag: string;
    status: IPairingStatus;
    expires_in: number; // seconds left on the server clock, 0 means expired
    device_name?: string | null;
    match_number?: number | null;
}

/** `POST /mobile_pairing`, the only response that carries the code */
export interface ICreatedPairingDoc extends IPairingDoc {
    code: string;
}

export type IPairingRequestError =
    | {kind: 'network'}
    | {kind: 'http'; status: number; issue: string | null};

export interface IPairingSnapshot {
    id: string;
    code: string;
    etag: string;
    status: IPairingStatus;
    deviceName: string | null;
    matchNumber: number | null;

    /**
     * Client clock time (ms) when the current step expires, computed from `expires_in`
     * so a skewed client clock does not matter. `null` while unknown.
     */
    expiresAt: number | null;
}

export type IPairingBusy = 'creating' | 'approving' | 'denying' | null;

export type IPairingView =
    | {kind: 'creating'}
    | {kind: 'refreshing'}
    | {kind: 'scan'; deepLink: string; secondsLeft: number}
    | {kind: 'confirm'; deviceName: string | null; matchNumber: number; secondsLeft: number}
    | {kind: 'finishing'; deviceName: string | null}
    | {kind: 'completed'; deviceName: string | null}
    | {kind: 'denied'}
    | {kind: 'failed'}
    | {kind: 'expired'}
    | {kind: 'error'; message: string};

const NON_TERMINAL_STATUSES: Array<IPairingStatus> = ['pending', 'claimed', 'approved'];

/**
 * Absolute API base URL without a trailing slash. The configured URL can be relative
 * to the page, but the phone needs a full address.
 */
export function getAbsoluteApiUrl(serverUrl: string, pageUrl: string): string {
    return new URL(serverUrl, pageUrl).href.replace(/\/+$/, '');
}

/** A phone can not reach a server that is only reachable from this computer. */
export function isLoopbackUrl(url: string): boolean {
    const {hostname} = new URL(url);

    return hostname === 'localhost'
        || hostname.endsWith('.localhost')
        || hostname === '[::1]'
        || hostname.startsWith('127.');
}

export function buildPairingDeepLink(apiUrl: string, code: string): string {
    return `superdesk-reporter://pair?server=${encodeURIComponent(apiUrl)}&code=${encodeURIComponent(code)}`;
}

function getExpiresAt(doc: IPairingDoc, receivedAt: number): number | null {
    return typeof doc.expires_in === 'number'
        ? receivedAt + Math.max(0, doc.expires_in) * 1000
        : null;
}

export function snapshotFromCreated(doc: ICreatedPairingDoc, receivedAt: number): IPairingSnapshot {
    return {
        id: doc._id,
        code: doc.code,
        etag: doc._etag,
        status: doc.status ?? 'pending',
        deviceName: null,
        matchNumber: null,
        expiresAt: getExpiresAt(doc, receivedAt),
    };
}

export function applyPairingDoc(
    snapshot: IPairingSnapshot,
    doc: IPairingDoc,
    receivedAt: number,
): IPairingSnapshot {
    return {
        ...snapshot,
        etag: doc._etag,
        status: doc.status,
        deviceName: doc.device_name ?? null,
        matchNumber: doc.match_number ?? null,
        expiresAt: getExpiresAt(doc, receivedAt),
    };
}

/** `null` when the expiry is not known yet */
export function getSecondsLeft(snapshot: IPairingSnapshot, now: number): number | null {
    if (snapshot.expiresAt == null) {
        return null;
    }

    return Math.max(0, Math.ceil((snapshot.expiresAt - now) / 1000));
}

function isExpired(snapshot: IPairingSnapshot, now: number): boolean {
    return getSecondsLeft(snapshot, now) === 0;
}

export function formatCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;

    return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
}

export function getPairingErrorMessage(error: IPairingRequestError): string {
    if (error.kind === 'network') {
        return gettext('Could not reach the server. Check your connection and try again.');
    }

    if (error.issue === 'expired') {
        return gettext('The sign-in request expired before it was approved.');
    }

    if (error.issue === 'invalid_state') {
        return gettext('This sign-in request can no longer be approved.');
    }

    switch (error.status) {
        case 403:
            return gettext('You are not allowed to connect a mobile app.');
        case 404:
            return gettext('This sign-in request no longer exists.');
        default:
            return gettext('Something went wrong while connecting the mobile app (error {{status}}).', {
                status: error.status,
            });
    }
}

export function deriveViewState(
    snapshot: IPairingSnapshot | null,
    now: number,
    apiUrl: string,
    error: IPairingRequestError | null,
): IPairingView {
    if (error != null) {
        return {kind: 'error', message: getPairingErrorMessage(error)};
    }

    if (snapshot == null) {
        return {kind: 'creating'};
    }

    const secondsLeft = getSecondsLeft(snapshot, now);

    switch (snapshot.status) {
        case 'pending':
        // an expired code is about to be replaced, see `shouldRegenerate`
            return secondsLeft === 0
                ? {kind: 'refreshing'}
                : {kind: 'scan', deepLink: buildPairingDeepLink(apiUrl, snapshot.code), secondsLeft: secondsLeft ?? 0};
        case 'claimed':
            if (secondsLeft === 0) {
                return {kind: 'expired'};
            }

            // the number is what lets the user tell their own phone from someone else's
            if (snapshot.matchNumber == null) {
                return {kind: 'error', message: gettext('The server did not send a number to compare.')};
            }

            return {
                kind: 'confirm',
                deviceName: snapshot.deviceName,
                matchNumber: snapshot.matchNumber,
                secondsLeft: secondsLeft ?? 0,
            };
        case 'approved':
            return secondsLeft === 0
                ? {kind: 'expired'}
                : {kind: 'finishing', deviceName: snapshot.deviceName};
        case 'completed':
            return {kind: 'completed', deviceName: snapshot.deviceName};
        case 'denied':
            return {kind: 'denied'};
        case 'failed':
            return {kind: 'failed'};
        default:
            return {kind: 'error', message: gettext('Unexpected sign-in request state.')};
    }
}

/**
 * How long after the code runs out on this clock the dialog waits before replacing it. The
 * deadline comes from `expires_in`, which the server rounds up, and starts when the response
 * arrived, so the server's deadline can be up to the request latency later. Replacing the code
 * retires the old one on the server, so it must not happen while a phone could still claim it.
 */
export const REGENERATE_GRACE_MS = 2000;

/** A pending code ran out and nobody scanned it: replace it with a new one. */
export function shouldRegenerate(
    snapshot: IPairingSnapshot | null,
    now: number,
    busy: IPairingBusy,
    error: IPairingRequestError | null,
): boolean {
    return snapshot != null
        && busy == null
        && error == null
        && snapshot.status === 'pending'
        && isExpired(snapshot, now - REGENERATE_GRACE_MS);
}

export function shouldPoll(
    snapshot: IPairingSnapshot | null,
    now: number,
    busy: IPairingBusy,
    error: IPairingRequestError | null,
): boolean {
    return snapshot != null
        && busy == null
        && error == null
        && NON_TERMINAL_STATUSES.includes(snapshot.status)
        && !isExpired(snapshot, now);
}

/** Closing the dialog withdraws a request that nobody approved yet. */
export function shouldCancelOnClose(snapshot: IPairingSnapshot | null): boolean {
    return snapshot != null && (snapshot.status === 'pending' || snapshot.status === 'claimed');
}
