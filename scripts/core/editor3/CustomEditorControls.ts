import React from 'react';
import {appConfig} from 'appConfig';
import {logger} from 'core/services/logger';
import {
    IShortcutConfig,
    ICustomInlineStyle,
    ICharacterInsertion,
} from 'superdesk-api';
import {eventToShortcutKeys, formatShortcut, shortcutToKey} from './helpers/shortcuts';

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

        const key = shortcutToKey(shortcut);

        if (this.keyBindings.has(key)) {
            const existing = this.keyBindings.get(key);

            logger.warn(
                `customEditorControls: shortcut "${key}" for "${control.id}" conflicts with "${existing.id}"`,
            );
        }

        this.keyBindings.set(key, control);
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

        for (const key of eventToShortcutKeys(e)) {
            const match = this.keyBindings.get(key);

            if (match) {
                return match;
            }
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
        return formatShortcut(shortcut);
    }
}

export const customEditorControls = new CustomEditorControlsClass();
