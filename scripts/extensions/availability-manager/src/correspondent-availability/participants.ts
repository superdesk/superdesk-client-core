import {IRestApiResponse, ISuperdeskQuery, IUser} from 'superdesk-api';
import {IDefaultAvailability, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
import {formatDateIso} from '../utils';
import {getItemsByUserByDate} from './with-availability-records';

const {nameof} = superdesk.helpers;
const {prepareSuperdeskQuery} = superdesk.helpers;
const {httpRequestJsonLocal} = superdesk;

export function fetchParticipants(): Promise<Set<IUser['_id']>> {
    const query: ISuperdeskQuery = {
        filter: {
            $and: [
                {[nameof<IDefaultAvailability>('enabled')]: {$eq: true}},
            ],
        },
        page: 1,
        max_results: 500,
        sort: [{[nameof<IDefaultAvailability>('_created')]: 'asc'}],
    };

    return httpRequestJsonLocal<IRestApiResponse<IDefaultAvailability>>({
        ...prepareSuperdeskQuery('/default_user_availability', query),
        abortSignal: new AbortController().signal,
    })
        .then((res) => {
            const allUsers = superdesk.entities.users.getAllUsers();

            return new Set(
                res._items
                    .filter(({_id}) => allUsers[_id] != null) // filter out disabled users
                    .map(({_id}) => _id),
            );
        });
}

export function filterParticipants(
    options: {
        participantIds: Array<IUser['_id']>;
        days: Array<Date>;
        filters: IFilters;
        byUserByDateFiltered: ReturnType<typeof getItemsByUserByDate>;
    },
): Array<IUser['_id']> {
    const {
        participantIds,
        days,
        filters,
        byUserByDateFiltered,
    } = options;

    return participantIds
        .filter((participantId) => {
            if (filters.status === null) { // not set, usage of triple-equals required
                return days.some((day) => {
                    const dayIso = formatDateIso(day);

                    return byUserByDateFiltered[participantId]?.[dayIso] == null;
                });
            } else {
                return byUserByDateFiltered[participantId] != null;
            }
        });
}