
export function waitUntil(precondition: () => boolean, timeoutAt: number = 1000 * 60): Promise<void> {
    return new Promise((resolve, reject) => {
        function checkNow() {
            if (precondition() === true) {
                window.clearInterval(interval);
                resolve();
                return true;
            }

            return false;
        }

        let interval: number;

        if (checkNow() === true) {
            // make sure it doesn't register an interval if it resolves on the first go
            return;
        }

        interval = window.setInterval(checkNow, 100);
        window.setTimeout(() => {
            window.clearInterval(interval);
            reject('timed out while trying to resolve a service');
        }, timeoutAt);
    });
}
