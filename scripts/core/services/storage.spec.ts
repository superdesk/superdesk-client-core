
describe('Storage', () => {
    beforeEach(() => {
        window.module('superdesk.core.services.storage');
        localStorage.clear();
    });

    it('uses local not session storage', inject((storage) => {
        storage.setItem('test', 'test');
        expect(localStorage.getItem('test')).toBe('"test"');
        expect(sessionStorage.getItem('test')).toBe(null);
    }));

    it('can clear', inject((storage) => {
        storage.setItem('test', 'test');
        storage.clear();
        expect(storage.getItem('test')).toBe(null);
    }));

    it('can save text', inject((storage) => {
        storage.setItem('test', 'text');
        expect(storage.getItem('test')).toBe('text');
    }));

    it('can save objects', inject((storage) => {
        var data = {id: 1, name: 'test'};

        storage.setItem('test', data);
        expect(storage.getItem('test')).toEqual(data);
    }));

    it('can save boolean', inject((storage) => {
        storage.setItem('true', true);
        expect(storage.getItem('true')).toBe(true);

        storage.setItem('false', false);
        expect(storage.getItem('false')).toBe(false);
    }));

    it('can remove item', inject((storage) => {
        storage.setItem('true', true);
        storage.removeItem('true');
        expect(storage.getItem('true')).toBe(null);
    }));
});
