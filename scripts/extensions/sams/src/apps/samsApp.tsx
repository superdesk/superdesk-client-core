// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';
import {Store} from 'redux';

// Types
import {createReduxStore, rootReducer, getStore, unsetStore} from '../store';

interface IState {
    ready: boolean;
}

export function getSamsApp(
    AppComponent: React.ComponentClass,
    onStoreInit?: (store: Store) => Promise<void>,
) {
    return class SamsApp extends React.Component<{}, IState> {
        constructor(props: {}) {
            super(props);

            this.state = {ready: false};
        }

        componentDidMount() {
            const store = createReduxStore(
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
                    <AppComponent />
                </Provider>
            );
        }
    };
}
