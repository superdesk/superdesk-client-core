import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    uploading?: boolean;
    remove?(): void;
    icon: string;
}

export class GridItemThumb extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-grid-item__thumb',
            {
                'sd-grid-item__thumb--uploading': this.props.uploading,
            },
        );

        return (
            <div className={classes}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <i className={`icon--2x icon-${this.props.icon}`} />
                </div>
                {this.props.remove && (
                    <a className="icn-btn sd-grid-item__remove" onClick={this.props.remove}>
                        <i className="icon-close-small" />
                    </a>
                )}
                {this.props.children}
            </div>
        );
    }
}
