export function InsertFilter() {
    return function(input, location, addition) {
        location = location || input.length;
        addition = addition || '';

        return input.substr(0, location) + addition + input.substr(location);
    };
}

export function ScheduleFilter() {
    return function(input) {
        var schedule = '';
        if (_.isPlainObject(input)) {
            schedule += input.minutes && input.minutes > 0?
                input.minutes + (input.minutes > 1?' minutes':' minute'):'';
            schedule += schedule.length > 0?' ':'';
            schedule += input.seconds && input.seconds > 0?
                input.seconds + (input.seconds > 1?' seconds':' second'):'';
        }
        return schedule;
    };
}
