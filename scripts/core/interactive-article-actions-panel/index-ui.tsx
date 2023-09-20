import React from 'react';
import {assertNever} from 'core/helpers/typescript-helpers';
import {SendToTab} from './actions/send-to-tab';
import {IArticle} from 'superdesk-api';
import {TabList} from 'core/ui/components/tabs';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Panel} from './panel/panel-main';
import {PanelHeader} from './panel/panel-header';
import {authoringReactViewEnabled} from 'appConfig';
import {DuplicateToTab} from './actions/duplicate-to-tab';
import {PublishTab} from './actions/publish-tab';
import {logger} from 'core/services/logger';
import {SendCorrectionTab} from './actions/send-correction-tab';
import {FetchToTab} from './actions/fetch-to-tab';
import {UnspikeTab} from './actions/unspike-tab';
import {IArticleActionInteractive, IPanelAction} from './interfaces';

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

export interface IPropsInteractiveArticleActionsPanelStateless extends IPanelAction {
    /**
     * Multiple instances of the component should be able to work at once.
     * `location` is added in order to be able to determine which one should be activated.
     */
    handleUnsavedChanges?(items: Array<IArticle>): Promise<Array<IArticle>>;
    markupV2?: boolean;
    onClose(): void;
    onDataChange?(item: IArticle): void;
}

interface IState {
    activeTab: IArticleActionInteractive;
}

export class InteractiveArticleActionsPanel
    extends React.PureComponent<IPropsInteractiveArticleActionsPanelStateless, IState> {
    constructor(props: IPropsInteractiveArticleActionsPanelStateless) {
        super(props);

        this.state = {
            activeTab: props.activeTab,
        };
    }

    render() {
        const {items, tabs, onClose, onError, onDataChange} = this.props;
        const {activeTab} = this.state;
        const markupV2 = authoringReactViewEnabled && this.props.markupV2 === true;
        const handleUnsavedChanges = this.props.handleUnsavedChanges ?? handleUnsavedChangesDefault;

        return (
            <Panel markupV2={markupV2} data-test-id="interactive-actions-panel">
                <PanelHeader markupV2={markupV2}>
                    <div className="space-between" style={{width: '100%', paddingRight: 10}}>
                        <TabList
                            tabs={
                                tabs.map((id) => ({id, label: getTabLabel(id)}))
                            }
                            selectedTabId={activeTab}
                            onChange={(tab: IArticleActionInteractive) => {
                                this.setState({
                                    activeTab: tab,
                                });
                            }}
                            data-test-id="tabs"
                        />

                        <Button
                            text={gettext('Close')}
                            onClick={() => {
                                onClose();
                            }}
                            iconOnly
                            icon="close-small"
                            size="small"
                            shape="round"
                            style="hollow"
                            data-test-id="close"
                        />
                    </div>
                </PanelHeader>

                {(() => {
                    if (activeTab === 'publish') {
                        if (items.length !== 1) {
                            logger.error(new Error('Publishing multiple items from authoring pane is not supported'));

                            return null;
                        }

                        const item = items[0];

                        return (
                            <PublishTab
                                onDataChange={onDataChange}
                                onError={onError}
                                item={item}
                                closePublishView={onClose}
                                markupV2={markupV2}
                                handleUnsavedChanges={
                                    () => handleUnsavedChanges([item]).then((res) => res[0])
                                }
                            />
                        );
                    } if (activeTab === 'correct') {
                        if (items.length !== 1) {
                            logger.error(new Error('Correcting multiple items from authoring pane is not supported'));

                            return null;
                        }

                        const item = items[0];

                        return (
                            <SendCorrectionTab
                                item={item}
                                closePublishView={onClose}
                                markupV2={markupV2}
                                handleUnsavedChanges={
                                    () => handleUnsavedChanges([item]).then((res) => res[0])
                                }
                            />
                        );
                    } else if (activeTab === 'send_to') {
                        return (
                            <SendToTab
                                items={items}
                                closeSendToView={onClose}
                                handleUnsavedChanges={handleUnsavedChanges}
                                markupV2={markupV2}
                            />
                        );
                    } else if (activeTab === 'fetch_to') {
                        return (
                            <FetchToTab
                                items={items}
                                closeFetchToView={onClose}
                                handleUnsavedChanges={handleUnsavedChanges}
                                markupV2={markupV2}
                            />
                        );
                    } if (activeTab === 'duplicate_to') {
                        return (
                            <DuplicateToTab
                                items={items}
                                closeDuplicateToView={onClose}
                                markupV2={markupV2}
                            />
                        );
                    } if (activeTab === 'unspike') {
                        return (
                            <UnspikeTab
                                items={items}
                                closeUnspikeView={onClose}
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
