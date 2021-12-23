import React from 'react';
import {assertNever} from 'core/helpers/typescript-helpers';
import {SendToTab} from './send-to-tab';
import {IArticle} from 'superdesk-api';
import {TabList} from 'core/ui/components/tabs';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Panel} from './panel/panel-main';
import {PanelHeader} from './panel/panel-header';
import {authoringReactViewEnabled} from 'appConfig';
import {DuplicateToTab} from './duplicate-to-tab';
import {PublishTab} from './publish-tab';
import {logger} from 'core/services/logger';
import {SendCorrectionTab} from './send-correction-tab';
import {FetchToTab} from './fetch-to-tab';
import {UnspikeTab} from './unspike-tab';
import {addInternalEventListener, dispatchInternalEvent} from 'core/internal-events';
import {applicationState} from 'core/get-superdesk-api-implementation';

export type IArticleActionInteractive = 'send_to' | 'fetch_to' | 'unspike' | 'duplicate_to' | 'publish' | 'correct';

const handleUnsavedChangesDefault = (items: Array<IArticle>) => Promise.resolve(items);

function getTabLabel(id: IArticleActionInteractive) {
    if (id === 'send_to') {
        return gettext('Send to');
    } else if (id === 'fetch_to') {
        return gettext('Fetch to');
    } else if (id === 'duplicate_to') {
        return gettext('Duplicate to');
    } else if (id === 'unspike') {
        return gettext('Unspike');
    } else if (id === 'publish') {
        return gettext('Publish');
    } else if (id === 'correct') {
        /**
         * Display as "Publish".
         * It's implemented as separate tab so it's easier
         * to decouple implementation into a separate component.
         */
        return gettext('Publish');
    } else {
        assertNever(id);
    }
}

interface IProps {
    /**
     * Multiple instances of the component should be able to work at once.
     * `location` is added in order to be able to determine which one should be activated.
     */
    location: 'authoring' | 'list-view';
    handleUnsavedChanges?(items: Array<IArticle>): Promise<Array<IArticle>>;
    markupV2?: boolean;
}

interface IStateActive {
    active: true;
    tabs: Array<IArticleActionInteractive>;
    items: Array<IArticle>;
    activeTab: IArticleActionInteractive;
}

export interface IPanelAction {
    tabs: Array<IArticleActionInteractive>;
    items: Array<IArticle>;
    activeTab: IArticleActionInteractive;
}

type IState = {active: false} | IStateActive;

export class InteractiveArticleActionsPanel extends React.PureComponent<IProps, IState> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            active: false,
        };

        this.closePanel = this.closePanel.bind(this);
    }

    componentDidMount() {
        this.eventListenersToRemoveBeforeUnmounting.push(
            addInternalEventListener('interactiveArticleActionStart', (event) => {
                const {items} = event.detail;

                const triggeredFromAuthoring =
                    items.length === 1
                    && items[0]._id === applicationState.articleInEditMode;

                if (
                    (this.props.location === 'authoring' && triggeredFromAuthoring === true)
                    || (this.props.location !== 'authoring' && triggeredFromAuthoring !== true)
                ) {
                    this.setState({
                        active: true,
                        ...event.detail,
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

    closePanel() {
        this.setState({active: false});

        dispatchInternalEvent('interactiveArticleActionEnd', undefined);
    }

    render() {
        if (this.state.active !== true) {
            return null;
        }

        const {activeTab} = this.state;
        const markupV2 = authoringReactViewEnabled && this.props.markupV2 === true;
        const handleUnsavedChanges = this.props.handleUnsavedChanges ?? handleUnsavedChangesDefault;

        return (
            <Panel markupV2={markupV2}>
                <PanelHeader markupV2={markupV2}>
                    <div className="space-between" style={{width: '100%', paddingRight: 10}}>
                        <TabList
                            tabs={
                                this.state.tabs.map((id) => ({id, label: getTabLabel(id)}))
                            }
                            selected={this.state.activeTab}
                            onChange={(tab: IArticleActionInteractive) => {
                                if (this.state.active) {
                                    this.setState({
                                        ...this.state,
                                        activeTab: tab,
                                    });
                                }
                            }}
                        />

                        <Button
                            text={gettext('Close')}
                            onClick={() => {
                                this.closePanel();
                            }}
                            iconOnly
                            icon="close-small"
                            size="small"
                            shape="round"
                            style="hollow"
                        />
                    </div>
                </PanelHeader>

                {(() => {
                    if (activeTab === 'publish') {
                        if (this.state.items.length !== 1) {
                            logger.error(new Error('Publishing multiple items from authoring pane is not supported'));

                            return null;
                        }

                        const item = this.state.items[0];

                        return (
                            <PublishTab
                                item={item}
                                closePublishView={this.closePanel}
                                markupV2={markupV2}
                                handleUnsavedChanges={
                                    () => handleUnsavedChanges([item]).then((res) => res[0])
                                }
                            />
                        );
                    } if (activeTab === 'correct') {
                        if (this.state.items.length !== 1) {
                            logger.error(new Error('Correcting multiple items from authoring pane is not supported'));

                            return null;
                        }

                        const item = this.state.items[0];

                        return (
                            <SendCorrectionTab
                                item={item}
                                closePublishView={this.closePanel}
                                markupV2={markupV2}
                                handleUnsavedChanges={
                                    () => handleUnsavedChanges([item]).then((res) => res[0])
                                }
                            />
                        );
                    } else if (activeTab === 'send_to') {
                        return (
                            <SendToTab
                                items={this.state.items}
                                closeSendToView={this.closePanel}
                                handleUnsavedChanges={handleUnsavedChanges}
                                markupV2={markupV2}
                            />
                        );
                    } else if (activeTab === 'fetch_to') {
                        return (
                            <FetchToTab
                                items={this.state.items}
                                closeFetchToView={this.closePanel}
                                handleUnsavedChanges={handleUnsavedChanges}
                                markupV2={markupV2}
                            />
                        );
                    } if (activeTab === 'duplicate_to') {
                        return (
                            <DuplicateToTab
                                items={this.state.items}
                                closeDuplicateToView={this.closePanel}
                                markupV2={markupV2}
                            />
                        );
                    } if (activeTab === 'unspike') {
                        return (
                            <UnspikeTab
                                items={this.state.items}
                                closeUnspikeView={this.closePanel}
                                markupV2={markupV2}
                            />
                        );
                    } else {
                        return assertNever(activeTab);
                    }
                })()}
            </Panel>
        );
    }
}
