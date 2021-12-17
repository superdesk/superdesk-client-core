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

export type ISendToTabID = 'send_to' | 'fetch_to' | 'unspike' | 'duplicate_to' | 'publish' | 'correct';

function getTabLabel(id: ISendToTabID) {
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
    tabs: Array<ISendToTabID>;
    items: Array<IArticle>;
    closeSendToView(): void;
    handleUnsavedChanges(items: Array<IArticle>): Promise<Array<IArticle>>;
    markupV2?: boolean;
}

interface IState {
    activeTab: ISendToTabID;
}

export class SendItemReact extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            activeTab: this.props.tabs[0],
        };
    }
    render() {
        const {activeTab} = this.state;
        const markupV2 = authoringReactViewEnabled && this.props.markupV2 === true;

        return (
            <Panel markupV2={markupV2}>
                <PanelHeader markupV2={markupV2}>
                    <div className="space-between" style={{width: '100%', paddingRight: 10}}>
                        <TabList
                            tabs={
                                this.props.tabs.map((id) => ({id, label: getTabLabel(id)}))
                            }
                            selected={this.state.activeTab}
                            onChange={(tab: ISendToTabID) => {
                                this.setState({activeTab: tab});
                            }}
                        />

                        <Button
                            text={gettext('Close')}
                            onClick={() => {
                                this.props.closeSendToView();
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
                        if (this.props.items.length !== 1) {
                            logger.error(new Error('Publishing multiple items from authoring pane is not supported'));

                            return null;
                        }

                        const item = this.props.items[0];

                        return (
                            <PublishTab
                                item={item}
                                closePublishView={this.props.closeSendToView}
                                markupV2={markupV2}
                                handleUnsavedChanges={
                                    () => this.props.handleUnsavedChanges([item]).then((res) => res[0])
                                }
                            />
                        );
                    } if (activeTab === 'correct') {
                        if (this.props.items.length !== 1) {
                            logger.error(new Error('Correcting multiple items from authoring pane is not supported'));

                            return null;
                        }

                        const item = this.props.items[0];

                        return (
                            <SendCorrectionTab
                                item={item}
                                closePublishView={this.props.closeSendToView}
                                markupV2={markupV2}
                                handleUnsavedChanges={
                                    () => this.props.handleUnsavedChanges([item]).then((res) => res[0])
                                }
                            />
                        );
                    } else if (activeTab === 'send_to') {
                        return (
                            <SendToTab
                                items={this.props.items}
                                closeSendToView={this.props.closeSendToView}
                                handleUnsavedChanges={this.props.handleUnsavedChanges}
                                markupV2={markupV2}
                            />
                        );
                    } else if (activeTab === 'fetch_to') {
                        return (
                            <FetchToTab
                                items={this.props.items}
                                closeFetchToView={this.props.closeSendToView}
                                handleUnsavedChanges={this.props.handleUnsavedChanges}
                                markupV2={markupV2}
                            />
                        );
                    } if (activeTab === 'duplicate_to') {
                        return (
                            <DuplicateToTab
                                items={this.props.items}
                                closeDuplicateToView={this.props.closeSendToView}
                                markupV2={markupV2}
                            />
                        );
                    } if (activeTab === 'unspike') {
                        return (
                            <UnspikeTab
                                items={this.props.items}
                                closeUnspikeView={this.props.closeSendToView}
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
