import React from 'react';
import {mount} from 'enzyme';
import {noop} from 'lodash';
import {VocabularyItemsViewEdit} from '../components/VocabularyItemsViewEdit';
import {s} from 'core/helpers/testUtils';

const getPromise = () => Promise.resolve({});

describe('vocabularies', () => {
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.templates-cache'));

    beforeEach(window.module(($provide) => {
        $provide.service('metadata', () => ({
            initialize: getPromise,
        }));
        $provide.service('relationsService', () => ({}));
        $provide.service('sortByNameFilter', () => ({}));
        $provide.service('$filter', () => () => (a) => a);
    }));

    it('can fetch vocabularies', inject((api, vocabularies, $q, $rootScope) => {
        var fixture = {foo: 'bar'};

        spyOn(api, 'getAll').and.returnValue($q.when(fixture));
        var result;

        vocabularies.getVocabularies().then(
            (vocabs) => {
                result = vocabs;
            },
        );
        $rootScope.$digest();
        expect(api.getAll).toHaveBeenCalledWith('vocabularies', {where: {type: 'manageable'}});
        expect(result).toBe(fixture);
        expect(vocabularies.vocabularies).toBe(fixture);
    }));

    it('convert values for qcode having integer type', () => {
        const items = [{name: 'foo', qcode: '1', is_active: true}];
        const schemaFields = [{key: 'name', required: true}, {key: 'qcode', type: 'integer'}];

        const wrapper = mount(
            (
                <VocabularyItemsViewEdit
                    items={items}
                    schemaFields={schemaFields}
                    newItemTemplate={{}}
                    setDirty={noop}
                    setItemsValid={noop}
                />
            ),
        );

        wrapper.setState({languages: []});

        const instance = wrapper.instance() as VocabularyItemsViewEdit;

        wrapper.update();

        const fakeEvent = {target: {value: '2'}};

        wrapper.find('input[type="number"]').simulate('change', fakeEvent);
        expect(instance.getItemsForSaving()[0].qcode).toBe(2);
    });

    describe('config controller', () => {
        beforeEach(inject((session) => {
            session.identity = {_id: 'user:1'};
        }));

        it('can sync changes in the list', inject(($controller, $rootScope) => {
            const scope = $rootScope.$new();

            scope.vocabularies = [{_id: 'foo', display_name: 'Foo'}];
            $controller('VocabularyConfig', {$scope: scope});

            scope.updateVocabulary({_id: 'foo', display_name: 'Bar'});
            expect(scope.vocabularies.length).toBe(1);
            expect(scope.vocabularies[0].display_name).toBe('Bar');

            scope.updateVocabulary({_id: 'new', display_name: 'New'});
            expect(scope.vocabularies.length).toBe(2);
        }));
    });

    describe('config modal', () => {
        describe('model', () => {
            it('being detected correctly', inject(($rootScope, $compile, $timeout) => {
                var scope = $rootScope.$new();

                scope.vocabulary = {items: [
                    {foo: 'flareon', bar: 'beedrill', is_active: true},
                    {bar: 'bellsprout', spam: 'sandslash', is_active: true},
                    {qux: 'quagsire', foo: 'frillish', corge: 'corfish', is_active: true},
                ]};
                scope.matchFieldTypeToTab = angular.noop;

                $compile('<div sd-vocabulary-config-modal></div>')(scope);
                $timeout.flush();

                expect(scope.model).toEqual(
                    {foo: null, bar: null, spam: null, qux: null, corge: null, is_active: null},
                );
            }));
        });

        describe('controller', () => {
            var scope;
            var testItem;

            beforeEach(inject(($rootScope, $controller) => {
                scope = $rootScope.$new();
                testItem = {foo: 'flareon', bar: 'beedrill', is_active: true};
                scope.vocabulary = {items: [testItem]};
                scope.closeVocabulary = jasmine.createSpy('close');
                scope.updateVocabulary = jasmine.createSpy('update');
                scope.matchFieldTypeToTab = angular.noop;
            }));

            it('can save vocabulary', inject((api, $q, $rootScope, metadata, $compile, $timeout) => {
                scope.vocabulary.items[0].foo = 'feraligatr';
                scope.vocabulary.items[0].bar = 'bayleef';
                scope.vocabulary.items[0].is_active = true;

                $compile('<div sd-vocabulary-config-modal></div>')(scope);
                $timeout.flush();

                spyOn(api, 'save').and.returnValue($q.when());
                spyOn(metadata, 'initialize').and.returnValue($q.when());
                scope.save();

                $rootScope.$digest();
                expect(api.save).toHaveBeenCalledWith(
                    'vocabularies',
                    {
                        items: [{foo: 'feraligatr', bar: 'bayleef', is_active: true}],
                    },
                    undefined,
                    undefined,
                    undefined,
                    {skipPostProcessing: true},
                );
                expect(metadata.initialize).toHaveBeenCalled();
            }));

            it('can validate crop_size vocabulary for minimum value(200)',
                inject((api, $q, $rootScope, metadata, $timeout, $compile) => {
                    scope.vocabulary._id = 'crop_sizes';
                    scope.vocabulary.items[0].name = '4-3';
                    scope.vocabulary.items[0].is_active = true;
                    scope.vocabulary.items[0].width = 200; // minimum 200 allowed
                    scope.vocabulary.items[0].height = 100; // minimum 200 allowed

                    $compile('<div sd-vocabulary-config-modal></div>')(scope);
                    $timeout.flush();

                    spyOn(api, 'save').and.returnValue($q.when());
                    spyOn(metadata, 'initialize').and.returnValue($q.when());
                    scope.save();

                    $rootScope.$digest();
                    expect(scope.errorMessage).toBe(
                        'Minimum height and width should be greater than or equal to 200',
                    );
                    expect(api.save).not.toHaveBeenCalled();
                    expect(metadata.initialize).toHaveBeenCalled();
                }));

            it('validates items according to schema fields', (done) => {
                const items = [{name: '', qcode: ''}];
                const schemaFields = [{key: 'name', required: true}, {key: 'qcode', required: true}];
                const waitForDebouncing = 300;

                const onSetItemValidSpy = jasmine.createSpy('onSetItemValidSpy');

                const wrapper = mount(
                    (
                        <VocabularyItemsViewEdit
                            items={items}
                            schemaFields={schemaFields}
                            newItemTemplate={{}}
                            setDirty={noop}
                            setItemsValid={onSetItemValidSpy}
                        />
                    ),
                );

                wrapper.setState({languages: []});

                wrapper.update();

                wrapper.find(s(['vocabulary-items-view-edit', 'field--name']))
                    .simulate('change', {target: {value: 'abc'}});

                setTimeout(() => {
                    expect(onSetItemValidSpy).toHaveBeenCalledWith(false);

                    wrapper.find(s(['vocabulary-items-view-edit', 'field--qcode']))
                        .simulate('change', {target: {value: 'abc'}});

                    setTimeout(() => {
                        expect(onSetItemValidSpy).toHaveBeenCalledWith(true);

                        done();
                    }, waitForDebouncing);
                }, waitForDebouncing);
            });

            it('can remove an item', () => {
                const wrapper = mount(
                    (
                        <VocabularyItemsViewEdit
                            items={[{name: 'foo', qcode: 'bar'}]}
                            schemaFields={[
                                {key: 'name'},
                                {key: 'qcode'},
                            ]}
                            newItemTemplate={{}}
                            setDirty={noop}
                            setItemsValid={noop}
                        />
                    ),
                );

                wrapper.setState({languages: []});

                const instance = wrapper.instance() as VocabularyItemsViewEdit;

                expect(instance.getItemsForSaving().length).toBe(1);

                wrapper.find(s(['vocabulary-items-view-edit', 'remove']))
                    .simulate('click');

                expect(instance.getItemsForSaving().length).toBe(0);
            });
        });
    });
});
