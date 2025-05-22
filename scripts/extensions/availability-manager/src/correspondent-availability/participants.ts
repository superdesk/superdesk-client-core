import {IRestApiResponse, ISuperdeskQuery, IUser} from 'superdesk-api';
import {IDefaultAvailability, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
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
        max_results: 200,
        sort: [{'versioncreated': 'asc'}],
    };

    return httpRequestJsonLocal<IRestApiResponse<IDefaultAvailability>>({
        ...prepareSuperdeskQuery('/default_user_availability', query),
        abortSignal: new AbortController().signal,
    }).then((res) => new Set(res._items.map(({_id}) => _id)));
}

export function filterParticipants(
    options: {
        participantIds: Array<IUser['_id']>;
        filters: IFilters;
        byUserByDateFiltered: ReturnType<typeof getItemsByUserByDate>;
    },
): Array<IUser['_id']> {
    const {
        participantIds,
        filters,
        byUserByDateFiltered,
    } = options;

    return participantIds
        .filter((participantId) => {
            if (filters.status === null) { // not set, usage of triple-equals required
                return true;
            } else {
                return byUserByDateFiltered[participantId] != null;
            }
        });
}