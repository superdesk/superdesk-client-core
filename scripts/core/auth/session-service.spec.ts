var SESSION = {
    token: 'abcd',
    _links: {
        self: {href: 'delete_session_url'},
    },
};

describe('session service', () => {
    beforeEach(() => {
        localStorage.clear();
        window.module('superdesk.core.services.storage');
        window.module('superdesk.core.auth.session');
    });

    it('has identity and token property', inject((session) => {
        expect(session.token).toBe(null);
        expect(session.identity).toBe(null);
    }));

    it('can be started', inject((session, $q) => {
        session.start(SESSION, {name: 'user'});
        expect(session.token).toBe(SESSION.token);
        expect(session.identity.name).toBe('user');
    }));

    it('can be set expired', inject((session, $rootScope) => {
        spyOn($rootScope, '$broadcast');
        session.start(SESSION, {name: 'foo'});
        expect($rootScope.$broadcast).toHaveBeenCalledWith('login');
        session.expire();
        expect(session.token).toBe(null);
        expect(session.identity.name).toBe('foo');
        expect($rootScope.$broadcast).toHaveBeenCalledWith('logout');
    }));

    it('can resolve identity on start', inject((session, $rootScope) => {
        var identity;

        session.getIdentity().then((_identity) => {
            identity = _identity;
        });

        session.getIdentity().then((i2) => {
            expect(identity).toBe(i2);
        });

        session.start(SESSION, {name: 'foo'});

        $rootScope.$apply();
        expect(identity.name).toBe('foo');
    }));

    it('can store state for future requests', inject((session, $rootScope) => {
        session.start(SESSION, {name: 'bar'});

        var nextInjector = angular.injector(['superdesk.core.auth.session', 'superdesk.core.services.storage', 'ng']);
        var nextSession = nextInjector.get('session');

        nextInjector.get('$rootScope').$digest();
        $rootScope.$digest();

        expect(nextSession.token).toBe(SESSION.token);
        expect(nextSession.identity.name).toBe('bar');

        nextSession.expire();
        $rootScope.$digest();

        expect(session.token).toBe(null);
        expect(session.identity.name).toBe('bar');
    }));

    it('can set test user with given id', inject((session) => {
        session.testUser('1234id');

        expect(session.token).toBe(1);
        expect(session.identity._id).toBe('1234id');
        expect(session.sessionId).toBe('s1234id');
    }));

    it('can filter blacklisted fields from indentity', inject((session) => {
        session.start(SESSION, {
            name: 'foo',
            session_preferences: ['session'],
            user_preferences: ['user'],
            workspace: ['workspace'],
            allowed_actions: ['actions'],
        });
        expect(session.identity.name).not.toBeUndefined();
        expect(session.identity.session_preferences).toBeUndefined();
        expect(session.identity.user_preferences).toBeUndefined();
        expect(session.identity.workspace).toBeUndefined();
        expect(session.identity.allowed_actions).toBeUndefined();
    }));

    it('can clear session', inject((session) => {
        session.start(SESSION, {name: 'bar'});
        session.clear();
        expect(session.token).toBe(null);
        expect(session.identity).toBe(null);
    }));

    it('can persist session delete href', inject((session) => {
        session.start(SESSION, {name: 'bar'});
        expect(session.getSessionHref()).toBe(SESSION._links.self.href);
    }));

    it('can update identity', inject((session, $rootScope) => {
        session.start(SESSION, {name: 'bar'});
        session.updateIdentity({name: 'baz'});
        expect(session.identity.name).toBe('baz');

        var nextInjector = angular.injector(['superdesk.core.auth.session', 'superdesk.core.services.storage', 'ng']);
        var nextSession = nextInjector.get('session');

        nextInjector.get('$rootScope').$digest();

        $rootScope.$apply();
        expect(nextSession.identity.name).toBe('baz');
    }));

    it('can return identity after session start', inject((session, $rootScope) => {
        session.start(SESSION, {name: 'bar'});
        $rootScope.$digest();

        var success = jasmine.createSpy('success');

        session.getIdentity().then(success);

        $rootScope.$digest();
        expect(success).toHaveBeenCalled();
    }));

    it('should not resolve identity after expiry', inject((session, $rootScope) => {
        session.start(SESSION, {name: 'bar'});
        $rootScope.$digest();

        session.expire();
        $rootScope.$digest();

        var success = jasmine.createSpy('success');

        session.getIdentity().then(success);

        $rootScope.$digest();
        expect(success).not.toHaveBeenCalled();
    }));
});
