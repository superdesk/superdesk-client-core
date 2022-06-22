import * as React from 'react';
import {IIngestRuleHandlerPreviewProps} from 'superdesk-api';
import {sdApi} from 'api';

export class CustomIngestRoutingActionPreview extends React.PureComponent<IIngestRuleHandlerPreviewProps> {
    render() {
        const ActionPreviewComponent = sdApi.ingest.getExtensionForIngestRuleHandler(this.props.rule)?.preview;

        return ActionPreviewComponent == null ? null : <ActionPreviewComponent rule={this.props.rule} />;
    }
}
