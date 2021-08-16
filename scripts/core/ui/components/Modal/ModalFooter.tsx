import * as React from 'react';
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

        return (
            <div
                className={flex ? 'modal-footer--flex' : 'modal__footer'}
                data-test-id="modal-footer"
                style={styles}
            >
                {children}
            </div>
        );
    }
}
