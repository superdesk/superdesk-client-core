// External Modules
import {ThunkAction} from 'redux-thunk';
import {Action} from 'redux';

// Types
import {IApplicationState} from './index';

export type IThunkAction<R> = ThunkAction<
    Promise<R>,
    IApplicationState,
    {},
    Action
>;
