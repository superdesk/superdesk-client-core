import React from 'react';

export class Center extends React.PureComponent {
    render() {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                {this.props.children}
            </div>
        );
    }
}
