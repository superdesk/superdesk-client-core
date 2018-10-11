

describe('ContentFiltersConfigCtrl', () => {
    var ctrl;

    beforeEach(window.module('superdesk.apps.content_filters'));

    beforeEach(inject(($controller) => {
        ctrl = $controller('ContentFiltersConfigCtrl', {});
    }));

    describe('on instantiation', () => {
        it('assigns the correct value to TEMPLATES_DIR variable', () => {
            expect(ctrl.TEMPLATES_DIR).toEqual(
                'scripts/apps/content-filters/views'
            );
        });

        it('initializes active tab name to "filters"', () => {
            expect(ctrl.activeTab).toEqual('filters');
        });
    });

    describe('changeTab() method', () => {
        it('changes the active tab name to given name', () => {
            ctrl.activeTab = 'foo';
            ctrl.changeTab('bar');
            expect(ctrl.activeTab).toEqual('bar');
        });
    });
});
