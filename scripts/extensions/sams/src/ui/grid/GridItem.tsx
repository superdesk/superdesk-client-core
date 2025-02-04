import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    onClick?(e: React.MouseEvent): void;
    onDoubleClick?(): void;
    selected?: boolean;
    locked?: boolean;
}

export class GridItem extends React.PureComponent<IProps> {
    clickCount: number = 0;
    singleClickTimer?: number;

    constructor(props: IProps) {
        super(props);

        this.handleClicks = this.handleClicks.bind(this);
    }

    handleClicks(event: React.MouseEvent) {
        if (this.props.onDoubleClick == null) {
            this.props.onClick!(event);
            return;
        }

        this.clickCount++;
        if (this.clickCount === 1) {
            // Tell React to keep this `event` item around for processing
            // inside the `window.setTimeout` callback function
            event.persist();
            this.singleClickTimer = window.setTimeout(() => {
                this.clickCount = 0;
                this.props.onClick!(event);
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
            <div className={classes} onClick={this.handleClicks}>
                {this.props.children}
            </div>
        );
    }
}
