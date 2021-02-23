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
    onCheckboxClick?(e: React.MouseEvent<HTMLDivElement>): void;
}

export class GridItemThumb extends React.PureComponent<IProps> {
    onChange(e: React.MouseEvent<HTMLDivElement>) {
        if (this.props.toggleSelected != null) {
            e.stopPropagation();
            this.props.toggleSelected();
        }
    }

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
                        <div className="sd-grid-item__checkbox" onClick={this.props.onCheckboxClick}>
                            <Checkbox
                                checked={this.props.selected ?? false}
                                label={{text: ''}}
                                onChange={() => this.onChange}
                            />
                        </div>
                    )
                }
                {this.props.children}
            </div>
        );
    }
}
