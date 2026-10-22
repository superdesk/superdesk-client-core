import React from 'react';
import {shallow} from 'enzyme';
import {IArticle, IPackageItem, IPackageItemsValueOperational} from 'superdesk-api';
import {dispatchInternalEvent} from 'core/internal-events';
import {notify} from 'core/notify/notify';
import {Editor} from './editor';
import {getOpenPackageGroups} from './open-packages';

function ref(id: string): IPackageItem {
    return {
        residRef: id,
        type: 'text',
        headline: '',
        slugline: id,
        location: 'archive',
        renditions: {},
        itemClass: 'icls:text',
    };
}

const PACKAGE_ID = 'package-in-editor-spec';

const value: IPackageItemsValueOperational = [
    {id: 'main', refs: [ref('a')]},
    {id: 'story', refs: [ref('b')]},
];

function Container(props: {children?: React.ReactNode}) {
    return <div>{props.children}</div>;
}

function render(onChange: (value: IPackageItemsValueOperational) => void, readOnly = false) {
    return shallow(
        <Editor
            editorId="groups"
            container={Container}
            value={value}
            onChange={onChange}
            reinitialize={() => undefined}
            computeLatestEntity={() => undefined}
            readOnly={readOnly}
            language="en"
            config={{}}
            fieldId="groups"
            fieldsData={null}
            editorPreferences={undefined as never}
            onEditorPreferencesChange={() => undefined}
            getVocabularyItems={() => []}
            item={{_id: PACKAGE_ID, type: 'composite'} as IArticle}
        />,
    );
}

function addItems(packageId: string, groupId: string, itemIds: Array<string>) {
    dispatchInternalEvent('addItemsToPackageInAuthoringReact', {
        packageId,
        groupId,
        items: itemIds.map((_id) => ({_id, type: 'text'} as IArticle)),
    });
}

describe('package items editor', () => {
    it('adds items from "Add to current package" to the group they were sent to', () => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = render(onChange);

        addItems(PACKAGE_ID, 'story', ['x', 'y']);

        expect(onChange).toHaveBeenCalledTimes(1);

        const next: IPackageItemsValueOperational = onChange.calls.mostRecent().args[0];
        const [main, story] = next.map((group) => group.refs.map(({residRef}) => residRef));

        // the order within the group is covered in package-groups.spec.ts
        expect(main).toEqual(['a']);
        expect(story).toEqual(jasmine.arrayWithExactContents(['x', 'y', 'b']));

        wrapper.unmount();
    });

    it('ignores items sent to another package', () => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = render(onChange);

        addItems('another-package', 'main', ['x']);

        expect(onChange).not.toHaveBeenCalled();

        wrapper.unmount();
    });

    it('does not add an item that is in the package already', () => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = render(onChange);

        spyOn(notify, 'error');

        addItems(PACKAGE_ID, 'main', ['b']);

        expect(onChange).not.toHaveBeenCalled();
        expect(notify.error).toHaveBeenCalledWith('Item is already in this package.');

        wrapper.unmount();
    });

    it('does not add items while read-only', () => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = render(onChange, true);

        addItems(PACKAGE_ID, 'main', ['x']);

        expect(onChange).not.toHaveBeenCalled();

        wrapper.unmount();
    });

    it('sets a story label sent for an item of the package', () => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = render(onChange);

        dispatchInternalEvent('setPackageItemLabelInAuthoringReact', {
            packageId: PACKAGE_ID,
            itemId: 'b',
            label: 'breaking',
        });

        expect(onChange.calls.mostRecent().args[0][1].refs[0].label).toBe('breaking');

        wrapper.unmount();
    });

    it('exposes the groups, unsaved changes included, while the package is open', () => {
        const wrapper = render(() => undefined);

        expect(getOpenPackageGroups(PACKAGE_ID)).toBe(value);

        const changed: IPackageItemsValueOperational = [{id: 'main', refs: [ref('a'), ref('c')]}];

        wrapper.setProps({value: changed});

        expect(getOpenPackageGroups(PACKAGE_ID)).toBe(changed);

        wrapper.unmount();

        expect(getOpenPackageGroups(PACKAGE_ID)).toBe(null);
    });

    it('stops listening once closed', () => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = render(onChange);

        wrapper.unmount();
        addItems(PACKAGE_ID, 'main', ['x']);

        expect(onChange).not.toHaveBeenCalled();
    });
});
