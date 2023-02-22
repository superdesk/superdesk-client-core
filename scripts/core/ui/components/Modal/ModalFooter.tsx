import * as React from 'react';
import classNames from 'classnames';
import {IModalFooterProps} from 'superdesk-api';

export class ModalFooter extends React.PureComponent<IModalFooterProps> {
    render() {
        const {children, flex} = this.props;

        const alignEnd = flex
            && Array.isArray(children)
            && children.filter((child) => child != null && child !== false).length > 1;

        const styles: React.CSSProperties = alignEnd
            ? {}
            : {justifyContent: 'flex-end'};

        const classes = classNames('modal__footer', {
            'modal__footer--flex': flex,
        });

        return (
            <div
                className={classes}
                data-test-id="modal-footer"
                style={styles}
            >
                {children}
            </div>
        );
    }
}
