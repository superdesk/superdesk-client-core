import React from 'react';
import {OrderedMap} from 'immutable';
import {mount} from 'enzyme';
import {IPackageItem, IVocabulary} from 'superdesk-api';
import {sdApi} from 'api';
import {getPackageItemRequest, PackageItemCard} from './package-item-card';

const packageItem: IPackageItem = {
    residRef: 'item-1',
    type: 'text',
    headline: 'Headline from the ref',
    slugline: 'slugline-from-ref',
    location: 'archive',
    renditions: {},
    itemClass: 'icls:text',
    label: 'story-label:featured',
};

describe('package item card', () => {
    describe('getPackageItemRequest', () => {
        it('requests the version the package points to', () => {
            expect(getPackageItemRequest({...packageItem, _current_version: 3})).toEqual(
                {path: '/archive/item-1', urlParams: {version: 3}},
            );
        });

        it('requests the current version when the package points to none', () => {
            expect(getPackageItemRequest(packageItem)).toEqual({path: '/archive/item-1', urlParams: undefined});
        });

        it('requests an ingest item from ingest', () => {
            expect(getPackageItemRequest({...packageItem, location: 'ingest'})).toEqual({path: '/ingest/item-1'});
        });
    });

    it('shows what the ref knows about an item that can not be loaded', () => {
        spyOn(sdApi.vocabularies, 'getAll').and.returnValue(OrderedMap<string, IVocabulary>([[
            'package-story-labels',
            {_id: 'package-story-labels', items: [{qcode: 'story-label:featured', name: 'Featured'}]} as IVocabulary,
        ]]));
        spyOn(PackageItemCard.prototype, 'fetchItem').and.callFake(function(this: PackageItemCard) {
            this.setState({error: true});
        });

        const wrapper = mount(<PackageItemCard packageItem={packageItem} readOnly={false} />);

        expect(wrapper.find('[data-test-id="package-items"]').prop('data-test-value')).toBe('slugline-from-ref');
        expect(wrapper.text()).toContain('Headline from the ref');
        expect(wrapper.find('[data-test-id="package-item-error"]').exists()).toBe(true);
        expect(wrapper.find('[data-test-id="package-item-label"]').text()).toContain('Featured');

        wrapper.unmount();
    });
});
