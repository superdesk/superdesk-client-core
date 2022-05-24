import {ISpacingProps} from 'superdesk-api';

export const isEmptyString = (str?: string): boolean => typeof str === 'string' && str.length > 0;

// Unlike `String.prototype.trimStart` this only trims an exact match
export const trimStartExact = (str: string, toTrim: string) => {
    const checkStart = str.slice(0, toTrim.length);

    return checkStart === toTrim ? str.slice(toTrim.length) : str;
};

// Unlike `String.prototype.trimEnd` this only trims an exact match
export const trimEndExact = (str: string, toTrim: string) => {
    const checkEnd = str.slice(str.length - toTrim.length);

    return checkEnd === toTrim ? str.slice(0, str.length - toTrim.length) : str;
};

interface IOnlyStringKeys {
    [key: string]: any;
}

// type-safe alternative to lodash.pick
export function pick<T extends IOnlyStringKeys, K extends keyof T>(obj: T, ...keys: Array<K>): Pick<T, K> {
    var picked: any = {};

    for (const key of keys) {
        picked[key] = obj[key];
    }

    return picked;
}

// type-safe alternative to lodash.omit
export function omit<T extends IOnlyStringKeys, K extends keyof T>(obj: T, ...keysToOmit: Array<K>): Omit<T, K> {
    const keys = new Set<string>();

    Object.keys(obj).forEach((key) => {
        keys.add(key);
    });

    keysToOmit.forEach((key) => {
        keys.delete(key as string);
    });

    var picked: any = {};

    keys.forEach((key) => {
        picked[key] = obj[key];
    });

    return picked;
}

export function filterObject<T extends {}>(obj: T, filterFn: (value, key) => boolean): Partial<T> {
    const result = {} as T;

    for (const [key, value] of Object.entries(obj)) {
        if (filterFn(value, key) === true) {
            result[key] = value;
        }
    }

    return result;
}

export function isImage(e: Element): e is HTMLImageElement {
    return e.tagName === 'IMG';
}

export function isAudio(e: Element): e is HTMLAudioElement {
    return e.tagName === 'AUDIO';
}

export function isVideo(e: Element): e is HTMLVideoElement {
    return e.tagName === 'VIDEO';
}

export function getSpacingProps<T extends ISpacingProps>(item: T): ISpacingProps {
    const properties = pick(
        item,
        'margin',
        'marginTop',
        'marginRight',
        'marginBottom',
        'padding',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
    );

    const propertiesShallowCopy = {...properties};

    for (const key in propertiesShallowCopy) {
        if (typeof propertiesShallowCopy[key] === 'undefined') {
            delete propertiesShallowCopy[key];
        }
    }

    return propertiesShallowCopy;
}

// will throw an exception if non-JSON object is passed
export function copyJson(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// will help downloading binary file
export function downloadBlob(data: BinaryType, mimetype: string, filename: string): void {
    const a = document.createElement('a');

    document.body.appendChild(a);
    const blob = new Blob([data], {type: mimetype}),
        url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}

export function copyString(data) {
    var element = document.createElement('textarea');

    document.body.appendChild(element);
    element.value = data;
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
}

/** Does not mutate the original array. */
export function arrayMove<T>(arr: Array<T>, from: number, to: number): Array<T> {
    if (
        from < 0 || from > arr.length - 1
        || to < 0 || to > arr.length - 1
    ) {
        console.error('Out of range.');
        return arr;
    }

    const copy = [...arr];

    const item = copy.splice(from, 1)[0];

    copy.splice(to, 0, item);

    return copy;
}

/**
 * Returns 'black' or 'white' depending on contrast of the background color.
 * @param backgroundColor - 6 characters long hex code starting with #
 */
export function getTextColor(backgroundColor: string): 'black' | 'white' {
    const r = parseInt(backgroundColor.substr(1, 2), 16);
    const g = parseInt(backgroundColor.substr(3, 2), 16);
    const b = parseInt(backgroundColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    return (yiq >= 128) ? 'black' : 'white';
}
