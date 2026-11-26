import React from 'react';
import {shallow} from 'enzyme';
import {IArticle} from 'superdesk-api';
import {WithArticles} from './with-articles';

type IRequestOptions = {path: string; urlParams?: {[key: string]: any}};

describe('WithArticles', () => {
    const draft = {_id: 'draft-1', state: 'in_progress'} as IArticle;

    // `/search` serves a published item from the `published` repo, which matches its archive id on `item_id` only
    const published = {_id: 'published-1', state: 'published'} as IArticle;

    function fakeSearch(options: {urlParams?: {[key: string]: any}}): Promise<any> {
        const filters = JSON.stringify(JSON.parse(options.urlParams.source).query);
        const matches = (field: string, id: string) => filters.includes(`{"terms":{"${field}":[`)
            && new RegExp(`"${field}":\\[[^\\]]*"${id}"`).test(filters);

        return Promise.resolve({
            _items: [
                ...(matches('_id', draft._id) ? [draft] : []),
                ...(matches('item_id', published._id) ? [published] : []),
            ],
        });
    }

    it('loads a published item along with an unpublished one', (done) => {
        const children = jasmine.createSpy('children').and.returnValue(<div />);
        const wrapper = shallow(
            <WithArticles ids={[draft._id, published._id]}>{children}</WithArticles>,
            {disableLifecycleMethods: true},
        );
        const instance = wrapper.instance() as WithArticles;

        spyOn(instance.asyncHelpers, 'httpRequestJsonLocal').and.callFake(fakeSearch);

        instance.fetchItems();

        setTimeout(() => {
            wrapper.update();

            expect(wrapper.find('SmoothLoaderOuter').prop('loading')).toBe(false);
            expect(instance.state.items.keySeq().toArray()).toEqual([draft._id, published._id]);

            done();
        });
    });

    it('finishes loading when an item can\'t be found, and leaves only that item out', (done) => {
        const missingId = 'deleted-1';
        const children = jasmine.createSpy('children').and.returnValue(<div />);
        const wrapper = shallow(
            <WithArticles ids={[draft._id, missingId]}>{children}</WithArticles>,
            {disableLifecycleMethods: true},
        );
        const instance = wrapper.instance() as WithArticles;

        spyOn(instance.asyncHelpers, 'httpRequestJsonLocal').and.callFake((options: IRequestOptions) => (
            options.path === '/search'
                ? fakeSearch(options)
                : Promise.reject({_status: 'ERR', _error: {code: 404}})
        ));

        instance.fetchItems();

        setTimeout(() => {
            wrapper.update();

            expect(wrapper.find('SmoothLoaderOuter').prop('loading')).toBe(false);

            (wrapper.find('SmoothLoaderOuter').prop('children') as () => JSX.Element)();

            expect(children).toHaveBeenCalledWith([draft]);

            done();
        });
    });

    it('keeps loading when an item fails to load for a reason other than 404', (done) => {
        const failingId = 'unreachable-1';
        const children = jasmine.createSpy('children').and.returnValue(<div />);
        const wrapper = shallow(
            <WithArticles ids={[draft._id, failingId]}>{children}</WithArticles>,
            {disableLifecycleMethods: true},
        );
        const instance = wrapper.instance() as WithArticles;

        spyOn(instance.asyncHelpers, 'httpRequestJsonLocal').and.callFake((options: IRequestOptions) => (
            options.path === '/search'
                ? fakeSearch(options)
                : Promise.reject({_status: 'ERR', _error: {code: 500}})
        ));

        instance.fetchItems();

        setTimeout(() => {
            wrapper.update();

            expect(instance.state.items.has(failingId)).toBe(false);
            expect(wrapper.find('SmoothLoaderOuter').prop('loading')).toBe(true);

            done();
        });
    });

    it('reads an item that /search does not return from archive', (done) => {
        const notIndexed = {_id: 'not-indexed-1', state: 'in_progress'} as IArticle;
        const children = jasmine.createSpy('children').and.returnValue(<div />);
        const wrapper = shallow(
            <WithArticles ids={[notIndexed._id]}>{children}</WithArticles>,
            {disableLifecycleMethods: true},
        );
        const instance = wrapper.instance() as WithArticles;

        spyOn(instance.asyncHelpers, 'httpRequestJsonLocal').and.callFake((options: IRequestOptions) => (
            options.path === '/search'
                ? fakeSearch(options)
                : Promise.resolve(options.path === `/archive/${notIndexed._id}` ? notIndexed : null)
        ));

        instance.fetchItems();

        setTimeout(() => {
            expect(instance.state.items.get(notIndexed._id)).toBe(notIndexed);

            done();
        });
    });
});
