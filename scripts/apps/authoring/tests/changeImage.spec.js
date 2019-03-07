import _ from 'lodash';
import {ChangeImageController} from '../authoring/controllers/ChangeImageController';
import {gettext} from 'core/utils';

describe('authoring ChangeImageController', () => {
    let deployConfig = {
        getSync: function() {
            return {};
        },
    };

    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.core.notify'));
    beforeEach(window.module('superdesk.mocks'));

    beforeEach(window.module(($provide) => {
        $provide.constant('lodash', _);
    }));

    beforeEach(inject((notify) => {
        spyOn(notify, 'success').and.returnValue(null);
        spyOn(notify, 'error').and.returnValue(null);
    }));

    beforeEach(inject(($q, $rootScope) => {
        spyOn($rootScope, '$broadcast').and.callThrough();
    }));

    let scopeData = {
        locals: {
            data: {
                item: {
                    renditions: {
                        '4-3': {width: 796, height: 600},
                        original: {width: 2599, height: 1494},
                    },
                },
                isNew: true,
                showMetadataEditor: false,
                renditions: [{name: '4-3', width: 800, height: 600}],
            },
        },
    };

    describe('saveAreaOfInterest', () => {
        it('can notify error if crop is invalid', inject((api, $rootScope, $q, notify, config) => {
            let scope = angular.copy(scopeData);
            let croppingData = {
                CropRight: 10,
                CropLeft: 10,
                CropTop: 10,
                CropBottom: 10,
            };

            ChangeImageController(scope, notify, _, api, $rootScope, deployConfig, $q, config);
            scope.saveAreaOfInterest(croppingData);
            expect(notify.error).toHaveBeenCalledWith(
                gettext('Original size cannot be less than the required crop sizes.')
            );
        }));

        it('can generate picture crop using api save', inject((api, $rootScope, $q, notify, config) => {
            let scope = angular.copy(scopeData);
            let croppingData = {
                CropRight: 2500,
                CropLeft: 0,
                CropTop: 0,
                CropBottom: 1400,
            };

            spyOn(api, 'save').and.returnValue($q.when({}));

            ChangeImageController(scope, notify, _, api, $rootScope, deployConfig, $q, config);
            scope.saveAreaOfInterest(croppingData);

            expect(api.save).toHaveBeenCalledWith('picture_crop', {item: scope.data.item, crop: croppingData});
        }));

        it('can notify error if picture_crop fails', inject((api, $rootScope, $q, notify, config) => {
            let scope = angular.copy(scopeData);
            let croppingData = {
                CropRight: 2500,
                CropLeft: 0,
                CropTop: 0,
                CropBottom: 1400,
            };

            spyOn(api, 'save').and.returnValue($q.reject({data: {_message: 'Failed to call picture_crop.'}}));

            ChangeImageController(scope, notify, _, api, $rootScope, deployConfig, $q, config);
            scope.saveAreaOfInterest(croppingData);

            $rootScope.$digest();

            expect(notify.error).toHaveBeenCalledWith(
                gettext('Failed to save the area of interest: Failed to call picture_crop.')
            );

            expect(scope.loaderForAoI).toBeFalsy();
        }));

        it('can notify error if picture_renditions fails', inject((api, $rootScope, $q, notify, config) => {
            let scope = angular.copy(scopeData);
            let croppingData = {
                CropRight: 2500,
                CropLeft: 0,
                CropTop: 0,
                CropBottom: 1400,
            };

            spyOn(api, 'save').and.callFake((resource, dest, diff, parent, params) => {
                if (resource === 'picture_crop') {
                    return $q.when({
                        href: '',
                        width: 100,
                        height: 100,
                        _id: 1,
                        item: {renditions: {original: {}}},
                    });
                }
                return $q.reject({data: {_message: 'Failed to call picture_renditions.'}});
            });

            ChangeImageController(scope, notify, _, api, $rootScope, deployConfig, $q, config);
            scope.saveAreaOfInterest(croppingData);

            $rootScope.$digest();

            expect(notify.error).toHaveBeenCalledWith(
                gettext('Failed to save the area of interest: Failed to call picture_renditions.')
            );

            expect(scope.loaderForAoI).toBeFalsy();
            expect(api.save.calls.count()).toBe(2);
            expect(scope.data.isDirty).toBeTruthy();
        }));

        it('can save new area of interest', inject((api, $rootScope, $q, notify, config) => {
            let scope = angular.copy(scopeData);
            let croppingData = {
                CropRight: 2500,
                CropLeft: 0,
                CropTop: 0,
                CropBottom: 1400,
            };

            spyOn(api, 'save').and.callFake((resource, dest, diff, parent, params) => {
                if (resource === 'picture_crop') {
                    return $q.when({
                        href: '',
                        width: 100,
                        height: 100,
                        _id: 1,
                        item: {renditions: {original: {}}},
                    });
                }
                return $q.when({
                    renditions: {},
                });
            });

            ChangeImageController(scope, notify, _, api, $rootScope, deployConfig, $q, config);
            scope.saveAreaOfInterest(croppingData);

            $rootScope.$digest();

            expect(notify.error).not.toHaveBeenCalled();

            expect(scope.loaderForAoI).toBeFalsy();
            expect(api.save.calls.count()).toBe(2);
            expect(scope.data.isDirty).toBeTruthy();
            expect(scope.isAoISelectionModeEnabled).toBeFalsy();
            expect(scope.areaOfInterestData).toEqual({});
            expect(scope.loaderForAoI).toBeFalsy();

            expect($rootScope.$broadcast).toHaveBeenCalledWith('poiUpdate', {x: 0.5, y: 0.5});
        }));

        it('sets default poi if not defined', inject((api, $rootScope, $q, notify, config) => {
            if (config.features == null) {
                config.features = {};
            }
            config.features.validatePointOfInterestForImages = false;

            let scope = angular.copy(scopeData);

            ChangeImageController(scope, notify, _, api, $rootScope, deployConfig, $q, config);
            $rootScope.$digest();

            expect(scope.data.poi).toEqual({x: 0.5, y: 0.5});
            expect(scope.data.metadata.poi).toEqual({x: 0.5, y: 0.5});
        }));

        it('sets default poi if non defined, but don\'t save when crop validation is on',
            inject((api, $rootScope, $q, notify, config) => {
                if (config.features == null) {
                    config.features = {};
                }
                config.features.validatePointOfInterestForImages = true;

                let scope = angular.copy(scopeData);

                ChangeImageController(scope, notify, _, api, $rootScope, deployConfig, $q, config);
                $rootScope.$digest();

                expect(scope.data.poi).toEqual({x: 0.5, y: 0.5});
                expect(scope.data.metadata.poi).toBeFalsy();
            })
        );

        it('No error thrown if poi is specified', inject((api, $rootScope, $q, notify, config) => {
            let scope = angular.copy(scopeData);

            scope.resolve = () => true;
            spyOn(scope, 'resolve').and.returnValue(null);
            scope.locals.data.poi = {x: 0.5, y: 0.5};

            ChangeImageController(scope, notify, _, api, $rootScope, deployConfig, $q, config);
            scope.saveCrops();
            scope.done();
            $rootScope.$digest();

            expect(scope.resolve).toHaveBeenCalled();
            expect(notify.error).not.toHaveBeenCalled();
        }));
    });
});
