export function SplitFilter() {
    return function(input = '') {
        var out = '';

        for (var i = 0; i < input.length; i++) {
            if (input.charAt(i) === input.charAt(i).toUpperCase()) {
                out = out + ' ';
            }

            out = out + input.charAt(i);
        }

        return out;
    };
}
