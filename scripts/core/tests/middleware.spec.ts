
import {applyMiddleware} from '../middleware';

describe('middleware', () => {
    const incMiddleware = (params) => params.foo += 1;

    it('can run empty', (done) => {
        applyMiddleware([], 'foo').then((result) => {
            expect(result).toBe('foo');
            done();
        });
    });

    it('can call all middlewares', (done) => {
        const middleware = [
            incMiddleware,
            incMiddleware,
            incMiddleware,
        ];

        applyMiddleware(middleware, {foo: 0}).then(({foo}) => {
            expect(foo).toBe(3);
            done();
        });
    });

    it('chains promises', (done) => {
        const middleware = [
            (params) => new Promise((resolve) => setTimeout(() => {
                params.calls.push('first');
                resolve();
            }, 100)),
            (params) => params.calls.push('second'),
        ];

        applyMiddleware(middleware, {calls: []})
            .then(({calls}) => {
                expect(calls).toEqual(['first', 'second']);
                done();
            });
    });

    it('cat stop chain via reject', (done) => {
        const middleware = [
            incMiddleware,
            () => Promise.reject('reason'),
            incMiddleware,
        ];

        const success = jasmine.createSpy('success');
        const reject = jasmine.createSpy('reject');

        applyMiddleware(middleware, {})
            .then(success, reject)
            .finally(() => {
                expect(success).not.toHaveBeenCalled();
                expect(reject).toHaveBeenCalled();
                done();
            });
    });

    it('passes the same params to all middlewares', (done) => {
        const middleware = [
            (x) => x.bar = 'bar',
            (y) => y.foo = 'foo',
        ];

        const reject = jasmine.createSpy('reject');

        applyMiddleware(middleware, {})
            .then((result) => {
                expect(result.foo).toBe('foo');
                expect(result.bar).toBe('bar');
            }, reject)
            .finally(() => {
                expect(reject).not.toHaveBeenCalled();
                done();
            });
    });
});
