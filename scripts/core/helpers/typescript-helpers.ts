export function nameof<T>(name: keyof T) {
    return name;
}

export type Writeable<T> = { -readonly [P in keyof T]-?: T[P] };

export function assertNever(x: never): never {
    throw new Error('Unexpected object: ' + x);
}
