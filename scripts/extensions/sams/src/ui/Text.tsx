import * as React from 'react';

interface IProps {
    children: React.ReactNode;
    style?: 'normal' | 'strong' | 'strong-s' | 'italic' | 'right' | 'center' | 'serif' | 'date-and-author';
}

export class Text extends React.PureComponent<IProps> {
    render() {
        const className = 'sd-text__' + this.props.style ?? 'normal';

        return (
            <p className={className}>
                {this.props.children}
            </p>
        );
    }
}
