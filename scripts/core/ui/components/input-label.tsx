import React from 'react';

export class InputLabel extends React.PureComponent<{text: string, errorStyle?: boolean}> {
    render() {
        return (
            <div
                className="form-label"
                style={{minHeight: 0, color: this.props.errorStyle ? 'var(--error-text-color)' : undefined}}
            >
                {this.props.text}
            </div>
        );
    }
}
