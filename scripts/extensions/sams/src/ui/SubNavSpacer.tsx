import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    dotted?: boolean;
    noMargin?: boolean;
    noRMargin?: boolean;
    noLMargin?: boolean;
}

export class SubNavSpacer extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'subnav__spacer',
            {
                'subnav__spacer--dotted': this.props.dotted === true,
                'subnav__spacer--no-margin': this.props.noMargin === true,
                'subnav__spacer--no-r-margin': this.props.noRMargin === true,
                'subnav__spacer--no-l-margin': this.props.noLMargin === true,
            },
        );

        return (
            <div className={classes} />
        );
    }
}
