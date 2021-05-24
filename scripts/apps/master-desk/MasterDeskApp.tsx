import React from 'react';
import {store} from 'core/data';
import {Provider} from 'react-redux';
import {MasterDesk} from './MasterDesk';

export const MasterDeskApp = () => (
    <Provider store={store}>
        <MasterDesk />
    </Provider>
);
