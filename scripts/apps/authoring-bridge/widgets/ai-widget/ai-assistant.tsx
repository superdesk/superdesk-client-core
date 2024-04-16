import React from 'react';
import {IArticleSideWidget, IExtensionActivationResult} from 'superdesk-api';
import {
    Button,
    ContentDivider,
    Heading,
    IconButton,
    IllustrationButton,
    Spacer,
    SvgIconIllustration,
} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import HeadlinesTab from './headlines';
import SummaryTab from './summary';

// Can't call `gettext` in the top level
const getLabel = () => gettext('AI Assistant');

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

interface IState {
    headlinesOpen: boolean;
    summaryOpen: boolean;
}

class AiAssistantWidget extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            headlinesOpen: false,
            summaryOpen: false,
        };
    }

    render() {
        return (
            <AuthoringWidgetLayout
                header={(
                    <Spacer v gap="0" alignItems="center">
                        <AuthoringWidgetHeading
                            widgetName={getLabel()}
                            editMode={false}
                        />
                        {(this.state.summaryOpen || this.state.headlinesOpen) && (
                            <>
                                <div className="p-1">
                                    <Spacer
                                        h
                                        gap="64"
                                        noGrow
                                        justifyContent="start"
                                        alignItems="center"
                                    >
                                        <IconButton
                                            size="small"
                                            icon="arrow-left"
                                            onClick={() => {
                                                this.state.headlinesOpen ? this.setState({
                                                    headlinesOpen: false,
                                                }) : this.setState({
                                                    summaryOpen: false,
                                                });
                                            }}
                                            ariaValue={gettext(
                                                'Close {{ value }}',
                                                {value: this.state.headlinesOpen ? 'Headlines' : 'Summary'},
                                            )}
                                        />
                                        <Heading type="h4" align="center">
                                            {gettext(
                                                '{{ value }} ',
                                                {value: this.state.headlinesOpen ? 'Headlines' : 'Summary'},
                                            )}
                                        </Heading>
                                    </Spacer>
                                </div>
                                <ContentDivider type="solid" margin="none" />
                            </>
                        )}
                    </Spacer>
                )}
                body={(() => {
                    if ((this.state.headlinesOpen || this.state.summaryOpen) === false) {
                        return (
                            <div
                                className="
                                    sd-grid-list
                                    sd-grid-list--xx-small
                                    sd-grid-list--gap-s
                                    sd-grid-list--no-margin
                                "
                            >
                                <IllustrationButton
                                    text="Headlines"
                                    onClick={() => {
                                        this.setState({
                                            headlinesOpen: true,
                                        });
                                    }}
                                >
                                    <SvgIconIllustration illustration="headlines" />
                                </IllustrationButton>
                                <IllustrationButton
                                    text="Summary"
                                    onClick={() => {
                                        this.setState({
                                            summaryOpen: true,
                                        });
                                    }}
                                >
                                    <SvgIconIllustration illustration="summary" />
                                </IllustrationButton>
                            </div>
                        );
                    } else if (this.state.headlinesOpen) {
                        return (
                            <HeadlinesTab
                                article={this.props.article}
                                onClose={() => {
                                    this.setState({
                                        headlinesOpen: false,
                                    });
                                }}
                            />
                        );
                    }

                    return (
                        <SummaryTab
                            profileId={this.props.article.profile}
                            onClose={() => {
                                this.setState({
                                    summaryOpen: false,
                                });
                            }}
                        />
                    );
                })()}
                footer={(this.state.headlinesOpen || this.state.summaryOpen) && (
                    <Button onClick={() => false} text={gettext('Regenerate')} style="hollow" />
                )}
            />
        );
    }
}

export function getAiSummaryWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: 'ai-assistant-widget',
        label: getLabel(),
        order: 2,
        icon: 'info',
        component: AiAssistantWidget,
    };

    return metadataWidget;
}
