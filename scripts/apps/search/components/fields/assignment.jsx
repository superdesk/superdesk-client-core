import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

export function assignment({item}) {
    if (!get(item, 'assignment_id')) {
        return null;
    }

    return (
        <span key="assignment">
            <i className="icon-calendar" />
        </span>
    );
}

assignment.propTypes = {item: PropTypes.object.required};
