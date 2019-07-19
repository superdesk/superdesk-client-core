import React from 'react';
import {createMarkUp} from '../../helpers';
import {IPropsItemListInfo} from '../ListItemInfo';

export const slugline: React.StatelessComponent<Pick<IPropsItemListInfo, 'item'>> = (props) => {
    if (props.item.slugline) {
        return (
            <span
                key="slugline"
                className="field--slugline"
                dangerouslySetInnerHTML={createMarkUp(props.item.slugline)}
                data-test-id="field--slugline"
            />
        );
    } else {
        return null;
    }
};
