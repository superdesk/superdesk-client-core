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
}

export class ListItemColumn extends React.Component<IPropsListItemColumn, any> {
    render() {
        return this.props.ellipsisAndGrow
            ? (
                <div className="sd-list-item__column sd-list-item__column--grow">
                    <div className="sd-list-item__row">
                        <span className="sd-overflow-ellipsis">{this.props.children}</span>
                    </div>
                </div>
            )
            : <div className="sd-list-item__column">{this.props.children}</div>;
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
