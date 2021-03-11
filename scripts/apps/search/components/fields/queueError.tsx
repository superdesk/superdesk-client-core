import React from 'react';
import {QueueError} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class QueueErrorComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        return (
            <QueueError
                item={props.item}
                key="queueError"
            />
        );
    }
}

export const queueError = QueueErrorComponent;
