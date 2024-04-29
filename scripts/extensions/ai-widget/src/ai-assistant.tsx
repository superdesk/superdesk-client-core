import React from 'react';
import {IArticleSideWidgetComponentType} from 'superdesk-api';
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
import {superdesk} from './superdesk';
import {configuration} from './configuration';

interface IState {
    activeSection: 'headlines' | 'summary' | null;

    /**
     * Handle loading of each request separately,
     */
    loadingHeadlines: boolean;
    loadingSummary: boolean;

    headlines: Array<string>;
    error: boolean;
    summary: string;
}

export class AiAssistantWidget extends React.PureComponent<IArticleSideWidgetComponentType, IState> {
    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        this.state = {
            activeSection: null,
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
        if (configuration.generateHeadlines == null) {
            this.setError();
        } else {
            configuration.generateHeadlines(this.props.article, superdesk)
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
        if (configuration.generateSummary == null) {
            this.setError();
        } else {
            configuration.generateSummary(this.props.article, superdesk)
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
        const {gettext} = superdesk.localization;
        const {AuthoringWidgetLayout, AuthoringWidgetHeading} = superdesk.components;
        const headlinesLabel = gettext('Headlines');
        const summaryLabel = gettext('Summary');

        return (
            <AuthoringWidgetLayout
                header={(
                        <AuthoringWidgetHeading
                            widgetName={gettext('Ai Assistant')}
                            editMode={false}
                            customContent={this.state.activeSection != null ? (
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
                                                        activeSection: null
                                                    });
                                                }}
                                                ariaValue={gettext('Close') + this.state.activeSection === 'headlines'
                                                    ? headlinesLabel : summaryLabel}
                                            />
                                            <Heading type="h4" align="center">
                                                {this.state.activeSection === 'headlines' ? headlinesLabel : summaryLabel}
                                            </Heading>
                                        </Spacer>
                                    </div>
                                    <ContentDivider type="solid" margin="none" />
                                </>
                            ) : <></>}
                        />
                )}
                body={(() => {
                    if (this.state.activeSection == null) {
                        return (
                            <div
                                className="
                                    sd-grid-list
                                    sd-grid-list--xx-small
                                    sd-grid-list--gap-s
                                    sd-grid-list--no-margin
                                "
                            >
                                {configuration.generateHeadlines != null && (
                                    <IllustrationButton
                                        text={gettext('Headlines')}
                                        onClick={() => {
                                            this.setState({
                                                activeSection: 'headlines',
                                            });
                                        }}
                                    >
                                        <SvgIconIllustration illustration="headlines" />
                                    </IllustrationButton>
                                )}
                                {configuration.generateSummary != null && (
                                    <IllustrationButton
                                        text={gettext('Summary')}
                                        onClick={() => {
                                            this.setState({
                                                activeSection: 'summary'
                                            });
                                        }}
                                    >
                                        <SvgIconIllustration illustration="summary" />
                                    </IllustrationButton>
                                )}
                            </div>
                        );
                    } else if (this.state.activeSection === 'headlines') {
                        return (
                            <HeadlinesTab
                                article={this.props.article}
                                error={this.state.error}
                                fieldsData={this.props.fieldsData}
                                onFieldsDataChange={this.props.onFieldsDataChange}
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
                footer={this.state.activeSection != null ? (
                    <Button
                        onClick={() => {
                            if (this.state.activeSection === 'headlines') {
                                this.setState({
                                    loadingHeadlines: true,
                                }, () => {
                                    this.generateHeadlines();
                                });
                            } else if (this.state.activeSection === 'summary') {
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
