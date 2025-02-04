import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class UsageTermsComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const {item} = this.props;

        if (item.usageterms) {
            return (
                <small
                    key="usageterms"
                    className="usageterms container"
                >
                    {item.usageterms}
                </small>
            );
        }

        return null;
    }
}

export const usageterms = UsageTermsComponent;
