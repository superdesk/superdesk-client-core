/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IArticleSideWidgetComponentType, ITranslation} from 'superdesk-api';
import {Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';
import DefaultAiAssistantPanel from './main-panel';
import SummaryWidget from './summary/summary-widget';
import {HeadlinesWidget} from './headlines/headlines-widget';
import TranslationsWidget from './translations/translations-widget';
import {AI_WIDGET_ID} from './extension';

const {assertNever} = superdesk.helpers;

export type IAiAssistantSection = 'headlines' | 'summary' | 'translations' | null;
export type ITranslationLanguage = ITranslation['_id'];

export interface ICommonProps<T> extends IArticleSideWidgetComponentType {
    state: T;
    setSection: (section: IAiAssistantSection) => void;
    setTabState: (state: IState['currentTab'], callbackFn?: () => void) => void;
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

type IState = {
    currentTab: IDefaultState | IStateTranslationsTab | IStateSummaryTab | IStateHeadlinesTab
};

const {AuthoringWidgetLayout, AuthoringWidgetHeading} = superdesk.components;
const {gettext} = superdesk.localization;

function renderResult({header, body, footer}: {header?: JSX.Element, body: JSX.Element, footer?: JSX.Element}) {
    return (
        <AuthoringWidgetLayout
            header={(
                <Spacer v gap="0" alignItems="center">
                    <AuthoringWidgetHeading
                        widgetId={AI_WIDGET_ID}
                        widgetName={gettext('Ai Assistant')}
                        editMode={false}
                    />
                    {header}
                </Spacer>
            )}
            body={body}
            footer={footer}
        />
    );
}

export class AiAssistantWidget extends React.PureComponent<IArticleSideWidgetComponentType, IState> {
    private inactiveTabState: {
        [KEY in NonNullable<IState['currentTab']['activeSection']>]?: IState['currentTab'];
    };

    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        this.inactiveTabState = {};
        this.getDefaultState = this.getDefaultState.bind(this);
        this.setSection = this.setSection.bind(this);

        const computeInitialState = () => {
            if (this.props.initialState.currentTab != null) {
                return this.props.initialState;
            }

            return {currentTab: this.props.initialState};
        }

        this.state = this.props.initialState != null
            ? computeInitialState()
            : {currentTab: {activeSection: null}};
    }

    private getDefaultState(section: IAiAssistantSection): IState['currentTab'] {
        switch (section) {
        case null:
        case undefined:
            return {
                activeSection: null,
            };
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
                loading: true,
            };
        case 'summary':
            return {
                activeSection: 'summary',
                summary: '',
                loading: false,
                error: true,
            };
        default:
            return assertNever(section);
        }
    }

    private setSection(section: IAiAssistantSection) {
        if (this.state.currentTab.activeSection != null) {
            this.inactiveTabState[this.state.currentTab.activeSection] = this.state.currentTab;
        }

        if (section == null) {
            this.setState({currentTab: {activeSection: null}});
        } else {
            const nextSectionState = this.inactiveTabState[section] ?? this.getDefaultState(section);

            this.setState({currentTab: nextSectionState});
        }
    }

    render() {
        const state = this.state;

        const tabManagementProps: Pick<ICommonProps<any>, 'setSection' | 'setTabState'> = {
            setSection: this.setSection,
            setTabState: (state, callbackFn) => {
                this.setState({currentTab: state}, callbackFn);
            },
        };

        switch (state.currentTab.activeSection) {
        case null:
            return (
                <AuthoringWidgetLayout
                    header={(
                        <AuthoringWidgetHeading
                            widgetId={AI_WIDGET_ID}
                            widgetName={gettext('Ai Assistant')}
                            editMode={false}
                        />
                    )}
                    body={(
                        <DefaultAiAssistantPanel
                            setSection={this.setSection}
                        />
                    )}
                />
            );
        case 'headlines':
            return (
                <HeadlinesWidget
                    state={state.currentTab}
                    {...tabManagementProps}
                    {...this.props}
                >
                    {renderResult}
                </HeadlinesWidget>
            );
        case 'summary':
            return (
                <SummaryWidget
                    state={state.currentTab}
                    {...tabManagementProps}
                    {...this.props}
                >
                    {renderResult}
                </SummaryWidget>
            );
        case 'translations':
            return (
                <TranslationsWidget
                    state={state.currentTab}
                    {...tabManagementProps}
                    {...this.props}
                >
                    {renderResult}
                </TranslationsWidget>
            );
        default:
            return assertNever(state.currentTab);
        }
    }
}
