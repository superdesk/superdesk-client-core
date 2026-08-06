import React from 'react';
import {assertNever} from 'core/helpers/typescript-helpers';
import {SendToTab} from './actions/send-to-tab';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Panel} from './panel/panel-main';
import {PanelHeader} from './panel/panel-header';
import {appConfig} from 'appConfig';
import {DuplicateToTab} from './actions/duplicate-to-tab';
import {WithPublishTab} from './actions/publish-tab';
import {logger} from 'core/services/logger';
import {FetchToTab} from './actions/fetch-to-tab';
import {UnspikeTab} from './actions/unspike-tab';
import {IArticleActionInteractive, IPanelAction} from './interfaces';
import {ActionTabs} from './action-tabs';
import {singleColumnWidthRem} from './actions/publish-action';

const handleUnsavedChangesDefault = (items: Array<IArticle>) => Promise.resolve(items);

export interface IPropsInteractiveArticleActionsPanelStateless extends IPanelAction {
    /**
     * Multiple instances of the component should be able to work at once.
     * `location` is added in order to be able to determine which one should be activated.
     */
    handleUnsavedChanges?(items: Array<IArticle>): Promise<Array<IArticle>>;
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

        const configuredDefaultTab = appConfig.authoring_actions_default_tab;
        const initialActiveTab =
            configuredDefaultTab != null && props.tabs.includes(configuredDefaultTab)
                ? configuredDefaultTab
                : props.activeTab;

        this.state = {
            activeTab: initialActiveTab,
        };
    }

    render() {
        const {items, tabs, onClose, onError, onDataChange} = this.props;
        const {activeTab} = this.state;
        const handleUnsavedChanges = this.props.handleUnsavedChanges ?? handleUnsavedChangesDefault;

        const panelHeader = (
            <PanelHeader>
                <div className="space-between" style={{width: '100%', paddingInlineEnd: 10}}>
                    <ActionTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onChange={(tab) => {
                            this.setState({activeTab: tab});
                        }}
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

            const item = items[0]; // only one item is supported in publishing tab

            return (
                <WithPublishTab
                    onDataChange={onDataChange}
                    onError={onError}
                    item={item}
                    closePublishView={onClose}
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

            const item = items[0]; // only one item is supported in correction tab

            return (
                <WithPublishTab
                    onDataChange={onDataChange}
                    onError={onError}
                    item={item}
                    closePublishView={onClose}
                    handleUnsavedChanges={
                        () => handleUnsavedChanges([item]).then((res) => res[0])
                    }
                    action="correct"
                >
                    {({columnCount, content}) => (
                        <PanelWithHeader columnCount={columnCount}>
                            {content}
                        </PanelWithHeader>
                    )}
                </WithPublishTab>
            );
        } else if (activeTab === 'send_to') {
            return (
                <PanelWithHeader>
                    <SendToTab
                        items={items}
                        closeSendToView={onClose}
                        handleUnsavedChanges={handleUnsavedChanges}
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
                    />
                </PanelWithHeader>
            );
        } else if (activeTab === 'duplicate_to') {
            return (
                <PanelWithHeader>
                    <DuplicateToTab
                        items={items}
                        closeDuplicateToView={onClose}
                    />
                </PanelWithHeader>
            );
        } else if (activeTab === 'unspike') {
            return (
                <PanelWithHeader>
                    <UnspikeTab
                        items={items}
                        closeUnspikeView={onClose}
                    />
                </PanelWithHeader>
            );
        } else {
            return assertNever(activeTab);
        }
    }
}
