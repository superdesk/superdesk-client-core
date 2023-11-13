import * as React from 'react';
import * as classNames from 'classnames';

interface IProps {
    text?: string;
    type?: 'default' | 'primary' | 'success' | 'warning' | 'alert' | 'highlight' | 'light';
    color?: string; // https://ui-framework.superdesk.org/#/components/colors
    shape?: 'round' | 'square'; // defaults to 'round'
    children?: React.ReactNode;
    hexColor?: string;
    'data-test-id'?: string;
}

export class Badge extends React.PureComponent<IProps> {
    render() {
        let classes = classNames('badge', {
            [`badge--${this.props.type}`]: this.props.type && !this.props.color,
            [`${this.props.color}`]: this.props.color && !this.props.type,
            'badge--square': this.props.shape === 'square',
        });

        if (this.props.children) {
            return (
                <div className="element-with-badge" data-test-id={this.props['data-test-id']}>
                    {this.props.children}
                    <span className={classes} style={{backgroundColor: this.props.hexColor}} data-test-id="badge-content">{this.props.text}</span>
                </div>
            );
        } else {
            return <span className={classes} style={{backgroundColor: this.props.hexColor}} data-test-id={this.props['data-test-id']}>{this.props.text}</span>;
        }
    }
}
