import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {Button} from '../index';
import {gettext} from '../utils';
import './style.scss';

/**
 * @ngdoc react
 * @name SlidingToolBar
 * @description Top sliding toolbar of a Sub Nav bar
 */
export const SlidingToolBar = ({hide, innerInfo, innerTools, tools, onCancel}) => (
    <div className={classNames(
        'subnav__sliding-toolbar',
        {'ng-hide': hide})} >
        <div className="sliding-toolbar__inner">
            <Button onClick={onCancel} text={gettext('Cancel')} />
            <span className="sliding-toolbar__info-text">{innerInfo}&nbsp;</span>
            <span className="sliding-toolbar__info-tools">{innerTools}</span>
        </div>
        {tools}
    </div>
);

SlidingToolBar.propTypes = {
    hide: PropTypes.bool,
    onCancel: PropTypes.func,
    innerInfo: PropTypes.string,
    innerTools: PropTypes.node,
    tools: PropTypes.node,
};

SlidingToolBar.defaultProp = {hide: true};
