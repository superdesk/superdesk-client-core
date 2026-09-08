import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {noop} from 'lodash';
import {GenericFormFieldType} from '../interfaces/form';
import {getFormFieldComponent} from '../form-field';
import {ISelectAsyncOption, ISelectAsyncParameters} from '../input-types/select-async';

const MODELS: Array<ISelectAsyncOption> = [
    {id: 'gpt-4o', label: 'gpt-4o'},
    {id: 'gpt-4o-mini', label: 'gpt-4o-mini'},
];

interface IMountOptions {
    type: GenericFormFieldType;
    field: string;
    componentParameters: ISelectAsyncParameters;
    value?: any;
    onChange?: (value: any) => void;
    formValues?: {[key: string]: any};
    previewOutput?: boolean;
}

let container: HTMLDivElement;
let mountedWrappers: Array<ReactWrapper>;

function mountField(options: IMountOptions): ReactWrapper {
    const Component = getFormFieldComponent(options.type);

    const wrapper = mount(
        <Component
            formField={{
                type: options.type,
                field: options.field,
                component_parameters: options.componentParameters,
            }}
            formValues={options.formValues ?? {}}
            disabled={false}
            value={options.value}
            issues={[]}
            previewOutput={options.previewOutput ?? false}
            onChange={options.onChange ?? noop}
        />,
        {attachTo: container},
    );

    mountedWrappers.push(wrapper);

    return wrapper;
}

function mountModelPicker(
    componentParameters: ISelectAsyncParameters,
    value?: string,
    onChange?: (value: string) => void,
): ReactWrapper {
    return mountField({
        type: GenericFormFieldType.selectAsync,
        field: 'default_model',
        componentParameters,
        value,
        onChange,
    });
}

function mountModelListPicker(
    componentParameters: ISelectAsyncParameters,
    value?: Array<string>,
    onChange?: (value: Array<string>) => void,
): ReactWrapper {
    return mountField({
        type: GenericFormFieldType.selectMultipleAsync,
        field: 'available_models',
        componentParameters,
        value,
        onChange,
    });
}

function openDropdown(wrapper: ReactWrapper, allowMultiple: boolean) {
    const openButtonSelector = allowMultiple ? 'button.tags-input__add-button' : 'button.tags-input__overlay-button';

    wrapper.find(openButtonSelector).simulate('click');
    wrapper.update();
}

function getOfferedOptionLabels(wrapper: ReactWrapper): Array<string> {
    return wrapper.find('[data-test-id="option"]').map((option) => option.text());
}

function getSelectedLabels(wrapper: ReactWrapper): Array<string> {
    return wrapper.find('[data-test-id="item"]').map((item) => item.text());
}

function countLoadingIndicators(wrapper: ReactWrapper, field: string): number {
    return wrapper.find(`[data-test-id="gform-loading--${field}"]`).length;
}

function getPreviewText(wrapper: ReactWrapper, field: string): string {
    return wrapper.find(`div[data-test-id="gform-output--${field}"]`).text();
}

/**
 * Options taken from a shortlist held by another form field, the shape the AI provider form uses
 * for its default model picker.
 */
function getShortlistParameters(): ISelectAsyncParameters & {getOptions: jasmine.Spy} {
    return {
        getOptions: jasmine.createSpy('getOptions').and.callFake((formValues) => Promise.resolve(
            (formValues.available_models as Array<string>).map((id) => ({id, label: id})),
        )),
        dependentFields: ['available_models'],
    };
}

interface IDeferredOptions {
    promise: Promise<Array<ISelectAsyncOption>>;
    resolve: (options: Array<ISelectAsyncOption>) => void;
}

function createDeferredOptions(): IDeferredOptions {
    let resolve!: (options: Array<ISelectAsyncOption>) => void;
    const promise = new Promise<Array<ISelectAsyncOption>>((resolveOptions) => {
        resolve = resolveOptions;
    });

    return {promise, resolve};
}

describe('selectAsync form field', () => {
    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        mountedWrappers = [];
    });

    afterEach(() => {
        mountedWrappers.forEach((wrapper) => wrapper.unmount());
        container.remove();
    });

    it('offers the options returned by getOptions', (done) => {
        const wrapper = mountModelPicker({getOptions: () => Promise.resolve(MODELS)});

        setTimeout(() => {
            wrapper.update();
            openDropdown(wrapper, false);

            expect(getOfferedOptionLabels(wrapper)).toEqual(['gpt-4o', 'gpt-4o-mini']);

            done();
        });
    });

    it('reports the picked option as the value', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = mountModelPicker({getOptions: () => Promise.resolve(MODELS)}, undefined, onChange);

        setTimeout(() => {
            wrapper.update();
            openDropdown(wrapper, false);

            wrapper.find('[data-test-id="option"]').at(1).simulate('click');

            expect(onChange).toHaveBeenCalledWith('gpt-4o-mini');

            done();
        });
    });

    it('narrows the options down to those matching the search term', (done) => {
        const wrapper = mountModelPicker({getOptions: () => Promise.resolve(MODELS)});

        setTimeout(() => {
            wrapper.update();
            openDropdown(wrapper, false);

            wrapper.find('input[data-test-id="filter-input"]').simulate('change', {target: {value: 'mini'}});
            wrapper.update();

            expect(getOfferedOptionLabels(wrapper)).toEqual(['gpt-4o-mini']);

            done();
        });
    });

    it('shows a stored value the options do not offer', (done) => {
        const wrapper = mountModelPicker({getOptions: () => Promise.resolve(MODELS)}, 'retired-model');

        setTimeout(() => {
            wrapper.update();

            expect(getSelectedLabels(wrapper)).toEqual(['retired-model']);

            done();
        });
    });

    it('keeps the current value and does not change it when getOptions rejects', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = mountModelPicker(
            {getOptions: () => Promise.reject(new Error('provider unreachable'))},
            'stored-model',
            onChange,
        );

        setTimeout(() => {
            wrapper.update();

            expect(wrapper.find('input').prop('value')).toBe('stored-model');
            expect(wrapper.find('[data-test-id="gform-message--default_model"]').length).toBe(1);
            expect(onChange).not.toHaveBeenCalled();

            done();
        });
    });

    it('lets the value be typed by hand when getOptions rejects', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = mountModelPicker(
            {getOptions: () => Promise.reject(new Error('provider unreachable'))},
            'stored-model',
            onChange,
        );

        setTimeout(() => {
            wrapper.update();

            wrapper.find('input').simulate('change', {target: {value: 'typed-model'}});

            expect(onChange).toHaveBeenCalledWith('typed-model');

            done();
        });
    });

    it('drops a value picked in this session once a dependent field change stops offering it', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const componentParameters = getShortlistParameters();

        const wrapper = mountField({
            type: GenericFormFieldType.selectAsync,
            field: 'default_model',
            componentParameters,
            value: 'gpt-4o',
            onChange,
            formValues: {available_models: ['gpt-4o', 'gpt-4o-mini']},
        });

        setTimeout(() => {
            // the operator picking another model from the options of the current shortlist
            wrapper.setProps({value: 'gpt-4o-mini'});
            wrapper.setProps({formValues: {available_models: ['gpt-4o']}});

            setTimeout(() => {
                expect(onChange).toHaveBeenCalledWith('');

                done();
            });
        });
    });

    it('keeps the stored value when a dependent field change stops offering it', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const componentParameters = getShortlistParameters();

        const wrapper = mountField({
            type: GenericFormFieldType.selectAsync,
            field: 'default_model',
            componentParameters,
            value: 'gpt-4o',
            onChange,
            formValues: {available_models: ['gpt-4o', 'gpt-4o-mini']},
        });

        setTimeout(() => {
            wrapper.setProps({formValues: {available_models: ['gpt-4o-mini']}});

            setTimeout(() => {
                expect(componentParameters.getOptions).toHaveBeenCalledTimes(2);
                expect(onChange).not.toHaveBeenCalled();

                done();
            });
        });
    });

    it('keeps a value the options still offer after a dependent field changed', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const componentParameters = getShortlistParameters();

        const wrapper = mountField({
            type: GenericFormFieldType.selectAsync,
            field: 'default_model',
            componentParameters,
            value: 'gpt-4o-mini',
            onChange,
            formValues: {available_models: ['gpt-4o', 'gpt-4o-mini']},
        });

        setTimeout(() => {
            wrapper.setProps({formValues: {available_models: ['gpt-4o-mini']}});

            setTimeout(() => {
                expect(componentParameters.getOptions).toHaveBeenCalledTimes(2);
                expect(onChange).not.toHaveBeenCalled();

                done();
            });
        });
    });

    it('shows a loading indicator and no interactive picker while the options are being fetched', (done) => {
        const {promise, resolve} = createDeferredOptions();
        const wrapper = mountModelPicker({getOptions: () => promise}, 'gpt-4o');

        expect(countLoadingIndicators(wrapper, 'default_model')).toBe(1);
        expect(wrapper.find('[data-test-id="open-popover"]').length).toBe(0);
        expect(wrapper.find('input').length).toBe(0);

        resolve(MODELS);

        setTimeout(() => {
            wrapper.update();

            expect(countLoadingIndicators(wrapper, 'default_model')).toBe(0);

            openDropdown(wrapper, false);

            expect(getOfferedOptionLabels(wrapper)).toEqual(['gpt-4o', 'gpt-4o-mini']);

            done();
        });
    });

    it('shows the loading indicator again while a dependent field change is refetched', (done) => {
        const fetches = [createDeferredOptions(), createDeferredOptions()];
        let started = 0;

        const wrapper = mountField({
            type: GenericFormFieldType.selectAsync,
            field: 'default_model',
            componentParameters: {
                getOptions: () => fetches[started++].promise,
                dependentFields: ['available_models'],
            },
            formValues: {available_models: ['gpt-4o']},
        });

        fetches[0].resolve(MODELS);

        setTimeout(() => {
            wrapper.update();

            expect(countLoadingIndicators(wrapper, 'default_model')).toBe(0);

            wrapper.setProps({formValues: {available_models: ['gpt-4o-mini']}});
            wrapper.update();

            expect(countLoadingIndicators(wrapper, 'default_model')).toBe(1);
            expect(wrapper.find('[data-test-id="open-popover"]').length).toBe(0);

            fetches[1].resolve([{id: 'gpt-4o-mini', label: 'gpt-4o-mini'}]);

            setTimeout(() => {
                wrapper.update();

                expect(countLoadingIndicators(wrapper, 'default_model')).toBe(0);

                done();
            });
        });
    });

    it('keeps the loading indicator up when a superseded fetch answers before the latest one', (done) => {
        const fetches = [createDeferredOptions(), createDeferredOptions()];
        let started = 0;

        const wrapper = mountField({
            type: GenericFormFieldType.selectAsync,
            field: 'default_model',
            componentParameters: {
                getOptions: () => fetches[started++].promise,
                dependentFields: ['available_models'],
            },
            formValues: {available_models: ['gpt-4o']},
        });

        wrapper.setProps({formValues: {available_models: ['gpt-4o-mini']}});

        fetches[0].resolve(MODELS);

        setTimeout(() => {
            wrapper.update();

            expect(countLoadingIndicators(wrapper, 'default_model')).toBe(1);

            fetches[1].resolve([{id: 'gpt-4o-mini', label: 'gpt-4o-mini'}]);

            setTimeout(() => {
                wrapper.update();

                expect(countLoadingIndicators(wrapper, 'default_model')).toBe(0);

                done();
            });
        });
    });

    it('offers the options of the latest fetch when an earlier one resolves after it', (done) => {
        const fetches = [createDeferredOptions(), createDeferredOptions()];
        let started = 0;

        const wrapper = mountField({
            type: GenericFormFieldType.selectAsync,
            field: 'default_model',
            componentParameters: {
                getOptions: () => fetches[started++].promise,
                dependentFields: ['available_models'],
            },
            formValues: {available_models: ['gpt-4o']},
        });

        wrapper.setProps({formValues: {available_models: ['gpt-4o-mini']}});

        fetches[1].resolve([{id: 'gpt-4o-mini', label: 'gpt-4o-mini'}]);
        fetches[0].resolve([{id: 'gpt-4o', label: 'gpt-4o'}]);

        setTimeout(() => {
            wrapper.update();
            openDropdown(wrapper, false);

            expect(getOfferedOptionLabels(wrapper)).toEqual(['gpt-4o-mini']);

            done();
        });
    });

    it('previews the stored value without listing the options', () => {
        const getOptions = jasmine.createSpy('getOptions').and.returnValue(Promise.resolve(MODELS));

        const wrapper = mountField({
            type: GenericFormFieldType.selectAsync,
            field: 'default_model',
            componentParameters: {getOptions},
            value: 'gpt-4o',
            previewOutput: true,
        });

        expect(getPreviewText(wrapper, 'default_model')).toBe('gpt-4o');
        expect(getOptions).not.toHaveBeenCalled();
    });
});

describe('selectMultipleAsync form field', () => {
    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        mountedWrappers = [];
    });

    afterEach(() => {
        mountedWrappers.forEach((wrapper) => wrapper.unmount());
        container.remove();
    });

    it('offers the options returned by getOptions', (done) => {
        const wrapper = mountModelListPicker({getOptions: () => Promise.resolve(MODELS)}, []);

        setTimeout(() => {
            wrapper.update();
            openDropdown(wrapper, true);

            expect(getOfferedOptionLabels(wrapper)).toEqual(['gpt-4o', 'gpt-4o-mini']);

            done();
        });
    });

    it('narrows the options down to those matching the search term', (done) => {
        const wrapper = mountModelListPicker({getOptions: () => Promise.resolve(MODELS)}, []);

        setTimeout(() => {
            wrapper.update();
            openDropdown(wrapper, true);

            wrapper.find('input[data-test-id="filter-input"]').simulate('change', {target: {value: 'mini'}});
            wrapper.update();

            expect(getOfferedOptionLabels(wrapper)).toEqual(['gpt-4o-mini']);

            done();
        });
    });

    it('adds the picked option to the values already selected', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = mountModelListPicker({getOptions: () => Promise.resolve(MODELS)}, ['gpt-4o'], onChange);

        setTimeout(() => {
            wrapper.update();
            openDropdown(wrapper, true);

            wrapper.find('[data-test-id="option"]').at(1).simulate('click');

            expect(onChange).toHaveBeenCalledWith(['gpt-4o', 'gpt-4o-mini']);

            done();
        });
    });

    it('shows a loading indicator and no interactive picker while the options are being fetched', (done) => {
        const {promise, resolve} = createDeferredOptions();
        const wrapper = mountModelListPicker({getOptions: () => promise}, ['gpt-4o']);

        expect(countLoadingIndicators(wrapper, 'available_models')).toBe(1);
        expect(wrapper.find('button.tags-input__add-button').length).toBe(0);
        expect(getSelectedLabels(wrapper)).toEqual([]);

        resolve(MODELS);

        setTimeout(() => {
            wrapper.update();

            expect(countLoadingIndicators(wrapper, 'available_models')).toBe(0);

            openDropdown(wrapper, true);

            expect(getOfferedOptionLabels(wrapper)).toEqual(['gpt-4o', 'gpt-4o-mini']);

            done();
        });
    });

    it('shows the stored values read only and does not change them when getOptions rejects', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = mountModelListPicker(
            {getOptions: () => Promise.reject(new Error('provider unreachable'))},
            ['gpt-4o', 'stored-model'],
            onChange,
        );

        setTimeout(() => {
            wrapper.update();

            expect(getSelectedLabels(wrapper)).toEqual(['gpt-4o', 'stored-model']);
            expect(wrapper.find('[data-test-id="gform-message--available_models"]').length).toBe(1);
            expect(wrapper.find('[data-test-id="remove"]').length).toBe(0);
            expect(onChange).not.toHaveBeenCalled();

            done();
        });
    });

    it('previews the stored values without listing the options', () => {
        const getOptions = jasmine.createSpy('getOptions').and.returnValue(Promise.resolve(MODELS));

        const wrapper = mountField({
            type: GenericFormFieldType.selectMultipleAsync,
            field: 'available_models',
            componentParameters: {getOptions},
            value: ['gpt-4o', 'gpt-4o-mini'],
            previewOutput: true,
        });

        expect(getPreviewText(wrapper, 'available_models')).toBe('gpt-4o, gpt-4o-mini');
        expect(getOptions).not.toHaveBeenCalled();
    });
});
