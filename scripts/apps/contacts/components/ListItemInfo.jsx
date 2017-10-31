import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {renderArea} from 'apps/contacts/helpers';

export const ListItemInfo = (props) => {
    let cssClass = classNames('item-info', {'item-info-reduced-rowheight': props.scope.singleLine});
    let itemProps = angular.extend({svc: props.svc, scope: props.scope}, props);
    let elemProps = {className: 'line'};

    if (props.scope.singleLine) {
        return (
            <div className={cssClass}>
                {renderArea('singleLine', itemProps, elemProps)}
            </div>
        );
    }

    return (
        <div className={cssClass}>
            {renderArea('firstLine', itemProps, elemProps)}
            {renderArea('secondLine', itemProps, elemProps)}
        </div>
    );
};

ListItemInfo.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired
};
