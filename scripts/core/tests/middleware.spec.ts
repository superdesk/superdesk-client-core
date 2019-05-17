
import {applyMiddleware} from '../middleware';

describe('middleware', () => {
    const incMiddleware = ({foo}) => foo + 1;

    it('can run empty', (done) => {
        applyMiddleware([], {'foo': 1}, 'foo').then((result) => {
            expect(result).toBe(1);
            done();
        });
    });

    it('can call all middlewares', (done) => {
        const middleware = [
            incMiddleware,
            incMiddleware,
            incMiddleware,
        ];

        applyMiddleware(middleware, {foo: 0}, 'foo').then((foo) => {
            expect(foo).toBe(3);
            done();
        });
    });

    it('chains promises', (done) => {
        const middleware = [
            ({calls}) => new Promise((resolve) => setTimeout(() => {
                calls.push('first');
                resolve(calls);
            }, 100)),
            ({calls}) => calls.concat(['second']),
        ];

        applyMiddleware(middleware, {calls: []}, 'calls')
            .then((calls) => {
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

    it('passes the same params to all middlewares with no key', (done) => {
        const middleware = [
            (x) => {
                x.bar = 'bar';
                return x;
            },
            (y) => {
                y.foo = 'foo';
                return y;
            },
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
