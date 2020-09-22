import ng from 'core/services/ng';
import {ISuperdesk} from 'superdesk-api';

export function getUrlPage(): string {
    const hash = window.location.hash;
    const index = hash.indexOf('?');

    return index < 0 ?
        hash.slice(1) :
        hash.slice(1, index);
}

export function setUrlPage(page: string) {
    const $location = ng.get('$location');

    $location.url(page);
}

function getAllUrlParameters(): URLSearchParams {
    const hash = window.location.hash;
    const index = hash.indexOf('?');

    return new URLSearchParams(hash.slice(index + 1));
}

function getUrlParameter<T>(field: string, converter: (value: string) => T, defaultValue?: T) {
    const value = getAllUrlParameters().get(field);

    return value == null ?
        defaultValue :
        converter(value);
}

function setUrlParameter(field: string, value?: string | number | boolean) {
    const $location = ng.get('$location');
    const $timeout = ng.get('$timeout');

    // Use Angularjs timeout to perform a digest cycle
    // Otherwise the url params don't actually update
    $timeout(() => {
        $location.search(field, value);
    });
}

export const urlParams: ISuperdesk['browser']['location']['urlParams'] = {
    // Strings
    getString: (field, defaultValue) => {
        return getAllUrlParameters().get(field) || defaultValue;
    },
    setString: (field, value) => {
        setUrlParameter(field, value?.length > 0 ? value : null);
    },

    // Numbers
    getNumber: (field, defaultValue) => {
        return getUrlParameter<number>(
            field,
            (value: string) => parseInt(value, 10),
            defaultValue,
        );
    },
    setNumber: (field, value) => {
        if (value == null || Number.isNaN(value)) {
            setUrlParameter(field);
        } else {
            setUrlParameter(field, value);
        }
    },

    // Booleans
    getBoolean: (field, defaultValue) => {
        return getUrlParameter<boolean>(
            field,
            (value: string) => value === true.toString(),
            defaultValue,
        );
    },
    setBoolean: (field, value) => {
        setUrlParameter(field, value);
    },

    // Dates
    getDate: (field, defaultValue) => {
        return getUrlParameter<Date>(
            field,
            (value: string) => new Date(value),
            defaultValue,
        );
    },
    setDate: (field, value) => {
        setUrlParameter(field, value && value.toISOString());
    },

    // JSON
    getJson: (field, defaultValue) => {
        return getUrlParameter(
            field,
            (value: string) => JSON.parse(value),
            defaultValue,
        );
    },
    setJson: (field, value) => {
        setUrlParameter(field, value && JSON.stringify(value));
    },
};
