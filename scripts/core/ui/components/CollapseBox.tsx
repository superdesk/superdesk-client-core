import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {KEYCODES} from './constants';
import {onEventCapture} from './utils';

import {IconButton} from './';

/**
 * @ngdoc react
 * @name CollapseBox
 * @description CollapseBox which has a closed and open view of an item
 */
export class CollapseBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: this.props.isOpen};
        this.scrollInView = this.scrollInView.bind(this);
        this.handleOpenClick = this.handleOpenClick.bind(this);
        this.openBox = this.openBox.bind(this);
        this.closeBox = this.closeBox.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.dom = {node: null};
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.onOpen) {
            this.setState({isOpen: nextProps.isOpen});
        }
    }

    handleKeyDown(event) {
        if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            // If we closed it by keydown, keep focus to show the tab route
            if (this.state.isOpen) {
                this.closeBox();
                this.dom.node.focus();
            } else {
                this.openBox();
            }
        }
    }

    openBox() {
        if (this.props.noOpen || this.state.isOpen) {
            return;
        }

        this.setState({isOpen: true});
        if (this.props.onOpen) {
            this.props.onOpen();
        }
    }

    closeBox() {
        if (this.state.isOpen) {
            this.setState({isOpen: false});
            if (this.props.onClose) {
                this.props.onClose();
            }
        }
    }

    handleOpenClick() {
        if (this.props.onClick) {
            this.props.onClick();
        }

        this.openBox();
    }

    scrollInView() {
        if (this.props.scrollInView &&
            (this.state.isOpen || this.props.noOpen) &&
            this.dom.node) {
            this.dom.node.scrollIntoView();
            // When just opened, lose focus to remove greyed background due to
            // initial collapsed view
            this.dom.node.blur();
        }
    }

    componentDidMount() {
        // Upon first rendering, if the box is open then scroll it into view
        this.scrollInView();
    }

    componentDidUpdate(prevProps, prevState) {
        // Scroll into view only upon first opening
        if (prevState.isOpen !== this.state.isOpen ||
                (this.props.forceScroll && this.props.forceScroll !== prevProps.forceScroll)) {
            this.scrollInView();
        }
    }

    render() {
        return (
            <div
                role="button"
                tabIndex={this.props.tabEnabled ? 0 : null}
                onKeyDown={!this.state.isOpen && this.props.tabEnabled ? this.handleKeyDown : null}
                className={classNames(
                    'sd-collapse-box',
                    'sd-shadow--z2',
                    {
                        'sd-collapse-box--open': this.state.isOpen,
                        'sd-collapse-box--invalid': this.props.invalid,
                    }
                )}
                ref={(node) => this.dom.node = node}
                onClick={this.handleOpenClick}
            >
                {this.state.isOpen && (
                    <div className="sd-collapse-box__content-wraper">
                        <div className="sd-collapse-box__content">
                            <div className="sd-collapse-box__tools">
                                {this.props.tools}
                                <IconButton
                                    icon="icon-chevron-up-thin"
                                    tabIndex={this.props.tabEnabled ? 0 : null}
                                    onClick={this.closeBox}
                                    onKeyDown={this.props.tabEnabled ? this.handleKeyDown : null}
                                />
                            </div>
                            {this.props.openItemTopBar &&
                            <div className="sd-collapse-box__content-block sd-collapse-box__content-block--top">
                                {this.props.openItemTopBar}
                            </div>}
                            {this.props.openItem}
                        </div>
                    </div>
                ) || (
                    <div className="sd-collapse-box__header">
                        {this.props.collapsedItem}
                    </div>
                )}
            </div>
        );
    }
}

CollapseBox.propTypes = {
    collapsedItem: PropTypes.node.isRequired,
    openItem: PropTypes.node.isRequired,
    openItemTopBar: PropTypes.node,
    tools: PropTypes.node,
    isOpen: PropTypes.bool,
    scrollInView: PropTypes.bool,
    invalid: PropTypes.bool,
    tabEnabled: PropTypes.bool,
    noOpen: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    forceScroll: PropTypes.bool,
    onClick: PropTypes.func,
};

CollapseBox.defaultProps = {
    isOpen: false,
    scrollInView: false,
    invalid: false,
};
