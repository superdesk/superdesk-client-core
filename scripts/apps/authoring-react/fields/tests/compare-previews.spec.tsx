import React from 'react';
import {mount} from 'enzyme';
import {
    ICommonFieldConfig,
    IDateTimeFieldConfig,
    IDatelineFieldConfig,
} from 'superdesk-api';
import {Preview as DateTimePreview} from 'apps/authoring-react/fields/datetime/preview';
import {Difference as DateTimeDifference} from 'apps/authoring-react/fields/datetime/difference';
import {Preview as DatelinePreview} from 'apps/authoring-react/fields/dateline/preview';
import {Difference as DatelineDifference} from 'apps/authoring-react/fields/dateline/difference';
import {Difference as BooleanDifference} from 'apps/authoring-react/fields/boolean/difference';

/**
 * The datetime value is a `Date | null` and the dateline value is an object; both previously rendered
 * the raw value as a React child (a Date object / a plain object), which throws when the compare and
 * print-preview views walk every field. These mount the components with the real value shapes (no
 * mocks); a throw fails the mount outright.
 */
describe('authoring-react datetime/dateline preview and difference rendering', () => {
    const dtConfig: IDateTimeFieldConfig = {};
    const datelineConfig: IDatelineFieldConfig = {};
    const commonConfig: ICommonFieldConfig = {};

    describe('datetime <Preview />', () => {
        it('renders nothing when the datetime is null', () => {
            const wrapper = mount(<DateTimePreview item={{}} value={null} config={dtConfig} />);

            expect(wrapper.isEmptyRender()).toBe(true);
        });

        it('renders a formatted date string, not a Date object', () => {
            const wrapper = mount(
                <DateTimePreview item={{}} value={new Date('2020-06-15T10:30:00Z')} config={dtConfig} />,
            );

            expect(wrapper.text()).toContain('2020');
            expect(wrapper.text()).not.toContain('object');
        });
    });

    describe('datetime <Difference />', () => {
        it('renders both values formatted when they differ', () => {
            const wrapper = mount(
                <DateTimeDifference
                    config={dtConfig}
                    value1={new Date('2020-06-15T10:30:00Z')}
                    value2={new Date('2021-06-15T10:30:00Z')}
                />,
            );

            expect(wrapper.text()).toContain('2020');
            expect(wrapper.text()).toContain('2021');
            expect(wrapper.text()).not.toContain('object');
        });

        it('treats two equal datetimes as unchanged', () => {
            const wrapper = mount(
                <DateTimeDifference
                    config={dtConfig}
                    value1={new Date('2020-06-15T10:30:00Z')}
                    value2={new Date('2020-06-15T10:30:00Z')}
                />,
            );

            expect(wrapper.text()).toContain('2020');
            expect(wrapper.text()).not.toContain('object');
        });

        it('handles a null value on one side', () => {
            const wrapper = mount(
                <DateTimeDifference
                    config={dtConfig}
                    value1={null}
                    value2={new Date('2021-06-15T10:30:00Z')}
                />,
            );

            expect(wrapper.text()).toContain('2021');
        });
    });

    describe('dateline <Preview />', () => {
        it('renders nothing when the dateline is null', () => {
            const wrapper = mount(<DatelinePreview item={{}} value={null} config={datelineConfig} />);

            expect(wrapper.isEmptyRender()).toBe(true);
        });

        it('renders nothing when the dateline has no composed text', () => {
            const wrapper = mount(
                <DatelinePreview item={{}} value={{source: 'AP'}} config={datelineConfig} />,
            );

            expect(wrapper.isEmptyRender()).toBe(true);
        });

        it('renders the composed dateline text, not the object', () => {
            const wrapper = mount(
                <DatelinePreview
                    item={{}}
                    value={{text: 'BERLIN, June 15 AP -', source: 'AP'}}
                    config={datelineConfig}
                />,
            );

            expect(wrapper.text()).toContain('BERLIN, June 15 AP -');
            expect(wrapper.text()).not.toContain('object');
        });
    });

    describe('dateline <Difference />', () => {
        it('diffs the composed text of two datelines, not the objects', () => {
            const wrapper = mount(
                <DatelineDifference
                    config={commonConfig}
                    value1={{text: 'BERLIN, June 15 AP -'}}
                    value2={{text: 'PARIS, June 16 AP -'}}
                />,
            );

            expect(wrapper.text()).toContain('BERLIN, June 15 AP -');
            expect(wrapper.text()).toContain('PARIS, June 16 AP -');
            expect(wrapper.text()).not.toContain('object');
        });

        it('handles a null dateline on one side', () => {
            const wrapper = mount(
                <DatelineDifference
                    config={commonConfig}
                    value1={null}
                    value2={{text: 'PARIS, June 16 AP -'}}
                />,
            );

            expect(wrapper.text()).toContain('PARIS, June 16 AP -');
        });
    });

    describe('boolean <Difference />', () => {
        it('renders both labels when the value flips', () => {
            const wrapper = mount(
                <BooleanDifference config={commonConfig} value1={true} value2={false} />,
            );

            expect(wrapper.text()).toContain('Yes');
            expect(wrapper.text()).toContain('No');
        });

        it('treats an unchanged value as unchanged', () => {
            const wrapper = mount(
                <BooleanDifference config={commonConfig} value1={true} value2={true} />,
            );

            expect(wrapper.text()).toContain('Yes');
            expect(wrapper.text()).not.toContain('No');
        });

        it('distinguishes false from null', () => {
            const wrapper = mount(
                <BooleanDifference config={commonConfig} value1={null} value2={false} />,
            );

            expect(wrapper.text()).toContain('No');
        });
    });
});
