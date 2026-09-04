import React from 'react';
import {isMacOS} from 'core/utils';
import {IShortcutConfig, KeyModifier} from 'superdesk-api';

const SPECIAL_KEY_LABELS: Record<string, string> = {
    ' ': 'Space',
    'arrowup': 'Up',
    'arrowdown': 'Down',
    'arrowleft': 'Left',
    'arrowright': 'Right',
};

/**
 * Maps KeyboardEvent.code (physical key) to the base character the key
 * represents without modifiers. This is needed because on macOS, Alt/Option
 * modifies e.key to produce alternate characters (e.g. Option+S → 'ß'),
 * making e.key unreliable for shortcut matching when Alt is a modifier.
 */
export function physicalKeyToChar(code: string): string | null {
    if (code.startsWith('Digit')) {
        return code.charAt(5).toLowerCase();
    }

    if (code.startsWith('Key')) {
        return code.charAt(3).toLowerCase();
    }

    const codeMap: Record<string, string> = {
        Minus: '-',
        Equal: '=',
        Space: ' ',
        BracketLeft: '[',
        BracketRight: ']',
        Backslash: '\\',
        Semicolon: ';',
        Quote: "'", // eslint-disable-line
        Comma: ',',
        Period: '.',
        Slash: '/',
        Backquote: '`',
    };

    return codeMap[code] ?? null;
}

/**
 * Normalizes a shortcut into a canonical string key, resolving `primary` to the
 * platform modifier (cmd on macOS, ctrl elsewhere).
 */
export function shortcutToKey(shortcut: IShortcutConfig): string {
    const normalizedModifiers = shortcut.modifiers
        .map((m) => (m === 'primary' ? (isMacOS() ? 'cmd' : 'ctrl') : m))
        .sort()
        .join('+');

    return `${normalizedModifiers}+${shortcut.key.toLowerCase()}`;
}

/**
 * Builds the canonical modifier+key string for a keyboard event. When the
 * character produced by the event does not match (macOS Alt/Option case), the
 * physical key (via e.code) is used as a fallback.
 */
export function eventToShortcutKeys(e: KeyboardEvent | React.KeyboardEvent): Array<string> {
    const modifiers: Array<KeyModifier> = [];

    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.metaKey) modifiers.push('cmd');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');

    const modifierPrefix = modifiers.sort().join('+');
    const keys = [`${modifierPrefix}+${e.key.toLowerCase()}`];

    const code = (e as KeyboardEvent).code ?? (e as React.KeyboardEvent).nativeEvent?.code;
    const physicalKey = code != null ? physicalKeyToChar(code) : null;

    if (physicalKey != null) {
        keys.push(`${modifierPrefix}+${physicalKey}`);
    }

    return keys;
}

/**
 * Returns true when the keyboard event matches the configured shortcut, robust
 * across platforms (handles the macOS Option-produces-a-character case).
 */
export function matchesShortcut(shortcut: IShortcutConfig, e: KeyboardEvent | React.KeyboardEvent): boolean {
    const target = shortcutToKey(shortcut);

    return eventToShortcutKeys(e).includes(target);
}

/**
 * Human-readable, platform-aware label for a shortcut (e.g. "Option+S" on macOS,
 * "Alt+S" elsewhere).
 */
export function formatShortcut(shortcut: IShortcutConfig): string {
    const mac = isMacOS();

    const parts = shortcut.modifiers.map((m) => {
        switch (m) {
            case 'primary':
                return mac ? 'Cmd' : 'Ctrl';
            case 'alt':
                return mac ? 'Option' : 'Alt';
            case 'shift':
                return 'Shift';
            case 'ctrl':
                return 'Ctrl';
            case 'cmd':
                return 'Cmd';
            default:
                return m;
        }
    });

    const keyLabel = SPECIAL_KEY_LABELS[shortcut.key] ?? shortcut.key.toUpperCase();

    return [...parts, keyLabel].join('+');
}
