import React from 'react';
import ReactDOM from 'react-dom';
import {DEFAULT_LIST_CONFIG} from './constants';
import {fields} from './components/fields';
import ng from '../../core/services/ng';
import {isKilled} from 'apps/archive/utils';
import {IArticle, IPublishedArticle} from 'superdesk-api';

export function getSpecStyle(spec) {
    var style = {};

    if (spec.color) {
        style['backgroundColor'] = spec.color;
    }

    return style;
}

export function getSpecTitle(spec, title) {
    return spec.name ? `${title}: ${spec.name}` : title;
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
    return !(item._type === 'items' || item._type === 'externalsource' ||
            isKilled(item) ||
        item._type === 'published' && !item.last_published_version);
}

export function menuHolderElem() {
    return document.getElementById('react-placeholder');
}

export function closeActionsMenu(itemId?) {
    const menuHolder = menuHolderElem();
    const menuItemId = menuHolder.getAttribute('data-item-id');

    if (menuItemId && menuItemId !== itemId) {
        return;
    }

    menuHolder.removeAttribute('data-item-id');
    ReactDOM.unmountComponentAtNode(menuHolderElem());
}

export function openActionsMenu(elem, target, itemId) {
    const menuHolder = menuHolderElem();

    menuHolder.setAttribute('data-item-id', itemId);
    renderToBody(elem, target);
}

/**
 * Render element close to target, but append to body
 *
 * Used for dropdown menus that would be only partialy visible if rendered
 * within parent which has overflow: hidden that is required for scrolling
 *
 * @param {Object} elem React element
 * @param {Node} target DOM node
 * @param {integer} zIndex z-index styling to be applied to the elem
 */
export function renderToBody(elem, target, zIndex = 1000) {
    ReactDOM.findDOMNode(ReactDOM.render(elem, menuHolderElem()));
    positionPopup(target, zIndex);
}

export function positionPopup(target, zIndex = 1000) {
    const node: any = menuHolderElem().firstChild;

    if (node == null) { // when loading
        return;
    }

    // first render it somewhere not visible
    menuHolderElem().style.zIndex = '-1';
    // make sure it's rendered

    node.style.display = 'block';
    var rect = node.getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;

    var ACTION_MENU_FROM_TOP = 100; // top-menu + search bar
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
    menuHolderElem().style.zIndex = zIndex.toString();
}

export function renderArea(area, itemProps, props: {className?: string}, customRender: any = {}) {
    // If singleline preference is set, don't show second line
    if (itemProps.scope.singleLine && area === 'secondLine') {
        return;
    }

    /* globals __SUPERDESK_CONFIG__: true */
    const listConfig = __SUPERDESK_CONFIG__.list || DEFAULT_LIST_CONFIG;
    let specs = listConfig[area] || [];

    // If narrowView configuration is available and also singleline are active
    if (itemProps.scope.singleLine && itemProps.narrow && listConfig.narrowView) {
        specs = listConfig.narrowView;
    }

    const elemProps = angular.extend({key: area}, props);
    const components = specs.map((field, i) => {
        if (customRender.fields && field in customRender.fields) {
            return customRender.fields[field](itemProps);
        }

        const Component = fields[field];

        if (Component != null) {
            return <Component key={i} {...itemProps} />;
        }

        return null;
    }).filter(Boolean);

    if (components.length > 0) {
        return <div {...elemProps}>
            { components }
        </div>;
    }

    return null;
}

/*
 * Bind mark Item dropdown action
 * @param {String} label - activity label
 */
export function bindMarkItemShortcut(label) {
    const keyboardManager = ng.get('keyboardManager');

    angular.element('.active .more-activity-toggle-ref').click();

    setTimeout(() => {
        let markDropdown = angular.element('.more-activity-menu.open .dropdown--noarrow');

        if (markDropdown.find('[title="' + label + '"]').length > 0) {
            markDropdown.find('[title="' + label + '"]')[0].click();
        }

        if (markDropdown.find('button').length > 0) {
            markDropdown.find('button:not([disabled])')
                .first()
                .focus();

            keyboardManager.push('up', () => {
                markDropdown.find('button:focus')
                    .parent('li')
                    .prev()
                    .children('button')
                    .focus();
            });
            keyboardManager.push('down', () => {
                markDropdown.find('button:focus')
                    .parent('li')
                    .next()
                    .children('button')
                    .focus();
            });
            keyboardManager.push('escape', () => {
                let actionMenu = angular.element('.more-activity-menu.open');

                actionMenu.find('button.dropdown__menu-close').click();
            });
        }
    });
}

export function isIPublishedArticle(item: IArticle | IPublishedArticle): item is IPublishedArticle {
    return item._type === 'published';
}
