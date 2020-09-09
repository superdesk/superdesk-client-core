// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';
import {Store} from 'redux';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IConnectComponentToSuperdesk} from '../interfaces';
import {createReduxStore, rootReducer, getStore, unsetStore} from '../store';

// APIs
import {getSamsAPIs} from '../api';

interface IState {
    ready: boolean;
}

export function getSamsApp(
    superdesk: ISuperdesk,
    getApp: IConnectComponentToSuperdesk,
    onStoreInit?: (store: Store) => Promise<void>,
) {
    const App = getApp(superdesk);
    const api = getSamsAPIs(superdesk);

    return class SamsApp extends React.Component<{}, IState> {
        constructor(props: {}) {
            super(props);

            this.state = {ready: false};
        }

        componentDidMount() {
            const store = createReduxStore(
                {superdesk, api},
                {},
                rootReducer,
            );

            (onStoreInit == null ? Promise.resolve() : onStoreInit(store))
                .then(() => {
                    this.setState({ready: true});
                });
        }

        componentWillUnmount() {
            unsetStore();
        }

        render() {
            const store = getStore();

            if (this.state.ready === false || store == null) {
                return null;
            }

            return (
                <Provider store={store}>
                    <App />
                </Provider>
            );
        }
    };
}
