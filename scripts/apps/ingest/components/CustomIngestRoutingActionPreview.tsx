import * as React from 'react';
import {IIngestRuleHandler, IIngestRule} from 'superdesk-api';

interface IProps {
    rule: IIngestRule;
    handler: IIngestRuleHandler;
}

export class CustomIngestRoutingActionPreview extends React.PureComponent<IProps> {
    render() {
        const ActionPreviewComponent = this.props.handler.customActionPreview;

        return ActionPreviewComponent == null ? null : <ActionPreviewComponent rule={this.props.rule} />;
    }
}
