export function nameof<T>(name: keyof T) {
    return name;
}

// eslint-disable-next-line space-infix-ops
export type Writeable<T> = { -readonly [P in keyof T]-?: T[P] };

export function applyDefault<T>(value: T, defaultValue: T) {
    return value != null ? value : defaultValue;
}

export function assertNever(x: never): never {
    throw new Error('Unexpected object: ' + x);
}
