import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {KEYCODES} from '../../../contacts/constants';
import {onEventCapture} from '../../../contacts/helpers';

export class ToggleBox extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    dom: {
        node: any
    }

    constructor(props) {
        super(props);
        this.state = {isOpen: this.props.isOpen};
        this.scrollInView = this.scrollInView.bind(this);
        this.toggle = this.toggle.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.dom = {node: null};
    }

    handleKeyDown(event) {
        if (event.keyCode === KEYCODES.RIGHT && !this.state.isOpen) {
            onEventCapture();
            this.setState({isOpen: true});
        } else if (event.keyCode === KEYCODES.LEFT && this.state.isOpen) {
            onEventCapture();
            this.setState({isOpen: false});
        }
    }

    toggle() {
        this.setState({isOpen: !this.state.isOpen});
    }

    scrollInView() {
        if (this.state.isOpen && this.dom.node) {
            this.dom.node.scrollIntoView();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // Scroll into view only upon first opening
        if (prevState.isOpen !== this.state.isOpen &&
            this.state.isOpen &&
            this.props.scrollInView
        ) {
            this.scrollInView();
        }
    }

    render() {
        const {
            style,
            title,
            children,
            hideUsingCSS,
        } = this.props;

        return (
            <div
                className={classNames(
                    'toggle-box toggle-box--circle',
                    style,
                    {hidden: !this.state.isOpen}
                )}
                ref={(node) => this.dom.node = node}
            >
                <div className="toggle-box__header" tabIndex={0} onClick={this.toggle}
                    onKeyDown={this.handleKeyDown}>
                    <div className="toggle-box__chevron"><i className="icon-chevron-right-thin"/></div>
                    <div className="toggle-box__label">{title}</div>
                    <div className="toggle-box__line"/>
                </div>
                <div className="toggle-box__content-wraper">
                    {this.state.isOpen && !hideUsingCSS && (
                        <div className="toggle-box__content">
                            {children}
                        </div>
                    )}

                    {hideUsingCSS && (
                        <div className={classNames(
                            'toggle-box__content',
                            {'toggle-box__content--hidden': !this.state.isOpen}
                        )}>
                            {children}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

ToggleBox.propTypes = {
    style: PropTypes.string,
    isOpen: PropTypes.bool,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    scrollInView: PropTypes.bool,
    hideUsingCSS: PropTypes.bool,
};

ToggleBox.defaultProps = {
    isOpen: true,
    scrollInView: false,
    hideUsingCSS: false,
};
