import React from 'react';
import {IExtensionActivationResult} from 'superdesk-api';

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

export class HistoryTab extends React.PureComponent<IProps> {
    render() {
        return (
            <div>history placeholder</div>
        );
    }
}
