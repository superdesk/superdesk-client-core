import * as React from 'react';
import {Spacer} from '@sourcefabric/common';
import {Alert, Label} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;

interface IProps {
    scrollRef: React.RefObject<HTMLDivElement>;
    children: React.ReactNode;
}

export class ValidationErrors extends React.PureComponent<IProps> {
    render() {
        return (
            <div ref={this.props.scrollRef} style={{width: '100%'}}>
                <Alert style="hollow" type="alert" fullWidth margin="none">
                    <Spacer v gap="8" noWrap>
                        <Label text={gettext('Errors')} type="alert" />

                        <div>
                            {this.props.children}
                        </div>
                    </Spacer>
                </Alert>
            </div>
        );
    }
}
