import React from 'react';
import {IArticleSideWidgetComponentType, ITranslation} from 'superdesk-api';
import {Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';
import {configuration} from './configuration';
import getHeadlinesWidget from './headlines/headlines-widget';
import getSummaryWidget from './summary/summary-widget';
import DefaultAiAssistantPanel from './main-panel';
import getTranslationsWidget from './translations/translations-widget';

export type IAiAssistantSection = 'headlines' | 'summary' | 'translations' | null;
export type ITranslationLanguage = ITranslation['_id'];

interface IState {
    activeSection: IAiAssistantSection;

    /**
     * Handle loading of each request separately,
     */
    loadingHeadlines: boolean;
    loadingSummary: boolean;
    loadingTranslations: boolean;

    headlines: Array<string>;
    error: boolean;
    summary: string;
    translations: string;
    activeLanguageId: ITranslationLanguage;
    programmaticallyOpened: boolean;
}

export class AiAssistantWidget extends React.PureComponent<IArticleSideWidgetComponentType, IState> {
    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        const lsSideWidget = localStorage.getItem('sideWidget');
        const programmaticallyOpened = lsSideWidget != null
            ? JSON.parse(lsSideWidget).activeSection === 'translations'
            : false;

        this.state = {
            activeSection: lsSideWidget != null ? JSON.parse(lsSideWidget).activeSection : null,
            headlines: [],
            summary: '',
            translations: '',
            loadingSummary: true,
            loadingHeadlines: true,
            loadingTranslations: programmaticallyOpened,
            error: false,
            activeLanguageId: this.props.article.language,
            programmaticallyOpened: programmaticallyOpened,
        };

        localStorage.removeItem('sideWidget');

        this.setError = this.setError.bind(this);
        this.generateHeadlines = this.generateHeadlines.bind(this);
        this.generateSummary = this.generateSummary.bind(this);
        this.generateTranslations = this.generateTranslations.bind(this);
    }

    setError() {
        this.setState({
            error: true,
        });
    }

    generateHeadlines() {
        configuration.generateHeadlines?.(this.props.article, superdesk)
            .then((res) => {
                this.setState({
                    loadingHeadlines: false,
                    headlines: res,
                });
            }).catch(() => {
                this.setError();
            });
    }

    generateTranslations() {
        configuration.generateTranslations?.(this.props.article, this.state.activeLanguageId, superdesk)
            .then((res) => {
                this.setState({
                    loadingTranslations: false,
                    translations: res,
                });
            }).catch(() => {
                this.setError();
            });
    }

    generateSummary() {
        configuration.generateSummary?.(this.props.article, superdesk)
            .then((res) => {
                this.setState({
                    loadingSummary: false,
                    summary: res,
                });
            }).catch(() => {
                this.setError();
            });
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
        const translationsWidget = getTranslationsWidget({
            closeActiveSection,
            article: this.props.article,
            error: this.state.error,
            setActiveLanguage: (language) => {
                this.setState({
                    activeLanguageId: language,
                });
            },
            activeLanguageId: this.state.activeLanguageId,
            programmaticallyOpened: this.state.programmaticallyOpened,
            generateTranslations: () => {
                this.setState({
                    loadingTranslations: true,
                }, () => this.generateTranslations());
            },
            translations: this.state.translations,
            loading: this.state.loadingTranslations,
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
            } else if (this.state.activeSection === 'translations') {
                return translationsWidget;
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
