export function EmbeddedFilter() {
    return function(input) {
        var output = {};

        for (var i in input) {
            if (input.hasOwnProperty(i)) {
                if (!/^embedded/.test(i)) {
                    output[i] = input[i];
                }
            }
        }
        return output;
    };
}
