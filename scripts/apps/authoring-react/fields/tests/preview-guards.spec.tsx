import React from 'react';
import {mount} from 'enzyme';
import {
    IDropdownConfigManualSource,
    IDropdownConfigRemoteSource,
    IUrlsFieldConfig,
} from 'superdesk-api';
import {Preview as UrlsPreview} from 'apps/authoring-react/fields/urls/preview';
import {PreviewManualEntry} from 'apps/authoring-react/fields/dropdown/dropdown-manual-entry/preview';
import {PreviewRemoteSource} from 'apps/authoring-react/fields/dropdown/dropdown-remote-source/preview';

/**
 * These previews are rendered by the print-preview and compare-versions views for every field in a
 * content profile, including fields the article never filled in. The values below mirror the shapes
 * that actually reach the components at runtime (the field types do not capture null/undefined or
 * stale references), which is why no value is mocked. A render that throws fails the mount outright.
 */
describe('authoring-react field previews tolerate missing and stale values', () => {
    describe('<UrlsPreview />', () => {
        const config: IUrlsFieldConfig = {};

        it('renders nothing when there is no value', () => {
            const wrapper = mount(<UrlsPreview item={{}} value={null as any} config={config} />);

            expect(wrapper.isEmptyRender()).toBe(true);
        });

        it('renders nothing for an empty list', () => {
            const wrapper = mount(<UrlsPreview item={{}} value={[]} config={config} />);

            expect(wrapper.isEmptyRender()).toBe(true);
        });

        it('renders a url that has no description', () => {
            const wrapper = mount(
                <UrlsPreview item={{}} value={[{url: 'http://example.com'}]} config={config} />,
            );

            expect(wrapper.text()).toContain('http://example.com');
        });

        it('renders both url and description when present', () => {
            const wrapper = mount(
                <UrlsPreview
                    item={{}}
                    value={[{url: 'http://example.com', description: 'Example'}]}
                    config={config}
                />,
            );

            expect(wrapper.text()).toContain('http://example.com');
            expect(wrapper.text()).toContain('Example');
        });
    });

    describe('<PreviewManualEntry />', () => {
        const config: IDropdownConfigManualSource = {
            source: 'manual-entry',
            type: 'text',
            options: [{id: 'a', label: 'Option A'}],
            roundCorners: false,
            multiple: true,
        };

        it('renders nothing when there is no value', () => {
            const wrapper = mount(<PreviewManualEntry item={{}} value={null} config={config} />);

            expect(wrapper.text()).toBe('');
        });

        it('ignores a value referencing an option no longer in the config', () => {
            const wrapper = mount(
                <PreviewManualEntry item={{}} value={['removed-option-id']} config={config} />,
            );

            expect(wrapper.text()).toBe('');
        });

        it('renders the label of a known option', () => {
            const wrapper = mount(<PreviewManualEntry item={{}} value={['a']} config={config} />);

            expect(wrapper.text()).toContain('Option A');
        });

        it('renders only the known options when a value mixes known and stale ids', () => {
            const wrapper = mount(
                <PreviewManualEntry item={{}} value={['a', 'removed-option-id']} config={config} />,
            );

            expect(wrapper.text()).toContain('Option A');
        });
    });

    describe('<PreviewRemoteSource />', () => {
        const config: IDropdownConfigRemoteSource = {
            source: 'remote-source',
            searchOptions: () => undefined,
            getLabel: (item: {name: string}) => item.name,
            getId: (item: {id: string}) => item.id,
            multiple: true,
        };

        it('renders nothing when there is no value', () => {
            const wrapper = mount(<PreviewRemoteSource item={{}} value={null} config={config} />);

            expect(wrapper.isEmptyRender()).toBe(true);
        });

        it('renders a single value', () => {
            const wrapper = mount(
                <PreviewRemoteSource item={{}} value={{id: '1', name: 'Remote A'}} config={config} />,
            );

            expect(wrapper.text()).toContain('Remote A');
        });

        it('renders every value in a list', () => {
            const wrapper = mount(
                <PreviewRemoteSource
                    item={{}}
                    value={[{id: '1', name: 'Remote A'}, {id: '2', name: 'Remote B'}]}
                    config={config}
                />,
            );

            expect(wrapper.text()).toContain('Remote A');
            expect(wrapper.text()).toContain('Remote B');
        });
    });
});
