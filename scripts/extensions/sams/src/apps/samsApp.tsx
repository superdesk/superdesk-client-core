// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';
import {Store} from 'redux';

// Types
import {superdeskApi} from '../apis';
import {getStoreSingleton, getStore, unsetStore} from '../store';

interface IState {
    ready: boolean;
}

interface IProps {
    onStoreInit?(store: Store): Promise<any>;
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
        const store = getStoreSingleton(superdeskApi);

        ((this.props.onStoreInit == null || storeExists) ?
            Promise.resolve() :
            this.props.onStoreInit(store)
        )
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
                {this.props.children}
            </Provider>
        );
    }
}

// export function getSamsApp<T = any>(
//     superdesk: ISuperdesk,
//     getApp: IConnectComponentToSuperdesk<T>,
//     onStoreInit?: (store: Store) => Promise<any>,
// ): React.ComponentType<T> {
//     const App = getApp(superdesk);
//
//     return class SamsApp extends React.Component<any, IState> {
//         constructor(props: {}) {
//             super(props);
//
//             this.state = {ready: false};
//         }
//
//         componentDidMount() {
//             const storeExists = getStore() !== undefined;
//             const store = getStoreSingleton(superdesk);
//
//             ((onStoreInit == null || storeExists) ? Promise.resolve() : onStoreInit(store))
//                 .then(() => {
//                     this.setState({ready: true});
//                 });
//         }
//
//         componentWillUnmount() {
//             unsetStore();
//         }
//
//         render() {
//             const store = getStore();
//
//             if (this.state.ready === false || store == null) {
//                 return null;
//             }
//
//             return (
//                 <Provider store={store}>
//                     <App {...this.props} />
//                 </Provider>
//             );
//         }
//     };
// }
