import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';
import {gettext} from 'core/utils';

class SluglineComponent extends React.Component<Pick<IPropsItemListInfo, 'item'>> {
    render() {
        const props = this.props;

        if (props.item.slugline) {
            return (
                <span
                    key="slugline"
                    className="field--slugline"
                    data-test-id="field--slugline"
                    tabIndex={0}
                >
                    <h6 className="a11y-only">{gettext('slugline')}</h6>
                    <span dangerouslySetInnerHTML={{__html: props.item.slugline}} />
                </span>
            );
        } else {
            return null;
        }
    }
}

export const slugline = SluglineComponent;
