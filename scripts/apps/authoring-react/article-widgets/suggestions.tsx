/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IArticleSideWidget, IExtensionActivationResult, IUser, IEditor3ValueOperational} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {EmptyState, Label} from 'superdesk-ui-framework/react';
import {getCustomEditor3Data} from 'core/editor3/helpers/editor3CustomData';
import {store} from 'core/data';
import {Card} from 'core/ui/components/Card';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {TimeElem} from 'apps/search/components';
import {Spacer, SpacerBlock} from 'core/ui/components/Spacer';
import {getLocalizedTypeText} from 'apps/authoring/track-changes/suggestions';

// Can't call `gettext` in the top level
const getLabel = () => gettext('Resolved suggestions');

const WIDGET_ID = 'editor3-suggestions-widget';

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

interface ISuggestion {
    resolutionInfo: {
        accepted: boolean;
        date: string;
        resolverUserId: IUser['_id'];
    };

    suggestionInfo: {
        author: IUser['_id'];
        date: string;
        selection: {}; // serialized SelectionState
        styleName: string;
        suggestionText: string;
        type: string;
        blockType?: string;
        link?: { // only for link suggestions
            href: string;
        }
    };

    suggestionText: string;
    oldText?: string; // used with replace suggestion
}

class Suggestion extends React.PureComponent<{suggestion: ISuggestion}> {
    render() {
        const {suggestionInfo, suggestionText, oldText, resolutionInfo} = this.props.suggestion;
        const suggestionAuthor =
            store.getState().entities.users[suggestionInfo.author];
        const suggestionResolver =
            store.getState().entities.users[resolutionInfo.resolverUserId];

        return (
            <Card>
                <Spacer h gap="8" justifyContent="space-between" alignItems="start" noGrow>
                    <div>
                        <Spacer h gap="8" justifyContent="start" noGrow>
                            <UserAvatar user={suggestionAuthor} />

                            <div>
                                <strong>{suggestionAuthor.display_name}</strong>:

                                <div>
                                    <TimeElem date={suggestionInfo.date} />
                                </div>
                            </div>
                        </Spacer>
                    </div>

                    <div>
                        {
                            resolutionInfo.accepted
                                ? (<Label text={gettext('Accepted')} type="success" />)
                                : (<Label text={gettext('Rejected')} type="alert" />)
                        }
                    </div>
                </Spacer>

                <SpacerBlock v gap="8" />

                <div>
                    {
                        suggestionInfo.type === 'REPLACE_SUGGESTION'
                            ? (
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: gettext(
                                            'Replace {{x}} with {{y}}',
                                            {
                                                x: `<strong>&quot;${oldText}&quot;</strong>`,
                                                y: `<strong>&quot;${suggestionText}&quot;</strong>`,
                                            },
                                        ),
                                    }}
                                />
                            )
                            : (
                                <strong>
                                    {
                                        getLocalizedTypeText(
                                            suggestionInfo.type,
                                            suggestionInfo.blockType,
                                        )
                                    }
                                    :&nbsp;

                                    <span>&quot;{suggestionText}&quot;</span>

                                    {
                                        suggestionInfo.type === 'ADD_LINK_SUGGESTION' && (
                                            <span>
                                                &nbsp;{suggestionInfo.link.href}
                                            </span>
                                        )
                                    }
                                </strong>
                            )
                    }
                </div>

                <SpacerBlock v gap="8" />

                <div>
                    {
                        resolutionInfo.accepted
                            ? gettext('Accepted by {{user}}', {user: suggestionResolver.display_name})
                            : gettext('Rejected by {{user}}', {user: suggestionResolver.display_name})
                    }

                    &nbsp;

                    <TimeElem date={resolutionInfo.date} />
                </div>
            </Card>
        );
    }
}

class SuggestionsWidget extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.getEditor3Fields = this.getEditor3Fields.bind(this);
        this.getResolvedSuggestions = this.getResolvedSuggestions.bind(this);
    }

    getEditor3Fields() {
        const {contentProfile} = this.props;
        const allFields = contentProfile.header.merge(contentProfile.content);

        return allFields.filter((field) => field.fieldType === 'editor3').toArray();
    }

    getResolvedSuggestions() {
        const {fieldsData} = this.props;

        return this.getEditor3Fields().map((field) => {
            const value = fieldsData.get(field.id) as IEditor3ValueOperational;

            return {
                fieldId: field.id,
                suggestions: (getCustomEditor3Data(
                    value.contentState,
                    'RESOLVED_SUGGESTIONS_HISTORY',
                ) ?? []) as Array<ISuggestion>,
            };
        }).filter(({suggestions}) => suggestions.length > 0);
    }

    render() {
        const {contentProfile} = this.props;
        const allFields = contentProfile.header.merge(contentProfile.content);
        const resolvedSuggestions = this.getResolvedSuggestions();

        const widgetBody: JSX.Element = resolvedSuggestions.length > 0
            ? (
                <div>
                    <Spacer v gap="16">
                        {
                            resolvedSuggestions.map(({fieldId, suggestions}, i) => {
                                return (
                                    <div key={i}>
                                        <div className="field-label--base">
                                            {allFields.get(fieldId).name}
                                        </div>

                                        <SpacerBlock v gap="8" />

                                        <Spacer v gap="8">
                                            {
                                                suggestions.map((suggestion, j) => (
                                                    <Suggestion
                                                        key={j}
                                                        suggestion={suggestion}
                                                    />
                                                ))
                                            }
                                        </Spacer>
                                    </div>
                                );
                            })
                        }
                    </Spacer>
                </div>
            )
            : (
                <EmptyState
                    title={gettext('There are no resolved suggestions')}
                    illustration="3"
                />
            );

        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetId={WIDGET_ID}
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={widgetBody}
                background="grey"
            />
        );
    }
}

export function getSuggestionsWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: WIDGET_ID,
        label: getLabel(),
        order: 3,
        icon: 'suggestion',
        component: SuggestionsWidget,
        isAllowed: (item) => item._type !== 'legal_archive' && item._type !== 'archived',
    };

    return metadataWidget;
}
