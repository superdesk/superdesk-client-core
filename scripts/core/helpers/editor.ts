import {appConfig} from 'appConfig';
import {httpRequestJsonLocal} from './network';
import {IRestApiResponse} from 'superdesk-api';

export function getAutocompleteSuggestions(field: string, language: string): Promise<Array<string>> {
    const supportedFields = ['slugline'];

    if (
        appConfig.archive_autocomplete
        && supportedFields.includes(field)
    ) {
        return httpRequestJsonLocal({
            method: 'GET',
            path: `/archive_autocomplete?field=${field}&language=${language}`,
        }).then((res: IRestApiResponse<{value: string}>) => {
            return res._items.map(({value}) => value);
        });
    } else {
        return Promise.resolve([]);
    }
}
