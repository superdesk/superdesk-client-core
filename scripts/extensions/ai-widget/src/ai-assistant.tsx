import React from 'react';
import {IArticleSideWidgetComponentType} from 'superdesk-api';
import {Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';
import {configuration} from './configuration';
import getHeadlinesWidget from './headlines/headlines-widget';
import getSummaryWidget from './summary/summary-widget';
import DefaultAiAssistantPanel from './main-panel';

export type IAiAssistantSection = 'headlines' | 'summary' | null;

interface IState {
    activeSection: IAiAssistantSection;

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
        const closeActiveSection = () => {
            this.setState({activeSection: null});
        };
        const headlinesWidget = getHeadlinesWidget({
            closeActiveSection,
            article: this.props.article,
            error: this.state.error,
            generateHeadlines: this.generateHeadlines,
            headlines: this.state.headlines,
            loading: this.state.loadingHeadlines,
            reGenerateHeadlines: () => {
                this.setState({
                    loadingHeadlines: true,
                }, () => this.generateHeadlines());
            },
            fieldsData: this.props.fieldsData,
            onFieldsDataChange: this.props.onFieldsDataChange,
        });
        const summaryWidget = getSummaryWidget({
            closeActiveSection,
            article: this.props.article,
            error: this.state.error,
            generateSummary: this.generateSummary,
            summary: this.state.summary,
            loading: this.state.loadingSummary,
            regenerateSummary: () => {
                this.setState({
                    loadingSummary: true,
                }, () => this.generateSummary());
            },
        });
        const currentComponent: {
            header?: JSX.Element;
            body: JSX.Element;
            footer?: JSX.Element;
        } = (() => {
            if (this.state.activeSection === 'headlines') {
                return headlinesWidget;
            } else if (this.state.activeSection === 'summary') {
                return summaryWidget;
            } else {
                return {
                    header: undefined,
                    body: (
                        <DefaultAiAssistantPanel
                            setSection={(id) => {
                                this.setState({
                                    activeSection: id,
                                });
                            }}
                        />
                    ),
                    footer: undefined,
                };
            }
        })();

        return (
            <AuthoringWidgetLayout
                header={(
                    <Spacer v gap="0" alignItems="center">
                        <AuthoringWidgetHeading
                            widgetName={gettext('Ai Assistant')}
                            editMode={false}
                        />
                        {currentComponent.header}
                    </Spacer>
                )}
                body={currentComponent.body}
                footer={currentComponent.footer}
            />
        );
    }
}
