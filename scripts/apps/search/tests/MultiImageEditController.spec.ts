import {MultiImageEditController} from '../MultiImageEdit';

describe('multi image edit controller', () => {
    beforeEach(window.module('superdesk.core.translate'));
    beforeEach(window.module('superdesk.core.services.modal'));
    beforeEach(window.module('superdesk.apps.authoring'));

    it('asks for confirmatino when closing with some changes', inject((modal, $q, $rootScope, $controller) => {
        const data = [];
        const $scope = $rootScope.$new();

        $scope.imagesOriginal = data;

        $controller(MultiImageEditController, {$scope});

        spyOn(modal, 'confirm').and.returnValue($q.reject());
        $scope.$close = jasmine.createSpy('$close');

        $scope.onChange('headline');
        $scope.close();
        expect(modal.confirm).toHaveBeenCalled();
        $rootScope.$digest();
        expect($scope.$close).not.toHaveBeenCalled();
    }));

    it('resets dirty status on save', inject(($q, $rootScope, $controller, authoring) => {
        const item = {};
        const data = [item];
        const $scope = $rootScope.$new();

        $scope.imagesOriginal = data;
        $scope.saveHandler = () => $q.when();

        $controller(MultiImageEditController, {$scope});

        expect($scope.isDirty()).toBe(false);

        $scope.onChange('headline');
        expect($scope.isDirty()).toBe(true);

        $scope.save();
        $rootScope.$digest();
        expect($scope.isDirty()).toBe(false);
    }));
});
