/**
 * Runs `fn` with `navigator.userAgent` shadowed so `isMacOS()` reports the
 * requested platform, restoring the original value afterwards. Karma runs on
 * whatever OS the developer or CI uses, so platform-dependent assertions must
 * pin the platform explicitly instead of relying on the host.
 */
export function withPlatform(mac: boolean, fn: () => void): void {
    const original = navigator.userAgent;

    Object.defineProperty(window.navigator, 'userAgent', {
        value: mac
            ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
            : 'Mozilla/5.0 (X11; Linux x86_64)',
        configurable: true,
    });

    try {
        fn();
    } finally {
        Object.defineProperty(window.navigator, 'userAgent', {value: original, configurable: true});
    }
}
