import React from 'react';
import {RelativeDate} from 'core/datetime/relativeDate';
import {state as State} from 'apps/search/components/fields/state';
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {IArticle} from 'superdesk-interfaces/Article';

interface IProps {
    item: IArticle;
    $filter: any;
    gettextCatalog: any;
    datetime: any;
    api: any;
    authoringWorkspace: any;
    TranslationService: any;
}

interface IState {
    translations: Array<IArticle>;
    references: Dictionary<IArticle['_id'], IArticle>;
}

function getReferences(api, translations: Array<IArticle>) {
    return new Promise<Array<IArticle>>((resolve) => {
        const translated_from_ids = translations
            .map((translation) => translation.translated_from)
            .filter((translated_from_id) => translated_from_id != null); // is null for original

        api('archive').query({
            $or: translated_from_ids.map((id) => ({_id: id})),
        }).then((response) => {
            resolve(response._items);
        });
    });
}

class TranslationsWidgetComponent extends React.Component<IProps, IState> {
    static propTypes: any;

    constructor(props) {
        super(props);

        this.state = {
            translations: null,
            references: null,
        };
    }

    componentDidMount() {
        const {api, item, TranslationService} = this.props;

        TranslationService.getTranslations(item).then((response) => {
                const translations: Array<IArticle> = response._items;

                getReferences(api, translations).then((references) => {
                    this.setState({
                        translations: response._items,
                        references: references.reduce((result, reference) => {
                            result[reference._id] = reference;
                            return result;
                        }, {}),
                    });
                });
            });
    }

    render() {
        const {$filter, gettextCatalog, authoringWorkspace, datetime} = this.props;
        const {translations, references} = this.state;

        if (translations == null) {
            return null;
        }

        const sortOriginalFirst = (a: IArticle) => a.translated_from == null ? -1 : 1;
        const listClassNames = "sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border";

        return (
            <div className="widget">
                {
                    translations.sort(sortOriginalFirst).map((translation: IArticle) => {
                        return (
                            <div
                                key={translation._id}
                                onClick={() => authoringWorkspace.popup(translation, 'edit')}
                                className="sd-list-item sd-shadow--z1"
                                style={{marginBottom: 6}}
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
                                                            {references[translation.translated_from].language}
                                                        </span>
                                                    </div>
                                                )
                                            }
                                        </div>
                                        <div>
                                            <State
                                                $filter={$filter}
                                                gettextCatalog={gettextCatalog}
                                                datetime={datetime}
                                                item={translation}
                                                style={{marginRight: 0}}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}

export const TranslationsWidget = connectServices<IProps>(
    TranslationsWidgetComponent,
    ['api', 'TranslationService', 'authoringWorkspace', '$filter', 'gettextCatalog', 'datetime'],
);
