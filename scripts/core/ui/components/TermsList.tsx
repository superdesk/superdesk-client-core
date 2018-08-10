import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

/**
 * @ngdoc react
 * @name TermsList
 * @description Displays a list of terms: subject, categories
 */
const TermsList = ({terms, displayField, onClick, readOnly}) => (
    <div className={classNames(
        'terms-list',
        {'terms-list--disabled': readOnly}
    )}>
        <ul>
            {terms.map((term, index) => (
                <li key={index} onClick={(!readOnly && onClick) ? onClick.bind(null, index) : null}>
                    {(!readOnly && onClick) && <i className="icon-close-small"/>}
                    {get(term, displayField) || term}
                </li>
            ))}
        </ul>
    </div>
);

TermsList.propTypes = {
    terms: PropTypes.array.isRequired,
    displayField: PropTypes.string,
    onClick: PropTypes.func,
    readOnly: PropTypes.bool,
};

TermsList.defaultProps = {readOnly: false};

export default TermsList;
