import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

export function language({item}) {
    if (!get(item, 'language')) {
        return null;
    }

    return (
        <span key="language" className="language-label">
            {get(item, 'language')}
        </span>
    );
}

language.propTypes = {item: PropTypes.object.required};
