/* eslint-disable react/no-multi-comp */

import React, {CSSProperties} from 'react';
import classNames from 'classnames';
import {IListItemProps, IPropsListItemColumn, IPropsListItemRow} from 'superdesk-api';

export class ListItem extends React.Component<IListItemProps> {
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
                onClick={this.props.onClick}
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
