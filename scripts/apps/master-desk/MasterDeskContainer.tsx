import React from 'react';
import {Container} from 'flux/utils';
import UserStore from 'core/data/UserStore';
import {MasterDesk} from './MasterDesk';

const getStores = () => ([
    UserStore,
]);

const getState = () => ({
    users: UserStore.getState(),
});

const MasterDeskApp = (props) => (
    <MasterDesk {...props} />
);

export default Container.createFunctional(MasterDeskApp, getStores, getState);
