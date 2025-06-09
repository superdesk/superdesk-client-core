/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import {ReactNode} from 'react';
import {Card} from 'superdesk-ui-framework/react';
import {IUserProfileSection} from 'superdesk-api';
import {AvailabilitySettings} from './availability-settings';

interface IPropsPage {
    children: ReactNode;
    'data-test-id'?: string;
}

const Page: React.ComponentType<{children: React.ReactNode}> = (props: IPropsPage) => (
    <div style={{display: 'flex', justifyContent: 'center'}} data-test-id={props['data-test-id']}>
        <div style={{margin: '2rem'}}>
            <Card paddingBase="3">
                {props.children}
            </Card>
        </div>
    </div>
);

type IProps = React.ComponentProps<IUserProfileSection['component']>;

export class AvailabilitySettingsPage extends React.PureComponent<IProps> {
    render() {
        return (
            <Page data-test-id="availability-settings">
                <AvailabilitySettings user={this.props.user} />
            </Page>
        );
    }
}
