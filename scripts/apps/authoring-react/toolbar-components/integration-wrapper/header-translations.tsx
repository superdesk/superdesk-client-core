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

    // the header stays mounted while the open item changes, so several fetches can be in flight at
    // once and resolve out of order. Only the newest one may write state.
    private latestRequest: number;

    constructor(props: IProps) {
        super(props);

        this.state = {translationsInfo: null};
        this.mounted = false;
        this.latestRequest = 0;
    }

    componentDidMount(): void {
        this.mounted = true;
        this.loadTranslations();
    }

    componentDidUpdate(prevProps: IProps): void {
        if (
            prevProps.item._id !== this.props.item._id
            || prevProps.item.translation_id !== this.props.item.translation_id
            || prevProps.item.translated_from !== this.props.item.translated_from
        ) {
            this.loadTranslations();
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
    }

    private loadTranslations(): void {
        const translationService = ng.get('TranslationService');
        const request = ++this.latestRequest;

        if (translationService.translationsEnabled() !== true) {
            return;
        }

        translationService.getTranslations(this.props.item)
            .then((translations) => {
                if (!this.mounted || request !== this.latestRequest) {
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
                if (!this.mounted || request !== this.latestRequest) {
                    return;
                }

                // this item is not in a translation chain; clearing matters on an item switch,
                // otherwise the previous item's translations would stay on screen
                this.setState({translationsInfo: null});
            });
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
                {/* no `href`: an empty one resolves to the base URL and drops the hash route */}
                <a
                    role="button"
                    tabIndex={0}
                    onClick={onOpenTranslationsWidget}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onOpenTranslationsWidget();
                        }
                    }}
                    style={{cursor: 'pointer'}}
                    aria-label={gettext('Open translations')}
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
