import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {IMobilePairingApi} from './api';
import {MobilePairingModal, POLL_INTERVAL_MS} from './MobilePairingModal';
import {ICreatedPairingDoc, IPairingDoc, REGENERATE_GRACE_MS} from './logic';

const API_URL = 'https://sd.example.com/api';

function created(overrides: Partial<ICreatedPairingDoc> = {}): ICreatedPairingDoc {
    return {_id: 'p1', _etag: 'e1', status: 'pending', code: 'secret-code', expires_in: 60, ...overrides};
}

function polled(overrides: Partial<IPairingDoc> = {}): IPairingDoc {
    return {
        _id: 'p1',
        _etag: 'e1',
        status: 'pending',
        expires_in: 60,
        device_name: null,
        match_number: null,
        ...overrides,
    };
}

/** The phone scanned the code and shows 42 */
function claimed(overrides: Partial<IPairingDoc> = {}): IPairingDoc {
    return polled({
        _etag: 'e2',
        status: 'claimed',
        expires_in: 120,
        device_name: 'Pixel 8',
        match_number: 42,
        ...overrides,
    });
}

/** Lets resolved promises run their callbacks; the mocked clock does not affect microtasks. */
async function flush(wrapper: ReactWrapper) {
    for (let i = 0; i < 10; i++) {
        await Promise.resolve();
    }

    wrapper.update();
}

function byTestId(wrapper: ReactWrapper, id: string): ReactWrapper {
    return wrapper.find(`[data-test-id="${id}"]`).hostNodes();
}

describe('<MobilePairingModal />', () => {
    let api: jasmine.SpyObj<IMobilePairingApi>;
    let closeModal: jasmine.Spy;
    let wrapper: ReactWrapper | null;

    function render() {
        wrapper = mount(<MobilePairingModal api={api} apiUrl={API_URL} closeModal={closeModal} />);

        return wrapper;
    }

    function unmount() {
        wrapper.unmount();
        wrapper = null;
    }

    async function advance(ms: number) {
        jasmine.clock().tick(ms);
        await flush(wrapper);
    }

    beforeEach(() => {
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date(2026, 10, 11, 12, 0, 0));

        api = jasmine.createSpyObj<IMobilePairingApi>('api', ['create', 'get', 'decide']);
        api.decide.and.returnValue(Promise.resolve({_id: 'p1', _etag: 'x'}));
        closeModal = jasmine.createSpy('closeModal');
        wrapper = null;
    });

    afterEach(() => {
        if (wrapper != null) {
            unmount();
        }

        jasmine.clock().uninstall();
    });

    it('creates a pairing, waits for the claim and approves it with the latest etag', async () => {
        api.create.and.returnValue(Promise.resolve(created()));
        api.get.and.returnValues(
            Promise.resolve(claimed()),
            Promise.resolve(claimed({_etag: 'e4', status: 'completed', expires_in: 0})),
        );
        api.decide.and.returnValue(Promise.resolve({_id: 'p1', _etag: 'e3', status: 'approved'}));

        render();
        await flush(wrapper);

        expect(api.create).toHaveBeenCalledTimes(1);
        expect(byTestId(wrapper, 'mobile-pairing--scan').length).toBe(1);
        expect(wrapper.find('svg').length).toBeGreaterThan(0);
        expect(byTestId(wrapper, 'mobile-pairing--countdown').text()).toContain('1:00');

        await advance(POLL_INTERVAL_MS);

        expect(api.get).toHaveBeenCalledWith('p1');
        expect(byTestId(wrapper, 'mobile-pairing--scan').length).toBe(0);
        expect(byTestId(wrapper, 'mobile-pairing--confirm').text()).toContain('Allow Pixel 8 to sign in as you?');
        expect(byTestId(wrapper, 'mobile-pairing--match-number').text()).toBe('42');

        byTestId(wrapper, 'mobile-pairing--approve').simulate('click');
        await flush(wrapper);

        expect(api.decide).toHaveBeenCalledOnceWith('p1', 'e2', 'approved');
        expect(byTestId(wrapper, 'mobile-pairing--finishing').length).toBe(1);

        await advance(1000);

        expect(byTestId(wrapper, 'mobile-pairing--completed').text()).toContain('Pixel 8 is signed in.');

        unmount();

        expect(api.decide).toHaveBeenCalledTimes(1);
    });

    it('closes after denying a claim without sending a second cancellation', async () => {
        api.create.and.returnValue(Promise.resolve(created()));
        api.get.and.returnValue(
            Promise.resolve(claimed()),
        );

        render();
        await flush(wrapper);
        await advance(POLL_INTERVAL_MS);

        byTestId(wrapper, 'mobile-pairing--deny').simulate('click');
        await flush(wrapper);

        expect(api.decide).toHaveBeenCalledOnceWith('p1', 'e2', 'denied');
        expect(closeModal).toHaveBeenCalled();

        unmount();

        expect(api.decide).toHaveBeenCalledTimes(1);
    });

    it('replaces an expired code with a new one after checking nobody claimed it', async () => {
        api.create.and.returnValues(
            Promise.resolve(created({expires_in: 3})),
            Promise.resolve(created({_id: 'p2', _etag: 'f1', code: 'second-code'})),
        );
        api.get.and.returnValues(
            Promise.resolve(polled({expires_in: 1})),
            Promise.resolve(polled({expires_in: 0})),
        );

        render();
        await flush(wrapper);

        await advance(POLL_INTERVAL_MS);
        expect(api.create).toHaveBeenCalledTimes(1);

        // out of time on this clock, but the server may still accept a claim
        await advance(1000);
        expect(byTestId(wrapper, 'mobile-pairing--refreshing').length).toBe(1);
        expect(api.get).toHaveBeenCalledTimes(1);
        expect(api.create).toHaveBeenCalledTimes(1);

        await advance(REGENERATE_GRACE_MS);

        expect(api.get).toHaveBeenCalledTimes(2);
        expect(api.create).toHaveBeenCalledTimes(2);
        expect(byTestId(wrapper, 'mobile-pairing--countdown').text()).toContain('1:00');
    });

    it('does not replace a code the server still accepts', async () => {
        api.create.and.returnValues(
            Promise.resolve(created({expires_in: 1})),
            Promise.resolve(created({_id: 'p2', _etag: 'f1', code: 'second-code'})),
        );
        api.get.and.returnValues(
            Promise.resolve(polled({expires_in: 1})),
            Promise.resolve(polled({expires_in: 0})),
        );

        render();
        await flush(wrapper);
        await advance(1000 + REGENERATE_GRACE_MS);

        expect(api.get).toHaveBeenCalledTimes(1);
        expect(api.create).toHaveBeenCalledTimes(1);

        await advance(1000 + REGENERATE_GRACE_MS);

        expect(api.get).toHaveBeenCalledTimes(2);
        expect(api.create).toHaveBeenCalledTimes(2);
    });

    it('keeps a code that was claimed right before it expired', async () => {
        api.create.and.returnValue(Promise.resolve(created({expires_in: 1})));
        api.get.and.returnValue(
            Promise.resolve(claimed()),
        );

        render();
        await flush(wrapper);
        await advance(1000 + REGENERATE_GRACE_MS);

        expect(api.create).toHaveBeenCalledTimes(1);
        expect(byTestId(wrapper, 'mobile-pairing--confirm').length).toBe(1);
    });

    it('cancels a pending request when the dialog closes', async () => {
        api.create.and.returnValue(Promise.resolve(created()));

        render();
        await flush(wrapper);

        unmount();

        expect(api.decide).toHaveBeenCalledOnceWith('p1', 'e1', 'denied');
    });

    it('shows a failed creation and lets the user start over', async () => {
        api.create.and.returnValues(
            Promise.reject({kind: 'http', status: 403, issue: null}),
            Promise.resolve(created()),
        );

        render();
        await flush(wrapper);

        expect(byTestId(wrapper, 'mobile-pairing--error').text()).toContain('not allowed');

        byTestId(wrapper, 'mobile-pairing--start-over').simulate('click');
        await flush(wrapper);

        expect(api.create).toHaveBeenCalledTimes(2);
        expect(byTestId(wrapper, 'mobile-pairing--scan').length).toBe(1);
    });

    it('shows when approving fails because the request expired', async () => {
        api.create.and.returnValue(Promise.resolve(created()));
        api.get.and.returnValue(
            Promise.resolve(claimed()),
        );
        api.decide.and.returnValue(Promise.reject({kind: 'http', status: 400, issue: 'expired'}));

        render();
        await flush(wrapper);
        await advance(POLL_INTERVAL_MS);

        byTestId(wrapper, 'mobile-pairing--approve').simulate('click');
        await flush(wrapper);

        expect(byTestId(wrapper, 'mobile-pairing--error').text()).toContain('expired');
        expect(byTestId(wrapper, 'mobile-pairing--start-over').length).toBe(1);
    });

    it('tolerates a network blip while polling but not a repeated failure', async () => {
        api.create.and.returnValue(Promise.resolve(created()));
        api.get.and.returnValue(Promise.reject({kind: 'network'}));

        render();
        await flush(wrapper);

        await advance(POLL_INTERVAL_MS);
        expect(byTestId(wrapper, 'mobile-pairing--scan').length).toBe(1);

        await advance(POLL_INTERVAL_MS);
        await advance(POLL_INTERVAL_MS);

        expect(api.get).toHaveBeenCalledTimes(3);
        expect(byTestId(wrapper, 'mobile-pairing--error').text()).toContain('Could not reach the server');
    });

    it('stops all timers when unmounted', async () => {
        api.create.and.returnValue(Promise.resolve(created()));
        api.get.and.returnValue(Promise.resolve(polled()));

        render();
        await flush(wrapper);
        unmount();

        jasmine.clock().tick(POLL_INTERVAL_MS * 5);

        expect(api.get).not.toHaveBeenCalled();
    });
});
