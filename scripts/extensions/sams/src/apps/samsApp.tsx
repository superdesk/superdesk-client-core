// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IConnectComponentToSuperdesk} from '../interfaces';
import {createReduxStore, rootReducer} from '../store';

// Redux Actions
import {loadStorageDestinations} from '../store/storageDestinations/actions';
import {loadSets} from '../store/sets/actions';

// APIs
import {getSamsAPIs} from '../api';
import extension from '../extension';

interface IState {
    ready: boolean;
}

export function getSamsApp(superdesk: ISuperdesk, getApp: IConnectComponentToSuperdesk) {
    const App = getApp(superdesk);
    const api = getSamsAPIs(superdesk);

    return class SamsApp extends React.Component<{}, IState> {
        constructor(props: {}) {
            super(props);

            this.state = {ready: false};
        }

        componentDidMount() {
            extension.exposes.store = createReduxStore(
                {superdesk, api},
                {},
                rootReducer,
            );

            Promise.all([
                extension.exposes.store.dispatch<any>(loadStorageDestinations()),
                extension.exposes.store.dispatch<any>(loadSets()),
            ])
                .then(() => {
                    this.setState({ready: true});
                });
        }

        componentWillUnmount() {
            extension.exposes.store = undefined;
        }

        render() {
            if (this.state.ready === false || extension.exposes.store == null) {
                return null;
            }

            return (
                <Provider store={extension.exposes.store}>
                    <App />
                </Provider>
            );
        }
    };
}
