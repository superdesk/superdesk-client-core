import React from 'react';
import {RelativeDate} from 'core/datetime/relativeDate';
import {state as State} from 'apps/search/components/fields/state';
import {IArticle, IArticleSideWidget, IExtensionActivationResult} from 'superdesk-api';
import {gettext} from 'core/utils';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {Card} from 'core/ui/components/Card';
import {Spacer, SpacerBlock} from 'core/ui/components/Spacer';
import {Label} from 'superdesk-ui-framework';
import {TranslationsBody} from './TranslationsBody';

const getLabel = () => gettext('Translations');

const WIDGET_ID = 'translation-widget';

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

class Translations extends React.Component<IProps> {
    render() {
        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetId={WIDGET_ID}
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={(
                    <TranslationsBody
                        item={this.props.article}
                        wrapperTemplate={
                            ({children}) =>
                                <Spacer v gap="16" justifyContent="start">{children}</Spacer>
                        }
                        translationTemplate={({translation, getTranslatedFromLanguage}) => (
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
                                                                    text={getTranslatedFromLanguage()}
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
                        )}
                    />
                )}
            />
        );
    }
}

export function getTranslationsWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: WIDGET_ID,
        label: getLabel(),
        order: 2,
        icon: 'web',
        component: Translations,
    };

    return metadataWidget;
}
