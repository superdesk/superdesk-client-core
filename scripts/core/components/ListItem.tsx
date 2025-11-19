/* eslint-disable react/no-multi-comp */

import React, {CSSProperties} from 'react';
import classNames from 'classnames';
import {IListItemProps, IPropsListItemColumn, IPropsListItemRow} from 'superdesk-api';

export class ListItem extends React.Component<IListItemProps> {
    private clickTimeout: number | null = null;
    private readonly clickDelay = 250;

    constructor(props: IListItemProps) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
    }

    componentWillUnmount() {
        if (this.clickTimeout != null) {
            window.clearTimeout(this.clickTimeout);
        }
    }

    /**
     * Wrapper for single click handler. Provides a longer delay,
     * so if user double clicks we don't trigger the single click handler beforehand.
     */
    handleClick(event: React.MouseEvent<HTMLDivElement>) {
        if (this.props.onDoubleClick != null && this.props.onClick != null) {
            event.preventDefault();

            if (this.clickTimeout != null) {
                window.clearTimeout(this.clickTimeout);
                this.clickTimeout = null;
            }

            this.clickTimeout = window.setTimeout(() => {
                this.clickTimeout = null;

                this.props.onClick?.();
            }, this.clickDelay);
        } else if (this.props.onClick != null) {
            this.props.onClick();
        }
    }

    handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
        if (this.props.onDoubleClick != null) {
            event.preventDefault();

            if (this.clickTimeout != null) {
                window.clearTimeout(this.clickTimeout);
                this.clickTimeout = null;
            }

            this.props.onDoubleClick();
        }
    }

    render() {
        const inlineStyles: React.CSSProperties = {
            cursor: typeof this.props.onClick === 'function' ? 'pointer' : 'inherit',
        };

        if (this.props.fullWidth) {
            inlineStyles.width = '100%';
        }

        if (this.props.noBackground) {
            inlineStyles.background = 'transparent';
        }

        return (
            <div
                onClick={this.handleClick}
                onDoubleClick={this.handleDoubleClick}
                className={
                    classNames(
                        this.props.className,
                        'sd-list-item',
                        {
                            'inactive': this.props.inactive,
                            'sd-list-item--no-hover': this.props.noHover,
                            'sd-shadow--z1': this.props.noShadow !== true,
                        },
                    )
                }
                style={inlineStyles}
                data-test-id={this.props['data-test-id']}
            >
                {this.props.children}
            </div>
        );
    }
}

export class ListItemColumn extends React.Component<IPropsListItemColumn> {
    render() {
        const {noBorder, noPadding, grow, justifyContent, ellipsisAndGrow, children, bold = false, title} = this.props;
        const cssClasses = [];
        var styles: CSSProperties = {};

        if (noPadding) {
            styles.padding = 0;
        }

        if (noBorder) {
            cssClasses.push('sd-list-item__column--no-border');
        }

        if (bold) {
            cssClasses.push('sd-text__strong');
        }

        if (ellipsisAndGrow) {
            return (
                <div
                    className={cssClasses.concat(['sd-list-item__column', 'sd-list-item__column--grow']).join(' ')}
                    style={styles}
                    title ={title}
                >
                    <ListItemRow justifyContent={justifyContent}>
                        <span className="sd-overflow-ellipsis">{children}</span>
                    </ListItemRow>
                </div>
            );
        } else {
            if (grow) { // only when ellipsis is not used
                styles.flexGrow = 1;
            }

            return (
                <div className={cssClasses.concat(['sd-list-item__column']).join(' ')} style={styles}>
                    {children}
                </div>
            );
        }
    }
}

export class ListItemActionsMenu extends React.Component {
    render() {
        return (
            <div className="sd-list-item__action-menu">
                {this.props.children}
            </div>
        );
    }
}

export class ListItemRow extends React.Component<IPropsListItemRow> {
    render() {
        const {justifyContent} = this.props;

        return (
            <div
                className="sd-list-item__row"
                style={{
                    width: '100%',
                    justifyContent: justifyContent == null ? undefined : justifyContent,
                }}
            >
                {this.props.children}
            </div>
        );
    }
}
