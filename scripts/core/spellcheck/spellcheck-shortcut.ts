import {appConfig} from 'appConfig';
import {IShortcutConfig} from 'superdesk-api';
import {formatShortcut, matchesShortcut} from 'core/editor3/helpers/shortcuts';

const DEFAULT_SPELLCHECK_SHORTCUT: IShortcutConfig = {
    key: 's',
    modifiers: ['alt'],
};

export function getSpellcheckShortcut(): IShortcutConfig {
    return appConfig.spellchecking?.shortcut ?? DEFAULT_SPELLCHECK_SHORTCUT;
}

export function getSpellcheckShortcutLabel(): string {
    return formatShortcut(getSpellcheckShortcut());
}

export function matchesSpellcheckShortcut(e: KeyboardEvent): boolean {
    return matchesShortcut(getSpellcheckShortcut(), e);
}
