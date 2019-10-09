/* eslint-disable react/no-multi-comp */

import React from 'react';
import classNames from 'classnames';
import {IListItemProps, IPropsListItemColumn} from 'superdesk-api';

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
        const {noBorder, justifyContent, ellipsisAndGrow, children, bold = false} = this.props;
        const cssClasses = [];

        if (noBorder) {
            cssClasses.push('sd-list-item__column--no-border');
        }

        if (bold) {
            cssClasses.push('sd-text__strong');
        }

        if (ellipsisAndGrow) {
            return (
                <div className={cssClasses.concat(['sd-list-item__column', 'sd-list-item__column--grow']).join(' ')}>
                    <ListItemRow justifyContent={justifyContent}>
                        <span className="sd-overflow-ellipsis">{children}</span>
                    </ListItemRow>
                </div>
            );
        } else {
            return (
                <div className={cssClasses.concat(['sd-list-item__column']).join(' ')}>
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

export class ListItemRow extends React.Component<{justifyContent?: string}> {
    render() {
        const {justifyContent} = this.props;

        return (
            <div className="sd-list-item__row" style={{
                width: '100%',
                justifyContent: justifyContent == null ? undefined : justifyContent,
            }}>
                {this.props.children}
            </div>
        );
    }
}
