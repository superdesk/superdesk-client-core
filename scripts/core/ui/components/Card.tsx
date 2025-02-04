import React from 'react';
import {IPropsCard} from 'superdesk-api';

export class Card extends React.PureComponent<IPropsCard> {
    render() {
        const spacing = this.props.padding ?? 10;
        const borderRadius = this.props.borderRadius ?? 4;

        return (
            <div
                className="sd-shadow--z2"
                style={{
                    background: this.props.background ?? '#fff',
                    padding: spacing,
                    borderRadius: borderRadius,
                    width: this.props.width,
                }}
            >
                {
                    this.props.heading != null && (
                        <div
                            style={{
                                margin: -spacing,
                                marginBottom: spacing,
                                padding: spacing,
                                borderStartStartRadius: borderRadius,
                                borderStartEndRadius: borderRadius,
                                borderBlockEnd: '1px solid grey',
                            }}
                        >
                            {this.props.heading}
                        </div>
                    )
                }
                {this.props.children}
            </div>
        );
    }
}
