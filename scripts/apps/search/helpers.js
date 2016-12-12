import React from 'react';
import ReactDOM from 'react-dom';
import {DEFAULT_LIST_CONFIG} from 'apps/search/constants';
import * as fields from 'apps/search/components/fields';

export function getSpecStyle(spec) {
    var style = {};

    if (spec.color) {
        style.backgroundColor = spec.color;
    }

    return style;
}

export function getSpecTitle(spec, title) {
    return spec.name || title;
}

export function getSpecValue(spec, value) {
    return spec.short || value;
}

/**
 * Test if an multi-selection allowed
 *
 * @return {Boolean}
 */
export function isCheckAllowed(item) {
    return !(item.state === 'killed' || item._type === 'published' && !item.last_published_version);
}

export function createMarkUp(html) {
    return {__html: html};
}

function menuHolderElem() {
    return document.getElementById('react-placeholder');
}

export function closeActionsMenu() {
    ReactDOM.unmountComponentAtNode(menuHolderElem());
}

/**
 * Render element close to target, but append to body
 *
 * Used for dropdown menus that would be only partialy visible if rendered
 * within parent which has overflow: hidden that is required for scrolling
 *
 * @param {Object} elem React element
 * @param {Node} target DOM node
 */
export function renderToBody(elem, target) {
    // first render it somewhere not visible
    menuHolderElem().style.zIndex = -1;
    var node = ReactDOM.findDOMNode(ReactDOM.render(elem, menuHolderElem()));
    // make sure it's rendered

    node.style.display = 'block';
    var rect = node.getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;

    var ACTION_MENU_FROM_TOP = 150; // 150 = top-menu + search bar
    var MENU_MARGIN_HEIGHT = 16;
    var LEFT_BAR_WIDTH = 48;
    var BOTTOM_BAR_HEIGHT = 30;
    var BUFFER = 5;

    // get target position
    var targetRect = target.getBoundingClientRect();

    // get workspace
    var workspace = document.getElementById('main-container');

    // compute menu position
    var top = targetRect.top + targetRect.height;
    var left = targetRect.left + targetRect.width - width;

    // menu goes off on the right side
    if (left + width + BUFFER > workspace.clientWidth) {
        left -= width;
        left += targetRect.width;
    }

    // menu goes off on the left side
    if (left - LEFT_BAR_WIDTH < 0) {
        left = targetRect.left;
    }

    // menu goes out on the bottom side
    if (top + height + BOTTOM_BAR_HEIGHT + BUFFER > workspace.clientHeight) {
        top -= height;
        top -= targetRect.height;
        top -= MENU_MARGIN_HEIGHT;
        top = top < ACTION_MENU_FROM_TOP ? ACTION_MENU_FROM_TOP : top;
    }

    node.style.top = top.toFixed() + 'px';
    node.style.left = left.toFixed() + 'px';
    node.style.position = 'absolute';
    menuHolderElem().style.zIndex = 1000;
}

export function renderArea(area, itemProps, props) {
    /* globals __SUPERDESK_CONFIG__: true */
    const listConfig = __SUPERDESK_CONFIG__.list || DEFAULT_LIST_CONFIG;

    var specs = listConfig[area] || [];
    var contents = specs.map((field) => {
        if (fields[field]) {
            return fields[field](itemProps);
        }

        console.warn('missing field in list: ' + field);
        return null;
    }).filter(angular.identity);
    var elemProps = angular.extend({key: area}, props);

    return contents.length ? React.createElement('div', elemProps, contents) : null;
}
