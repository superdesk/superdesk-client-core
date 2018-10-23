import _ from 'lodash';

LockService.$inject = ['$q', 'api', 'session', 'privileges', 'notify'];
export function LockService($q, api, session, privileges, notify) {
    /**
     * Lock an item
     */
    this.lock = function lock(item, force, action) {
        if (!item.lock_user && item._editable || force) {
            return api.save('archive_lock', {}, {lock_action: action}, item).then((_lock) => {
                _.extend(item, _lock);
                item._locked = true;
                item.lock_user = session.identity._id;
                item.lock_session = session.sessionId;
                item.lock_action = action || 'edit';
                return item;
            }, (err) => {
                const msg = _.get(err, 'data._message') ? gettext('Error: ' + err.data._message) :
                    gettext('Failed to get a lock on the item!');

                notify.error(msg);
                item._locked = false;
                item._editable = false;
                return item;
            });
        }

        item._locked = this.isLockedInCurrentSession(item);
        return $q.when(item);
    };

    /**
     * Unlock an item
     */
    this.unlock = function unlock(item) {
        return api('archive_unlock', item).save({})
            .then((lock) => {
                _.extend(item, lock);
                item._locked = false;
                return item;
            }, (err) => item);
    };

    /**
     * Test if an item is locked by some other session, so not editable
     *
     * @param {Object} item
     * @return {Boolean}
     */
    this.isLocked = function isLocked(item) {
        if (!item) {
            return false;
        }

        return !!item.lock_user && !this.isLockedInCurrentSession(item);
    };

    function getLockedUserId(item) {
        return !!item.lock_user && item.lock_user._id || item.lock_user;
    }

    /**
     * Test if an item is locked in current session
     *
     * @param {Object} item
     * @return {Boolean}
     */
    this.isLockedInCurrentSession = function(item) {
        return !!item.lock_session && item.lock_session === session.sessionId;
    };

    /**
     * Test if an item is locked by me, different session session
     *
     * @param {Object} item
     * @return {Boolean}
     */
    this.isLockedByMe = function isLockedByMe(item) {
        var userId = getLockedUserId(item);

        return !!userId && userId === session.identity._id;
    };

    /**
    * can unlock the item or not.
    */
    this.can_unlock = function canUnlock(item) {
        if (this.isLockedByMe(item)) {
            return true;
        }

        return item.state === 'draft' ? false : privileges.privileges.unlock;
    };
}
