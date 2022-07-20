import {describe, it} from 'mocha';
import {strict as assert} from 'assert';
import {computeStartEndTime} from './compute-start-end-time';
import {IRundownItemBase} from '../interfaces';
import {cloneDeep} from 'lodash';

const rundownItemsWithCorrectTimes: Array<IRundownItemBase> = [
    {
        title: 'one',
        duration: 60 * 15,
        planned_duration: 60 * 15,
        start_time: '13:00',
        end_time: '13:15',
    },
    {
        title: 'two',
        duration: 60 * 20,
        planned_duration: 60 * 20,
        start_time: '13:15',
        end_time: '13:35',
    },
    {
        title: 'three',
        duration: 60 * 30,
        planned_duration: 60 * 30,
        start_time: '13:35',
        end_time: '14:05',
    },
];

describe('utils.computeStartEndTime', () => {
    it('does not modify the array if times are already correct', () => {
        const showStart = '13:00';

        assert.deepEqual(
            computeStartEndTime(showStart, cloneDeep(rundownItemsWithCorrectTimes)),
            rundownItemsWithCorrectTimes,
        );
    });

    it('generates start/end times if not present', () => {
        const rundownItemsWithNoTimes: Array<IRundownItemBase> = [
            {
                title: 'one',
                duration: 60 * 15,
                planned_duration: 60 * 15,
            },
            {
                title: 'two',
                duration: 60 * 20,
                planned_duration: 60 * 20,
            },
            {
                title: 'three',
                duration: 60 * 30,
                planned_duration: 60 * 30,
            },
        ];

        const showStart = '13:00';

        assert.deepEqual(
            computeStartEndTime(showStart, cloneDeep(rundownItemsWithNoTimes)),
            rundownItemsWithCorrectTimes,
        );
    });

    it('fixes start/end times if incorrect', () => {
        const rundownItemsWithIncorrectTimes: Array<IRundownItemBase> = [
            {
                title: 'one',
                duration: 60 * 15,
                planned_duration: 60 * 15,
                start_time: '12:00',
                end_time: '12:15',
            },
            {
                title: 'two',
                duration: 60 * 20,
                planned_duration: 60 * 20,
                start_time: '12:15',
                end_time: '12:35',
            },
            {
                title: 'three',
                duration: 60 * 30,
                planned_duration: 60 * 30,
                start_time: '12:35',
                end_time: '13:05',
            },
        ];

        const showStart = '13:00';

        assert.deepEqual(
            computeStartEndTime(showStart, cloneDeep(rundownItemsWithIncorrectTimes)),
            rundownItemsWithCorrectTimes,
        );
    });
});
