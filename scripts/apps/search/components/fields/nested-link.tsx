import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';

interface IProps {
    toggleNested(): void;
    showNested: boolean;
    nestedCount: number;
}

export const nestedlink: React.StatelessComponent<IProps> = (props) => (
    props.nestedCount > 0 ? (
        <div key="nestedlink" className="element-with-badge">
            <a className="text-link"
                onClick={props.toggleNested}>
                {props.showNested ?
                    gettext('Hide previous items') :
                    gettext('Show previous items')}
            </a>
            <span className="badge badge--light">{props.nestedCount}</span>
        </div>
    ) : null
);

nestedlink.propTypes = {
    showNested: PropTypes.bool,
    nestedCount: PropTypes.number,
    toggleNested: PropTypes.func.isRequired,
};
