import React from 'react';

export class InputLabel extends React.PureComponent<{text: string}> {
    render() {
        return (
            <div className="form-label" style={{minHeight: 0}}>
                {this.props.text}
            </div>
        );
    }
}
