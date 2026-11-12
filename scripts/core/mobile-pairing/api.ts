import {httpRequestRawLocal} from 'core/helpers/network';
import {
    ICreatedPairingDoc,
    IPairingDecision,
    IPairingDoc,
    IPairingRequestError,
    IPairingStatus,
} from './logic';

interface IPairingHttpRequest {
    method: 'GET' | 'POST' | 'PATCH';
    path: string;
    payload?: {};
    headers?: {[key: string]: string};
}

/** Resolves with the response for every HTTP status, rejects only when there is no response. */
export type IPairingTransport = (request: IPairingHttpRequest) => Promise<Response>;

export interface IPatchedPairingDoc {
    _id: string;
    _etag: string;
    status?: IPairingStatus;
}

export interface IMobilePairingApi {
    create(): Promise<ICreatedPairingDoc>;
    get(id: string): Promise<IPairingDoc>;

    /**
     * Sends the decision with `If-Match: etag`. When the etag is stale (412) it reads the
     * pairing again and retries once with the fresh etag.
     */
    decide(id: string, etag: string, decision: IPairingDecision): Promise<IPatchedPairingDoc>;
}

export function isPairingRequestError(x: unknown): x is IPairingRequestError {
    return typeof x === 'object'
        && x != null
        && (x['kind'] === 'network' || (x['kind'] === 'http' && typeof x['status'] === 'number'));
}

function rejectWith(error: IPairingRequestError): Promise<never> {
    return Promise.reject(error);
}

function toRequestError(response: Response): Promise<IPairingRequestError> {
    return response.json()
        .then((body) => {
            const issue = body?._issues?.pairing;

            return typeof issue === 'string' ? issue : null;
        })
        .catch(() => null)
        .then((issue): IPairingRequestError => ({kind: 'http', status: response.status, issue}));
}

export function createMobilePairingApi(transport: IPairingTransport): IMobilePairingApi {
    function request<T>(options: IPairingHttpRequest): Promise<T> {
        return transport(options)
            .catch(() => rejectWith({kind: 'network'}))
            .then((response) => {
                if (response.ok) {
                    return response.json().catch(
                        () => rejectWith({kind: 'http', status: response.status, issue: null}),
                    ) as Promise<T>;
                }

                return toRequestError(response).then(rejectWith);
            });
    }

    function get(id: string): Promise<IPairingDoc> {
        return request<IPairingDoc>({method: 'GET', path: `/mobile_pairing/${encodeURIComponent(id)}`});
    }

    function patch(id: string, etag: string, decision: IPairingDecision): Promise<IPatchedPairingDoc> {
        return request<IPatchedPairingDoc>({
            method: 'PATCH',
            path: `/mobile_pairing/${encodeURIComponent(id)}`,
            payload: {status: decision},
            headers: {'Content-Type': 'application/json', 'If-Match': etag},
        });
    }

    return {
        create: () => request<ICreatedPairingDoc>({
            method: 'POST',
            path: '/mobile_pairing',
            payload: {},
            headers: {'Content-Type': 'application/json'},
        }),
        get,
        decide: (id, etag, decision) => patch(id, etag, decision).catch((error) => {
            if (isPairingRequestError(error) && error.kind === 'http' && error.status === 412) {
                return get(id).then((fresh) => patch(id, fresh._etag, decision));
            }

            return Promise.reject(error);
        }),
    };
}

export const mobilePairingApi: IMobilePairingApi = createMobilePairingApi(
    (options) => httpRequestRawLocal(options).catch((reason) => {
        // `httpRequestRawLocal` rejects with the response for non 2xx statuses
        if (reason instanceof Response) {
            return reason;
        }

        return Promise.reject(reason);
    }),
);
