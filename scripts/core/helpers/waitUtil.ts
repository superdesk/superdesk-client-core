export const waitUntil = (precondition, timeoutAt = 1000 * 60) => new Promise((resolve, reject) => {
    function checkNow() {
        if (precondition() === true) {
            window.clearInterval(interval);
            resolve();
            return true;
        }
    }

    let interval;

    if (checkNow() === true) {
        // make sure it doesn't register an interval if it resolves on the first go
        return;
    }

    interval = setInterval(checkNow, 100);
    setTimeout(() => {
        clearInterval(interval);
        reject('timed out while trying to resolve a service');
    }, timeoutAt);
});