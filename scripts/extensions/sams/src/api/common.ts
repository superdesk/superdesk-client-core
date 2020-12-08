import {IRestApiResponse} from 'superdesk-api';
import {IVersionInformation} from '../interfaces';

export function fixItemResponseVersionDates<T extends IVersionInformation>(
    response: IRestApiResponse<T>,
): IRestApiResponse<T> {
    (response._items ?? []).forEach(
        (item: T) => {
            fixItemVersionDates(item);
        },
    );

    return response;
}

export function fixItemVersionDates<T extends IVersionInformation>(item: T): T {
    if (item.firstcreated == null) {
        item.firstcreated = item._created;
    }

    if (item.versioncreated == null) {
        item.versioncreated = item._updated;
    }

    if (item.version_creator == null && item.original_creator != null) {
        item.version_creator = item.original_creator;
    }

    return item;
}
