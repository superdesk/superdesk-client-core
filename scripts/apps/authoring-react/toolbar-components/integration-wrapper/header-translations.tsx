import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';

interface IProps {
    item: IArticle;
    onOpenTranslationsWidget(): void;
}

interface ITranslationsInfo {
    count: number;
    translatedFromLanguage: string | null;
}

interface IState {
    translationsInfo: ITranslationsInfo | null;
}

/**
 * Port of the translations block in authoring-header.html:80-86.
 *
 * `getTranslations` rejects for items with no `translation_id`, which is why `translationsInfo` is
 * left null rather than seeded with a default: null is the "not a translation chain" case.
 */
export class HeaderTranslations extends React.PureComponent<IProps, IState> {
    private mounted: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {translationsInfo: null};
        this.mounted = false;
    }

    componentDidMount(): void {
        this.mounted = true;

        const translationService = ng.get('TranslationService');

        if (translationService.translationsEnabled() !== true) {
            return;
        }

        translationService.getTranslations(this.props.item)
            .then((translations) => {
                if (!this.mounted) {
                    return;
                }

                const items: Array<IArticle> = translations._items;

                this.setState({
                    translationsInfo: {
                        count: items.filter((item) => item.translated_from != null).length,
                        translatedFromLanguage: items.find(
                            (item) => item._id === this.props.item.translated_from,
                        )?.language ?? null,
                    },
                });
            })
            .catch(() => {
                // no translations for this item, the block stays hidden
            });
    }

    componentWillUnmount(): void {
        this.mounted = false;
    }

    render(): React.ReactNode {
        const {translationsInfo} = this.state;

        if (translationsInfo == null) {
            return null;
        }

        const {item, onOpenTranslationsWidget} = this.props;

        return (
            <span data-test-id="authoring-header-translations">
                {
                    item.translated_from != null
                        ? (
                            <React.Fragment>
                                <span className="authoring-header__label-2">{gettext('Translated from')}</span>
                                {' '}
                                <span
                                    className="label label--hollow"
                                    data-test-id="authoring-header-translated-from"
                                    data-test-value={translationsInfo.translatedFromLanguage ?? ''}
                                >
                                    {translationsInfo.translatedFromLanguage}
                                </span>
                            </React.Fragment>
                        )
                        : (
                            <span
                                className="label label--primary label--hollow"
                                data-test-id="authoring-header-original"
                            >
                                {gettext('Original')}
                            </span>
                        )
                }
                {' '}
                <a
                    onClick={onOpenTranslationsWidget}
                    style={{cursor: 'pointer'}}
                    data-test-id="authoring-header-translations-count"
                    data-test-value={translationsInfo.count.toString()}
                >
                    <strong>({translationsInfo.count})</strong>
                    {' '}
                    {gettext('translations')}
                </a>
            </span>
        );
    }
}
