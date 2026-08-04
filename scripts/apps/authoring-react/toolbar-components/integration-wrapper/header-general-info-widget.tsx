import React from 'react';
import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {gettext, gettextPlural} from 'core/utils';
import {countWords} from 'core/count-words';
import * as helpers from 'apps/authoring/authoring/helpers';
import {TRANSLATIONS_WIDGET_ID} from 'apps/authoring-react/article-widgets/translations/constants';
import {useToolbarContext} from './toolbar-context';
import {HeaderStateLabels} from './header-state-labels';
import {HeaderBroadcastMaster} from './header-broadcast-master';
import {HeaderTranslations} from './header-translations';

/**
 * The header general info row, ported from authoring-header.html:38-86.
 *
 * Reads `getLatestItem()` rather than the `entity` prop, which can be stale. That is also what makes
 * the word count update as the user types.
 *
 * Not ported: RELATED, which needs a related-items side widget authoring-react does not have.
 */
export const HeaderGeneralInfoWidget: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useToolbarContext<IArticle>();

    if (exposed == null) {
        return null;
    }

    const item = exposed.getLatestItem();

    const wordCountEnabled = (appConfig.ui?.authoring?.firstLine?.wordCount ?? true) && item.type === 'text';
    const wordCount = countWords(helpers.cleanHtml(item.body_html ?? ''));
    const source = item.source ?? '';
    const signals = item.signal ?? [];
    const correctionSequence = item.correction_sequence ?? 0;

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

            {signals.length > 0 && (
                <span data-test-id="authoring-header-signal">
                    <span className="authoring-header__label">{gettext('SIGNAL')}</span>
                    {signals.map((signal, i) => (
                        <React.Fragment key={i}>
                            {' '}
                            <span className="signal authoring-header__value">
                                {signal.name || signal.qcode}
                            </span>
                        </React.Fragment>
                    ))}
                </span>
            )}

            {source.length > 0 && (
                <span data-test-id="authoring-header-source" data-test-value={source}>
                    <span className="authoring-header__label">{gettext('SOURCE')}</span>
                    {' '}
                    <span className="authoring-header__value">{source}</span>
                </span>
            )}

            {correctionSequence > 0 && (
                <span
                    data-test-id="authoring-header-correction-sequence"
                    data-test-value={correctionSequence.toString()}
                >
                    <span className="authoring-header__label">{gettext('UPDATE')}</span>
                    {' '}
                    <span className="authoring-header__value">{correctionSequence}</span>
                </span>
            )}

            <HeaderStateLabels item={item} />

            <HeaderBroadcastMaster item={item} />

            <HeaderTranslations
                item={item}
                onOpenTranslationsWidget={() => exposed.toggleSideWidget(TRANSLATIONS_WIDGET_ID)}
            />
        </div>
    );
};
