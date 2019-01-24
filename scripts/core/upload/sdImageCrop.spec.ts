
describe('Image Crop', () => {
    beforeEach(window.module('superdesk.core.upload'));
    beforeEach(window.module('superdesk.core.services.imageFactory'));

    describe('sdImageCrop directive', () => {
        var scope, isoScope, fakeImg, $elm, jcropApi;
        var url = 'http://master.dev.superdesk.org/api/upload/55dbf92936b0650033518780/raw?_schema=http';
        var newUrl = 'http://master.dev.superdesk.org/api/upload/55ca5972b8e27e006385b6e3/raw?_schema=http';

        beforeEach(inject(($rootScope, imageFactory, $compile) => {
            scope = $rootScope.$new();

            fakeImg = {};
            spyOn(imageFactory, 'makeInstance').and.callFake(() => fakeImg);

            scope.boxWidth = 640;
            scope.boxHeight = 480;
            scope.src = url;
            scope.rendition = {width: 800, height: 600, name: '4-3'};
            scope.original = {width: 900, height: 600};
            scope.cropData = {};
            $elm = $compile('<div sd-image-crop data-src="src" data-show-Min-Size-Error="true"' +
                ' data-original="original" ' +
                ' data-rendition="rendition" data-box-width="boxWidth"' +
                ' data-box-height="boxHeight" crop-data="cropData" data-on-change="onChange()"></div>')(scope);
        }));

        it('invokes watch', inject(() => {
            scope.$digest();
            expect(fakeImg.src).toEqual(url);
        }));

        it('observes changes', inject(() => {
            scope.$digest();

            isoScope = $elm.isolateScope();
            isoScope.src = newUrl;
            isoScope.$digest();

            expect(fakeImg.src).toEqual(newUrl);
        }));

        it('defines image onload handler', inject(() => {
            scope.$digest();

            isoScope = $elm.isolateScope();
            isoScope.src = newUrl;
            isoScope.$digest();

            expect(typeof fakeImg.onload).toEqual('function');
        }));

        describe('onload handler', () => {
            var mySpy;

            beforeEach(inject(() => {
                mySpy = spyOn($.fn, 'Jcrop');
            }));

            it('executes with validation passed for default aspect-ratio(4:3)', inject(() => {
                scope.$digest();

                isoScope = $elm.isolateScope();
                isoScope.src = newUrl;
                isoScope.$digest();

                expect(typeof fakeImg.onload).toEqual('function');

                var handler = fakeImg.onload;

                handler.apply(fakeImg);
                expect(mySpy.calls.count()).toEqual(1);

                var retObj = mySpy.calls.argsFor(0);

                expect(retObj[0].aspectRatio).toBe(4 / 3);
                expect(retObj[0].minSize).toEqual([800, 600]);
                expect(retObj[0].trueSize).toEqual([900, 600]);
                expect(retObj[0].setSelect).toEqual([50, 0, 850, 600]);
            }));

            it('executes with validation failed', inject(($compile) => {
                scope.original.width = 500;
                scope.$digest();

                isoScope = $elm.isolateScope();
                isoScope.src = newUrl;
                isoScope.$digest();

                expect(typeof fakeImg.onload).toEqual('function');

                var handler = fakeImg.onload;

                handler.apply(fakeImg);
                expect(mySpy.calls.count()).toEqual(0);
                expect($elm.text())
                    .toBe(
                        'Sorry, but image must be at least {{r.width}}x{{r.height}}, ' +
                        '(it is {{img.width}}x{{img.height}}).'
                    );
            }));

            it('calls onChange callback on change only', inject(() => {
                scope.onChange = jasmine.createSpy('onchange');
                // fake jcropApi
                jcropApi = {
                    setOptions: function() { /* no-op */ },
                    tellSelect: function() { /* no-op */ },
                    destroy: function() { /* no-op */ },
                };

                scope.$digest();

                var handler = fakeImg.onload;

                handler.apply(fakeImg);

                // no calls to onChange callback on Jcrop initialization
                expect(scope.onChange).not.toHaveBeenCalled();
                expect(scope.onChange.calls.count()).toBe(0);

                var coords = {x: 0, x2: 100, y: 0, y2: 100};

                var retObj = mySpy.calls.mostRecent().args;

                var callbackSpy = spyOn(jcropApi, 'setOptions');

                spyOn(jcropApi, 'tellSelect').and.returnValue(coords);

                var callbackHandler = retObj[1]; // handle Jcrop callback from $.fn.Jcrop

                callbackHandler.apply(jcropApi);
                expect(jcropApi.tellSelect).toHaveBeenCalled();

                var callbackResult = callbackSpy.calls.mostRecent().args;

                // calls onChange callback on selection
                callbackResult[0].onSelect(coords);
                expect(scope.onChange).toHaveBeenCalled();
                expect(scope.onChange.calls.count()).toBe(1);

                scope.onChange.calls.reset(); // clears calls count

                // no calls to onChange callback, when no change. (coords unchanged)
                callbackResult[0].onSelect(coords);
                expect(scope.onChange).not.toHaveBeenCalled();
                expect(scope.onChange.calls.count()).toBe(0);

                // calls onChange callback on change only (coords changed)
                coords = {x: 0, x2: 200, y: 0, y2: 200};
                callbackResult[0].onSelect(coords);
                expect(scope.onChange).toHaveBeenCalled();
                expect(scope.onChange.calls.count()).toBe(1);
            }));
        });
    });
});
