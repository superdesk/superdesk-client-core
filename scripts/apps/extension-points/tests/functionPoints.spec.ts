describe('functionPoints service', () => {
    let scope;
    let $q;
    let functionPoints;
    const functionName = 'authoring:publish';

    beforeEach(window.module('superdesk.apps.extension-points'));

    beforeEach(inject((_$q_, _$rootScope_, _functionPoints_) => {
        $q = _$q_;
        functionPoints = _functionPoints_;

        scope = _$rootScope_.$new(true);
    }));

    it('returns an empty array if nothing registered', () => {
        expect(functionPoints.functions).toEqual({});
        expect(functionPoints.get(functionName)).toEqual([]);
    });

    it('can register functions', () => {
        const callback = jasmine.createSpy();

        functionPoints.register(functionName, callback);
        expect(functionPoints.functions).toEqual({
            [functionName]: [callback],
        });
        expect(functionPoints.get(functionName)).toEqual([callback]);
    });

    describe('run', () => {
        it('returns resolved promise when no functions are registered', (done) => {
            functionPoints.run(functionName)
                .then(done, done.fail)
                .catch(done.fail);

            scope.$digest();
        });

        it('can run registered functions', (done) => {
            const callback = jasmine.createSpy().and.returnValue($q.when());
            const resolveFunction = jasmine.createSpy();
            const args = {item: {_id: 'test'}};

            functionPoints.register(functionName, callback);
            functionPoints.run(functionName, args)
                .then(resolveFunction, done.fail)
                .catch(done.fail);

            scope.$digest();

            expect(callback).toHaveBeenCalledWith(args);
            expect(resolveFunction).toHaveBeenCalled();
            done();
        });

        it('can run multiple registered functions', (done) => {
            const callbacks = [
                jasmine.createSpy().and.returnValue($q.when()),
                jasmine.createSpy().and.returnValue($q.when()),
                jasmine.createSpy().and.returnValue($q.when()),
            ];
            const resolveFunction = jasmine.createSpy();
            const args = {item: {_id: 'test'}};

            functionPoints.register(functionName, callbacks[0]);
            functionPoints.register(functionName, callbacks[1]);
            functionPoints.register(functionName, callbacks[2]);
            functionPoints.run(functionName, args)
                .then(resolveFunction, done.fail)
                .catch(done.fail);

            scope.$digest();

            expect(callbacks[0]).toHaveBeenCalledWith(args);
            expect(callbacks[1]).toHaveBeenCalledWith(args);
            expect(callbacks[2]).toHaveBeenCalledWith(args);
            expect(resolveFunction).toHaveBeenCalled();
            done();
        });

        it('bails out on first rejected response', (done) => {
            const rtnArgs = {test: {one: 'two'}};
            const callbacks = [
                jasmine.createSpy().and.returnValue($q.when()),
                jasmine.createSpy().and.returnValue($q.reject(rtnArgs)),
                jasmine.createSpy().and.returnValue($q.when()),
            ];
            const rejectFunction = jasmine.createSpy();
            const args = {item: {_id: 'test'}};

            functionPoints.register(functionName, callbacks[0]);
            functionPoints.register(functionName, callbacks[1]);
            functionPoints.register(functionName, callbacks[2]);

            functionPoints.run(functionName, args)
                .then(done.fail, rejectFunction)
                .catch(done.fail);

            scope.$digest();

            expect(callbacks[0]).toHaveBeenCalledWith(args);
            expect(callbacks[1]).toHaveBeenCalledWith(args);
            expect(callbacks[2]).not.toHaveBeenCalled();
            expect(rejectFunction).toHaveBeenCalledWith(rtnArgs);
            done();
        });
    });
});
