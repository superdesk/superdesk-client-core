import React from 'react';
import {CheckGroup, Checkbox} from 'superdesk-ui-framework/react';
import {IUser} from 'superdesk-api';
import {gettext} from 'core/utils';

interface IProps {
    toggleEmailNotification: (notificationId: string) => void;
    preferences: {
        notifications: IUser['user_preferences']['notifications'];
    };
    notificationLabels: Dictionary<string, string>;
}

export class EmailNotificationPreferences extends React.PureComponent<IProps> {
    render(): React.ReactNode {
        return (
            <CheckGroup orientation="vertical">
                {Object.entries(this.props.preferences.notifications)
                    .map(([notificationId, notificationSettings]) => {
                        return (
                            <Checkbox
                                key={notificationId}
                                label={{
                                    text: gettext(
                                        'Send {{name}} notifications',
                                        {name: this.props.notificationLabels[notificationId]},
                                    )}}
                                onChange={() => {
                                    this.props.toggleEmailNotification(notificationId);
                                }}
                                checked={notificationSettings.email}
                            />
                        );
                    })}
            </CheckGroup>
        );
    }
}
