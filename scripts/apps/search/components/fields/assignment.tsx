import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

export const assignment: React.StatelessComponent<any> = ({item, svc}) => {
    const {gettextCatalog} = svc;

    if (!get(item, 'assignment_id')) {
        return null;
    }

    return (
        <span key="assignment"
            className="assignment-icon"
            title={gettextCatalog.getString('Coverage')}>
            <i className="icon-calendar" />
        </span>
    );
};

assignment.propTypes = {
    item: PropTypes.object.isRequired,
    svc: PropTypes.any.isRequired,
};
