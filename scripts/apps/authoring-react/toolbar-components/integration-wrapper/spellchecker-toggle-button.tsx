import React from 'react';
import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {getSpellcheckerConfig} from 'core/editor3/components/spellchecker/default-spellcheckers';
import {getSpellcheckShortcutLabel, matchesSpellcheckShortcut} from 'core/spellcheck/spellcheck-shortcut';
import {useToolbarContext} from './toolbar-context';
import {ToolbarIconButton} from './toolbar-icon-button';

/**
 * Like angular's `isSpellcheckerAvailable`, but asks for the language's dictionaries:
 * `spellcheck.isActiveDictionary` is global and only kept up to date while the spellchecker is on.
 */
export function isSpellcheckerAvailable(language: string): Promise<boolean> {
    if (appConfig.features?.useTansaProofing === true) {
        return Promise.resolve(false);
    }

    if (getSpellcheckerConfig()[language]?.spellcheckerId != null) {
        return Promise.resolve(true);
    }

    return Promise.resolve(ng.get('spellcheck').getDictionary(language))
        .then((dictionaries: Array<unknown>) => dictionaries.length > 0)
        .catch(() => false);
}

export const SpellcheckerToggleButton: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed, readOnly} = useToolbarContext<IArticle>();
    const [available, setAvailable] = React.useState(false);

    // the language editor3 spellchecks with, see `getLanguage` in authoring-integration-wrapper
    const language = entity.language ?? 'en';
    const spellchecker = exposed?.spellchecker;
    const enabled = spellchecker?.enabled === true;

    React.useEffect(() => {
        let current = true;

        isSpellcheckerAvailable(language).then((result) => {
            if (current) {
                setAvailable(result);
            }
        });

        return () => {
            current = false;
        };
    }, [language]);

    React.useEffect(() => {
        if (!available || readOnly || spellchecker == null) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (matchesSpellcheckShortcut(event)) {
                // keeps the combo (e.g. Alt+S) from reaching the browser menu
                event.preventDefault();
                spellchecker.setSpellcheckerStatus(!enabled);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [available, readOnly, spellchecker, enabled]);

    if (!available || spellchecker == null) {
        return null;
    }

    const status = enabled ? gettext('Spell checker on') : gettext('Spell checker off');

    return (
        <ToolbarIconButton
            icon="font"
            label={`${status} (${getSpellcheckShortcutLabel()})`}
            testId="authoring-spellchecker-toggle"
            pressed={enabled}
            onClick={() => spellchecker.setSpellcheckerStatus(!enabled)}
        />
    );
};
