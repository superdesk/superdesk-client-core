describe('editor3.service', () => {
    beforeEach(window['module']('superdesk.core.editor3'));

    it('should implement editor2 find & replace interface', inject((editor3) => {
        [
            'selectNext',
            'selectPrev',
            'replace',
            'replaceAll',
            'setSettings',
            'render',
            'getActiveText',
        ].forEach((fn) => {
            expect(typeof editor3[fn]).toBe('function');
        });
    }));
});
