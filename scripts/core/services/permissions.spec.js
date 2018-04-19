

describe('PermissionsService', () => {
    beforeEach(window.module('superdesk.core.services.entity'));
    beforeEach(window.module('superdesk.core.services.server'));
    beforeEach(window.module('superdesk.core.services.permissions'));

    beforeEach(window.module(($provide) => {
        $provide.constant('config', {server: {url: 'http://localhost'}});
    }));

    var rootScope, httpBackend, permissionsService;

    var testPermissions = {
        testResource_1: {read: true},
        testResource_2: {write: true},
        testResource_3: {read: true, write: true},
    };

    beforeEach(() => {
        inject(($rootScope, $httpBackend, _em_, _permissionsService_) => {
            rootScope = $rootScope;
            httpBackend = $httpBackend;
            permissionsService = _permissionsService_;
        });
    });

    it('can succeed checking role', () => {
        permissionsService.isRoleAllowed(testPermissions, {
            permissions: testPermissions,
        }).then((result) => {
            expect(result).toBe(true);
        });
    });

    it('can fail checking role', () => {
        permissionsService.isRoleAllowed(testPermissions, {
            permissions: {
                testResource_1: {read: true},
                testResource_3: {write: true},
            },
        }).then((result) => {
            expect(result).toBe(false);
        });
    });

    it('can succeed checking user', () => {
        var result = false;

        httpBackend
            .expectGET('http://localhost/user_roles/testRoleId')
            .respond(200, {permissions: testPermissions});

        permissionsService.isUserAllowed(testPermissions, {
            role: 'testRoleId',
        }).then((isAllowed) => {
            result = isAllowed;
        });

        httpBackend.flush();

        expect(result).toBe(true);
    });

    it('can fail checking user', () => {
        var result = false;

        httpBackend
            .expectGET('http://localhost/user_roles/testRoleId')
            .respond(200, {permissions: {testResource_1: {read: true}}});

        permissionsService.isUserAllowed(testPermissions, {
            role: 'testRoleId',
        }).then((isAllowed) => {
            result = isAllowed;
        });

        httpBackend.flush();

        expect(result).toBe(false);
    });

    it('can succeed checking current user', () => {
        var result = false;

        rootScope.currentUser = {role: 'testRoleId'};

        httpBackend
            .expectGET('http://localhost/user_roles/testRoleId')
            .respond(200, {permissions: testPermissions});

        permissionsService.isUserAllowed(testPermissions, false).then((isAllowed) => {
            result = isAllowed;
        });

        httpBackend.flush();

        expect(result).toBe(true);
    });

    it('can fail checking current user', () => {
        var result = false;

        rootScope.currentUser = {role: 'testRoleId'};

        httpBackend
            .expectGET('http://localhost/user_roles/testRoleId')
            .respond(200, {permissions: {testResource_1: {read: true}}});

        permissionsService.isUserAllowed(testPermissions, false).then((isAllowed) => {
            result = isAllowed;
        });

        httpBackend.flush();

        expect(result).toBe(false);
    });
});
