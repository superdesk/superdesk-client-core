import {IPackageItem} from 'superdesk-api';
import {authoringReactViewEnabled, setAuthoringReact} from 'appConfig';
import {addInternalEventListener} from 'core/internal-events';
import {
    removeOpenPackageGroups,
    setOpenPackageGroups,
} from 'apps/authoring-react/fields/package-items/open-packages';

describe('packages service', () => {
    beforeEach(window.module('superdesk.apps.packaging'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    it('can get reference for an item', inject((packages) => {
        var item = {headline: 'foo', type: 'text', _id: 'foo:1'};
        var ref = packages.getReferenceFor(item);

        expect(ref.type).toBe(item.type);
        expect(ref.residRef).toBe(item._id);
        expect(ref.headline).toBe(item.headline);
    }));

    describe('with authoring-react', () => {
        const openPackage = {
            _id: 'open-package',
            type: 'composite',
            groups: [{id: 'root', refs: [{idRef: 'main'}]}, {id: 'main', refs: []}],
        };

        let authoringReactWasEnabled: boolean;

        beforeEach(inject((authoringWorkspace) => {
            authoringReactWasEnabled = authoringReactViewEnabled;
            setAuthoringReact(true);
            spyOn(authoringWorkspace, 'getItem').and.returnValue(openPackage);
        }));

        afterEach(() => {
            setAuthoringReact(authoringReactWasEnabled);
            removeOpenPackageGroups(openPackage._id);
        });

        it('sends "Add to current" to the open package', inject((packages, $rootScope) => {
            const received = [];
            const removeListener = addInternalEventListener(
                'addItemsToPackageInAuthoringReact',
                (event) => received.push(event.detail),
            );

            spyOn($rootScope, '$broadcast');

            packages.addPackageGroupItem('story', {_id: 'item'});
            removeListener();

            expect(received).toEqual([{packageId: 'open-package', groupId: 'story', items: [{_id: 'item'}]}]);
            expect($rootScope.$broadcast).not.toHaveBeenCalledWith('package:addItems', jasmine.anything());
        }));

        it('sends a story label to the open package', inject((packages) => {
            const received = [];
            const removeListener = addInternalEventListener(
                'setPackageItemLabelInAuthoringReact',
                (event) => received.push(event.detail),
            );

            packages.setItemLabel({_id: 'item'}, {qcode: 'breaking', name: 'Breaking'});
            packages.setItemLabel({_id: 'item'}, null);
            removeListener();

            expect(received).toEqual([
                {packageId: 'open-package', itemId: 'item', label: 'breaking'},
                {packageId: 'open-package', itemId: 'item', label: null},
            ]);
        }));

        it('reads the groups of the open package, not the item it was opened with', inject((packages) => {
            const ref = {residRef: 'item', label: 'breaking'} as IPackageItem;

            setOpenPackageGroups(openPackage._id, [{id: 'main', refs: [ref]}]);

            expect(packages.isAdded(openPackage, {_id: 'item'})).toBe(true);
            expect(packages.isAdded(openPackage, {_id: 'other-item'})).toBe(false);
            expect(packages.isSetItemLabel({_id: 'item'}, {qcode: 'breaking'})).toBe(true);
            expect(packages.isSetItemLabel({_id: 'item'}, null)).toBe(false);
        }));
    });
});
