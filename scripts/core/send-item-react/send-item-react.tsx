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

type ITab = 'send_to' | 'publish' | 'duplicate_to';

const TAB_SEND_TO: ITab = 'send_to';
const TAB_PUBLISH: ITab = 'publish';
const TAB_DUPLICATE_TO: ITab = 'duplicate_to';

interface IProps {
    items: Array<IArticle>;
    closeSendToView(): void;
    onSendBefore(items: Array<IArticle>): Promise<Array<IArticle>>;
    markupV2?: boolean;
}

interface IState {
    tabs: Array<ITab>;
    activeTab: ITab;
}

export class SendItemReact extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            tabs: ['publish', 'send_to', 'duplicate_to'],
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
                            tabs={[
                                {id: TAB_PUBLISH, label: gettext('Publish')},
                                {id: TAB_SEND_TO, label: gettext('Send to')},
                                {id: TAB_DUPLICATE_TO, label: gettext('Duplicate to')},
                            ]}
                            selected={this.state.activeTab}
                            onChange={(tab: ITab) => {
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
                        return (
                            <div>publish tab</div>
                        );
                    } else if (activeTab === 'send_to') {
                        return (
                            <SendToTab
                                items={this.props.items}
                                closeSendToView={this.props.closeSendToView}
                                onSendBefore={this.props.onSendBefore}
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
