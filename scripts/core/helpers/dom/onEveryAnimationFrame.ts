export class OnEveryAnimationFrame {
    // only use this with callbacks which are not resource intensive(<5ms)
    // don't forget to `destroy` when finished

    lastTimer: number;

    constructor(callback) {
        this.lastTimer = 0; // dummy value for initial check
        this.loop(callback);
    }
    loop(callback) {
        callback();
        if (this.lastTimer != null) {
            this.lastTimer = window.requestAnimationFrame(() => {
                this.loop(callback);
            });
        }
    }
    destroy() {
        window.cancelAnimationFrame(this.lastTimer);
        this.lastTimer = null;
    }
}
