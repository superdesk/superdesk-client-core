import React from 'react';
import {Associations} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class AssociationsComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        return (
            <Associations
                item={props.item}
                openAuthoringView={props.openAuthoringView}
                key="associations"
            />
        );
    }
}

export const associations = AssociationsComponent;
