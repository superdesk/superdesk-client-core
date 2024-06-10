import React from 'react';
import {IArticle, IArticleSideWidgetComponentType, ITranslation, OrderedMap} from 'superdesk-api';
import {Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';
import DefaultAiAssistantPanel from './main-panel';
import SummaryWidget from './summary/summary-widget';
import {HeadlinesWidget} from './headlines/headlines-widget';
import TranslationsWidget from './translations/translations-widget';

export type IAiAssistantSection = 'headlines' | 'summary' | 'translations' | null;
export type ITranslationLanguage = ITranslation['_id'];

export interface ICommonProps<T> {
    state: T;
    article: IArticle;
    setSection: (section: IAiAssistantSection) => void;
    fieldsData?: OrderedMap<string, unknown>;
    onFieldsDataChange?(fieldsData?: OrderedMap<string, unknown>): void;
    setTabState: (state: IState, callbackFn?: () => void) => void;
    children: (components: {header?: JSX.Element, body: JSX.Element, footer?: JSX.Element}) => JSX.Element;
}

export interface IStateTranslationsTab {
    activeSection: 'translations';
    mode: 'other' | 'current';
    translation: string;
    loading: boolean;
    error: boolean;
    activeLanguageId: ITranslationLanguage;
}

export interface IStateSummaryTab {
    activeSection: 'summary';
    summary: string;
    loading: boolean;
    error: boolean;
}

export interface IStateHeadlinesTab {
    activeSection: 'headlines';
    headlines: Array<string> | null;
    loading: boolean;
    error: boolean;
}

interface IDefaultState {
    activeSection: null;
}

type IState = IDefaultState | IStateTranslationsTab | IStateSummaryTab | IStateHeadlinesTab;

export class AiAssistantWidget extends React.PureComponent<IArticleSideWidgetComponentType, IState> {
    private inactiveTabState: {
        [KEY in NonNullable<IState['activeSection']>]?: IState;
    };

    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        this.inactiveTabState = {};
        this.state = this.props.initialState ?? {activeSection: null};
    }

    componentDidUpdate(_prevProps: Readonly<IArticleSideWidgetComponentType>, prevState: Readonly<IState>): void {
        const prevSection = prevState.activeSection;
        const newSection = this.state.activeSection;

        if (prevSection !== 'headlines' && newSection === 'headlines') {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState(this.inactiveTabState['headlines'] ?? {
                activeLanguageId: this.props.article.language,
                activeSection: 'headlines',
                error: false,
                headlines: [],
                loading: true,
            });
        } else if (prevSection !== 'translations' && newSection === 'translations') {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState(this.inactiveTabState['translations'] ?? {
                activeSection: 'translations',
                activeLanguageId: this.props.article.language,
                error: false,
                loading: false,
                mode: 'current',
                translation: '',
            });
        } else if (prevSection !== 'summary' && newSection === 'summary') {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState(this.inactiveTabState['summary'] ?? {
                activeSection: 'summary',
                error: false,
                loading: true,
                summary: '',
            });
        } else if (prevSection !== null && newSection === null) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({activeSection: null});
        }

        if (prevSection != null && newSection == null) {
            this.inactiveTabState[prevSection] = {...this.state};
        } else if (prevSection == null && newSection != null) {
            this.inactiveTabState[newSection] = {...this.state};
        }
    }

    render() {
        const {gettext} = superdesk.localization;
        const {AuthoringWidgetLayout, AuthoringWidgetHeading} = superdesk.components;
        const state = this.state;
        type IHeadlinesComponentProps = React.ComponentType<ICommonProps<IStateHeadlinesTab>>;
        type ISummaryComponentProps = React.ComponentType<ICommonProps<IStateSummaryTab>>;
        type ITranslationsComponentProps = React.ComponentType<ICommonProps<IStateTranslationsTab>>;
        const componentsByTab: {
            [KEY in NonNullable<IState['activeSection']>]: IHeadlinesComponentProps | ISummaryComponentProps | ITranslationsComponentProps;
        } = {
            'headlines': HeadlinesWidget,
            'summary': SummaryWidget,
            'translations': TranslationsWidget,
        };
        const CurrentComponent = state.activeSection && componentsByTab[state.activeSection];

        return CurrentComponent != null ? (
            <CurrentComponent
                state={state as never}
                setTabState={(state, callbackFn) => {
                    this.setState(state, callbackFn);
                }}
                setSection={(section) => {
                    this.setState({activeSection: section});
                }}
                {...this.props}
            >
                {({header, body, footer}) => (
                    <AuthoringWidgetLayout
                        header={(
                            <Spacer v gap="0" alignItems="center">
                                <AuthoringWidgetHeading
                                    widgetName={gettext('Ai Assistant')}
                                    editMode={false}
                                />
                                {header}
                            </Spacer>
                        )}
                        body={body}
                        footer={footer}
                    />
                )}
            </CurrentComponent>
        ) : (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetName={gettext('Ai Assistant')}
                        editMode={false}
                    />
                )}
                body={
                    <DefaultAiAssistantPanel
                        setSection={(section) => {
                            this.setState({activeSection: section});
                        }}
                    />
                }
            />
        );
    }
}
