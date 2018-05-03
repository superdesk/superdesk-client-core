import React from 'react';
import PropTypes from 'prop-types';
import {Portal} from 'react-portal';
import {KEYCODES} from '../../../contacts/constants';
import Menu from './Menu';

import './style.scss';

export default class Popup extends React.Component {
    constructor(props) {
        super(props);

        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);

        this.setPortalNodes = this.setPortalNodes.bind(this);
        this.setParentNode = this.setParentNode.bind(this);

        this.dom = {
            portal: null,
            child: null,
            root: null,
            parent: null,
        };
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeydown);
        document.addEventListener('click', this.handleClickOutside);

        if (this.dom.root) {
            // First render it somewhere not visible
            this.dom.root.style.zIndex = -1;

            // Make sure it's rendered
            this.dom.child.style.display = 'block';

            if (this.props.inheritWidth) {
                this.dom.child.style.width = this.dom.parent.getBoundingClientRect().width + 'px';
            }

            const {width, height} = this.dom.child.getBoundingClientRect();

            const ACTION_MENU_FROM_TOP = 100; // top-menu + search bar
            const MENU_MARGIN_HEIGHT = 16;
            const LEFT_BAR_WIDTH = 48;
            const BOTTOM_BAR_HEIGHT = 30;
            const BUFFER = 5;

            // Get target position
            const target = this.dom.parent.getElementsByClassName(this.props.target)[0];
            const targetRect = target.getBoundingClientRect();

            // Get the workspace
            const workspace = document.getElementById(this.props.workspaceId) || document.body;

            // Compute menu position
            let top = targetRect.top + targetRect.height;
            let left = targetRect.left + targetRect.width - width;

            // Menu goes off on the right side
            if (left + width + BUFFER > workspace.clientWidth) {
                left -= width;
                left += targetRect.width;
            }

            // Menu goes off on the left side
            if (left - LEFT_BAR_WIDTH < 0) {
                left = targetRect.left;
            }

            // Menu goes out on the bottom side
            if (top + height + BOTTOM_BAR_HEIGHT + BUFFER > workspace.clientHeight) {
                top -= height;
                top -= targetRect.height;
                top -= MENU_MARGIN_HEIGHT;
                top = top < ACTION_MENU_FROM_TOP ? ACTION_MENU_FROM_TOP : top;
            }

            this.dom.child.style.top = top.toFixed() + 'px';
            this.dom.child.style.left = left.toFixed() + 'px';
            this.dom.child.style.position = 'absolute';
            this.dom.child.style.zIndex = 2100;

            this.dom.root.style.zIndex = 2000;
            this.dom.root.style.position = 'fixed';
            this.dom.root.style.top = 0;
            this.dom.root.style.left = 0;
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
        document.removeEventListener('click', this.handleClickOutside);
    }

    handleClickOutside(event) {
        if (!this.dom.root || this.dom.root.contains(event.target) || !document.contains(event.target)) {
            return;
        }

        this.props.close();
    }

    handleKeydown(event) {
        if (event.keyCode === KEYCODES.ESCAPE) {
            event.preventDefault();
            this.props.close();
        }

        if (this.props.onKeyDown) {
            this.props.onKeyDown(event);
        }
    }

    setParentNode(node) {
        if (node && node.parentNode) {
            this.dom.parent = node.parentNode;
        } else {
            this.dom.parent = null;
        }
    }

    setPortalNodes(node) {
        this.dom.portal = node;

        if (this.dom.portal) {
            this.dom.root = this.dom.portal.defaultNode || this.dom.portal.props.node;
        } else {
            this.dom.root = this.dom.child = null;
        }
    }

    render() {
        const {children, className, noPadding, popupContainer} = this.props;

        return (
            <div ref={this.setParentNode}>
                <Portal
                    ref={this.setPortalNodes}
                    node={popupContainer && popupContainer()}
                >
                    <div ref={(node) => this.dom.child = node} className={className ? `popup ${className}` : 'popup'}>
                        <Menu noPadding={noPadding}>
                            {children}
                        </Menu>
                    </div>
                </Portal>
            </div>
        );
    }
}

Popup.propTypes = {
    children: PropTypes.node.isRequired,
    target: PropTypes.string.isRequired,
    close: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func,
    workspaceId: PropTypes.string,
    className: PropTypes.string,
    noPadding: PropTypes.bool,
    popupContainer: PropTypes.func,
    inheritWidth: PropTypes.bool,
};

PropTypes.defaultProps = {
    workspaceId: 'main-container',
    noPadding: false,
    inheritWidth: false,
};
