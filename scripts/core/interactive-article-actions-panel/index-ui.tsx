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
import {WithPublishTab} from './actions/publish-tab';
import {logger} from 'core/services/logger';
import {SendCorrectionTab} from './actions/send-correction-tab';
import {FetchToTab} from './actions/fetch-to-tab';
import {UnspikeTab} from './actions/unspike-tab';
import {IArticleActionInteractive, IPanelAction} from './interfaces';

const singleColumnWidthRem = 40; // rem

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
        const item = items[0];
        const filteredTabs = item.flags.marked_for_not_publication
            ? tabs.filter((tab) => tab !== 'publish')
            : tabs;

        const panelHeader = (
            <PanelHeader markupV2={markupV2}>
                <div className="space-between" style={{width: '100%', paddingRight: 10}}>
                    <TabList
                        tabs={filteredTabs.map((id) => ({id, label: getTabLabel(id)}))}
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
        );

        function PanelWithHeader({columnCount = 1, children}: {columnCount?: number, children: React.ReactNode}) {
            return (
                <Panel
                    width={`${singleColumnWidthRem * columnCount}rem`}
                    markupV2={markupV2}
                    data-test-id="interactive-actions-panel"
                >
                    {panelHeader}
                    {children}
                </Panel>
            );
        }

        if (activeTab === 'publish') {
            if (items.length !== 1) {
                // this block should never run, but I'm handling it anyway just in case

                const error = gettext('Publishing multiple items from authoring pane is not supported');

                logger.error(new Error(error));

                return (
                    <div>{error}</div>
                );
            }

            return (
                <WithPublishTab
                    onDataChange={onDataChange}
                    onError={onError}
                    item={item}
                    closePublishView={onClose}
                    markupV2={markupV2}
                    handleUnsavedChanges={
                        () => handleUnsavedChanges([item]).then((res) => res[0])
                    }
                >
                    {({columnCount, content}) => (
                        <PanelWithHeader columnCount={columnCount}>
                            {content}
                        </PanelWithHeader>
                    )}
                </WithPublishTab>
            );
        } else if (activeTab === 'correct') {
            if (items.length !== 1) {
                // this block should never run, but I'm handling it anyway just in case

                const error = gettext('Correcting multiple items from authoring pane is not supported');

                logger.error(new Error(error));

                return (
                    <div>{error}</div>
                );
            }

            return (
                <PanelWithHeader>
                    <SendCorrectionTab
                        item={item}
                        closePublishView={onClose}
                        markupV2={markupV2}
                        handleUnsavedChanges={
                            () => handleUnsavedChanges([item]).then((res) => res[0])
                        }
                    />
                </PanelWithHeader>
            );
        } else if (activeTab === 'send_to') {
            return (
                <PanelWithHeader>
                    <SendToTab
                        items={items}
                        closeSendToView={onClose}
                        handleUnsavedChanges={handleUnsavedChanges}
                        markupV2={markupV2}
                    />
                </PanelWithHeader>
            );
        } else if (activeTab === 'fetch_to') {
            return (
                <PanelWithHeader>
                    <FetchToTab
                        items={items}
                        closeFetchToView={onClose}
                        handleUnsavedChanges={handleUnsavedChanges}
                        markupV2={markupV2}
                    />
                </PanelWithHeader>
            );
        } else if (activeTab === 'duplicate_to') {
            return (
                <PanelWithHeader>
                    <DuplicateToTab
                        items={items}
                        closeDuplicateToView={onClose}
                        markupV2={markupV2}
                    />
                </PanelWithHeader>
            );
        } else if (activeTab === 'unspike') {
            return (
                <PanelWithHeader>
                    <UnspikeTab
                        items={items}
                        closeUnspikeView={onClose}
                        markupV2={markupV2}
                    />
                </PanelWithHeader>
            );
        } else {
            return assertNever(activeTab);
        }
    }
}
