import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

class NestedLink extends React.PureComponent<IPropsItemListInfo> {
    static propTypes: any;

    render() {
        const {nestedCount, toggleNested, showNested} = this.props;

        return nestedCount > 0 ? (
            <div key="nestedlink" className="element-with-badge">
                <a className="text-link"
                    onClick={toggleNested}>
                    {showNested ?
                        gettext('Hide previous items') :
                        gettext('Show previous items')}
                </a>
                <span className="badge badge--light">{nestedCount}</span>
            </div>
        ) : null;
    }
}

NestedLink.propTypes = {
    showNested: PropTypes.bool,
    nestedCount: PropTypes.number,
    toggleNested: PropTypes.func.isRequired,
};

export const nestedlink = NestedLink;
