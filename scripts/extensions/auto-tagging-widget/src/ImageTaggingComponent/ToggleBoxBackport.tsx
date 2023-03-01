import * as React from 'react';
import classNames from 'classnames';
import nextId from 'react-id-generator';

interface IProps {
    title: string;
    badge?: JSX.Element;
    children: any;
    hideUsingCSS?: boolean;
    initiallyOpen?: boolean; // defaults to false
    className?: string;
    margin?: 'none' | 'small' | 'normal' | 'large';
    onOpen?(): void;
    onClose?(): void;
}

interface IState {
    isOpen: boolean;
}

/**
 * @ngdoc react
 * @name ToggleBox
 * @description ToggleBox used to open/close a set of details
 */

export class ToggleBox extends React.PureComponent<IProps, IState> {
    htmlId = nextId();
    constructor(props: IProps) {
        super(props);
        this.state = {
            isOpen: this.props.initiallyOpen ?? false,
        };
    }

    handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>): void => {
        if (event.key === 'ArrowRight' && !this.state.isOpen) {
            this.setState({isOpen: true});
        } else if (event.key === 'ArrowLeft' && this.state.isOpen) {
            this.setState({isOpen: false});
        } else if (event.key === 'Enter') {
            this.toggle();
        }
    }

    toggle = (): void => {
        this.setState({isOpen: !this.state.isOpen}, () => {
            if (!this.state.isOpen && this.props.onClose) {
                this.props.onClose();
            } else if (this.props.onOpen) {
                this.props.onOpen();
            }
        });
    }

    render() {
        let classes = classNames('toggle-box', {
            'toggle-box--margin-normal': this.props.margin === undefined,
            [`toggle-box--margin-${this.props.margin}`]: this.props.margin,
            'hidden': !this.state.isOpen,
        }, this.props.className);
        const {title, hideUsingCSS, children, badge} = this.props;
        const {isOpen} = this.state;

        return (
            <div
                className={classes}
            >
                <a
                    className="toggle-box__header"
                    onClick={this.toggle}
                    role="button"
                    tabIndex={0}
                    onKeyDown={this.handleKeyDown}
                    id={`togglebox-${this.htmlId}`}
                >
                    <div className="toggle-box__chevron">
                        <i className="icon-chevron-right-thin" />
                    </div>
                    <div className="toggle-box__label">
                        {title}
                    </div>
                    <div
                        className="toggle-box__line"
                    />
                    {badge ? badge : null}
                </a>
                <div className="toggle-box__content-wraper">
                    {isOpen && !hideUsingCSS && (
                        <div className="toggle-box__content" aria-describedby={`togglebox-${this.htmlId}`}>
                            {children}
                        </div>
                    )}

                    {hideUsingCSS && (
                        <div
                            className={classNames(
                                'toggle-box__content',
                                {'toggle-box__content--hidden': !isOpen},
                            )}
                            aria-describedby={`togglebox-${this.htmlId}`}
                        >
                            {children}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
