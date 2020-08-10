// External Modules
import {ThunkAction} from 'redux-thunk';
import {Action} from 'redux';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IApplicationState} from './index';
import {ISamsAPI} from '../interfaces';

export interface IExtraArguments {
    api: ISamsAPI;
    superdesk: ISuperdesk;
}

export type IThunkAction<R> = ThunkAction<
    Promise<R>,
    IApplicationState,
    IExtraArguments,
    Action
>;
