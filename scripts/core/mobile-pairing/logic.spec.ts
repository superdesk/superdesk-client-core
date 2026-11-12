import {
    applyPairingDoc,
    buildPairingDeepLink,
    deriveViewState,
    formatCountdown,
    getAbsoluteApiUrl,
    getSecondsLeft,
    IPairingSnapshot,
    isLoopbackUrl,
    shouldCancelOnClose,
    shouldPoll,
    REGENERATE_GRACE_MS,
    shouldRegenerate,
    snapshotFromCreated,
} from './logic';

const API_URL = 'https://sd.example.com/api';
const NOW = 1_000_000;

function snapshot(overrides: Partial<IPairingSnapshot> = {}): IPairingSnapshot {
    return {
        id: 'pairing-1',
        code: 'code_-123',
        etag: 'etag-1',
        status: 'pending',
        deviceName: null,
        matchNumber: null,
        expiresAt: NOW + 30_000,
        ...overrides,
    };
}

describe('mobile pairing logic', () => {
    describe('buildPairingDeepLink', () => {
        it('percent-encodes the server url so it survives as a single query parameter', () => {
            expect(buildPairingDeepLink('http://host:5011/api', 'abc_-DEF')).toBe(
                'superdesk-reporter://pair?server=http%3A%2F%2Fhost%3A5011%2Fapi&code=abc_-DEF',
            );
        });

        it('encodes characters in the server url that would otherwise start new parameters', () => {
            const link = buildPairingDeepLink('https://sd.example.com/api?tenant=a&x=1#frag', 'code');
            const url = new URL(link);

            expect(url.searchParams.get('server')).toBe('https://sd.example.com/api?tenant=a&x=1#frag');
            expect(url.searchParams.get('code')).toBe('code');
            const keys: Array<string> = [];

            url.searchParams.forEach((_value, key) => {
                keys.push(key);
            });

            expect(keys).toEqual(['server', 'code']);
        });
    });

    describe('getAbsoluteApiUrl', () => {
        it('keeps an absolute url and drops a trailing slash', () => {
            expect(getAbsoluteApiUrl('http://host:5011/api', 'http://other/#/workspace')).toBe('http://host:5011/api');
            expect(getAbsoluteApiUrl('http://host:5011/api/', 'http://other/')).toBe('http://host:5011/api');
            expect(getAbsoluteApiUrl('http://host:5011', 'http://other/')).toBe('http://host:5011');
        });

        it('resolves a relative url against the page', () => {
            expect(getAbsoluteApiUrl('/api', 'https://sd.example.com/#/workspace/monitoring')).toBe(
                'https://sd.example.com/api',
            );
        });
    });

    describe('isLoopbackUrl', () => {
        it('flags addresses a phone can not reach', () => {
            expect(isLoopbackUrl('http://localhost:5011/api')).toBe(true);
            expect(isLoopbackUrl('http://127.0.0.1:5000/api')).toBe(true);
            expect(isLoopbackUrl('http://[::1]:5000/api')).toBe(true);
            expect(isLoopbackUrl('https://sd.example.com/api')).toBe(false);
            expect(isLoopbackUrl('http://192.168.1.20:5000/api')).toBe(false);
        });
    });

    describe('getSecondsLeft and formatCountdown', () => {
        it('rounds up and never goes below zero', () => {
            expect(getSecondsLeft(snapshot({expiresAt: NOW + 1}), NOW)).toBe(1);
            expect(getSecondsLeft(snapshot({expiresAt: NOW + 60_000}), NOW)).toBe(60);
            expect(getSecondsLeft(snapshot({expiresAt: NOW - 5_000}), NOW)).toBe(0);
            expect(getSecondsLeft(snapshot({expiresAt: null}), NOW)).toBe(null);
        });

        it('formats minutes and padded seconds', () => {
            expect(formatCountdown(0)).toBe('0:00');
            expect(formatCountdown(9)).toBe('0:09');
            expect(formatCountdown(60)).toBe('1:00');
            expect(formatCountdown(125)).toBe('2:05');
        });
    });

    describe('snapshots', () => {
        it('computes the expiry from expires_in on the client clock', () => {
            const created = snapshotFromCreated(
                {_id: 'p1', _etag: 'e1', status: 'pending', code: 'c', expires_in: 60},
                NOW,
            );

            expect(created).toEqual({
                id: 'p1',
                code: 'c',
                etag: 'e1',
                status: 'pending',
                deviceName: null,
                matchNumber: null,
                expiresAt: NOW + 60_000,
            });
        });

        it('keeps the code when applying a polled document, which never carries it', () => {
            const updated = applyPairingDoc(
                snapshot(),
                {
                    _id: 'pairing-1',
                    _etag: 'etag-2',
                    status: 'claimed',
                    expires_in: 120,
                    device_name: 'Pixel',
                    match_number: 42,
                },
                NOW,
            );

            expect(updated).toEqual({
                id: 'pairing-1',
                code: 'code_-123',
                etag: 'etag-2',
                status: 'claimed',
                deviceName: 'Pixel',
                matchNumber: 42,
                expiresAt: NOW + 120_000,
            });
        });
    });

    describe('deriveViewState', () => {
        it('shows a spinner before the first pairing exists', () => {
            expect(deriveViewState(null, NOW, API_URL, null)).toEqual({kind: 'creating'});
        });

        it('shows the QR deep link and the time left for a pending pairing', () => {
            expect(deriveViewState(snapshot(), NOW, API_URL, null)).toEqual({
                kind: 'scan',
                deepLink: buildPairingDeepLink(API_URL, 'code_-123'),
                secondsLeft: 30,
            });
        });

        it('hides an expired pending code while it is replaced', () => {
            expect(deriveViewState(snapshot({expiresAt: NOW}), NOW, API_URL, null)).toEqual({kind: 'refreshing'});
        });

        it('asks for confirmation with the device name and number once claimed', () => {
            const claimed = snapshot(
                {status: 'claimed', deviceName: 'Pixel 8', matchNumber: 42, expiresAt: NOW + 90_000},
            );

            expect(deriveViewState(claimed, NOW, API_URL, null)).toEqual({
                kind: 'confirm',
                deviceName: 'Pixel 8',
                matchNumber: 42,
                secondsLeft: 90,
            });
        });

        it('never offers approval for a claim without a number to compare', () => {
            const claimed = snapshot({status: 'claimed', deviceName: 'Pixel 8', matchNumber: null});

            expect(deriveViewState(claimed, NOW, API_URL, null).kind).toBe('error');
        });

        it('reports a claim that ran out of time as expired', () => {
            const claimed = snapshot({status: 'claimed', matchNumber: 42, expiresAt: NOW - 1});

            expect(deriveViewState(claimed, NOW, API_URL, null)).toEqual({kind: 'expired'});
        });

        it('waits for the phone after approval, also before the new expiry is known', () => {
            const approved = snapshot({status: 'approved', deviceName: 'Pixel', expiresAt: null});

            expect(deriveViewState(approved, NOW, API_URL, null)).toEqual({kind: 'finishing', deviceName: 'Pixel'});
            expect(deriveViewState(snapshot({status: 'approved', expiresAt: NOW + 10_000}), NOW, API_URL, null).kind)
                .toBe('finishing');
            expect(deriveViewState(snapshot({status: 'approved', expiresAt: NOW}), NOW, API_URL, null))
                .toEqual({kind: 'expired'});
        });

        it('maps the terminal statuses', () => {
            const completed = snapshot({status: 'completed', deviceName: 'Pixel', expiresAt: NOW - 1});

            expect(deriveViewState(completed, NOW, API_URL, null)).toEqual({kind: 'completed', deviceName: 'Pixel'});
            expect(deriveViewState(snapshot({status: 'denied'}), NOW, API_URL, null)).toEqual({kind: 'denied'});
            expect(deriveViewState(snapshot({status: 'failed'}), NOW, API_URL, null)).toEqual({kind: 'failed'});
        });

        it('lets an error win over the pairing state', () => {
            const view = deriveViewState(snapshot(), NOW, API_URL, {kind: 'network'});

            expect(view.kind).toBe('error');
        });

        it('explains the known errors', () => {
            const message = (error) => {
                const view = deriveViewState(null, NOW, API_URL, error);

                return view.kind === 'error' ? view.message : null;
            };

            expect(message({kind: 'network'})).toContain('Could not reach the server');
            expect(message({kind: 'http', status: 403, issue: null})).toContain('not allowed');
            expect(message({kind: 'http', status: 404, issue: null})).toContain('no longer exists');
            expect(message({kind: 'http', status: 400, issue: 'expired'})).toContain('expired');
            expect(message({kind: 'http', status: 400, issue: 'invalid_state'})).toContain('can no longer be approved');
            expect(message({kind: 'http', status: 500, issue: null})).toContain('500');
        });
    });

    describe('shouldRegenerate', () => {
        it('replaces a pending code only once it has also expired on the server', () => {
            expect(shouldRegenerate(snapshot({expiresAt: NOW + 1_000}), NOW, null, null)).toBe(false);
            const expired = snapshot({expiresAt: NOW});

            expect(shouldRegenerate(expired, NOW, null, null)).toBe(false);
            expect(shouldRegenerate(expired, NOW + REGENERATE_GRACE_MS - 1, null, null)).toBe(false);
            expect(shouldRegenerate(expired, NOW + REGENERATE_GRACE_MS, null, null)).toBe(true);
        });

        it('stops regenerating once a phone claimed the code', () => {
            expect(shouldRegenerate(snapshot({status: 'claimed', expiresAt: NOW - 1}), NOW, null, null)).toBe(false);
            expect(shouldRegenerate(snapshot({status: 'approved', expiresAt: NOW - 1}), NOW, null, null)).toBe(false);
        });

        it('waits for requests in flight and does not regenerate over an error', () => {
            const expired = snapshot({expiresAt: NOW});

            expect(shouldRegenerate(expired, NOW, 'creating', null)).toBe(false);
            expect(shouldRegenerate(expired, NOW, null, {kind: 'network'})).toBe(false);
            expect(shouldRegenerate(null, NOW, null, null)).toBe(false);
        });
    });

    describe('shouldPoll', () => {
        it('polls while the pairing can still change', () => {
            expect(shouldPoll(snapshot(), NOW, null, null)).toBe(true);
            expect(shouldPoll(snapshot({status: 'claimed'}), NOW, null, null)).toBe(true);
            expect(shouldPoll(snapshot({status: 'approved', expiresAt: null}), NOW, null, null)).toBe(true);
        });

        it('stops on terminal states, expiry, errors and requests in flight', () => {
            expect(shouldPoll(snapshot({status: 'completed'}), NOW, null, null)).toBe(false);
            expect(shouldPoll(snapshot({status: 'denied'}), NOW, null, null)).toBe(false);
            expect(shouldPoll(snapshot({status: 'failed'}), NOW, null, null)).toBe(false);
            expect(shouldPoll(snapshot({status: 'claimed', expiresAt: NOW}), NOW, null, null)).toBe(false);
            expect(shouldPoll(snapshot(), NOW, 'approving', null)).toBe(false);
            expect(shouldPoll(snapshot(), NOW, null, {kind: 'network'})).toBe(false);
            expect(shouldPoll(null, NOW, null, null)).toBe(false);
        });
    });

    describe('shouldCancelOnClose', () => {
        it('cancels only requests nobody decided yet', () => {
            expect(shouldCancelOnClose(snapshot({status: 'pending'}))).toBe(true);
            expect(shouldCancelOnClose(snapshot({status: 'claimed'}))).toBe(true);
            expect(shouldCancelOnClose(snapshot({status: 'approved'}))).toBe(false);
            expect(shouldCancelOnClose(snapshot({status: 'completed'}))).toBe(false);
            expect(shouldCancelOnClose(snapshot({status: 'denied'}))).toBe(false);
            expect(shouldCancelOnClose(null)).toBe(false);
        });
    });
});
