import React from 'react';
import {CheckGroup, Checkbox} from 'superdesk-ui-framework/react';

interface IProps {
    toggleEmailNotification: (notificationId: string) => void;
    preferences: {[key: string]: any};
}

export default class EmailNotificationPreferences extends React.PureComponent<IProps> {
    render(): React.ReactNode {
        return (
            <CheckGroup orientation='vertical'>
                {Object.entries(this.props.preferences ?? []).map(([key, value]) => {
                    return (
                        <Checkbox
                            key={key}
                            label={{text: value.label}}
                            onChange={() => {
                                this.props.toggleEmailNotification(key);
                            }}
                            checked={value?.enabled ?? value?.default ?? false}
                        />
                    );
                })}
            </CheckGroup>
        );
    }
}
