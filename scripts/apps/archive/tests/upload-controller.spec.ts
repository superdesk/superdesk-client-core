import {UploadController} from '../controllers/UploadController';
import {sdApi} from 'api';

describe('upload controller staging', () => {
    beforeEach(() => {
        spyOn(sdApi.navigation, 'isPersonalSpace').and.returnValue(true);
    });

    function staged(status = 'processing', metadataStatus = 'ready', meta = {}) {
        return {_id: 'staged-id', _etag: 'etag', status, metadata_status: metadataStatus, meta};
    }

    function setup() {
        const listeners = {};
        const scope = {
            $applyAsync: (callback) => callback(),
            $on: (event, callback) => listeners[event] = callback,
            resolve: jasmine.createSpy('resolve'),
            reject: jasmine.createSpy('reject'),
            imagesMetadata: [],
            pendingItems: [],
            items: [],
            processing: false,
            failed: false,
            saving: false,
            removing: false,
            addFiles: null,
            save: null,
            cancel: null,
            onRemoveItem: null,
        };
        const timers = [];
        const timeout = Object.assign(
            (callback) => {
                const timer = {callback};

                timers.push(timer);
                return timer;
            },
            {cancel: jasmine.createSpy('cancel')},
        );
        let respond;
        let onProgress;
        let uploadStarted;
        const upload = {start: () => {
            const response = new Promise((resolve) => respond = resolve);

            return {then: (success, failure, progress) => {
                onProgress = progress;
                uploadStarted();
                return response.then(success, failure);
            }};
        }};
        const save = jasmine.createSpy('save').and.returnValue(Promise.resolve({_id: 'archive-id'}));
        const api = Object.assign(
            () => ({url: () => Promise.resolve('/upload_staging'), save}),
            {
                archive: {getHeaders: () => ({})},
                find: jasmine.createSpy('find').and.callFake(() => Promise.resolve(staged('processing', 'pending'))),
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
                remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve()),
            },
        );
        const notify = {error: jasmine.createSpy('error'), warning: jasmine.createSpy('warning')};
        const q = {
            all: (values) => Promise.all(values),
            reject: (reason) => Promise.reject(reason),
            defer: () => {
                let resolve;
                let reject;
                const promise = new Promise((res, rej) => {
                    resolve = res;
                    reject = rej;
                });

                return {promise, resolve, reject};
            },
        };

        UploadController(scope, q, upload, api, {addTaskToArticle: jasmine.createSpy('addTaskToArticle')},
            {identity: {_id: 'user', byline: 'User'}}, {}, notify, {}, {}, timeout);

        async function add(
            response = staged('processing', 'pending'),
            type = 'audio/mpeg',
            cancel = false,
            uploading = () => undefined,
        ) {
            const started = new Promise<void>((resolve) => uploadStarted = resolve);
            const adding = scope.addFiles([new File(['binary'], 'media', {type})]);

            await started;
            uploading();
            if (cancel) {
                scope.cancel();
            }
            respond({data: response});
            await adding;
            await scope.items[0]?.refresh;
        }

        async function event(response, name = 'upload_staging:updated') {
            api.find.and.returnValue(Promise.resolve(response));
            listeners[name]({}, {user: 'user', staged_id: 'staged-id'});
            await scope.items[0]?.refresh;
        }

        return {
            scope, api, save, notify, timers, timeout, listeners, add, event,
            progress: (loaded, total) => onProgress({loaded, total}),
        };
    }

    it('waits for metadata and uses websocket refreshes without polling or overwriting edits', async () => {
        const {scope, api, timers, add, event} = setup();

        await add();
        expect(scope.imagesMetadata).toEqual([]);
        expect(api.find.calls.count()).toBe(1);
        expect(timers.length).toBe(1); // Deadline only, no repeated polling timer.
        await event(staged('processing', 'ready', {headline: 'Embedded'}));
        expect(scope.imagesMetadata[0].headline).toBe('Embedded');
        scope.imagesMetadata[0].headline = 'Edited';
        await event(staged('ready', 'ready', {headline: 'Embedded'}));
        expect(scope.imagesMetadata[0].headline).toBe('Edited');
    });

    it('shows upload progress then a pending metadata preview without initializing the editor', async () => {
        const {scope, add, event, progress} = setup();

        await add(staged('processing', 'pending'), 'audio/mpeg', false, () => {
            expect(scope.pendingItems.length).toBe(1);
            expect(scope.pendingItems[0].file.name).toBe('media');
            expect(scope.pendingItems[0].staged).toBeUndefined();
            progress(45, 100);
            expect(scope.pendingItems[0].progress).toBe(45);
            expect(scope.imagesMetadata.length).toBe(0);
        });
        expect(scope.pendingItems.length).toBe(1);
        expect(scope.pendingItems[0].staged.metadata_status).toBe('pending');
        expect(scope.imagesMetadata.length).toBe(0);
        await event(staged('processing', 'ready', {headline: 'Extracted'}));
        expect(scope.pendingItems.length).toBe(0);
        expect(scope.imagesMetadata[0].headline).toBe('Extracted');
    });

    it('allows removal while waiting for metadata', async () => {
        const {scope, api, add} = setup();

        await add();
        await scope.onRemoveItem(scope.pendingItems[0].meta);
        expect(scope.pendingItems.length).toBe(0);
        expect(scope.items.length).toBe(0);
        expect(api.remove).not.toHaveBeenCalled();
    });

    it('removes an upload from the UI while its staging request is in flight', async () => {
        const {scope, api, add} = setup();
        let removing;

        await add(staged(), 'audio/mpeg', false, () => {
            removing = scope.onRemoveItem(scope.pendingItems[0].meta);
            expect(scope.items.length).toBe(0);
        });
        await removing;
        expect(api.remove).not.toHaveBeenCalled();
        expect(scope.items.length).toBe(0);
        expect(scope.processing).toBe(false);
    });

    it('accepts Upload while renditions run and commits exactly once on ready', async () => {
        const {scope, save, add, event} = setup();

        await add();
        await event(staged('processing', 'ready', {headline: 'Embedded'}));
        const saving = scope.save();

        await Promise.resolve();
        expect(scope.saving).toBe(true);
        expect(save).not.toHaveBeenCalled();
        await event(staged('ready'));
        await saving;
        expect(save.calls.count()).toBe(1);
        expect(scope.resolve).toHaveBeenCalled();
    });

    it('always requests uncached processing snapshots', async () => {
        const {api, add, event} = setup();

        await add();
        await event(staged('processing'));
        await event(staged('ready'));
        expect(api.find.calls.count()).toBe(3);
        for (const args of api.find.calls.allArgs()) {
            expect(args).toEqual(['upload_staging', 'staged-id', {}, false]);
        }
    });

    it('waits for the digest to apply a snapshot before starting the next refresh', async () => {
        const {scope, api, add, listeners} = setup();

        await add();
        const callbacks = [];

        scope.$applyAsync = (callback) => callbacks.push(callback);
        api.find.and.returnValue(Promise.resolve(staged('ready')));
        listeners['upload_staging:updated']({}, {user: 'user', staged_id: 'staged-id'});
        listeners['upload_staging:updated']({}, {user: 'user', staged_id: 'staged-id'});
        for (let i = 0; i < 10; i++) {
            await Promise.resolve();
        }
        expect(api.find.calls.count()).toBe(2); // Initial GET plus the first event.
        expect(callbacks.length).toBe(1);
        callbacks.shift()();
        await scope.items[0].refresh;
        expect(scope.items[0].staged.status).toBe('ready');
        expect(api.find.calls.count()).toBe(2);
    });

    it('retries video confirmation with a fresh ETag', async () => {
        const {scope, api, add, event} = setup();

        await add(staged('awaiting_confirmation'), 'video/mp4');
        await event(staged('awaiting_confirmation'));
        const fresh = {...staged('awaiting_confirmation'), _etag: 'fresh'};
        let attempts = 0;

        api.update.and.callFake(() => ++attempts === 1
            ? Promise.reject({status: 412}) : Promise.resolve());
        api.find.and.returnValue(Promise.resolve(fresh));
        const saving = scope.save();

        for (let i = 0; i < 20; i++) {
            await Promise.resolve();
        }
        expect(api.update.calls.count()).toBe(2);
        expect(api.update.calls.mostRecent().args).toEqual(['upload_staging', fresh, {confirmed: true}]);
        await event(staged('ready'));
        await saving;
        expect(scope.resolve).toHaveBeenCalled();
    });

    it('removes the item from the UI without deleting its staging record', async () => {
        const {scope, api, add} = setup();

        await add();
        await scope.onRemoveItem(scope.pendingItems[0].meta);
        expect(scope.items.length).toBe(0);
        expect(scope.removing).toBe(false);
        expect(api.remove).not.toHaveBeenCalled();
    });

    it('does not confirm video again when the fresh snapshot is already ready', async () => {
        const {scope, api, add} = setup();

        await add(staged('awaiting_confirmation'), 'video/mp4');
        api.update.and.callFake(() => Promise.reject({status: 412}));
        api.find.and.returnValue(Promise.resolve({...staged('ready'), confirmed: true}));
        await scope.save();
        expect(api.update.calls.count()).toBe(1);
        expect(scope.resolve).toHaveBeenCalled();
    });

    it('confirms deferred video processing before waiting for ready', async () => {
        const {scope, api, save, add, event} = setup();

        await add(staged('awaiting_confirmation'), 'video/mp4');
        await event(staged('awaiting_confirmation'));
        api.find.and.returnValue(Promise.resolve(staged('processing')));
        const saving = scope.save();

        for (let i = 0; i < 5; i++) {
            await Promise.resolve();
        }
        expect(api.update).toHaveBeenCalledWith('upload_staging', staged('awaiting_confirmation'), {confirmed: true});
        expect(save).not.toHaveBeenCalled();
        await event(staged('ready'));
        await saving;
        expect(save.calls.count()).toBe(1);
    });

    it('recovers missed events on websocket reconnect', async () => {
        const {scope, add, event} = setup();

        await add();
        await event(staged('ready', 'ready', {headline: 'Recovered'}), 'connected');
        expect(scope.imagesMetadata[0].headline).toBe('Recovered');
        expect(scope.processing).toBe(false);
    });

    it('allows manual entry after metadata failure', async () => {
        const {scope, notify, add, event} = setup();

        await add();
        await event(staged('ready', 'failed'));
        expect(notify.warning).toHaveBeenCalled();
        expect(scope.imagesMetadata.length).toBe(1);
        expect(scope.failed).toBe(false);
        await scope.save();
        expect(scope.resolve).toHaveBeenCalled();
    });

    it('rejects a confirmed upload when rendition generation fails', async () => {
        const {scope, notify, save, add, event} = setup();

        await add();
        await event(staged('processing'));
        const saving = scope.save().then(() => false, () => true);

        await event(staged('failed'));
        expect(await saving).toBe(true);
        expect(notify.error).toHaveBeenCalled();
        expect(save).not.toHaveBeenCalled();
    });

    it('cancels the processing deadline and removes the item from the UI', async () => {
        const {scope, api, timeout, add, event} = setup();

        await add();
        await event(staged('processing'));
        await scope.onRemoveItem(scope.imagesMetadata[0]);
        expect(timeout.cancel).toHaveBeenCalled();
        expect(api.remove).not.toHaveBeenCalled();
        expect(scope.imagesMetadata.length).toBe(0);
    });

    it('does not delete uploads whose POST finishes after cancelling the dialog', async () => {
        const {scope, api, timers, add} = setup();

        await add(staged(), 'audio/mpeg', true);
        expect(api.remove).not.toHaveBeenCalled();
        expect(scope.items.length).toBe(0);
        expect(scope.imagesMetadata.length).toBe(0);
        expect(timers.length).toBe(0);
    });

    it('surfaces a processing timeout without any periodic status queries', async () => {
        const {scope, timers, api, notify, add} = setup();

        await add();
        timers[0].callback();
        expect(scope.failed).toBe(true);
        expect(api.find.calls.count()).toBe(1);
        expect(notify.error).toHaveBeenCalled();
    });
});
