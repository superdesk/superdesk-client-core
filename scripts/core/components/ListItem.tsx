import React from 'react';

interface IListItemProps {
    onClick?: () => void;
}

export class ListItem extends React.Component<IListItemProps, any> {
    render() {
        return (
            <div
                onClick={this.props.onClick || null}
                className="sd-list-item sd-shadow--z1">
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
        const classNames = [];

        if (this.props.noBorder) {
            classNames.push('sd-list-item__column--no-border');
        }

        if (this.props.ellipsisAndGrow) {
            return (
                <div className={classNames.concat(['sd-list-item__column', 'sd-list-item__column--grow']).join(' ')}>
                    <div className="sd-list-item__row">
                        <span className="sd-overflow-ellipsis">{this.props.children}</span>
                    </div>
                </div>
            );
        } else {
            return (
                <div className={classNames.concat(['sd-list-item__column']).join(' ')}>
                    {this.props.children}
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

export class ListItemRow extends React.Component<any, any> {
    render() {
        return (
            <div className="sd-list-item__row">
                {this.props.children}
            </div>
        );
    }
}
