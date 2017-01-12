/**
 * @ngdoc service
 * @module superdesk.core.editor3
 * @name EditorEvents
 * @description Allows components to register as listeners to various editor events,
 * such as the right click event.
 */
export default new class EditorEvents {
    constructor() {
        this._rightClickListeners = [];

        this.onRightClick = this.onRightClick.bind(this);
        this.triggerRightClick = this.triggerRightClick.bind(this);
    }

    /**
     * @ngdoc method
     * @name Editor3#onRightClick
     * @param {Function} fn The function to call when the right click even occurs.
     * @description Registers a function to be called when the right click event occurs.
     * The function will receive a set of props as a parameter.
     * @returns {Function} Returns a function that can be called to de-register the
     * listener.
     */
    onRightClick(fn) {
        this._rightClickListeners.push(fn);
        return removeLast(this._rightClickListeners);
    }

    /**
     * @ngdoc method
     * @name Editor3#triggerRightClick
     * @param {Object} props Properties to pass to each listener.
     * @description Triggers all right click listeners and passes the given props.
     */
    triggerRightClick(props) {
        this._rightClickListeners.forEach((fn) => fn(props));
    }
}();

/**
 * @param {Array} arr Array to remove from.
 * @returns {Function} Function that removes the last item of the array when called.
 * @description Returns a function that removes the last item that was added
 * into the given array.
 * @private
 */
function removeLast(arr) {
    const i = arr.length - 1;

    return () => {
        arr.splice(i, 1);
    };
}
