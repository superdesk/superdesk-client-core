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

interface IStateTranslationsTab {
    activeSection: 'translations';
    translations: string;
    loading: boolean;
    error: boolean;
    activeLanguageId: ITranslationLanguage;
    isCurrentArticleTranslated: boolean;
}

interface IStateSummaryTab {
    activeSection: 'summary';
    summary: string;
    loading: boolean;
    error: boolean;
}

interface IStateHeadlinesTab {
    activeSection: 'headlines';
    headlines: Array<string>;
    loading: boolean;
    error: boolean;
}

interface IDefaultState {
    activeSection: null;
}

type IState = IDefaultState | IStateTranslationsTab | IStateSummaryTab | IStateHeadlinesTab;

export class AiAssistantWidget extends React.PureComponent<IArticleSideWidgetComponentType, IState> {
    headlinesState: IStateHeadlinesTab;
    summaryState: IStateSummaryTab;
    translationsState: IStateTranslationsTab;

    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        const isCurrentArticleTranslated = this.props.initialState?.activeTab === 'translations' ?? false;

        this.headlinesState = {
            error: false,
            loading: true,
            activeSection: 'headlines',
            headlines: [],
        };

        this.summaryState = {
            error: false,
            loading: true,
            activeSection: 'summary',
            summary: '',
        };

        this.translationsState = {
            error: false,
            loading: isCurrentArticleTranslated,
            activeSection: 'translations',
            translations: '',
            activeLanguageId: this.props.article.language,
            isCurrentArticleTranslated: isCurrentArticleTranslated,
        };

        if (isCurrentArticleTranslated) {
            this.state = {
                ...this.translationsState,
            };
        } else {
            this.state = {
                activeSection: null,
            };
        }

        this.setError = this.setError.bind(this);
        this.generateHeadlines = this.generateHeadlines.bind(this);
        this.generateSummary = this.generateSummary.bind(this);
        this.generateTranslations = this.generateTranslations.bind(this);
    }

    setError() {
        const state = this.state;

        if (state.activeSection != null) {
            this.setState({...state, error: true, loading: false});
        }
    }

    generateHeadlines() {
        const state = this.state;

        if (state.activeSection === 'headlines') {
            configuration.generateHeadlines?.(this.props.article, superdesk)
                .then((res) => {
                    this.setState({
                        ...state,
                        loading: false,
                        headlines: res,
                    });
                }).catch(() => {
                    this.setError();
                });
        }
    }

    generateTranslations() {
        const state = this.state;

        if (state.activeSection === 'translations') {
            configuration.translations?.generateTranslations?.(this.props.article, state.activeLanguageId, superdesk)
                .then((res) => {
                    this.setState({
                        ...state,
                        loading: false,
                        translations: res,
                    });
                }).catch(() => {
                    this.setError();
                });
        }
    }

    generateSummary() {
        const state = this.state;

        if (state.activeSection === 'summary') {
            configuration.generateSummary?.(this.props.article, superdesk)
                .then((res) => {
                    this.setState({
                        ...state,
                        loading: false,
                        summary: res,
                    });
                }).catch(() => {
                    this.setError();
                });
        }
    }

    componentDidUpdate(_prevProps: Readonly<IArticleSideWidgetComponentType>, prevState: Readonly<IState>): void {
        const prevSection = prevState.activeSection;
        const newSection = this.state.activeSection;

        if (prevSection !== 'headlines' && newSection === 'headlines') {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState(this.headlinesState);
        } else if (prevSection !== 'translations' && newSection === 'translations') {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState(this.translationsState);
        } else if (prevSection !== 'summary' && newSection === 'summary') {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState(this.summaryState);
        } else if (prevSection !== null && newSection === null) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({activeSection: null});
        }

        // Persist closed tab state
        if (prevSection === 'headlines') {
            this.headlinesState = {
                ...prevState,
            };
        } else if (prevSection === 'summary') {
            this.summaryState = {
                ...prevState,
            };
        } else if (prevSection === 'translations') {
            this.translationsState = {
                ...prevState,
            };
        }
    }

    render() {
        const {gettext} = superdesk.localization;
        const {AuthoringWidgetLayout, AuthoringWidgetHeading} = superdesk.components;
        const closeActiveSection = () => {
            this.setState({activeSection: null});
        };
        const state = this.state;

        const currentComponent: {
            header?: JSX.Element;
            body: JSX.Element;
            footer?: JSX.Element;
        } = (() => {
            if (state.activeSection === 'headlines') {
                return getHeadlinesWidget({
                    closeActiveSection,
                    article: this.props.article,
                    error: state.error,
                    generateHeadlines: this.generateHeadlines,
                    headlines: state.headlines ?? [],
                    loading: state.loading,
                    reGenerateHeadlines: () => {
                        this.setState({
                            ...state,
                            loading: true,
                        }, () => this.generateHeadlines());
                    },
                    fieldsData: this.props.fieldsData,
                    onFieldsDataChange: this.props.onFieldsDataChange,
                });
            } else if (state.activeSection === 'translations') {
                return getTranslationsWidget({
                    closeActiveSection,
                    article: this.props.article,
                    error: state.error,
                    setActiveLanguage: (language) => {
                        this.setState({
                            ...state,
                            activeLanguageId: language,
                        });
                    },
                    activeLanguageId: state.activeLanguageId,
                    programmaticallyOpened: state.isCurrentArticleTranslated,
                    generateTranslations: () => {
                        this.setState({
                            ...state,
                            loading: true,
                        }, () => this.generateTranslations());
                    },
                    translations: state.translations,
                    loading: state.loading,
                    fieldsData: this.props.fieldsData,
                    onFieldsDataChange: this.props.onFieldsDataChange,
                });
            } else if (state.activeSection === 'summary') {
                return getSummaryWidget({
                    closeActiveSection,
                    article: this.props.article,
                    error: state.error,
                    generateSummary: this.generateSummary,
                    summary: state.summary,
                    loading: state.loading,
                    regenerateSummary: () => {
                        this.setState({
                            ...state,
                            loading: true,
                        }, () => this.generateSummary());
                    },
                });
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
