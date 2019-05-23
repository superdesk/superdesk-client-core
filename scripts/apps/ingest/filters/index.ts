import _ from 'lodash';

export function InsertFilter() {
    return function(input, location, addition = '') {
        let loc = location || input.length;

        return input.substr(0, loc) + addition + input.substr(loc);
    };
}

export function ScheduleFilter() {
    return function(input) {
        var schedule = '';

        if (_.isPlainObject(input)) {
            schedule += input.minutes && input.minutes > 0 ?
                input.minutes + (input.minutes > 1 ? ' minutes' : ' minute') : '';
            schedule += schedule.length > 0 ? ' ' : '';
            schedule += input.seconds && input.seconds > 0 ?
                input.seconds + (input.seconds > 1 ? ' seconds' : ' second') : '';
        }
        return schedule;
    };
}
