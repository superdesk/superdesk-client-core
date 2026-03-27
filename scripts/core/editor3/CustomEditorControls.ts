import {appConfig} from 'appConfig';
import {isMacOS} from 'core/utils';
import {
    IShortcutConfig,
    ICustomInlineStyle,
    ICharacterInsertion,
    KeyModifier,
} from 'superdesk-api';

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
        const commandName = `toggle-${config.id}-tag`;

        const feature: IEditorControl = {
            id: config.id,
            type: 'inline-style',
            formatOption,
            commandName,
            draftJsStyle: formatOption,
            icon: config.icon,
            label: config.label,
            tooltip: config.tooltip,
            borderColor: config.borderColor,
            shortcut: config.shortcut,
        };

        this.features.set(formatOption, feature);

        if (config.shortcut) {
            const key = this.shortcutToKey(config.shortcut);

            this.keyBindings.set(key, feature);
        }
    }

    private registerCharacterInsertion(config: ICharacterInsertion) {
        const formatOption = this.formatId(config.id, 'INSERT_CHAR');
        const commandName = `insert-${config.id}`;

        const feature: IEditorControl = {
            id: config.id,
            type: 'character-insertion',
            formatOption,
            commandName,
            draftJsStyle: formatOption,
            icon: config.icon,
            label: config.label,
            tooltip: config.tooltip,
            character: config.character,
            shortcut: config.shortcut,
        };

        this.features.set(formatOption, feature);

        if (config.shortcut) {
            const key = this.shortcutToKey(config.shortcut);

            this.keyBindings.set(key, feature);
        }
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

    matchKeyBinding(e: KeyboardEvent): IEditorControl | null {
        this.initialize();

        const key = e.key.toLowerCase();
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

        const exactKey = `${modifiers.sort().join('+')}+${key}`;
        const exactMatch = this.keyBindings.get(exactKey);

        if (exactMatch) return exactMatch;

        const primaryModifiers = modifiers
            .map((m) => (m === 'cmd' || m === 'ctrl' ? 'primary' : m))
            .filter((m, i, arr) => arr.indexOf(m) === i);
        const primaryKey = `${primaryModifiers.sort().join('+')}+${key}`;

        return this.keyBindings.get(primaryKey) || null;
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
        const parts = shortcut.modifiers.map((m) => {
            switch (m) {
                case 'primary':
                    return isMacOS() ? 'Cmd' : 'Ctrl';
                case 'alt':
                    return 'Alt';
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

        return [...parts, shortcut.key.toUpperCase()].join('+');
    }
}

export const customEditorControls = new CustomEditorControlsClass();
