export function nameof<T>(name: keyof T) {
    return name;
}

// eslint-disable-next-line space-infix-ops
export type Writeable<T> = { -readonly [P in keyof T]-?: T[P] };

export function applyDefault<T>(value: T, defaultValue: T) {
    return value != null ? value : defaultValue;
}

export function isArray<T>(x: T | Array<T>): x is Array<T> {
    return Array.isArray(x);
}

export function assertNever(x: never): never {
    throw new Error('Unexpected object: ' + x);
}

export function filterUndefined<T>(values: Partial<T>): Partial<T> {
    const filteredValue = {} as Partial<T>;
    let key: keyof T;

    for (key in values) {
        if (values[key] != null) {
            filteredValue[key] = values[key];
        }
    }

    return filteredValue;
}

export function filterKeys<T>(original: T, keys: Array<keyof T>): Partial<T> {
    const filteredValue = {} as Partial<T>;

    keys.forEach((key) => {
        filteredValue[key] = original[key];
    });

    return filteredValue;
}

export function stringToNumber(value?: string, radix?: number): number | undefined {
    return value?.length > 0 ?
        parseInt(value, radix ?? 10) :
        undefined;
}

export function numberToString(value?: number): string | undefined {
    return value?.toString() ?? undefined;
}

export function notNullOrUndefined<T>(x: null | undefined | T): x is T {
    return x != null;
}
