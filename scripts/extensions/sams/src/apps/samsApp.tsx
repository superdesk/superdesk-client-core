// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';
import {Store} from 'redux';

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
