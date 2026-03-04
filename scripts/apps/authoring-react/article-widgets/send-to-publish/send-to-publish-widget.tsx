import React from 'react';
import {IArticleSideWidgetComponentType, IArticle} from 'superdesk-api';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {gettext} from 'core/utils';
import {IArticleActionInteractive, IPanelError} from 'core/interactive-article-actions-panel/interfaces';
import {addInternalEventListener, dispatchInternalEvent} from 'core/internal-events';
import {assertNever} from 'core/helpers/typescript-helpers';
import {ActionTabs} from 'core/interactive-article-actions-panel/action-tabs';
import {SendToAction} from 'core/interactive-article-actions-panel/actions/send-to-action';
import {DuplicateToAction} from 'core/interactive-article-actions-panel/actions/duplicate-to-action';
import {UnspikeAction} from 'core/interactive-article-actions-panel/actions/unspike-action';
import {FetchToAction} from 'core/interactive-article-actions-panel/actions/fetch-to-action';
import {SendCorrectionAction} from 'core/interactive-article-actions-panel/actions/send-correction-action';
import {PublishAction} from 'core/interactive-article-actions-panel/actions/publish-action';
import {Text} from 'superdesk-ui-framework/react';

export const INTERACTIVE_ARTICLE_ACTIONS_WIDGET_ID = 'interactive-article-actions-widget';

const getLabel = () => gettext('Send to / Publish');

interface IState {
    tabs: Array<IArticleActionInteractive>;
    activeTab: IArticleActionInteractive;
}

export class SendToPublishWidget extends React.Component<IArticleSideWidgetComponentType, IState> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        // Parse initial state if provided (from widget state persistence)
        const initialState = this.props.initialState as IState | undefined;

        this.state = initialState ?? {
            tabs: ['send_to', 'publish'],
            activeTab: 'publish',
        };

        this.eventListenersToRemoveBeforeUnmounting = [];
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleDataChange = this.handleDataChange.bind(this);
    }

    componentDidMount() {
        // Listen for internal events to update tabs/activeTab when triggered from toolbar
        this.eventListenersToRemoveBeforeUnmounting.push(
            addInternalEventListener('interactiveArticleActionStart', (event) => {
                const {items, tabs, activeTab} = event.detail;

                // Only respond if this event is for the current article
                if (items.length === 1 && items[0]._id === this.props.article._id) {
                    this.setState({
                        tabs,
                        activeTab,
                    });
                }
            }),
        );
    }

    componentWillUnmount() {
        this.eventListenersToRemoveBeforeUnmounting.forEach((removeListener) => {
            removeListener();
        });
    }

    handleClose() {
        dispatchInternalEvent('interactiveArticleActionEnd', undefined);
    }

    handleError(error: IPanelError) {
        if (error.kind === 'publishing-error') {
            // The parent handles validation errors through the widget props if needed
        } else {
            assertNever(error.kind);
        }
    }

    handleDataChange(item: IArticle) {
        this.props.onItemChange?.(item);
    }

    renderWithLayout(
        body: JSX.Element,
        footer: JSX.Element,
        tabs: Array<IArticleActionInteractive>,
        activeTab: IArticleActionInteractive,
    ) {
        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetId={INTERACTIVE_ARTICLE_ACTIONS_WIDGET_ID}
                        widgetName={getLabel()}
                        editMode={false}
                        customContent={(
                            <ActionTabs
                                tabs={tabs}
                                activeTab={activeTab}
                                onChange={(tab) => {
                                    this.setState({activeTab: tab});
                                }}
                            />
                        )}
                    />
                )}
                body={body}
                footer={footer}
                bodyPadding="small"
            />
        );
    }

    renderActiveTabContent(): {body: JSX.Element; footer: JSX.Element} {
        const {activeTab} = this.state;

        if (activeTab === 'send_to') {
            return {
                body: null,
                footer: null,
            };
        } else if (activeTab === 'publish') {
            return {
                body: null,
                footer: null,
            };
        } else if (activeTab === 'correct') {
            return {
                body: null,
                footer: null,
            };
        } else if (activeTab === 'duplicate_to') {
            return {
                body: null,
                footer: null,
            };
        } else if (activeTab === 'unspike') {
            return {
                body: null,
                footer: null,
            };
        } else if (activeTab === 'fetch_to') {
            return {
                body: null,
                footer: null,
            };
        } else {
            assertNever(activeTab);
        }
    }

    render() {
        const {article} = this.props;
        const {tabs, activeTab} = this.state;

        const handleUnsavedChanges = () => this.props.handleUnsavedChanges();
        const handleUnsavedChangesArray = (items: Array<IArticle>) =>
            handleUnsavedChanges().then((res) => [res]);

        if (activeTab === 'send_to') {
            return (
                <SendToAction
                    items={[article]}
                    closeSendToView={this.handleClose}
                    handleUnsavedChanges={handleUnsavedChangesArray}
                >
                    {({body, footer, noDestinationsAvailable}) => {
                        if (noDestinationsAvailable) {
                            return this.renderWithLayout(
                                <Text size="medium" align="center" weight="medium">
                                    {gettext('No destinations are available.')}
                                </Text>,
                                null,
                                tabs,
                                activeTab,
                            );
                        }
                        return this.renderWithLayout(body, footer, tabs, activeTab);
                    }}
                </SendToAction>
            );
        } else if (activeTab === 'publish') {
            return (
                <PublishAction
                    item={article}
                    closePublishView={this.handleClose}
                    handleUnsavedChanges={handleUnsavedChanges}
                    onError={this.handleError}
                    onDataChange={this.handleDataChange}
                >
                    {({body, footer, loading}) => {
                        if (loading) {
                            return this.renderWithLayout(null, null, tabs, activeTab);
                        }
                        return this.renderWithLayout(body, footer, tabs, activeTab);
                    }}
                </PublishAction>
            );
        } else if (activeTab === 'correct') {
            return (
                <SendCorrectionAction
                    item={article}
                    closePublishView={this.handleClose}
                    handleUnsavedChanges={handleUnsavedChanges}
                    onDataChange={this.handleDataChange}
                >
                    {({body, footer}) => this.renderWithLayout(body, footer, tabs, activeTab)}
                </SendCorrectionAction>
            );
        } else if (activeTab === 'duplicate_to') {
            return (
                <DuplicateToAction
                    items={[article]}
                    closeDuplicateToView={this.handleClose}
                >
                    {({body, footer}) => this.renderWithLayout(body, footer, tabs, activeTab)}
                </DuplicateToAction>
            );
        } else if (activeTab === 'unspike') {
            return (
                <UnspikeAction
                    items={[article]}
                    closeUnspikeView={this.handleClose}
                >
                    {({body, footer}) => this.renderWithLayout(body, footer, tabs, activeTab)}
                </UnspikeAction>
            );
        } else if (activeTab === 'fetch_to') {
            return (
                <FetchToAction
                    items={[article]}
                    closeFetchToView={this.handleClose}
                    handleUnsavedChanges={handleUnsavedChangesArray}
                >
                    {({body, footer}) => this.renderWithLayout(body, footer, tabs, activeTab)}
                </FetchToAction>
            );
        } else {
            assertNever(activeTab);
        }
    }
}
