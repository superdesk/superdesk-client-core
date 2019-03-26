/* eslint-disable react/no-multi-comp */

import React from 'react';
import classNames from 'classnames';
import {omit} from 'lodash';

interface IListItemProps extends React.AllHTMLAttributes<HTMLDivElement> {
    inactive?: boolean;
    noHover?: boolean;
}

export class ListItem extends React.Component<IListItemProps, any> {
    render() {
        const propsExceptOwn = omit(this.props, ['inactive', 'noHover']);
        return (
            <div
                {...propsExceptOwn}
                className={
                    classNames(
                        this.props.className,
                        'sd-list-item sd-shadow--z1',
                        {
                            'inactive': this.props.inactive,
                            'sd-list-item--no-hover': this.props.noHover,
                        },
                    )
                }>
                {this.props.children}
            </div>
        );
    }
}

interface IPropsListItemColumn {
    ellipsisAndGrow?: boolean;
    noBorder?: boolean;
}

export class ListItemColumn extends React.Component<IPropsListItemColumn, any> {
    render() {
        const cssClasses = [];

        if (this.props.noBorder) {
            cssClasses.push('sd-list-item__column--no-border');
        }

        if (this.props.ellipsisAndGrow) {
            return (
                <div className={cssClasses.concat(['sd-list-item__column', 'sd-list-item__column--grow']).join(' ')}>
                    <div className="sd-list-item__row">
                        <span className="sd-overflow-ellipsis">{this.props.children}</span>
                    </div>
                </div>
            );
        } else {
            return (
                <div className={cssClasses.concat(['sd-list-item__column']).join(' ')}>
                    {this.props.children}
                </div>
            );
        }
    }
}

export class ListItemActionsMenu extends React.Component<any> {
    render() {
        return (
            <div className="sd-list-item__action-menu">
                {this.props.children}
            </div>
        );
    }
}

export class ListItemRow extends React.Component<any, any> {
    render() {
        return (
            <div className="sd-list-item__row">
                {this.props.children}
            </div>
        );
    }
}
