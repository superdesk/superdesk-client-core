
describe('auth', () => {
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.core.auth'));
    beforeEach(window.module('superdesk.core.menu'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    it('can use routes with auth=false without identity', inject(($rootScope, $location, $route) => {
        $location.path('/reset-password/');
        $rootScope.$digest();
        expect($location.path()).toBe('/reset-password/');
    }));

    it('can reload a route after login', inject(($compile, $rootScope, $route, $q, auth) => {
        var elem = $compile('<div sd-login-modal></div>')($rootScope.$new()),
            scope = elem.scope();

        $rootScope.$digest();
        $rootScope.$digest();

        spyOn(auth, 'login').and.returnValue($q.when({}));
        spyOn($route, 'reload');
        $route.current = {};

        scope.authenticate();
        $rootScope.$digest();

        expect($route.reload).not.toHaveBeenCalled();

        $route.current = {redirectTo: '/test'};
        scope.authenticate();
        $rootScope.$digest();

        expect($route.reload).toHaveBeenCalled();
    }));
});
