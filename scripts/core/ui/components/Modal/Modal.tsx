import React from 'react';

export class Modal extends React.PureComponent<{'data-test-id'?: string}> {
    render() {
        return (
            <div data-test-id={this.props['data-test-id']}>
                {this.props.children}
            </div>
        );
    }
}
