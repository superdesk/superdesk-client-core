import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Row
 * @description Row Component to be used in an item preview to show an item's detail
 */
export const Row:React.StatelessComponent<any> = (
    {label, value, className, children, noPadding, enabled, flex, rowItem}
) => (
    enabled ?
        <div
            className={classNames(
                {
                    form__row: !rowItem,
                    'form__row-item': rowItem,
                    'no-padding': noPadding,
                    'form__row--flex': flex,
                }
            )}
        >
            {label && <label className="form-label form-label--light">{label}</label>}
            {value && <p className={'sd-text__' + className}>{value}</p>}
            {children}
        </div> :
        null
);

Row.propTypes = {
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.node,
    ]),
    className: PropTypes.string,
    children: PropTypes.node,
    noPadding: PropTypes.bool,
    enabled: PropTypes.bool,
    flex: PropTypes.bool,
    rowItem: PropTypes.bool,
};

Row.defaultProps = {
    noPadding: false,
    enabled: true,
    flex: false,
    rowItem: false,
};
