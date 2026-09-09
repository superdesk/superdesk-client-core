import React from 'react';
import {shallow} from 'enzyme';
import {IArticleSideWidget} from 'superdesk-api';
import {SideWidgetConfigurationProvider} from './side-widget-configuration';

function widget(_id: string, configuration: unknown): IArticleSideWidget {
    return {
        _id,
        label: _id,
        order: 1,
        icon: 'chat',
        component: (() => null) as any,
        configuration: {
            component: () => null,
            getInitialConfiguration: () => configuration,
        },
    };
}

describe('the configuration handed to a side widget', () => {
    // the panel renders the provider in the same position for every configurable widget, so
    // switching from one to another reuses this instance
    it('belongs to the widget the panel switched to, not to the previous one', () => {
        const children = jasmine.createSpy('children').and.returnValue(<div />);
        const first = widget('first', {sluglineMatch: 'EXACT'});
        const second = widget('second', {tags: []});

        const wrapper = shallow(
            <SideWidgetConfigurationProvider widget={first}>
                {children}
            </SideWidgetConfigurationProvider>,
        );

        expect(children.calls.mostRecent().args[0]).toEqual({sluglineMatch: 'EXACT'});

        wrapper.setProps({widget: second});

        expect(children.calls.mostRecent().args[0]).toEqual({tags: []});
    });

    it('survives a re-render of the same widget', () => {
        const children = jasmine.createSpy('children').and.returnValue(<div />);
        const only = widget('only', {sluglineMatch: 'EXACT'});

        const wrapper = shallow(
            <SideWidgetConfigurationProvider widget={only}>
                {children}
            </SideWidgetConfigurationProvider>,
        );
        const instance = wrapper.instance() as SideWidgetConfigurationProvider;

        instance.setState({configuration: {sluglineMatch: 'PREFIX'}});
        wrapper.setProps({widget: {...only}});

        expect(children.calls.mostRecent().args[0]).toEqual({sluglineMatch: 'PREFIX'});
    });
});
