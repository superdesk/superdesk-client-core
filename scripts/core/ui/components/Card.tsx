import React from 'react';
import {IPropsCard} from 'superdesk-api';

export class Card extends React.PureComponent<IPropsCard> {
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
