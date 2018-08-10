import React from 'react';
import PropTypes from 'prop-types';
import {values} from 'lodash';

import {ICON_COLORS} from '../constants';

import {Column} from './Column';
import {Checkbox} from '../Form';

/**
 * @ngdoc react
 * @name ItemType
 * @description Component to show item type - generally left of the item with select checkbox
 */
export const ItemType:React.StatelessComponent<any> = ({hasCheck, checked, onCheckToggle}) => (
    <Column hasCheck={hasCheck} checked={checked} >
        {hasCheck && (
            <div className="sd-list-item__checkbox-container">
                <Checkbox value={checked} onChange={(field, value) => {
                    onCheckToggle(value);
                }}/>
            </div>
        )}
    </Column>
);

ItemType.propTypes = {
    onCheckToggle: PropTypes.func,
    item: PropTypes.object.isRequired,
    checked: PropTypes.bool,
    hasCheck: PropTypes.bool,
    color: PropTypes.oneOf(values(ICON_COLORS)),
};
