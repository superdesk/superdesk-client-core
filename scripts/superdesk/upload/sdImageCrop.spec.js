'use strict';

describe('Image Crop', function() {

    beforeEach(module('superdesk.upload'));
    beforeEach(module('superdesk.imageFactory'));

    describe('sdImageCrop directive', function() {
        var scope, isoScope, fakeImg, $elm;
        var url = 'http://master.dev.superdesk.org/api/upload/55dbf92936b0650033518780/raw?_schema=http';
        var newUrl = 'http://master.dev.superdesk.org/api/upload/55ca5972b8e27e006385b6e3/raw?_schema=http';

        beforeEach(inject(function ($rootScope, imageFactory, $compile) {
            scope = $rootScope.$new();

            fakeImg = {};
            spyOn(imageFactory, 'makeInstance').and.callFake(function () {
                return fakeImg;
            });

            scope.boxWidth = 640;
            scope.boxHeight = 480;
            scope.src = url;
            scope.rendition = {height: 600, name: '4-3', width: 800};

            $elm = $compile('<div sd-image-crop data-src="src" data-show-Min-Size-Error="true"' +
                ' data-rendition="rendition" data-box-width="boxWidth"' +
                ' data-box-height="boxHeight"></div>')(scope);
        }));

        it('should be ok with given rendition', inject(function($compile) {
            $compile('<div sd-image-crop data-rendition="rendition"></div>')(scope);
        }));

        it('should fail when rendition missing', inject(function($compile) {
            var fn = function() {
                $compile('<div sd-image-crop></div>')(scope);
            };
            expect(fn).toThrow(new Error('sdImageCrop: attribute "rendition" is mandatory'));
        }));

        it('invokes watch', inject(function() {
            scope.$digest();
            expect(fakeImg.src).toEqual(url);
        }));

        it('observes changes', inject(function() {
            scope.$digest();

            isoScope = $elm.isolateScope();
            isoScope.src = newUrl;
            isoScope.$digest();

            expect(fakeImg.src).toEqual(newUrl);
        }));

        it('defines image onload handler', inject(function() {
            scope.$digest();

            isoScope = $elm.isolateScope();
            isoScope.src = newUrl;
            isoScope.$digest();

            expect(typeof fakeImg.onload).toEqual('function');
        }));

        describe('onload handler', function() {
            var mySpy;
            beforeEach(inject(function() {
                mySpy = jasmine.createSpy('mySpy');
                spyOn(window, '$').and.callFake(function () {
                    var fakeObj = {
                        'Jcrop': mySpy
                    };
                    return fakeObj;
                });
            }));

            it('executes with validation passed for default aspect-ratio(4:3)', inject(function() {
                scope.$digest();

                isoScope = $elm.isolateScope();
                isoScope.src = newUrl;
                isoScope.$digest();

                expect(typeof fakeImg.onload).toEqual('function');

                scope.$parent.preview = {};

                var handler = fakeImg.onload;
                handler.apply(fakeImg);
                expect(mySpy.calls.count()).toEqual(1);

                var retObj = mySpy.calls.argsFor(0);
                expect(retObj[0].aspectRatio).toBe(4 / 3);
                expect(retObj[0].boxWidth).toBe(640);
                expect(retObj[0].boxHeight).toBe(480);
                expect(retObj[0].minSize).toEqual([800, 600]);
            }));

            it('executes with validation passed for new aspect-ratio(21:9)', inject(function($compile) {
                scope.rendition = {height: 450, name: '21-9', width: 1050};
                scope.$digest();

                $elm = $compile('<div sd-image-crop data-src="src" data-show-Min-Size-Error="true"' +
                ' data-rendition="rendition" data-box-width="boxWidth"' +
                ' data-box-height="boxHeight"></div>')(scope);

                isoScope = $elm.isolateScope();
                isoScope.src = newUrl;
                isoScope.$digest();

                expect(typeof fakeImg.onload).toEqual('function');

                scope.$parent.preview = {};

                var handler = fakeImg.onload;
                handler.apply(fakeImg);
                expect(mySpy.calls.count()).toEqual(1);

                var retObj = mySpy.calls.argsFor(0);
                expect(retObj[0].aspectRatio).toBe(21 / 9);
                expect(retObj[0].boxWidth).toBe(640);
                expect(retObj[0].boxHeight).toBe(480);
                expect(retObj[0].minSize).toEqual([scope.rendition.width, scope.rendition.height]);
            }));

            it('executes with validation failed', inject(function($compile) {
                var fn = function() {
                    fakeImg.width = 800;
                    fakeImg.height = 500;
                    scope.$digest();

                    isoScope = $elm.isolateScope();
                    isoScope.src = newUrl;
                    isoScope.$digest();

                    expect(typeof fakeImg.onload).toEqual('function');

                    scope.$parent.preview = {};

                    var handler = fakeImg.onload;
                    handler.apply(fakeImg);
                    expect(mySpy.calls.count()).toEqual(1);
                };
                expect(fn).toThrow(new Error('sdImageCrop: Sorry, but image must be at least ' +
                    scope.rendition.width + 'x' + scope.rendition.height));
            }));
        });
    });
});
