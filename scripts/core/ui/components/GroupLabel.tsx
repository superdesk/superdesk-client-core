/* eslint-disable react/prop-types */

import React from 'react';

export class GroupLabel extends React.PureComponent {
    render() {
        return (
            <div style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.08,
                color: '#5D9BC0',
                paddingTop: 16,
                paddingBottom: 10,
            }}>
                {this.props.children}
            </div>
        );
    }
}
