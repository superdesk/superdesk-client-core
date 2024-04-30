import React from 'react';
import {IArticleSideWidgetComponentType} from 'superdesk-api';
import {
    ContentDivider,
    Heading,
    IconButton,
    Spacer,
} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';
import {configuration} from './configuration';
import AiAssistantHeader from './header';
import AiAssistantFooter from './footer';

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

        return (
            <AuthoringWidgetLayout
                header={(
                    <Spacer v gap="0" alignItems="center">
                        <AuthoringWidgetHeading
                            widgetName={gettext('Ai Assistant')}
                            editMode={false}
                        />
                        {this.state.activeSection != null && (
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
                                                    activeSection: null,
                                                });
                                            }}
                                            ariaValue={this.state.activeSection === 'headlines'
                                                ? gettext('Close Headlines') : gettext('Close Summary')
                                            }
                                        />
                                        <Heading type="h4" align="center">
                                            {this.state.activeSection === 'headlines'
                                                ? gettext('Headlines') : gettext('Summary')}
                                        </Heading>
                                    </Spacer>
                                </div>
                                <ContentDivider type="solid" margin="none" />
                            </>
                        )}
                    </Spacer>
                )}
                body={(
                    <AiAssistantHeader
                        activeSection={this.state.activeSection}
                        article={this.props.article}
                        error={this.state.error}
                        fieldsData={this.props.fieldsData}
                        generateHeadlines={this.generateHeadlines}
                        generateSummary={this.generateSummary}
                        headlines={this.state.headlines}
                        summary={this.state.summary}
                        loadingHeadlines={this.state.loadingHeadlines}
                        loadingSummary={this.state.loadingSummary}
                        onFieldsDataChange={this.props.onFieldsDataChange}
                        setSection={(id) => {
                            this.setState({
                                activeSection: id,
                            });
                        }}
                    />
                )}
                footer={(
                    <AiAssistantFooter
                        activeSection={this.state.activeSection}
                        setLoadingHeadlines={() => {
                            this.setState({
                                loadingHeadlines: true,
                            }, () => {
                                this.generateHeadlines();
                            });
                        }}
                        setLoadingSummary={() => {
                            this.setState({
                                loadingSummary: true,
                            }, () => {
                                this.generateSummary();
                            });
                        }}
                    />
                )}
            />
        );
    }
}
