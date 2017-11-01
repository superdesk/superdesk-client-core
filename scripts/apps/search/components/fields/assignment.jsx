import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

export function assignment({item}) {
    if (!get(item, 'assignment')) {
        return null;
    }

    return (
        <span>
            <i className="icon-calendar" />
        </span>
    );
}

assignment.propTypes = {item: PropTypes.object.required};
