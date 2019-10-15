import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';
import {appConfig} from 'core/config';

class NestedLink extends React.PureComponent<IPropsItemListInfo> {
    static propTypes: any;

    render() {
        const {isNested, item, toggleNested, showNested} = this.props;
        const sequence = item.correction_sequence || item.rewrite_sequence;

        if (isNested === true || appConfig.features.nestedItemsInOutputStage !== true
            || sequence == null || sequence <= 1) {
            return null;
        }

        return (
            <div key="nestedlink" className="element-with-badge">
                <a className="text-link"
                    onClick={toggleNested}
                    onDoubleClick={(event) => event.stopPropagation()}
                >
                    {showNested ?
                        gettext('Hide previous items') :
                        gettext('Show previous items')}
                </a>
            </div>
        );
    }
}

NestedLink.propTypes = {
    showNested: PropTypes.bool,
    nestedCount: PropTypes.number,
    toggleNested: PropTypes.func.isRequired,
};

export const nestedlink = NestedLink;
