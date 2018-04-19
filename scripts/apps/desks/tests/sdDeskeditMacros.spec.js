
/**
* Module with tests for the sdDeskeditMacros directive
*
* @module sdDeskeditMacros directive tests
*/
describe('sdDeskeditMacros directive', () => {
    var macros,
        scope,
        getMacrosDeferred,
        getMacrosByDeskDeferred,
        $compile,
        $rootScope;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject((_$compile_, _$rootScope_, $q, _macros_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        macros = _macros_;

        getMacrosDeferred = $q.defer();
        getMacrosByDeskDeferred = $q.defer();

        spyOn(macros, 'get').and.returnValue(getMacrosDeferred.promise);
        spyOn(macros, 'getByDesk')
            .and.returnValue(getMacrosByDeskDeferred.promise);
    }));

    /**
     * Compiles the directive under test and links it with a new scope
     * containing the provided scope values.
     *
     * @function compileDirective
     * @param {Object} scopeValues - values in the current scope of the DOM
     *   element the directive will be applied to
     * @return {Object} - the root DOM node of the compiled directive element
     */
    function compileDirective(scopeValues) {
        var html,
            newScope,
            $element;

        newScope = $rootScope.$new();
        angular.extend(newScope, scopeValues);

        html = '<div sd-deskedit-macros></div>';

        $element = $compile(html)(newScope);
        newScope.$digest();

        return $element;
    }

    it('fetches macros for the current desk if desk is defined', () => {
        var scopeValues,
            $element;

        scopeValues = {
            desk: {
                edit: {name: 'Desk D'},
            },
        };

        $element = compileDirective(scopeValues);
        scope = $element.scope();
        scope.$digest();

        expect(macros.getByDesk).toHaveBeenCalledWith('Desk D', true);
    });

    it('stores macro list in scope when desk macros data is fetched',
        () => {
            var macrosFromServer,
                scopeValues,
                $element;

            scopeValues = {
                desk: {
                    edit: {name: 'Desk D'},
                },
            };

            $element = compileDirective(scopeValues);
            scope = $element.scope();

            scope.macros = null;
            macrosFromServer = [{_id: 'foo'}, {_id: 'bar'}, {_id: 'baz'}];
            getMacrosByDeskDeferred.resolve(macrosFromServer);
            scope.$digest();

            expect(scope.macros).toEqual(macrosFromServer);
        }
    );

    it('fetches all macros if current desk is not set', () => {
        var scopeValues,
            $element;

        scopeValues = {desk: undefined};

        $element = compileDirective(scopeValues);
        scope = $element.scope();
        scope.$digest();

        expect(macros.get).toHaveBeenCalled();
    });

    it('stores macro list in scope when macros data is fetched', () => {
        var macrosFromServer,
            scopeValues,
            $element;

        scopeValues = {desk: undefined};

        $element = compileDirective(scopeValues);
        scope = $element.scope();

        scope.macros = null;
        macrosFromServer = [{_id: 'foo'}, {_id: 'bar'}, {_id: 'baz'}];
        getMacrosDeferred.resolve(macrosFromServer);
        scope.$digest();

        expect(scope.macros).toEqual(macrosFromServer);
    });
});
