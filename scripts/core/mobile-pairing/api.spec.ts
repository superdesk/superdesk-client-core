import {createMobilePairingApi, IPairingTransport} from './api';

function jsonResponse(status: number, body: {}): Response {
    return new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
}

describe('mobile pairing api', () => {
    it('creates a pairing with an empty JSON body', (done) => {
        const transport = jasmine.createSpy('transport').and.returnValue(
            Promise.resolve(jsonResponse(201, {_id: 'p1', _etag: 'e1', status: 'pending', code: 'c', expires_in: 60})),
        );

        createMobilePairingApi(transport).create().then((doc) => {
            expect(transport).toHaveBeenCalledWith({
                method: 'POST',
                path: '/mobile_pairing',
                payload: {},
                headers: {'Content-Type': 'application/json'},
            });
            expect(doc.code).toBe('c');
            done();
        }).catch(done.fail);
    });

    it('sends the decision with If-Match', (done) => {
        const transport = jasmine.createSpy('transport').and.returnValue(
            Promise.resolve(jsonResponse(200, {_id: 'p1', _etag: 'e2', _status: 'OK', status: 'approved'})),
        );

        createMobilePairingApi(transport).decide('p1', 'e1', 'approved').then((doc) => {
            expect(transport).toHaveBeenCalledTimes(1);
            expect(transport).toHaveBeenCalledWith({
                method: 'PATCH',
                path: '/mobile_pairing/p1',
                payload: {status: 'approved'},
                headers: {'Content-Type': 'application/json', 'If-Match': 'e1'},
            });
            expect(doc._etag).toBe('e2');
            done();
        }).catch(done.fail);
    });

    it('re-reads the pairing and retries once with the fresh etag on 412', (done) => {
        const responses = [
            jsonResponse(412, {_status: 'ERR', _message: 'etag mismatch'}),
            jsonResponse(200, {_id: 'p1', _etag: 'fresh', status: 'claimed', expires_in: 100}),
            jsonResponse(200, {_id: 'p1', _etag: 'e3', _status: 'OK', status: 'approved'}),
        ];
        const transport = jasmine.createSpy('transport').and.callFake(() => Promise.resolve(responses.shift()));

        createMobilePairingApi(transport).decide('p1', 'stale', 'approved').then((doc) => {
            const calls = transport.calls.allArgs().map(([request]) => [request.method, request.headers?.['If-Match']]);

            expect(calls).toEqual([
                ['PATCH', 'stale'],
                ['GET', undefined],
                ['PATCH', 'fresh'],
            ]);
            expect(doc._etag).toBe('e3');
            done();
        }).catch(done.fail);
    });

    it('gives up after the single retry', (done) => {
        const transport = jasmine.createSpy('transport').and.callFake((request) => Promise.resolve(
            request.method === 'GET'
                ? jsonResponse(200, {_id: 'p1', _etag: 'fresh', status: 'claimed', expires_in: 100})
                : jsonResponse(412, {_status: 'ERR'}),
        ));

        createMobilePairingApi(transport).decide('p1', 'stale', 'approved').then(
            () => done.fail('expected a rejection'),
            (error) => {
                expect(error).toEqual({kind: 'http', status: 412, issue: null});
                expect(transport).toHaveBeenCalledTimes(3);
                done();
            },
        );
    });

    it('reads the pairing issue from Superdesk errors', (done) => {
        const transport: IPairingTransport = () => Promise.resolve(
            jsonResponse(400, {_status: 'ERR', _message: 'expired', _issues: {pairing: 'expired'}}),
        );

        createMobilePairingApi(transport).decide('p1', 'e1', 'approved').then(
            () => done.fail('expected a rejection'),
            (error) => {
                expect(error).toEqual({kind: 'http', status: 400, issue: 'expired'});
                done();
            },
        );
    });

    it('reports a non JSON error body by its status', (done) => {
        const transport: IPairingTransport = () => Promise.resolve(
            new Response('<html>Bad gateway</html>', {status: 502}),
        );

        createMobilePairingApi(transport).get('p1').then(
            () => done.fail('expected a rejection'),
            (error) => {
                expect(error).toEqual({kind: 'http', status: 502, issue: null});
                done();
            },
        );
    });

    it('reports a request that got no response as a network error', (done) => {
        const transport: IPairingTransport = () => Promise.reject(new TypeError('Failed to fetch'));

        createMobilePairingApi(transport).create().then(
            () => done.fail('expected a rejection'),
            (error) => {
                expect(error).toEqual({kind: 'network'});
                done();
            },
        );
    });

    it('encodes the pairing id in the path', (done) => {
        const transport = jasmine.createSpy('transport').and.returnValue(
            Promise.resolve(jsonResponse(200, {_id: 'a/b', _etag: 'e', status: 'pending', expires_in: 10})),
        );

        createMobilePairingApi(transport).get('a/b').then(() => {
            expect(transport.calls.mostRecent().args[0].path).toBe('/mobile_pairing/a%2Fb');
            done();
        }).catch(done.fail);
    });
});
