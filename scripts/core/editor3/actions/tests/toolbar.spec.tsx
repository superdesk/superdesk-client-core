import {cropImage, insertMedia} from '..';

describe('editor3.actions.toolbar', () => {
    beforeEach(window['module'](($provide) => {
        $provide.service('superdesk', ($q) => ({
            intent: jasmine.createSpy().and.returnValue($q.when('media_list')),
        }));

        $provide.service('renditions', ($q) => ({
            crop: jasmine.createSpy().and.returnValue($q.when('cropped_image')),
        }));
    }));

    it('cropImage', inject((renditions, $rootScope) => {
        const dispatch = jasmine.createSpy('dispatcher');

        cropImage('key', {media: 'image_data'})(dispatch);

        $rootScope.$apply(); // settles promise

        expect(renditions.crop).toHaveBeenCalledWith('image_data', {});
        expect(dispatch).toHaveBeenCalledWith({
            type: 'TOOLBAR_UPDATE_IMAGE',
            payload: {entityKey: 'key', media: 'cropped_image'},
        });
    }));

    it('insertMedia', inject((superdesk, $rootScope) => {
        const dispatch = jasmine.createSpy('dispatcher');

        insertMedia()(dispatch);

        $rootScope.$apply();

        expect(superdesk.intent).toHaveBeenCalledWith('upload', 'media', undefined);
        expect(dispatch).toHaveBeenCalledWith({
            type: 'TOOLBAR_INSERT_MEDIA',
            payload: 'media_list',
        });
    }));
});
