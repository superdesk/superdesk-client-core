import React from 'react';
import {CheckGroup, Checkbox} from 'superdesk-ui-framework/react';

interface IProps {
    toggleEmailNotification: (notificationId: string) => void;
    preferences?: {[key: string]: {label: string; email?: boolean; default?: boolean;}};
}

export class EmailNotificationPreferences extends React.PureComponent<IProps> {
    render(): React.ReactNode {
        return (
            <CheckGroup orientation="vertical">
                {Object.entries(this.props.preferences ?? []).map(([key, value]) => (
                    <Checkbox
                        key={key}
                        label={{text: value.label}}
                        onChange={() => {
                            this.props.toggleEmailNotification(key);
                        }}
                        checked={value?.email ?? value?.default ?? false}
                    />
                ))}
            </CheckGroup>
        );
    }
}
