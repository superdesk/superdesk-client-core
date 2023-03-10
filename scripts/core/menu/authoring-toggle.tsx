import React from 'react';
import {sdApi} from 'api';
import {Switch} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';

interface IState {
    enabled: boolean;
}

export class AuthoringToggle extends React.PureComponent<{}, IState> {
    constructor(props) {
        super(props);
        this.state = {
            enabled: false,
        };
    }

    componentDidMount(): void {
        Promise.resolve(sdApi.preferences.get('authoring')).then((res) => {
            this.setState({
                enabled: res.enabled,
            });
        });
    }

    render() {
        return (
            <Switch
                value={this.state.enabled}
                label={{text: gettext('Switch authoring')}}
                onChange={() => {
                    sdApi.preferences.update('authoring', {
                        enabled: !this.state.enabled,
                    });

                    this.setState({
                        enabled: !this.state.enabled,
                    });
                }}
            />
        );
    }
}
