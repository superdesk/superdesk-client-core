import {IShortcutConfig} from 'superdesk-api';
import {
    physicalKeyToChar,
    shortcutToKey,
    eventToShortcutKeys,
    matchesShortcut,
    formatShortcut,
} from './shortcuts';

function keyEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
    return {
        key: '',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        ...overrides,
    } as unknown as KeyboardEvent;
}

// karma runs in Chrome on Linux, so isMacOS() is false by default. Shadow
// navigator.userAgent to exercise the macOS branches, restoring afterwards.
function withPlatform(mac: boolean, fn: () => void): void {
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

describe('editor3 shortcut helpers', () => {
    describe('physicalKeyToChar', () => {
        it('maps letter, digit and punctuation codes to their base character', () => {
            expect(physicalKeyToChar('KeyS')).toBe('s');
            expect(physicalKeyToChar('Digit3')).toBe('3');
            expect(physicalKeyToChar('Minus')).toBe('-');
            expect(physicalKeyToChar('Space')).toBe(' ');
        });

        it('returns null for keys it does not know', () => {
            expect(physicalKeyToChar('F7')).toBe(null);
        });
    });

    describe('shortcutToKey', () => {
        it('normalizes and sorts modifiers', () => {
            expect(shortcutToKey({key: 's', modifiers: ['alt']})).toBe('alt+s');
            expect(shortcutToKey({key: '-', modifiers: ['shift', 'alt']})).toBe('alt+shift+-');
        });

        it('resolves "primary" per platform', () => {
            withPlatform(false, () => {
                expect(shortcutToKey({key: 's', modifiers: ['primary']})).toBe('ctrl+s');
            });
            withPlatform(true, () => {
                expect(shortcutToKey({key: 's', modifiers: ['primary']})).toBe('cmd+s');
            });
        });
    });

    describe('eventToShortcutKeys', () => {
        it('includes the physical-key fallback alongside the character key', () => {
            const keys = eventToShortcutKeys(keyEvent({key: 's', altKey: true, code: 'KeyS'}));

            expect(keys).toContain('alt+s');
        });

        it('derives the key from e.code when e.key is a produced character (macOS Option)', () => {
            // On macOS Option+S yields 'ß' as e.key; e.code stays 'KeyS'.
            const keys = eventToShortcutKeys(keyEvent({key: 'ß', altKey: true, code: 'KeyS'}));

            expect(keys).toContain('alt+s');
        });
    });

    describe('matchesShortcut', () => {
        it('matches Alt+S on Windows/Linux', () => {
            expect(
                matchesShortcut({key: 's', modifiers: ['alt']}, keyEvent({key: 's', altKey: true, code: 'KeyS'})),
            ).toBe(true);
        });

        it('matches Option+S on macOS via the physical key even though e.key is "ß"', () => {
            expect(
                matchesShortcut({key: 's', modifiers: ['alt']}, keyEvent({key: 'ß', altKey: true, code: 'KeyS'})),
            ).toBe(true);
        });

        it('does not match when an extra modifier is held', () => {
            expect(
                matchesShortcut(
                    {key: 's', modifiers: ['alt']},
                    keyEvent({key: 's', altKey: true, ctrlKey: true, code: 'KeyS'}),
                ),
            ).toBe(false);
        });

        it('does not match a different key', () => {
            expect(
                matchesShortcut({key: 's', modifiers: ['alt']}, keyEvent({key: 'a', altKey: true, code: 'KeyA'})),
            ).toBe(false);
        });

        it('resolves "primary" to Ctrl off macOS and Cmd on macOS', () => {
            const primary: IShortcutConfig = {key: 's', modifiers: ['primary']};

            withPlatform(false, () => {
                expect(matchesShortcut(primary, keyEvent({key: 's', ctrlKey: true, code: 'KeyS'}))).toBe(true);
            });
            withPlatform(true, () => {
                expect(matchesShortcut(primary, keyEvent({key: 's', metaKey: true, code: 'KeyS'}))).toBe(true);
            });
        });
    });

    describe('formatShortcut', () => {
        it('renders Windows/Linux labels', () => {
            withPlatform(false, () => {
                expect(formatShortcut({key: 's', modifiers: ['alt']})).toBe('Alt+S');
                expect(formatShortcut({key: 's', modifiers: ['alt', 'shift']})).toBe('Alt+Shift+S');
                expect(formatShortcut({key: 's', modifiers: ['primary']})).toBe('Ctrl+S');
            });
        });

        it('renders macOS labels', () => {
            withPlatform(true, () => {
                expect(formatShortcut({key: 's', modifiers: ['alt']})).toBe('Option+S');
                expect(formatShortcut({key: 's', modifiers: ['primary']})).toBe('Cmd+S');
            });
        });

        it('uses friendly labels for special keys', () => {
            withPlatform(false, () => {
                expect(formatShortcut({key: ' ', modifiers: ['primary', 'alt', 'shift']})).toBe('Ctrl+Alt+Shift+Space');
            });
        });
    });
});
