import React from 'react';
import {IArticle, IArticleSideWidgetComponentType, ITranslation, OrderedMap} from 'superdesk-api';
import {Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';
import DefaultAiAssistantPanel from './main-panel';
import SummaryWidget from './summary/summary-widget';
import {HeadlinesWidget} from './headlines/headlines-widget';
import TranslationsWidget from './translations/translations-widget';

const {assertNever} = superdesk.helpers;

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
        this.getDefaultState = this.getDefaultState.bind(this);
        this.state = this.props.initialState ?? {activeSection: null};
    }

    private getDefaultState(section: IAiAssistantSection): IState {
        switch(section) {
            case null:
                return {activeSection: null};
            case 'translations':
                return {
                    activeSection: 'translations',
                    mode: 'current',
                    translation: '',
                    loading: false,
                    error: false,
                    activeLanguageId: this.props.article.language,
                };
            case 'headlines':
                return {
                    activeSection: 'headlines',
                    headlines: [],
                    error: false,
                    loading: false,
                }
            case 'summary':
                return {
                    activeSection: 'summary',
                    summary: '',
                    loading: false,
                    error: false,
                };
            default:
                return assertNever(section);
        }
    }

    private setSection(section: IAiAssistantSection) {
        if (section == null) {
            this.setState({activeSection: null});
        } else {
            const nextSectionState = this.inactiveTabState[section] ?? this.getDefaultState(section);

            if (this.state.activeSection != null) {
                this.inactiveTabState[this.state.activeSection] = this.state;
            }

            this.setState(nextSectionState);
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
                setSection={this.setSection}
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
                        setSection={this.setSection}
                    />
                }
            />
        );
    }
}
