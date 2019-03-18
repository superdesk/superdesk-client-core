describe('modal service', () => {
    beforeEach(window.module('superdesk.core.services.modal'));

    beforeEach(inject(($templateCache) => {
        $templateCache.put('scripts/core/views/confirmation-modal.html', require('./../views/confirmation-modal.html'));
    }));

    // modal should never try to translate its contents,
    // it breaks rendering of such strings. everything should be translated before
    // calling modal service
    it('does not translate modal header/body', inject((modal, gettextCatalog, $rootScope) => {
        spyOn(gettextCatalog, 'getString').and.returnValue('translated');

        modal.confirm('body', 'header', 'ok', 'cancel', 'foo');
        $rootScope.$digest();

        expect(angular.element(document.body).find('.modal__header').text().trim()).toBe('header');
        expect(angular.element(document.body).find('.modal__body').text().trim()).toBe('body');
    }));
});
