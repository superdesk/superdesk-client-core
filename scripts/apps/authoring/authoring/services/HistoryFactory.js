/**
 * Watches an expression to keep history of its states
 * and binds ctrl-z and ctrl-y to undo/redo its states
 */
HistoryFactory.$inject = ['History', '$window', '$timeout'];
export function HistoryFactory(History, $window, $timeout) {
    var KeyOperations = {
        ['Z'.charCodeAt(0)]: History.undo,
        ['Y'.charCodeAt(0)]: History.redo,
    };

    return {
        watch: function(expression, scope) {
            $timeout(() => {
                History.watch(expression, scope);
            }, 0, false);
            var onHistoryKey = function(event, cb) {
                var modifier = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;

                if (modifier && KeyOperations[event.keyCode]) {
                    cb();
                }
            };
            var onHistoryKeydown = function(event) {
                onHistoryKey(event, () => {
                    event.preventDefault();
                    // action is on keydown becuase command key (event.metakey) on OSX is not detected on keyup events
                    // for some reason.
                    scope.$apply(() => {
                        KeyOperations[event.keyCode].bind(History)(expression, scope);
                    });
                });
            };
            var onHistoryKeyup = function(event) {
                onHistoryKey(event, () => {
                    event.preventDefault();
                });
            };

            angular.element($window).on('keydown', onHistoryKeydown);
            angular.element($window).on('keyup', onHistoryKeyup);
            scope.$on('$destroy', () => {
                angular.element($window).unbind('keydown', onHistoryKeydown);
                angular.element($window).unbind('keyup', onHistoryKeyup);
                History.forget(scope, expression);
            });
        },
    };
}

