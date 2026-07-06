import * as React from 'react';
import {Alert} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;

interface IProps {
    limit: number;
}

export class LimitNotification extends React.PureComponent<IProps> {
    render() {
        return (
            <div data-test-id="content-list--limit-notification">
                <Alert
                    type="alert"
                    size="small"
                    margin="small"
                >
                    {
                        gettext(
                            'This list is limited to {{n}} items. Articles below will be removed.',
                            {n: this.props.limit},
                        )
                    }
                </Alert>
            </div>
        );
    }
}
