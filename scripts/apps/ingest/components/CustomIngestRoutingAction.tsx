import * as React from 'react';
import {IIngestRuleHandler, IIngestRule} from 'superdesk-api';

interface IProps {
    rule: IIngestRule;
    handler: IIngestRuleHandler;
    updateRule(rule: IIngestRule): void;
}

export class CustomIngestRoutingAction extends React.PureComponent<IProps> {
    render() {
        const ActionComponent = this.props.handler.customActionComponent;

        return ActionComponent == null ? null : (
            <ActionComponent
                rule={this.props.rule}
                updateRule={this.props.updateRule}
            />
        );
    }
}
