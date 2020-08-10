// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';
import {Store} from 'redux';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IConnectComponentToSuperdesk} from '../interfaces';
import {createReduxStore, rootReducer} from '../store';

// Redux Actions
import {loadStorageDestinations} from '../store/storageDestinations/actions';
import {loadSets} from '../store/sets/actions';

// APIs
import {getSamsAPIs} from '../api';

interface IState {
    ready: boolean;
}

export function getSamsApp(superdesk: ISuperdesk, getApp: IConnectComponentToSuperdesk) {
    const App = getApp(superdesk);
    const api = getSamsAPIs(superdesk);

    return class SamsApp extends React.Component<{}, IState> {
        store: Store;

        constructor(props: {}) {
            super(props);

            this.store = createReduxStore(
                {superdesk, api},
                {},
                rootReducer,
            );

            this.state = {ready: false};
        }

        componentDidMount() {
            Promise.all([
                this.store.dispatch<any>(loadStorageDestinations()),
                this.store.dispatch<any>(loadSets()),
            ])
                .then(() => {
                    this.setState({ready: true});
                });
        }

        render() {
            if (this.state.ready === false) {
                return null;
            }

            return (
                <Provider store={this.store}>
                    <App />
                </Provider>
            );
        }
    };
}
