import React from 'react';

export class InputLabel extends React.PureComponent<{text: string, errorStyle?: boolean}> {
    render() { // FINISH: use proper color
        return (
            <div className="form-label" style={{minHeight: 0, color: this.props.errorStyle ? 'red' : undefined}}>
                {this.props.text}
            </div>
        );
    }
}
