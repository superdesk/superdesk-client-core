export function nameof<T>(name: keyof T) {
    return name;
}

export function assertNever(x: never): never {
    throw new Error('Unexpected object: ' + x);
}
