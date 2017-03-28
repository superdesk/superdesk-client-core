import {cropImage, insertImages} from '..';

describe('editor3.actions.toolbar', () => {
    beforeEach(window.module(($provide) => {
        $provide.service('superdesk', ($q) => ({
            intent: jasmine.createSpy().and.returnValue($q.when('image_list'))
        }));

        $provide.service('renditions', ($q) => ({
            crop: jasmine.createSpy().and.returnValue($q.when('cropped_image'))
        }));
    }));

    it('cropImage', inject((renditions, $rootScope) => {
        const dispatch = jasmine.createSpy('dispatcher');

        cropImage('key', {img: 'image_data'})(dispatch);

        $rootScope.$apply(); // settles promise

        expect(renditions.crop).toHaveBeenCalledWith('image_data');
        expect(dispatch).toHaveBeenCalledWith({
            type: 'TOOLBAR_UPDATE_IMAGE',
            payload: {entityKey: 'key', img: 'cropped_image'}
        });
    }));

    it('insertImages', inject((superdesk, $rootScope) => {
        const dispatch = jasmine.createSpy('dispatcher');

        insertImages()(dispatch);

        $rootScope.$apply();

        expect(superdesk.intent).toHaveBeenCalledWith('upload', 'media');
        expect(dispatch).toHaveBeenCalledWith({
            type: 'TOOLBAR_INSERT_IMAGES',
            payload: 'image_list'
        });
    }));
});
