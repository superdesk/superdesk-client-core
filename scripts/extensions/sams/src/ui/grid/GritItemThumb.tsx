import * as React from 'react';
import classNames from 'classnames';
import {Checkbox} from 'superdesk-ui-framework/react';

interface IProps {
    children: React.ReactNode;
    uploading?: boolean;
    remove?(event: React.MouseEvent<HTMLAnchorElement>): void;
    icon: string;
    selected?: boolean;
    toggleSelected?(): void;
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
                {this.props.toggleSelected == null ?
                    null : (
                        <div className="sd-grid-item__checkbox">
                            <Checkbox
                                checked={this.props.selected ?? false}
                                label={{text: ''}}
                                onChange={() => this.props.toggleSelected != null && this.props.toggleSelected()}
                            />
                        </div>
                    )
                }
                {this.props.children}
            </div>
        );
    }
}
