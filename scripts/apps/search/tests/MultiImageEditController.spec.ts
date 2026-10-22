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

    it('keeps embedded metadata separate when images arrive asynchronously', inject(($rootScope, $controller) => {
        const $scope = $rootScope.$new();
        const first = {_id: 1, headline: 'First image', byline: 'First photographer', extra: {location: 'Paris'}};
        const second = {_id: 2, headline: 'Second image', byline: 'Second photographer', extra: {location: 'Prague'}};

        $scope.imagesOriginal = [second];
        $controller(MultiImageEditController, {$scope});
        $rootScope.$digest();
        expect($scope.metadata.headline).toBe('Second image');

        $scope.imagesOriginal = [second, first];
        $rootScope.$digest();
        expect($scope.images[0].headline).toBe('Second image');
        expect($scope.images[1]).toEqual({...first, selected: false});
        expect($scope.metadata.headline).toBe('Second image');
        $scope.selectAll();
        expect($scope.placeholder.headline).toBe('(multiple values)');
        expect($scope.isDirty()).toBe(false);
    }));

    it('limits edits to the current selection when more images arrive', inject(($rootScope, $controller) => {
        const $scope = $rootScope.$new();

        $scope.imagesOriginal = [{_id: 1, headline: 'First image', byline: 'First photographer'}];
        $controller(MultiImageEditController, {$scope});
        $rootScope.$digest();
        $scope.metadata.headline = 'Shared headline';
        $scope.onChange('headline');

        $scope.imagesOriginal = [
            ...$scope.imagesOriginal,
            {_id: 2, headline: 'Second image', byline: 'Second photographer'},
        ];
        $rootScope.$digest();
        expect($scope.images.map((image) => image.headline)).toEqual(['Shared headline', 'Second image']);
        expect($scope.images.map((image) => image.byline)).toEqual(['First photographer', 'Second photographer']);
        expect($scope.getSelectedImages().map((image) => image._id)).toEqual([1]);
        $scope.metadata.headline = 'Continued typing';
        $scope.onChange('headline');
        expect($scope.images[1].headline).toBe('Second image');
        $scope.selectAll();
        expect($scope.placeholder.headline).toBe('(multiple values)');
        $scope.metadata.headline = 'Intentional bulk edit';
        $scope.onChange('headline');
        expect($scope.images.map((image) => image.headline)).toEqual([
            'Intentional bulk edit', 'Intentional bulk edit',
        ]);
    }));

    it('preserves cleared and nested edits without applying them to later arrivals',
        inject(($rootScope, $controller) => {
            const $scope = $rootScope.$new();

            $scope.imagesOriginal = [{_id: 1, headline: 'First image', extra: {location: 'Paris'}}];
            $controller(MultiImageEditController, {$scope});
            $rootScope.$digest();
            $scope.metadata.headline = '';
            $scope.onChange('headline');
            $scope.metadata.extra = {location: 'Edited'};
            $scope.onChange('extra');
            $scope.imagesOriginal = [
                ...$scope.imagesOriginal,
                {_id: 2, headline: 'Second image', extra: {location: 'Prague'}},
            ];
            $rootScope.$digest();
            expect($scope.images.map((image) => image.headline)).toEqual(['', 'Second image']);
            expect($scope.images.map((image) => image.extra.location)).toEqual(['Edited', 'Prague']);
            $scope.images[1].extra.location = 'Individual edit';
            expect($scope.images[0].extra.location).toBe('Edited');
        }));

    it('selects the first ready batch but preserves deselection when later images arrive',
        inject(($rootScope, $controller) => {
            const $scope = $rootScope.$new();

            $scope.imagesOriginal = [];
            $controller(MultiImageEditController, {$scope});
            $rootScope.$digest();
            $scope.imagesOriginal = [{_id: 1}, {_id: 2}];
            $rootScope.$digest();
            expect($scope.getSelectedImages().length).toBe(2);
            $scope.unselectAll();
            $scope.imagesOriginal = [...$scope.imagesOriginal, {_id: 3}];
            $rootScope.$digest();
            expect($scope.getSelectedImages()).toEqual([]);
        }));

    it('selects upload items as they become ready until the selection changes',
        inject(($rootScope, $controller) => {
            const $scope = $rootScope.$new();

            $scope.isUpload = true;
            $scope.imagesOriginal = [];
            $controller(MultiImageEditController, {$scope});
            $rootScope.$digest();

            $scope.imagesOriginal = [{_id: 1}];
            $rootScope.$digest();
            expect($scope.getSelectedImages().map((image) => image._id)).toEqual([1]);

            $scope.imagesOriginal = [...$scope.imagesOriginal, {_id: 2}];
            $rootScope.$digest();
            expect($scope.getSelectedImages().map((image) => image._id)).toEqual([1, 2]);

            $scope.unselectAll();
            $scope.imagesOriginal = [...$scope.imagesOriginal, {_id: 3}];
            $rootScope.$digest();
            expect($scope.getSelectedImages()).toEqual([]);
        }));
});
