import React from 'react';
import {RelativeDate} from 'core/datetime/relativeDate';
import {state as State} from 'apps/search/components/fields/state';
import {IArticle, IArticleSideWidget, IExtensionActivationResult, IRestApiResponse} from 'superdesk-api';
import {gettext} from 'core/utils';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {Card} from 'core/ui/components/Card';
import {Spacer, SpacerBlock} from 'core/ui/components/Spacer';
import {Label} from 'superdesk-ui-framework';

const getLabel = () => gettext('Translations');

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

interface IState {
    translations: Array<IArticle>;
    translationsLookup: Dictionary<IArticle['_id'], IArticle>;
}

class Translations extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            translations: null,
            translationsLookup: null,
        };
    }

    getTranslations(): Promise<IRestApiResponse<IArticle>> {
        return httpRequestJsonLocal<IRestApiResponse<IArticle>>({
            method: 'GET',
            path: '/search',
            urlParams: {
                repo: 'archive,published',
                source: {
                    'query': {
                        'filtered': {
                            'filter': {
                                'and': [
                                    {
                                        'not': {
                                            'term': {
                                                'state': 'spiked',
                                            },
                                        },
                                    },
                                    {
                                        'not': {
                                            'and': [
                                                {
                                                    'not': {
                                                        'exists': {
                                                            'field': 'task.desk',
                                                        },
                                                    },
                                                },
                                                {
                                                    'exists': {
                                                        'field': 'task.user',
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    {
                                        'not': {
                                            'term': {
                                                'package_type': 'takes',
                                            },
                                        },
                                    },
                                    {
                                        'term': {
                                            'translation_id': this.props.article.translation_id,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    'sort': [
                        {
                            'versioncreated': 'desc',
                        },
                    ],
                }},
        });
    }

    componentDidMount() {
        this.getTranslations()
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
        const {translations, translationsLookup} = this.state;

        if (translations == null) {
            return null;
        }

        const sortOldestFirst = (a: IArticle, b: IArticle) =>
            new Date(b.firstcreated) > new Date(a.firstcreated) ? -1 : 1;

        // const listClassNames = 'sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border';

        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={(
                    <Spacer v gap="16" justifyContent="start">
                        {
                            translations.sort(sortOldestFirst).map((translation: IArticle) => (
                                <Card key={translation._id}>
                                    <div onClick={() => openArticle(translation._id, 'edit')}>
                                        <div>
                                            <Spacer h gap="4" justifyContent="space-between" noWrap>
                                                <span className="label">{translation.language}</span>
                                                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                                    {translation.headline}
                                                </span>
                                                <span style={{whiteSpace: 'nowrap'}}>
                                                    <RelativeDate datetime={translation.versioncreated} />
                                                </span>
                                            </Spacer>
                                            <SpacerBlock v gap="8" />
                                            <Spacer h gap="4" justifyContent="space-between" noWrap>
                                                <div>
                                                    {
                                                        translation.translated_from == null
                                                            ? (
                                                                <Label
                                                                    style="hollow"
                                                                    color="blue--400"
                                                                    text={gettext('Original')}
                                                                />
                                                            )
                                                            : (
                                                                <div className="flex-row sibling-spacer-4">
                                                                    <span>{gettext('Translated from')}</span>
                                                                    <Label
                                                                        text={translationsLookup[translation.translated_from].language}
                                                                        style="hollow"
                                                                        color="yellow-600"
                                                                    />
                                                                </div>
                                                            )
                                                    }
                                                </div>
                                                <div>
                                                    <State
                                                        item={translation}
                                                    />
                                                </div>
                                            </Spacer>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        }
                    </Spacer>
                )}
            />
        );
    }
}

export function getTranslationsWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: 'translation-widget',
        label: getLabel(),
        order: 2,
        icon: 'web',
        component: Translations,
    };

    return metadataWidget;
}
