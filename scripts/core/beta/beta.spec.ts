describe('beta service', () => {
    beforeEach(window.module('superdesk.core.services.beta'));

    it('can filter out sd-beta from html when beta is off',
        (done) => inject((betaService, $rootScope, $http, $httpBackend) => {
            $rootScope.beta = false;
            var isBeta = null;

            betaService.isBeta().then((_beta) => {
                isBeta = _beta;
            });

            $rootScope.$digest();
            expect(isBeta).toBe(false);

            var template = '<div>normal</div><div sd-beta>beta</div>';

            $httpBackend.expectGET('view_off.html').respond(200, template);

            $http.get('view_off.html').then((response) => {
                expect(response.data).not.toContain('beta');

                done();
            });

            $httpBackend.flush();
        }));

    it('keeps it there when beta is on',
        (done) => inject((betaService, preferencesService, $rootScope, $http, $httpBackend, $q) => {
            $rootScope.beta = true;

            spyOn(preferencesService, 'get').and.returnValue($q.when({enabled: true}));

            let promise = Promise.resolve();

            promise = promise.then(() => new Promise<void>((resolve) => {
                betaService.isBeta().then((_beta) => {
                    expect(_beta).toBe(true);

                    resolve();
                });

                $rootScope.$digest();
            }));

            promise = promise.then(() => new Promise<void>((resolve) => {
                var template = '<div sd-beta>beta</div>',
                    data;

                $httpBackend.expectGET('view_on.html').respond(200, template);

                $http.get('view_on.html').then((response) => {
                    data = response.data;

                    expect(data).toContain('beta');

                    resolve();
                });

                $httpBackend.flush();
            }));

            promise = promise.then(() => {
                done();
            });
        }));
});
