import React from 'react';

interface IProps {
    className: string;
    size?: number;
}

export class Icon extends React.PureComponent<IProps> {
    render() {
        return (
            <span style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <i
                    style={{fontSize: (this.props.size || 16) + 'px', lineHeight: '1', width: 'auto', height: 'auto'}}
                    className={this.props.className}
                />
            </span>
        );
    }
}