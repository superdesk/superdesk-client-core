import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class SignalComponent extends React.PureComponent<IPropsItemListInfo> {
    render() {
        const props = this.props;

        if (props.item.signal == null) {
            return null;
        }

        return (
            <React.Fragment>
                {props.item.signal.map((_signal) => (
                    <span className="signal" key={_signal.qcode}>{_signal.name || _signal.qcode}</span>
                ))}
            </React.Fragment>
        );
    }
}

export const signal = SignalComponent;
