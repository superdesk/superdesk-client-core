import {IArticle, IExposedFromAuthoring} from 'superdesk-api';
import {getAuthoringCosmeticActions} from '../authoring-integration-wrapper';
import {PrintPreviewButton} from '../toolbar-components/integration-wrapper';

function getActionsFor(type: IArticle['type']) {
    const exposed = {
        item: {_id: 'a', type} as IArticle,
        printPreview: jasmine.createSpy('printPreview'),
    } as unknown as IExposedFromAuthoring<IArticle>;

    return {exposed, actions: getAuthoringCosmeticActions(exposed)};
}

describe('authoring-react print preview', () => {
    ['text', 'picture'].forEach((type: IArticle['type']) => {
        it(`is offered for ${type} items, with its shortcut`, () => {
            const {exposed, actions} = getActionsFor(type);
            const printPreview = actions.find(({component}) => component === PrintPreviewButton);

            expect(printPreview).toBeDefined();

            printPreview.keyBindings['ctrl+shift+i']();

            expect(exposed.printPreview).toHaveBeenCalled();
        });
    });

    ['video', 'audio', 'graphic', 'composite'].forEach((type: IArticle['type']) => {
        it(`is not offered for ${type} items, nor its shortcut`, () => {
            const {actions} = getActionsFor(type);

            expect(actions.some(({component}) => component === PrintPreviewButton)).toBe(false);
            expect(actions.some(({keyBindings}) => keyBindings?.['ctrl+shift+i'] != null)).toBe(false);
        });
    });
});
