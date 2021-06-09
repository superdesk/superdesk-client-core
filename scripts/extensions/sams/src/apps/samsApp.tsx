// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';
import {Store} from 'redux';

import {superdeskApi} from '../apis';

import {loadSets} from '../store/sets/actions';
import {setCurrentDeskId} from '../store/workspace/actions';
import {loadStorageDestinations} from '../store/storageDestinations/actions';
import {loadDesksSamsSettings} from '../store/workspace/actions';

// Utils
import {getStoreSingleton, getStore, unsetStore} from '../store';

interface IProps {
    onStoreInit?(store: Store): Promise<any>;
}

interface IState {
    ready: boolean;
}

export class SamsApp extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            ready: false,
        };
    }

    componentDidMount() {
        const storeExists = getStore() !== undefined;
        const store = getStoreSingleton();

        (storeExists ?
            Promise.resolve() :
            this.initApp(store)
        )
            .then(() => {
                this.setState({ready: true});
            });
    }

    componentWillUnmount() {
        unsetStore();
    }

    initApp(store: Store) {
        return superdeskApi.entities.desk.waitTilReady()
            .then(() => {
                store.dispatch<any>(setCurrentDeskId(superdeskApi.entities.desk.getActiveDeskId()));

                return Promise.all([
                    store.dispatch<any>(loadStorageDestinations()),
                    store.dispatch<any>(loadSets()),
                    store.dispatch<any>(loadDesksSamsSettings()),
                ])
                    .then(() => {
                        if (this.props.onStoreInit != null) {
                            return this.props.onStoreInit(store);
                        }

                        return Promise.resolve();
                    });
            });
    }

    render() {
        const store = getStore();

        if (this.state.ready === false || store == null) {
            return null;
        }

        return (
            <Provider store={store}>
                {this.props.children}
            </Provider>
        );
    }
}
