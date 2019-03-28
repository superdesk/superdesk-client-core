/* eslint-disable react/no-multi-comp */

import React from 'react';

export class PageContainer extends React.Component<any, any> {
    render() {
        return (
            <div className="sd-column-box--3">
                {this.props.children}
            </div>
        );
    }
}

interface IPageContainerItem {
    shrink?: boolean;
    'data-test-id'?: string;
}

export class PageContainerItem extends React.Component<IPageContainerItem, any> {
    render() {
        return (
            <div
                className={this.props.shrink ? 'sd-column-box__main-column' : null}
                data-test-id={this.props["data-test-id"]}
            >
                {this.props.children}
            </div>
        );
    }
}
