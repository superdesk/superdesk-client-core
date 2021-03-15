import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class CopyrightComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const {item} = this.props;

        if (item.copyrightholder) {
            const title = item.usageterms || item.copyrightnotice || '';

            return (
                <small
                    key="copyright"
                    className="copyright container"
                    title={title}
                >&copy; {item.copyrightholder}</small>
            );
        }

        return null;
    }
}

export const copyright = CopyrightComponent;
