import {extensions} from 'appConfig';
import React from 'react';
import {CheckGroup, Checkbox} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';

interface IProps {
    toggleEmailNotification: (notificationId: string) => void;
}

export default class EmailNotificationPreferences extends React.PureComponent<IProps, any> {

    render(): React.ReactNode {
        const notificationsFromExtensions: {[key: string]: {type: string}} = {};
        const preferences = ng.get('preferencesService');

        for (const extension of Object.values(extensions)) {
            for (const [key, value] of Object.entries(extension.activationResult.contributions?.notifications ?? [])) {
                if (value.type === 'email') {
                    notificationsFromExtensions[key] = value;
                }
            }
        }

        return (
            <CheckGroup>
                {Object.entries(notificationsFromExtensions).map(([key]) => {
                    return (
                        <Checkbox
                            key={key}
                            label={{text: preferences[key].label}}
                            onChange={() => {
                                this.props.toggleEmailNotification(key);
                            }}
                            checked={preferences?.[key]?.enabled}
                        />
                    )
                })}
            </CheckGroup>
        );
    }
}
