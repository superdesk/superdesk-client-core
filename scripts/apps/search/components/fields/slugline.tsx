import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class SluglineComponent extends React.Component<Pick<IPropsItemListInfo, 'item'>> {
    render() {
        const props = this.props;

        if (props.item.slugline) {
            return (
                <span
                    key="slugline"
                    className="field--slugline"
                    dangerouslySetInnerHTML={{__html: props.item.slugline}}
                    data-test-id="field--slugline"
                />
            );
        } else {
            return null;
        }
    }
}

export const slugline = SluglineComponent;
