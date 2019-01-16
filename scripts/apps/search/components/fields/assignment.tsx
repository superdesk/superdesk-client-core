import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from 'core/ui/components/utils';

export const assignment: React.StatelessComponent<any> = ({item}) => {
    if (!get(item, 'assignment_id')) {
        return null;
    }

    return (
        <span key="assignment"
            className="assignment-icon"
            title={gettext('Coverage')}>
            <i className="icon-calendar" />
        </span>
    );
};

assignment.propTypes = {
    item: PropTypes.object.isRequired,
};
