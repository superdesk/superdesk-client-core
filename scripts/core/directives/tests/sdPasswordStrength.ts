
describe('sdPasswordStrength', () => {
    var $compile, $rootScope, compileDirective;

    beforeEach(window.module('gettext'));
    beforeEach(window.module('superdesk.core.directives.passwordStrength'));

    beforeEach(inject((_$compile_, _$rootScope_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        compileDirective = function compileDirective(scopeValues) {
            var html = '<input type="password" ng-model="pwd" sd-password-strength>';
            var newScope = $rootScope.$new();

            angular.extend(newScope, scopeValues);
            var el = $compile(html)(newScope);

            newScope.$digest();

            return el;
        };
    }));

    it('should insert strength indicator after input', () => {
        var $el = compileDirective();

        expect($el.next().hasClass('password-strength')).toBeTruthy();
    });

    it('should start of with strength as "Short" if empty', () => {
        var $el = compileDirective();

        expect($el.next()
            .find('.label')
            .text(),
        ).toBe('Short');
    });

    it('should start of with correct strength when model is pre-populated', () => {
        var $el = compileDirective({pwd: 'abcdE123'});

        expect($el.next()
            .find('.label')
            .text(),
        ).toBe('OK');
    });

    it('should update strength when model changes', () => {
        var $el = compileDirective();
        var $scope = $el.scope();
        var label = $el.next().find('.label');

        expect(label.text()).toBe('Short');

        $scope.pwd = '123456789';
        $scope.$digest();

        expect(label.text()).toBe('Weak');
    });

    it('should update strength as input progresses', () => {
        var $el = compileDirective();
        var label = $el.next().find('.label');
        var $scope = $el.scope();

        expect(label.text()).toBe('Short');

        $scope.pwd = 'abcdefgh';
        $scope.$digest();
        expect(label.text()).toBe('Weak');

        $scope.pwd = $scope.pwd + 'A';
        $scope.$digest();
        expect(label.text()).toBe('Better');

        $scope.pwd = $scope.pwd + '1';
        $scope.$digest();
        expect(label.text()).toBe('OK');

        $scope.pwd = $scope.pwd + '@';
        $scope.$digest();
        expect(label.text()).toBe('Strong');
    });

    it('should invalidate model when password is not good enough', () => {
        var $el = compileDirective({pwd: 'abcd'});
        var ctrl = $el.controller('ngModel');

        expect(ctrl.$invalid).toBeTruthy();
    });

    it('should validate model when password becomes good enough', () => {
        var $el = compileDirective({pwd: 'abcd'});
        var $scope = $el.scope();
        var ctrl = $el.controller('ngModel');

        expect(ctrl.$invalid).toBeTruthy();

        $scope.pwd = $scope.pwd + '@123';
        $scope.$digest();
        expect(ctrl.$valid).toBeTruthy();
    });
});
