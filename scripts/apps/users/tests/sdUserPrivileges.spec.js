
/**
* Module with tests for the sdUserPrivileges directive
*
* @module sdUserPrivileges directive tests
*/
describe('sdUserPrivileges directive', () => {
    var queryDeferred,
        getByIdDeferred,
        fakeEndpoints,
        isoScope, // the directive's own isolate scope
        $compile,
        $rootScope;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.users'));

    beforeEach(window.module(($provide) => {
        fakeEndpoints = {};

        function fakeApi() {
            function apiMock(endpointName) {
                return fakeEndpoints[endpointName];
            }

            // some API methods are attached directly to the API service, thus
            // a different mocking technique here
            apiMock.save = jasmine.createSpy('api_save');

            return apiMock;
        }

        $provide.service('api', fakeApi);
    }));

    beforeEach(inject((_$rootScope_, _$compile_, $q, api, userList) => {
        $rootScope = _$rootScope_;
        $compile = _$compile_;

        queryDeferred = $q.defer();
        getByIdDeferred = $q.defer();

        fakeEndpoints.privileges = {
            query: jasmine.createSpy('privileges_query')
                .and.returnValue(queryDeferred.promise),
        };

        fakeEndpoints.roles = {
            getById: jasmine.createSpy('get_roles_by_user_id')
                .and.returnValue(getByIdDeferred.promise),
        };

        var user = {_id: 1, role: '€d1t0r', privileges: [{name: 'foo'}, {name: 'bar'}]};

        spyOn(userList, 'getUser').and.returnValue($q.when(user));
    }));

    /**
     * Compiles the directive under test and links it with a new scope
     * containing the provided scope values.
     * Provided values should contain at least a "user" object, since the
     * directive undertest expects it to be present in the parent scope.
     *
     * @function compileDirective
     * @param {Object} scopeValues - values in the current scope of the DOM
     *   element the directive will be applied to
     * @return {Object} - the root DOM node of the compiled directive
     *   element
     */
    function compileDirective(scopeValues) {
        var html,
            scope, // the scope of the element the directive is applied to
            $element;

        scope = $rootScope.$new();
        angular.extend(scope, scopeValues);

        html = '<div sd-user-privileges data-user="user"></div>';

        $element = $compile(html)(scope);
        scope.$digest();

        return $element;
    }

    beforeEach(() => {
        var $element,
            scopeValues,
            userPrivileges;

        userPrivileges = [{name: 'foo'}, {name: 'bar'}];

        scopeValues = {
            user: {
                privileges: userPrivileges,
                role: '€d1t0r',
            },
        };

        $element = compileDirective(scopeValues);
        isoScope = $element.isolateScope();
    });

    describe('on initialization', () => {
        it('fetches and stores the list of all privileges', () => {
            var serverResponse = {
                _items: [
                    {name: 'role_foo'},
                    {name: 'role_bar'},
                ],
            };

            expect(fakeEndpoints.privileges.query).toHaveBeenCalled();

            isoScope.privileges = [];
            queryDeferred.resolve(serverResponse);
            isoScope.$digest();

            expect(isoScope.privileges).toEqual(
                [{name: 'role_foo'}, {name: 'role_bar'}]
            );
        });

        it('fetches and stores the user\'s role object', () => {
            var serverResponse = {
                name: '€d1t0r',
                privileges: [
                    {name: 'create_content'}, {name: 'edit_content'},
                ],
            };

            queryDeferred.resolve(serverResponse);
            getByIdDeferred.resolve(serverResponse);
            isoScope.role = {};
            isoScope.$digest();
            expect(fakeEndpoints.roles.getById).toHaveBeenCalledWith('€d1t0r');
            expect(isoScope.role).toEqual(serverResponse);
        });

        it('logs an error if fetching the user\'s role fails', () => {
            spyOn(console, 'error');

            queryDeferred.reject('Server error');
            isoScope.$digest();

            expect(console.error).toHaveBeenCalledWith('Server error');
        });
    });

    describe('scope\'s save() method', () => {
        var api,
            saveDeferred;

        beforeEach(inject(($q, _api_) => {
            api = _api_;
            saveDeferred = $q.defer();
            api.save.and.returnValue(saveDeferred.promise);
        }));

        it('saves user\'s privileges', () => {
            var userJohn = {
                name: 'John Doe',
                privileges: [{name: 'can_edit'}],
            };

            isoScope.user = userJohn;

            isoScope.save();

            expect(api.save).toHaveBeenCalledWith(
                'users',
                userJohn,
                {
                    privileges: [{name: 'can_edit'}],
                }
            );
        });

        it('updates the original priviliges list to the newly saved ones',
            () => {
                isoScope.user = {
                    name: 'John Doe',
                    privileges: [{name: 'manager'}, {name: 'reviewer'}],
                };

                isoScope.origPrivileges = [{name: 'editor'}];

                isoScope.save();
                saveDeferred.resolve();
                isoScope.$digest();

                expect(isoScope.origPrivileges).toEqual(
                    [{name: 'manager'}, {name: 'reviewer'}]
                );
            }
        );

        it('issues system notification on success', inject((notify) => {
            spyOn(notify, 'success');

            isoScope.save();
            saveDeferred.resolve();
            isoScope.$digest();

            expect(notify.success).toHaveBeenCalledWith('Privileges updated.');
        }));

        it('marks the HTML form as pristine on success', () => {
            isoScope.userPrivileges.$pristine = false;

            isoScope.save();
            saveDeferred.resolve();
            isoScope.$digest();

            expect(isoScope.userPrivileges.$pristine).toBe(true);
        });

        it('does *not* mark the HTML form as pristine on error', () => {
            isoScope.userPrivileges.$pristine = false;

            isoScope.save();
            saveDeferred.reject({data: 'Server Error'});
            isoScope.$digest();

            expect(isoScope.userPrivileges.$pristine).toBe(false);
        });

        it('issues system notification on error', inject((notify) => {
            spyOn(notify, 'error');

            isoScope.save();
            saveDeferred.reject({data: 'Server Error'});
            isoScope.$digest();

            expect(notify.error).toHaveBeenCalledWith(
                'Error. Privileges not updated.');
        }));
    });

    describe('scope\'s cancel() method', () => {
        it('restores user\'s original privilege setttings', () => {
            isoScope.user.privileges = [{name: 'aaa'}, {name: 'bbb'}];
            isoScope.origPrivileges = [{name: 'foo'}, {name: 'bar'}];

            isoScope.cancel();

            expect(isoScope.user.privileges).toEqual(
                [{name: 'foo'}, {name: 'bar'}]);
        });

        it('marks the corresponding HTML form as pristine', () => {
            isoScope.userPrivileges.$pristine = false;
            isoScope.cancel();
            expect(isoScope.userPrivileges.$pristine).toBe(true);
        });
    });
});
