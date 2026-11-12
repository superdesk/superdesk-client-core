import React from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {showModal} from '@sourcefabric/common';
import {Alert, Button, ButtonGroup, Modal, Spinner} from 'superdesk-ui-framework/react';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import {IMobilePairingApi, isPairingRequestError, mobilePairingApi} from './api';
import {
    applyPairingDoc,
    deriveViewState,
    formatCountdown,
    getAbsoluteApiUrl,
    IPairingBusy,
    IPairingDecision,
    IPairingRequestError,
    IPairingSnapshot,
    IPairingView,
    isLoopbackUrl,
    shouldCancelOnClose,
    shouldPoll,
    shouldRegenerate,
    snapshotFromCreated,
} from './logic';

export const TICK_INTERVAL_MS = 1000;
export const POLL_INTERVAL_MS = 2000;

/** Network blips while polling are tolerated up to this many failures in a row. */
const MAX_FAILED_POLLS = 3;

interface IProps {
    api: IMobilePairingApi;
    apiUrl: string; // absolute, it is what the phone will talk to
    closeModal(): void;
}

interface IState {
    snapshot: IPairingSnapshot | null;
    busy: IPairingBusy;
    error: IPairingRequestError | null;
    now: number;
}

function toRequestError(error: unknown): IPairingRequestError {
    return isPairingRequestError(error) ? error : {kind: 'network'};
}

function isTransientError(error: IPairingRequestError): boolean {
    return error.kind === 'network' || error.status >= 500;
}

function getDeviceLabel(deviceName: string | null): string {
    return deviceName?.trim() ? deviceName : gettext('an unnamed device');
}

export class MobilePairingModal extends React.PureComponent<IProps, IState> {
    private ticker: number | null = null;

    /**
     * Bumped whenever a new pairing is requested or a decision is sent, so responses
     * to requests started before that are ignored instead of overwriting newer state.
     */
    private generation = 0;

    private pollInFlight = false;
    private lastPollAt = 0;
    private failedPolls = 0;
    private unmounted = false;
    private cancelOnUnmount = true;

    constructor(props: IProps) {
        super(props);

        this.state = {
            snapshot: null,
            busy: null,
            error: null,
            now: Date.now(),
        };

        this.tick = this.tick.bind(this);
        this.startOver = this.startOver.bind(this);
    }

    componentDidMount() {
        this.ticker = window.setInterval(this.tick, TICK_INTERVAL_MS);
        this.start();
    }

    componentWillUnmount() {
        this.unmounted = true;

        if (this.ticker != null) {
            window.clearInterval(this.ticker);
            this.ticker = null;
        }

        const {snapshot, busy} = this.state;

        // an approval or denial in flight already decides the request
        if (this.cancelOnUnmount && busy !== 'approving' && busy !== 'denying') {
            this.cancel(snapshot);
        }
    }

    private isStale(generation: number): boolean {
        return this.unmounted || generation !== this.generation;
    }

    private cancel(snapshot: IPairingSnapshot | null) {
        if (shouldCancelOnClose(snapshot)) {
            this.props.api.decide(snapshot.id, snapshot.etag, 'denied').catch(() => undefined);
        }
    }

    private start() {
        const generation = ++this.generation;

        this.failedPolls = 0;
        this.setState({snapshot: null, busy: 'creating', error: null});

        this.props.api.create()
            .then((doc) => {
                if (this.unmounted) {
                    // the dialog closed while the code was being created, nobody will ever see it
                    this.props.api.decide(doc._id, doc._etag, 'denied').catch(() => undefined);
                    return;
                }

                if (this.isStale(generation)) {
                    return;
                }

                const now = Date.now();

                this.lastPollAt = now;
                this.setState({snapshot: snapshotFromCreated(doc, now), busy: null, now});
            })
            .catch((error) => {
                if (!this.isStale(generation)) {
                    this.setState({busy: null, error: toRequestError(error)});
                }
            });
    }

    /**
     * Reads the expired pairing once more before replacing it: a phone could have
     * claimed it just before it ran out, and that claim would otherwise be left waiting.
     */
    private regenerate() {
        const {snapshot} = this.state;
        const generation = ++this.generation;

        this.setState({busy: 'creating'});

        this.props.api.get(snapshot.id)
            .then((doc) => {
                if (this.isStale(generation)) {
                    return;
                }

                if (doc.status === 'pending' && doc.expires_in <= 0) {
                    this.start();
                    return;
                }

                const now = Date.now();

                this.lastPollAt = now;
                this.setState({snapshot: applyPairingDoc(snapshot, doc, now), busy: null, now});
            })
            .catch((_error) => {
                if (this.isStale(generation)) {
                    return;
                }

                const error = toRequestError(_error);

                if (error.kind === 'http' && error.status === 404) {
                    this.start();
                } else {
                    this.setState({busy: null, error});
                }
            });
    }

    private poll() {
        const {snapshot} = this.state;
        const generation = this.generation;

        this.pollInFlight = true;
        this.lastPollAt = Date.now();

        this.props.api.get(snapshot.id)
            .then((doc) => {
                if (this.isStale(generation)) {
                    return;
                }

                const now = Date.now();

                this.failedPolls = 0;
                this.setState({snapshot: applyPairingDoc(this.state.snapshot, doc, now), now});
            })
            .catch((_error) => {
                if (this.isStale(generation)) {
                    return;
                }

                const error = toRequestError(_error);

                this.failedPolls += 1;

                if (!isTransientError(error) || this.failedPolls >= MAX_FAILED_POLLS) {
                    this.setState({error});
                }
            })
            .finally(() => {
                this.pollInFlight = false;
            });
    }

    private tick() {
        const now = Date.now();

        this.setState({now}, () => {
            const {snapshot, busy, error} = this.state;

            if (shouldRegenerate(snapshot, now, busy, error)) {
                this.regenerate();
            } else if (
                shouldPoll(snapshot, now, busy, error)
                && !this.pollInFlight
                && now - this.lastPollAt >= POLL_INTERVAL_MS
            ) {
                this.poll();
            }
        });
    }

    private decide(decision: IPairingDecision) {
        const {snapshot} = this.state;
        const generation = ++this.generation;

        this.setState({busy: decision === 'approved' ? 'approving' : 'denying'});

        this.props.api.decide(snapshot.id, snapshot.etag, decision)
            .then((response) => {
                if (this.isStale(generation)) {
                    return;
                }

                if (decision === 'denied') {
                    this.cancelOnUnmount = false;
                    this.props.closeModal();
                    return;
                }

                // the phone gets a new expiry after approval, the next poll reads it
                this.lastPollAt = 0;
                this.setState({
                    snapshot: {
                        ...this.state.snapshot,
                        etag: response._etag,
                        status: response.status ?? 'approved',
                        expiresAt: null,
                    },
                    busy: null,
                    now: Date.now(),
                });
            })
            .catch((error) => {
                if (!this.isStale(generation)) {
                    this.setState({busy: null, error: toRequestError(error)});
                }
            });
    }

    private startOver() {
        this.cancel(this.state.snapshot);
        this.start();
    }

    private renderBody(view: IPairingView): React.ReactNode {
        switch (view.kind) {
            case 'creating':
                return (
                    <div className="sd-text-align--center" data-test-id="mobile-pairing--creating">
                        <Spinner size="medium" />
                        <p className="sd-margin-t--2">{gettext('Creating a sign-in code...')}</p>
                    </div>
                );
            case 'refreshing':
                return (
                    <div className="sd-text-align--center" data-test-id="mobile-pairing--refreshing">
                        <Spinner size="medium" />
                        <p className="sd-margin-t--2">{gettext('The code expired. Getting a new one...')}</p>
                    </div>
                );
            case 'scan':
                return (
                    <div className="sd-text-align--center" data-test-id="mobile-pairing--scan">
                        <p className="sd-margin-b--2">
                            {gettext('Scan this code with the Superdesk Reporter app on your phone.')}
                        </p>
                        <QRCodeSVG
                            value={view.deepLink}
                            size={240}
                            level="M"
                            marginSize={4}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            title={gettext('Sign-in code for the Superdesk Reporter app')}
                        />
                        <p className="sd-margin-t--2" data-test-id="mobile-pairing--countdown">
                            {gettext('The code expires in {{time}}. A new one will appear after that.', {
                                time: formatCountdown(view.secondsLeft),
                            })}
                        </p>
                        {isLoopbackUrl(this.props.apiUrl) && (
                            <Alert type="warning" size="small" margin="normal">
                                {gettext(
                                    'The server address is {{url}}, which a phone can not reach.',
                                    {url: this.props.apiUrl},
                                )}
                            </Alert>
                        )}
                    </div>
                );
            case 'confirm':
                return (
                    <div className="sd-text-align--center" data-test-id="mobile-pairing--confirm">
                        <h3 className="sd-margin-b--2">
                            {gettext('Allow {{device}} to sign in as you?', {device: getDeviceLabel(view.deviceName)})}
                        </h3>
                        <p>{gettext('Check that your phone shows')}</p>
                        <div
                            style={{fontSize: 48, fontWeight: 600, lineHeight: 1.2}}
                            data-test-id="mobile-pairing--match-number"
                        >
                            {view.matchNumber}
                        </div>
                        <p className="sd-margin-t--2">
                            {gettext('Only approve if you scanned the code yourself and the numbers match.')}
                        </p>
                        <p className="sd-margin-t--1">
                            {gettext('{{time}} left to decide.', {time: formatCountdown(view.secondsLeft)})}
                        </p>
                    </div>
                );
            case 'finishing':
                return (
                    <div className="sd-text-align--center" data-test-id="mobile-pairing--finishing">
                        <Spinner size="medium" />
                        <p className="sd-margin-t--2">
                            {gettext('Approved. Finishing the sign-in on {{device}}...', {
                                device: getDeviceLabel(view.deviceName),
                            })}
                        </p>
                    </div>
                );
            case 'completed':
                return (
                    <Alert type="success" margin="none">
                        <span data-test-id="mobile-pairing--completed">
                            {gettext('{{device}} is signed in.', {device: getDeviceLabel(view.deviceName)})}
                        </span>
                    </Alert>
                );
            case 'denied':
                return (
                    <Alert type="warning" margin="none">
                        <span data-test-id="mobile-pairing--denied">
                            {gettext('This sign-in request was cancelled.')}
                        </span>
                    </Alert>
                );
            case 'failed':
                return (
                    <Alert type="alert" margin="none">
                        <span data-test-id="mobile-pairing--failed">
                            {gettext('This sign-in request was blocked after too many failed attempts.')}
                        </span>
                    </Alert>
                );
            case 'expired':
                return (
                    <Alert type="warning" margin="none">
                        <span data-test-id="mobile-pairing--expired">
                            {gettext('This sign-in request expired.')}
                        </span>
                    </Alert>
                );
            case 'error':
                return (
                    <Alert type="alert" margin="none">
                        <span data-test-id="mobile-pairing--error">{view.message}</span>
                    </Alert>
                );
        }
    }

    private renderFooter(view: IPairingView): JSX.Element {
        const {busy} = this.state;
        const {closeModal} = this.props;

        switch (view.kind) {
            case 'confirm':
                return (
                    <ButtonGroup align="end">
                        <Button
                            type="default"
                            text={gettext('Deny')}
                            onClick={() => this.decide('denied')}
                            disabled={busy != null}
                            isLoading={busy === 'denying'}
                            data-test-id="mobile-pairing--deny"
                        />
                        <Button
                            type="primary"
                            text={gettext('Approve')}
                            onClick={() => this.decide('approved')}
                            disabled={busy != null}
                            isLoading={busy === 'approving'}
                            data-test-id="mobile-pairing--approve"
                        />
                    </ButtonGroup>
                );
            case 'completed':
                return (
                    <ButtonGroup align="end">
                        <Button type="primary" text={gettext('Done')} onClick={closeModal} />
                    </ButtonGroup>
                );
            case 'denied':
            case 'failed':
            case 'expired':
            case 'error':
                return (
                    <ButtonGroup align="end">
                        <Button type="default" text={gettext('Close')} onClick={closeModal} />
                        <Button
                            type="primary"
                            text={gettext('Start over')}
                            onClick={this.startOver}
                            data-test-id="mobile-pairing--start-over"
                        />
                    </ButtonGroup>
                );
            case 'finishing':
                return (
                    <ButtonGroup align="end">
                        <Button type="default" text={gettext('Close')} onClick={closeModal} />
                    </ButtonGroup>
                );
            default:
                return (
                    <ButtonGroup align="end">
                        <Button type="default" text={gettext('Cancel')} onClick={closeModal} />
                    </ButtonGroup>
                );
        }
    }

    render() {
        const {snapshot, now, error} = this.state;
        const view = deriveViewState(snapshot, now, this.props.apiUrl, error);

        return (
            <Modal
                visible
                size="small"
                position="center"
                onHide={this.props.closeModal}
                headerTemplate={gettext('Connect mobile app')}
                footerTemplate={this.renderFooter(view)}
                data-test-id="mobile-pairing-modal"
            >
                {this.renderBody(view)}
            </Modal>
        );
    }
}

export function showMobilePairingModal(): void {
    const apiUrl = getAbsoluteApiUrl(appConfig.server.url, window.location.href);

    showModal(({closeModal}) => (
        <MobilePairingModal api={mobilePairingApi} apiUrl={apiUrl} closeModal={closeModal} />
    ));
}
