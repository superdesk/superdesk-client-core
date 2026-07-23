import {appConfig} from 'appConfig';
import {
    getSpellcheckShortcut,
    getSpellcheckShortcutLabel,
    matchesSpellcheckShortcut,
} from './spellcheck-shortcut';

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

describe('spellcheck-shortcut', () => {
    let originalSpellchecking: typeof appConfig.spellchecking;

    beforeEach(() => {
        originalSpellchecking = appConfig.spellchecking;
    });

    afterEach(() => {
        appConfig.spellchecking = originalSpellchecking;
    });

    it('defaults to Alt+S when no shortcut is configured', () => {
        appConfig.spellchecking = {};

        expect(getSpellcheckShortcut()).toEqual({key: 's', modifiers: ['alt']});
        expect(getSpellcheckShortcutLabel()).toBe('Alt+S');
    });

    it('uses the configured shortcut when present', () => {
        appConfig.spellchecking = {shortcut: {key: 's', modifiers: ['alt', 'shift']}};

        expect(getSpellcheckShortcut()).toEqual({key: 's', modifiers: ['alt', 'shift']});
        expect(getSpellcheckShortcutLabel()).toBe('Alt+Shift+S');
    });

    it('matches the default Alt+S event', () => {
        appConfig.spellchecking = {};

        expect(matchesSpellcheckShortcut(keyEvent({key: 's', altKey: true, code: 'KeyS'}))).toBe(true);
        expect(matchesSpellcheckShortcut(keyEvent({key: 's', altKey: true, shiftKey: true, code: 'KeyS'}))).toBe(false);
    });

    it('matches the configured override and not the old default', () => {
        appConfig.spellchecking = {shortcut: {key: 's', modifiers: ['alt', 'shift']}};

        expect(matchesSpellcheckShortcut(keyEvent({key: 's', altKey: true, shiftKey: true, code: 'KeyS'}))).toBe(true);
        expect(matchesSpellcheckShortcut(keyEvent({key: 's', altKey: true, code: 'KeyS'}))).toBe(false);
    });
});
