import extension from './extension';
import {CONTENT_LISTS_PAGE_URL, CONTENT_LISTS_PRIVILEGE} from './constants';
import {ContentListsPage} from './page';
import {superdeskMock} from './tests/superdesk-mock';

describe('extension activation', () => {
    it('contributes the content lists page when the user has the privilege', (done) => {
        const privilegeSpy = spyOn(superdeskMock, 'hasPrivilege').and.returnValue(true);

        extension.activate(null as never).then((result) => {
            expect(privilegeSpy).toHaveBeenCalledWith(CONTENT_LISTS_PRIVILEGE);

            const pages = result.contributions?.pages ?? [];

            expect(pages.length).toBe(1);
            expect(pages[0].title).toBe('Content lists');
            expect(pages[0].url).toBe(CONTENT_LISTS_PAGE_URL);
            expect(pages[0].component).toBe(ContentListsPage);

            done();
        });
    });

    it('contributes nothing without the privilege', (done) => {
        spyOn(superdeskMock, 'hasPrivilege').and.returnValue(false);

        extension.activate(null as never).then((result) => {
            expect(result.contributions).toBeUndefined();

            done();
        });
    });
});
