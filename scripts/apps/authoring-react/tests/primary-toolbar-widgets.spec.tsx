import React from 'react';
import {mount, shallow} from 'enzyme';
import {IArticle} from 'superdesk-api';
import {sdApi} from 'api';
import {
    getAuthoringPrimaryToolbarWidgets,
    getMultiEditPrimaryToolbarWidgets,
} from '../authoring-angular-integration';
import {MultiEditModal} from '../multi-edit-modal';
import {AuthoringIntegrationWrapper} from '../authoring-integration-wrapper';

const panelState = {active: false} as any;
const panelActions = {closePanel: () => undefined} as any;

/**
 * The publish control renders nothing for an item it can not act on, so counting widgets is not
 * enough on its own: it has to be mounted to tell an absent control from a withheld one.
 */
function rendersAnything(widget: {component: React.ComponentType<{entity: IArticle}>}): boolean {
    const item = {_id: 'a', type: 'text', state: 'in_progress', task: {desk: 'd', stage: 's'}} as IArticle;

    return mount(<widget.component entity={item} />).children().length > 0;
}

describe('authoring primary toolbar widgets', () => {
    it('offers the send to / publish control in normal authoring', () => {
        expect(getAuthoringPrimaryToolbarWidgets(panelState, panelActions).some(rendersAnything)).toBe(true);
    });

    it('offers no send to / publish control in the multi-edit variant', () => {
        expect(getMultiEditPrimaryToolbarWidgets().some(rendersAnything)).toBe(false);
    });

    it('gives multi-edit the same extension widgets as normal authoring', () => {
        const authoring = getAuthoringPrimaryToolbarWidgets(panelState, panelActions);

        // the publish control is the only difference between the two
        expect(getMultiEditPrimaryToolbarWidgets().length).toBe(authoring.length - 1);
    });

    /**
     * The two assertions above only pin what the functions return. This one pins that multi-edit
     * actually uses the publish-free one, which is the part a future edit would get wrong: without
     * it, pointing multi-edit back at the publishing toolbar leaves the suite green.
     *
     * Publishing from a multi-edit board is deliberately unsupported. The angular board offers only
     * Remove item and Save, and the panel could not be routed to the right editor anyway, because
     * `applicationState.articleInEditMode` holds a single id.
     */
    it('wires the multi-edit boards to the toolbar without publishing', () => {
        spyOn(sdApi.article, 'getWorkQueueItems').and.returnValue([]);

        const items = [{_id: 'a'}, {_id: 'b'}] as Array<IArticle>;
        const modal = shallow(<MultiEditModal initiallySelectedArticles={items} onClose={() => undefined} />);
        const boards = modal.find(AuthoringIntegrationWrapper);

        expect(boards.length).toBeGreaterThan(0);

        boards.forEach((board) => {
            expect(board.prop('getAuthoringPrimaryToolbarWidgets')).toBe(getMultiEditPrimaryToolbarWidgets);
        });
    });
});
