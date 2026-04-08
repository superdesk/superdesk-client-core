import {IDesk} from 'superdesk-api';
import {sdApi} from 'api';

type IUserPreferredDesksPreference = {
    selected?: Partial<Record<IDesk['_id'], boolean>>;
};

export function getUserPreferredDesks(): Partial<Record<IDesk['_id'], boolean>> {
    const preferredDesks: IUserPreferredDesksPreference | null = sdApi.preferences.get('desks:preferred');

    return preferredDesks?.selected ?? {};
}