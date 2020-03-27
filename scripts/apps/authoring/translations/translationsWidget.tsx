import React from 'react';
import {RelativeDate} from 'core/datetime/relativeDate';
import {state as State} from 'apps/search/components/fields/state';
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringWorkspaceService} from '../authoring/services/AuthoringWorkspaceService';

interface IProps {
    item: IArticle;
    datetime: any;
    authoringWorkspace: AuthoringWorkspaceService;
    TranslationService: any;
}

interface IState {
    translations: Array<IArticle>;
    translationsLookup: Dictionary<IArticle['_id'], IArticle>;
}

class TranslationsWidgetComponent extends React.Component<IProps, IState> {
    static propTypes: any;

    constructor(props) {
        super(props);

        this.state = {
            translations: null,
            translationsLookup: null,
        };
    }

    componentDidMount() {
        const {item, TranslationService} = this.props;

        TranslationService.getTranslations(item)
            .then((response) => {
                const translations: Array<IArticle> = response._items;

                this.setState({
                    translations: translations,
                    translationsLookup: translations.reduce((result, reference) => {
                        result[reference._id] = reference;
                        return result;
                    }, {}),
                });
            });
    }

    render() {
        const {authoringWorkspace, datetime} = this.props;
        const {translations, translationsLookup} = this.state;

        if (translations == null) {
            return null;
        }

        const sortOldestFirst = (a: IArticle, b: IArticle) =>
            new Date(b.firstcreated) > new Date(a.firstcreated) ? -1 : 1;

        const listClassNames = 'sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border';

        return (
            <div className="widget sd-list-item-group sd-list-item-group--space-between-items sd-padding--1">
                {
                    translations.sort(sortOldestFirst).map((translation: IArticle) => (
                        <div
                            key={translation._id}
                            onClick={() => authoringWorkspace.popup(translation, 'edit')}
                            className="sd-list-item sd-shadow--z1"
                        >
                            <div className={listClassNames}>
                                <div className="sd-list-item__row">
                                    <span className="label">{translation.language}</span>
                                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                        {translation.headline}
                                    </span>
                                    <span style={{whiteSpace: 'nowrap'}}>
                                        <RelativeDate datetime={translation.versioncreated} />
                                    </span>
                                </div>
                                <div className="sd-list-item__row">
                                    <div className="sd-list-item--element-grow">
                                        {
                                            translation.translated_from == null
                                                ? (
                                                    <span className="label label--primary label--hollow">
                                                        {gettext('Original')}
                                                    </span>
                                                )
                                                : (
                                                    <div className="flex-bar sibling-spacer-4">
                                                        <span>{gettext('Translated from')}</span>
                                                        <span className="label label--hollow">
                                                            {translationsLookup[translation.translated_from].language}
                                                        </span>
                                                    </div>
                                                )
                                        }
                                    </div>
                                    <div>
                                        <State
                                            svc={{datetime}}
                                            item={translation}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        );
    }
}

export const TranslationsWidget = connectServices<IProps>(
    TranslationsWidgetComponent,
    ['TranslationService', 'authoringWorkspace', 'datetime'],
);
