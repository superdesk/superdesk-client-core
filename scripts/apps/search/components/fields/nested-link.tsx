import React from 'react';
import PropTypes from 'prop-types';

interface IProps {
    toggleNested(): void;
    showNested: boolean;
    nestedCount: number;
    svc: {
        gettext(message: string): string,
    };
}

export const nestedlink: React.StatelessComponent<IProps> = (props) => (
    props.nestedCount > 0 ? <a key="nestedlink" className="text-link"
        onClick={props.toggleNested}>
        {props.showNested ?
            props.svc.gettext('Hide previous items') :
            props.svc.gettext('Show previous items')}
    </a> : null
);

nestedlink.propTypes = {
    showNested: PropTypes.bool,
    nestedCount: PropTypes.number,
    toggleNested: PropTypes.func.isRequired,
    svc: PropTypes.any.isRequired,
};
