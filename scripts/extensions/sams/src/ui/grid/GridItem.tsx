import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    onClick?(): void;
    onDoubleClick?(): void;
    selected?: boolean;
    locked?: boolean;
}

export class GridItem extends React.PureComponent<IProps> {
    clickCount: number = 0;
    singleClickTimer: number;

    constructor(props: IProps) {
        super(props);

        this.handleClicks = this.handleClicks.bind(this);
    }

    handleClicks() {
        if (this.props.onDoubleClick == null) {
            if (this.clickCount > 0) {
                window.clearTimeout(this.singleClickTimer);
                this.clickCount = 0;
            }

            this.props.onClick!();
            return;
        }

        this.clickCount++;
        if (this.clickCount === 1) {
            this.singleClickTimer = window.setTimeout(() => {
                this.clickCount = 0;
                this.props.onClick!();
            }, 300);
        } else if (this.clickCount === 2) {
            window.clearTimeout(this.singleClickTimer);
            this.clickCount = 0;
            this.props.onDoubleClick!();
        }
    }

    render() {
        const classes = classNames(
            'sd-grid-item',
            {
                'sd-grid-item--with-click': this.props.onClick != null,
                'sd-grid-item--with-click locked': this.props.locked,
                'sd-grid-item--selected': this.props.selected,
            },
        );

        return (
            <div className={classes} onClick={() => this.handleClicks()}>
                {this.props.children}
            </div>
        );
    }
}
