import React from 'react';
import {Button} from 'superdesk-ui-framework/react';
import {IPropsAddContentCustomButton} from 'core/ui/components/content-create-dropdown/content-create-dropdown';
import {gettext} from 'core/utils';

export class WorkQueueCreateNewButton extends React.PureComponent<IPropsAddContentCustomButton> {
    render() {
        return (
            <Button
                text={gettext('Create new')}
                icon="plus-sign"
                type="primary"
                onClick={(event) => {
                    this.props.onClick(event);
                }}
            />
        );
    }
}
