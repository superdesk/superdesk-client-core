export function DashboardCard() {
    return {
        link: function(scope, elem) {
            var p = elem.parent();
            var maxW = p.parent().width();
            var marginW = parseInt(elem.css('margin-left'), 10) + parseInt(elem.css('margin-right'), 10);
            var newW = p.outerWidth() + elem.outerWidth() + marginW;

            if (newW < maxW) {
                p.outerWidth(newW);
            }
        },
    };
}
