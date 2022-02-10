import React, {CSSProperties} from 'react';

interface IProps {
    background?: CSSProperties['background'];
    padding?: CSSProperties['padding'];
    borderRadius?: CSSProperties['borderRadius'];
}

export class Card extends React.PureComponent<IProps> {
    render() {
        return (
            <div
                className="sd-shadow--z2"
                style={{
                    background: this.props.background ?? '#fff',
                    padding: this.props.padding ?? 10,
                    borderRadius: this.props.borderRadius ?? 4,
                }}
            >
                {this.props.children}
            </div>
        );
    }
}
