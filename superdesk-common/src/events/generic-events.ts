interface IOptions {
    once?: boolean;
}

export class GenericEvents<T extends {[key: string]: any}> {
    private prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    addListener<K extends keyof T>(
        eventName: K,
        handler: (event: CustomEvent<T[K]>) => void,
        options?: IOptions,
    ): void {
        window.addEventListener(
            `${this.prefix}__${(eventName as string)}`,
            handler as any,
            {once: options?.once},
        );
    }

    removeListener<K extends keyof T>(eventName: K, handler: (event: CustomEvent<T[K]>) => void) {
        window.removeEventListener(
            `${this.prefix}__${(eventName as string)}`,
            handler as any,
        );
    }

    dispatchEvent<K extends keyof T>(eventName: K, payload: T[K]): void {
        window.dispatchEvent(new CustomEvent(
            `${this.prefix}__${(eventName as string)}`,
            {detail: payload},
        ));
    }
}
