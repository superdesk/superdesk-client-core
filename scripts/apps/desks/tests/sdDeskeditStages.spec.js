
/**
* Module with tests for the sdDeskeditStages directive
*
* @module sdDeskeditStages directive tests
*/
describe('sdDeskeditStages directive', () => {
    let macros,
        scope,
        getMacrosDeferred,
        getMacrosByDeskDeferred,
        $compile,
        $rootScope,
        macrosFromServer;

    macrosFromServer = [
        {_id: 'foo', action_type: 'direct'},
        {_id: 'bar', action_type: 'direct'},
        {_id: 'baz', action_type: 'interactive'}
    ];

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
        spyOn(macros, 'getByDesk').and.returnValue(getMacrosByDeskDeferred.promise);
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
        let html,
            newScope,
            $element;

        newScope = $rootScope.$new();
        angular.extend(newScope, scopeValues);

        html = '<div sd-deskedit-stages></div>';

        $element = $compile(html)(newScope);
        newScope.$digest();

        return $element;
    }

    it('fetches macros', () => {
        let scopeValues,
            $element;

        scopeValues = {
            desk: {
                edit: {name: 'Desk D'}
            }
        };

        $element = compileDirective(scopeValues);
        scope = $element.scope();
        scope.$digest();

        expect(macros.getByDesk).toHaveBeenCalledWith('Desk D', true);
    });

    it('fetches macros when creating a new desk', () => {
        let $element = compileDirective({desk: {}});

        scope = $element.scope();
        scope.$digest();

        expect(macros.get).toHaveBeenCalled();
    });

    it('stores macro list in scope where `action_type` is not `interactive`', () => {
        let scopeValues,
            $element;

        scopeValues = {
            desk: {
                edit: {name: 'Desk D'}
            }
        };

        $element = compileDirective(scopeValues);
        scope = $element.scope();

        scope.macros = null;
        getMacrosByDeskDeferred.resolve(macrosFromServer);
        scope.$digest();

        expect(scope.macros[0]).toEqual(macrosFromServer[0]);
        expect(scope.macros[1]).toEqual(macrosFromServer[1]);
        expect(scope.macros.length).toEqual(2);
    });
});
