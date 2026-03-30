import React from 'react';
import {appConfig} from 'appConfig';
import {isMacOS} from 'core/utils';
import {logger} from 'core/services/logger';
import {
    IShortcutConfig,
    ICustomInlineStyle,
    ICharacterInsertion,
    KeyModifier,
} from 'superdesk-api';

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
 * modifies e.key to produce alternate characters (e.g. Option+- → '–'),
 * making e.key unreliable for shortcut matching when Alt is a modifier.
 */
function physicalKeyToChar(code: string): string | null {
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

export interface IEditorControl {
    id: string;
    type: 'inline-style' | 'character-insertion';
    formatOption: string;
    commandName: string;
    draftJsStyle: string;
    icon: string;
    label: string;
    tooltip?: string;
    character?: string;
    borderColor?: 'tag-color-1' | 'tag-color-2';
    shortcut?: IShortcutConfig;
}

class CustomEditorControlsClass {
    private features: Map<string, IEditorControl> = new Map();
    private keyBindings: Map<string, IEditorControl> = new Map();
    private initialized = false;

    initialize() {
        if (this.initialized) return;

        this.registerFromConfig();

        this.initialized = true;
    }

    private registerFromConfig() {
        const features = appConfig.authoring?.customEditorFeatures;

        for (const style of features?.inlineStyles ?? []) {
            this.registerInlineStyle(style);
        }

        for (const insertion of features?.characterInsertions ?? []) {
            this.registerCharacterInsertion(insertion);
        }
    }

    private formatId(id: string, prefix: string): string {
        return `${prefix}_${id}`;
    }

    private registerInlineStyle(config: ICustomInlineStyle) {
        const formatOption = this.formatId(config.id, 'EDITOR_TAG');

        if (this.features.has(formatOption)) {
            logger.warn(`customEditorControls: duplicate formatOption "${formatOption}", skipping`);
            return;
        }

        const control: IEditorControl = {
            id: config.id,
            type: 'inline-style',
            formatOption,
            commandName: `toggle-${config.id}-tag`,
            draftJsStyle: formatOption,
            icon: config.icon,
            label: config.label,
            tooltip: config.tooltip,
            borderColor: config.borderColor,
            shortcut: config.shortcut,
        };

        this.features.set(formatOption, control);
        this.registerShortcut(config.shortcut, control);
    }

    private registerCharacterInsertion(config: ICharacterInsertion) {
        if (!config.character) {
            logger.warn(`customEditorControls: character insertion "${config.id}" has no character, skipping`);
            return;
        }

        const formatOption = this.formatId(config.id, 'INSERT_CHAR');

        if (this.features.has(formatOption)) {
            logger.warn(`customEditorControls: duplicate formatOption "${formatOption}", skipping`);
            return;
        }

        const control: IEditorControl = {
            id: config.id,
            type: 'character-insertion',
            formatOption,
            commandName: `insert-${config.id}`,
            draftJsStyle: formatOption,
            icon: config.icon,
            label: config.label,
            tooltip: config.tooltip,
            character: config.character,
            shortcut: config.shortcut,
        };

        this.features.set(formatOption, control);
        this.registerShortcut(config.shortcut, control);
    }

    private registerShortcut(shortcut: IShortcutConfig | undefined, control: IEditorControl) {
        if (shortcut == null) {
            return;
        }

        const key = this.shortcutToKey(shortcut);

        if (this.keyBindings.has(key)) {
            const existing = this.keyBindings.get(key);

            logger.warn(
                `customEditorControls: shortcut "${key}" for "${control.id}" conflicts with "${existing.id}"`,
            );
        }

        this.keyBindings.set(key, control);
    }

    private shortcutToKey(shortcut: IShortcutConfig): string {
        const normalizedModifiers = shortcut.modifiers
            .map((m) => (m === 'primary' ? (isMacOS() ? 'cmd' : 'ctrl') : m))
            .sort()
            .join('+');

        return `${normalizedModifiers}+${shortcut.key.toLowerCase()}`;
    }

    getAllFeatures(): Array<IEditorControl> {
        this.initialize();
        return Array.from(this.features.values());
    }

    getInlineStyles(): Array<IEditorControl> {
        return this.getAllFeatures().filter((f) => f.type === 'inline-style');
    }

    getCharacterInsertions(): Array<IEditorControl> {
        return this.getAllFeatures().filter((f) => f.type === 'character-insertion');
    }

    getFeatureByFormatOption(formatOption: string): IEditorControl | undefined {
        this.initialize();
        return this.features.get(formatOption);
    }

    getFeatureByCommand(command: string): IEditorControl | undefined {
        this.initialize();
        return this.getAllFeatures().find((f) => f.commandName === command);
    }

    matchKeyBinding(e: KeyboardEvent | React.KeyboardEvent): IEditorControl | null {
        this.initialize();

        const modifiers: Array<KeyModifier> = [];

        if (isMacOS()) {
            if (e.metaKey) modifiers.push('cmd');
            if (e.ctrlKey) modifiers.push('ctrl');
        } else {
            if (e.ctrlKey) modifiers.push('ctrl');
            if (e.metaKey) modifiers.push('cmd');
        }
        if (e.altKey) modifiers.push('alt');
        if (e.shiftKey) modifiers.push('shift');

        const modifierPrefix = modifiers.sort().join('+');

        // Try e.key first (the character produced by the keypress)
        const match = this.keyBindings.get(`${modifierPrefix}+${e.key.toLowerCase()}`);

        if (match) return match;

        // On macOS, Alt/Option modifies e.key (e.g. Option+- → '–' instead of '-').
        // Fall back to the physical key via e.code so shortcuts still match.
        // React 16 SyntheticKeyboardEvent does not expose e.code, so we read it
        // from the native event when available.
        const code = (e as KeyboardEvent).code ?? (e as React.KeyboardEvent).nativeEvent?.code;
        const physicalKey = code != null ? physicalKeyToChar(code) : null;

        if (physicalKey != null) {
            const physicalMatch = this.keyBindings.get(`${modifierPrefix}+${physicalKey}`);

            if (physicalMatch) return physicalMatch;
        }

        return null;
    }

    getStyleMap(): Record<string, React.CSSProperties> {
        this.initialize();
        const styleMap: Record<string, React.CSSProperties> = {};

        for (const feature of this.getInlineStyles()) {
            if (feature.borderColor) {
                const color = this.getBorderColor(feature.borderColor);

                styleMap[feature.draftJsStyle] = {
                    display: 'inline-block',
                    borderBlockEnd: `4px double ${color}`,
                };
            }
        }

        return styleMap;
    }

    private getBorderColor(borderColor: 'tag-color-1' | 'tag-color-2'): string {
        return borderColor === 'tag-color-1'
            ? 'var(--sd-editor-colour__mark-people, blue)'
            : 'var(--sd-editor-colour__mark-company, purple)';
    }

    formatShortcut(shortcut: IShortcutConfig): string {
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
}

export const customEditorControls = new CustomEditorControlsClass();
