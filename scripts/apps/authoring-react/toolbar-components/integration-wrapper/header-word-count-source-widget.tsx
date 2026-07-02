import React from 'react';
import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {gettext, gettextPlural} from 'core/utils';
import {countWords} from 'core/count-words';
import * as helpers from 'apps/authoring/authoring/helpers';
import {useToolbarContext} from './toolbar-context';

/**
 * Implements the authoring-react header's live WORDS counter and SOURCE block, matching legacy
 * (authoring-header.html). The word count is derived from body_html the same way legacy did
 * (cleanHtml -> countWords), and it
 * updates as the user types because `getLatestItem()` serialises the live editor3 content on every
 * re-render. Reads from the toolbar context's `getLatestItem()` rather than the widget `entity` prop,
 * which can be stale.
 */
export const HeaderWordCountSourceWidget: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useToolbarContext<IArticle>();

    if (exposed == null) {
        return null;
    }

    const item = exposed.getLatestItem();

    if (item.type !== 'text') {
        return null;
    }

    const wordCountEnabled = appConfig.ui?.authoring?.firstLine?.wordCount ?? true;
    const wordCount = countWords(helpers.cleanHtml(item.body_html ?? ''));
    const source = item.source ?? '';

    return (
        <div className="authoring-header__general-info">
            {wordCountEnabled && (
                <span data-test-id="authoring-header-word-count" data-test-value={wordCount.toString()}>
                    <strong className="authoring-header__value">{wordCount}</strong>
                    {' '}
                    <span className="authoring-header__label">
                        {gettextPlural(wordCount, 'WORD', 'WORDS')}
                    </span>
                </span>
            )}

            {source.length > 0 && (
                <span data-test-id="authoring-header-source" data-test-value={source}>
                    <span className="authoring-header__label">{gettext('SOURCE')}</span>
                    {' '}
                    <span className="authoring-header__value">{source}</span>
                </span>
            )}
        </div>
    );
};
