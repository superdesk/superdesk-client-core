import React from 'react';
import {IExtensionActivationResult, ISuperdesk} from 'superdesk-api';
import {
    Button,
    ContentDivider,
    Heading,
    IconButton,
    IllustrationButton,
    Spacer,
    SvgIconIllustration,
} from 'superdesk-ui-framework/react';
import HeadlinesTab from './headlines';
import SummaryTab from './summary';
import {requests} from './requests';

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

interface IState {
    headlinesOpen: boolean;
    summaryOpen: boolean;

    /**
     * Handle loading of each request separately,
     */
    loadingHeadlines: boolean;
    loadingSummary: boolean;

    headlines: Array<string>;
    error: boolean;
    summary: string;
}

export default function getAiAssistantWidget(superdesk: ISuperdesk, label: string) {
    const {gettext} = superdesk.localization;
    const {AuthoringWidgetLayout, AuthoringWidgetHeading} = superdesk.components;

    return class AiAssistantWidget extends React.PureComponent<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                headlinesOpen: false,
                summaryOpen: false,
                headlines: [],
                error: false,
                loadingSummary: true,
                loadingHeadlines: true,
                summary: '',
            };

            this.setError = this.setError.bind(this);
            this.generateHeadlines = this.generateHeadlines.bind(this);
            this.generateSummary = this.generateSummary.bind(this);
        }

        setError() {
            this.setState({
                error: true,
            });
        }

        generateHeadlines() {
            if (requests.generateHeadlines == null) {
                this.setError();
            } else {
                requests.generateHeadlines(this.props.article, superdesk)
                    .then((res) => {
                        this.setState({
                            loadingHeadlines: false,
                            headlines: res,
                        });
                    }).catch(() => {
                        this.setError();
                    });
            }
        }

        generateSummary() {
            if (requests.generateSummary == null) {
                this.setError();
            } else {
                requests.generateSummary(this.props.article, superdesk)
                    .then((res) => {
                        this.setState({
                            loadingSummary: false,
                            summary: res,
                        });
                    }).catch(() => {
                        this.setError();
                    });
            }
        }

        render() {
            return (
                <AuthoringWidgetLayout
                    header={(
                        <Spacer v gap="0" alignItems="center">
                            <AuthoringWidgetHeading
                                widgetName={label}
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
                                                    this.setState({
                                                        headlinesOpen: false,
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
                                        text={gettext('Headlines')}
                                        onClick={() => {
                                            this.setState({
                                                headlinesOpen: true,
                                            });
                                        }}
                                    >
                                        <SvgIconIllustration illustration="headlines" />
                                    </IllustrationButton>
                                    <IllustrationButton
                                        text={gettext('Summary')}
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
                                    error={this.state.error}
                                    generateHeadlines={this.generateHeadlines}
                                    headlines={this.state.headlines}
                                    loading={this.state.loadingHeadlines}
                                    superdesk={superdesk}
                                />
                            );
                        }

                        return (
                            <SummaryTab
                                article={this.props.article}
                                generateSummary={this.generateSummary}
                                summary={this.state.summary}
                                loading={this.state.loadingSummary}
                                error={this.state.error}
                                superdesk={superdesk}
                            />
                        );
                    })()}
                    footer={(this.state.headlinesOpen || this.state.summaryOpen) ? (
                        <Button
                            onClick={() => {
                                if (this.state.headlinesOpen) {
                                    this.setState({
                                        loadingHeadlines: true,
                                    }, () => {
                                        this.generateHeadlines();
                                    });
                                } else if (this.state.summaryOpen) {
                                    this.setState({
                                        loadingSummary: true,
                                    }, () => {
                                        this.generateSummary();
                                    });
                                }
                            }}
                            text={gettext('Regenerate')}
                            style="hollow"
                        />
                    ) : <></>}
                />
            );
        }
    }
}
