import {appConfig} from 'appConfig';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import _ from 'lodash';

function collection(data) {
    return {_items: data};
}

var USER_URL = 'http://localhost/users/1',
    USER_PATH = '/users/1',
    USERS_URL = 'http://localhost/users',
    SERVER_URL = 'http://localhost',
    ETAG = 'xyz';

function testEtagHeader(headers) {
    return headers['If-Match'] === ETAG;
}

var HTTP_API = {
    type: 'http',
    service: function() {
        this.queryLog = [];

        var query = this.query;

        this.query = function(criteria) {
            this.queryLog.push(criteria);
            return query.call(this, criteria);
        };

        this.ping = function() {
            return 'pong';
        };
    },
    backend: {
        rel: 'users',
        headers: {'X-Filter': 'User.*'},
    },
};

function doConfig() {
    const testConfig: Partial<ISuperdeskGlobalConfig> = {server: {url: SERVER_URL, ws: undefined}};

    Object.assign(appConfig, testConfig);
}

describe('API Provider', () => {
    beforeEach(window.module(doConfig));
    beforeEach(window.module('superdesk.core.api'));

    beforeEach(() => {
        angular.module('superdesk.core.api')
            .config(['apiProvider', (apiProvider) => {
                apiProvider.api('http', HTTP_API);
            }]);
    });

    it('exists', inject((api) => {
        expect(api).toBeDefined();
    }));

    it('can register apis', inject((api) => {
        expect(api.http).toBeDefined();
    }));

    it('can override backend methods', inject((api, $rootScope) => {
        expect(api.http.queryLog.length).toBe(0);
        api.http.query();
        expect(api.http.queryLog.length).toBe(1);
    }));

    it('can define new methods', inject((api) => {
        expect(api.http.ping()).toBe('pong');
    }));

    describe('HTTP API Endpoint', () => {
        afterEach(inject(($httpBackend) => {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('can query', (done) => inject((api, urls, $q, $httpBackend, $http) => {
            var headers = $http.defaults.headers.common;

            headers['X-Filter'] = 'User.*';

            spyOn(urls, 'resource').and.returnValue($q.when(USERS_URL));

            $httpBackend.expectGET(USERS_URL, headers).respond(collection([{}]));

            api.http.query().then((users) => {
                expect(users._items.length).toBe(1);
                expect(urls.resource).toHaveBeenCalledWith('users');

                done();
            });

            $httpBackend.flush();
        }));

        it('rejects on query error', (done) => inject((api, urls, $q, $httpBackend) => {
            $httpBackend.expectGET(USERS_URL).respond(400);

            spyOn(urls, 'resource').and.returnValue($q.when(USERS_URL));

            api.http.query().then(null, () => {
                done();
            });

            $httpBackend.flush();
        }));

        it('can create new resource', (done) => inject((api, urls, $q, $httpBackend) => {
            var userData = {username: 'test'};

            spyOn(urls, 'resource').and.returnValue($q.when(USERS_URL));

            $httpBackend.expectPOST(USERS_URL, userData).respond(201, {_links: {self: {href: 'user_href'}}});

            api.http.save({username: 'test'}).then((user) => {
                expect(user._links.self.href).toBe('user_href');
                expect(urls.resource).toHaveBeenCalledWith('users');

                done();
            });

            $httpBackend.flush();
        }));

        it('can fail creating new resource', (done) => inject((api, urls, $q, $httpBackend) => {
            var userData = {username: 'test'};

            spyOn(urls, 'resource').and.returnValue($q.when(USERS_URL));

            $httpBackend.expectPOST(USERS_URL, userData).respond(200, {
                _status: 'ERR',
                _issues: {first_name: {required: 1}},
            });

            const onSuccess = jasmine.createSpy('onSuccess');

            api.http.save({username: 'test'}).then(onSuccess, (response) => {
                expect(onSuccess).not.toHaveBeenCalled();
                done();
            });

            $httpBackend.flush();
        }));

        it('can create new with diff', inject((api, urls, $q, $httpBackend) => {
            var user: any = {},
                data = {username: 'test'};

            spyOn(urls, 'resource').and.returnValue($q.when(USERS_URL));

            $httpBackend.expectPOST(USERS_URL, data).respond(201, {_links: {self: {href: 'user_href'}}});

            api.http.save(user, data);

            $httpBackend.flush();

            expect(user.username).toBe('test');
            expect(urls.resource).toHaveBeenCalledWith('users');
        }));

        it('can update endpoint', (done) => inject((api, $httpBackend) => {
            var userData = {
                _links: {self: {href: USER_PATH}},
                _id: 2,
                username: 'test',
                Avatar: {href: 'test'},
            };

            $httpBackend.expectPATCH(USER_URL, {username: 'test', Avatar: {href: 'test'}}).respond(200);

            api.http.save(userData).then((user) => {
                expect(user.username).toBe('test');
                expect(user._links.self.href).toBe(USER_PATH);

                done();
            });

            $httpBackend.flush();
        }));

        it('can update with diff', inject((api, $httpBackend) => {
            var userData = {_links: {self: {href: USER_PATH}}, _id: 2, username: 'test'},
                diff = {Active: false};

            $httpBackend.expectPATCH(USER_URL, diff).respond({});

            api.http.save(userData, diff);

            $httpBackend.flush();
        }));

        it('can delete', (done) => inject((api, $httpBackend) => {
            var user = {_links: {self: {href: USER_PATH}}};

            $httpBackend.expectDELETE(USER_URL).respond(204);

            api.http.remove(user).then(() => {
                done();
            });

            $httpBackend.flush();
        }));

        it('handles delete on deleted resource as success', (done) => inject((api, $httpBackend) => {
            var user = {_links: {self: {href: USER_PATH}}};

            $httpBackend.expectDELETE(USER_URL).respond(404);

            api.http.remove(user).then(() => {
                done();
            });

            $httpBackend.flush();
        }));

        it('rejects other delete errors as errors', (done) => inject((api, $httpBackend) => {
            var user = {_links: {self: {href: USER_PATH}}},
                success = jasmine.createSpy('success');

            $httpBackend.expectDELETE(USER_URL).respond(405);

            api.http.remove(user).then(success, () => {
                expect(success).not.toHaveBeenCalled();

                done();
            });

            $httpBackend.flush();
        }));

        it('can get item by url', (done) => inject((api, $httpBackend) => {
            $httpBackend.expectGET(USER_URL).respond({username: 'foo'});

            api.http.getByUrl(USER_PATH).then((user) => {
                expect(user.username).toBe('foo');

                done();
            });

            $httpBackend.flush();
        }));

        it('can get item by id', (done) => inject((api, urls, $q, $httpBackend) => {
            spyOn(urls, 'resource').and.returnValue($q.when(SERVER_URL + '/users'));

            $httpBackend.expectGET(SERVER_URL + '/users/1').respond({username: 'foo'});

            api.http.getById(1).then((user) => {
                expect(user.username).toBe('foo');
                expect(urls.resource).toHaveBeenCalledWith('users');

                done();
            });

            $httpBackend.flush();
        }));

        it('can replace resource on given dest', inject((api, $httpBackend) => {
            var data = {username: 'foo'};

            $httpBackend.expectPUT(USER_URL, data).respond({});

            api.http.replace(USER_PATH, data);

            $httpBackend.flush();
        }));

        it('rejects non success responses', (done) => inject((api, $httpBackend) => {
            $httpBackend.expectGET(USER_URL).respond(400);

            var success = jasmine.createSpy('success');

            api.http.getByUrl(USER_PATH).then(success, () => {
                expect(success).not.toHaveBeenCalled();
                done();
            });

            $httpBackend.flush();
        }));

        it('can get resource url', (done) => inject((api, urls, $q, $rootScope) => {
            spyOn(urls, 'resource').and.returnValue($q.when(USERS_URL));

            api.http.getUrl().then((url) => {
                expect(url).toBe(USERS_URL);
                expect(urls.resource).toHaveBeenCalledWith('users');

                done();
            });

            $rootScope.$digest();
        }));

        it('can get resource headers', inject((api) => {
            expect(api.http.getHeaders()['X-Filter']).toBe('User.*');
        }));
    });

    describe('new api service', () => {
        afterEach(inject(($httpBackend) => {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        beforeEach(inject(($httpBackend) => {
            $httpBackend.whenGET(SERVER_URL).respond(200, {
                _links: {child: [
                    {title: 'users', href: '/users'},
                    {title: 'workspace', href: '/users/<regex():user_id>/workspace'},
                ]},
            });
        }));

        it('can create', inject((api, $httpBackend) => {
            var user: any = {name: 'foo'};

            $httpBackend.expectPOST(USERS_URL, user).respond(201, {_id: 1});

            api('users').save(user);

            $httpBackend.flush();

            expect(user._id).toBe(1);
        }));

        it('can update', inject((api, $httpBackend) => {
            var user = {_id: 1, _links: {self: {href: USER_PATH}}, name: 'foo', _etag: ETAG};
            var diff = {name: 'bar'};

            $httpBackend.expectPATCH(USER_URL, diff, testEtagHeader).respond(200, {name: 'bar', _type: 'user'});

            api('users').save(user, diff);

            $httpBackend.flush();

            expect(user.name).toBe('bar');
            expect(_.has(user, '_type')).toBe(false);

            $httpBackend.expectPATCH(USER_URL, {foo: 1}, testEtagHeader).respond(200, {});
            api('users').save(user, {foo: 1, _type: 'user'});
            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();
        }));

        it('can query resource', (done) => inject((api, $httpBackend) => {
            $httpBackend.expectGET(USERS_URL + '?limit=1').respond(200, {_items: []});

            api('users').query({limit: 1})
                .then((users) => {
                    expect(users._items.length).toBe(0);

                    done();
                });

            $httpBackend.flush();
        }));

        it('can query subresource', inject((api, $httpBackend) => {
            var user = {_id: 1};

            $httpBackend.expectGET(USER_URL + '/workspace').respond(200, {});

            api('workspace', user).query();

            $httpBackend.flush();
        }));

        it('rejects on status error', (done) => inject((api, $httpBackend) => {
            $httpBackend.expectGET(USERS_URL).respond(400);

            var success = jasmine.createSpy('success');

            api('users').query()
                .then(success, () => {
                    expect(success).not.toHaveBeenCalled();

                    done();
                });

            $httpBackend.flush();
        }));

        it('rejects on data error', (done) => inject((api, $httpBackend) => {
            $httpBackend.expectPOST(USERS_URL).respond(200, {_status: 'ERR'});

            var success = jasmine.createSpy('success');

            api('users')
                .save({})
                .then(success, () => {
                    expect(success).not.toHaveBeenCalled();

                    done();
                });

            $httpBackend.flush();
        }));

        it('cleans data before saving it', inject((api, $httpBackend) => {
            $httpBackend.expectPOST(USERS_URL, {name: 'foo', _id: 1}).respond(200, {});
            api('users').save({name: 'foo', _created: 'now', _updated: 'now', _id: 1});
            $httpBackend.flush();
        }));

        it('can fetch an item by id', (done) => inject((api, $httpBackend) => {
            var data = {_id: 1};

            $httpBackend.expectGET(USER_URL).respond(200, data);
            api('users').getById(1)
                .then((user) => {
                    expect(user._id).toBe(1);

                    done();
                });
            $httpBackend.flush();
        }));

        it('can remove an item', inject((api, $httpBackend) => {
            var user = {_links: {self: {href: USER_PATH}}, _etag: ETAG};

            $httpBackend.expectDELETE(USER_URL, testEtagHeader).respond(200);
            api('users').remove(user);
            $httpBackend.flush();
        }));

        it('can get a given url', inject((api, $httpBackend) => {
            $httpBackend.expectGET(USER_URL).respond(200, {});
            api.get(USER_PATH);
            $httpBackend.flush();
        }));

        it('can update given resource', inject((api, $httpBackend) => {
            var data = {name: 'foo'};

            $httpBackend.expectPATCH(USER_URL, data).respond(200);
            api.update('users', {_id: 1}, data);
            $httpBackend.flush();
        }));

        it('can clean diff data for update', inject((api, $httpBackend) => {
            var user = {_links: {self: {href: USER_PATH}}, username: 'foo'};
            var diff = Object.create(user);

            diff.last_name = false;

            $httpBackend.expectPATCH(USER_URL, {last_name: false}).respond(200, {});
            api.save('users', user, diff);
            $httpBackend.flush();
        }));
    });
});
