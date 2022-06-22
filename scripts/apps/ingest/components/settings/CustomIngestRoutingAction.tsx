import * as React from 'react';
import {IIngestRuleHandlerEditorProps} from 'superdesk-api';
import {sdApi} from 'api';

export class CustomIngestRoutingAction extends React.PureComponent<IIngestRuleHandlerEditorProps> {
    render() {
        const ActionComponent = sdApi.ingest.getExtensionForIngestRuleHandler(this.props.rule)?.editor;

        return ActionComponent == null ? null : (
            <ActionComponent
                rule={this.props.rule}
                updateRule={this.props.updateRule}
            />
        );
    }
}
