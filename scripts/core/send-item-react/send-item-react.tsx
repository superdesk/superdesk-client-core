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

export type ISendToTabID = 'send_to' | 'publish' | 'duplicate_to';

function getTabLabel(id: ISendToTabID) {
    if (id === 'send_to') {
        return gettext('Send to');
    } else if (id === 'duplicate_to') {
        return gettext('Duplicate to');
    } else if (id === 'publish') {
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
            activeTab: 'publish',
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
                    } else if (activeTab === 'send_to') {
                        return (
                            <SendToTab
                                items={this.props.items}
                                closeSendToView={this.props.closeSendToView}
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
                    } else {
                        return assertNever(activeTab);
                    }
                })()}
            </Panel>
        );
    }
}
