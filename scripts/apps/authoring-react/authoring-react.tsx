import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, Loader} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {generatePatch} from 'core/helpers/CrudManager';
import {IContentProfileV2, authoringStorage} from './data-layer';
import {AuthoringSection} from './authoring-section';

interface IProps {
    itemId: IArticle['_id'];
    onClose(): void;
}

interface IStateLoaded {
    initialized: true;
    itemOriginal: IArticle;
    itemWithChanges: IArticle;
    profile: IContentProfileV2;

    /**
     * Prevents changes to state while async operation is in progress(e.g. saving).
     */
    loading: boolean;
}

type IState = {initialized: false} | IStateLoaded;

function waitForCssAnimation(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(
            () => {
                resolve();
            },
            500, // transition time taken from styles/sass/layouts.scss #authoring-container
        );
    });
}
export class AuthoringReact extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };

        this.save = this.save.bind(this);

        const setStateOriginal = this.setState.bind(this);

        this.setState = (...args) => {
            const {state} = this;

            // disallow changing state while loading (for example when saving is in progress)
            const allow: boolean = (() => {
                if (state.initialized !== true) {
                    return true;
                } else if (args[0]['loading'] === false) {
                    // it is allowed to change state while loading
                    // only if it sets loading to false
                    return true;
                } else {
                    return state.loading === false;
                }
            })();

            if (allow) {
                setStateOriginal(...args);
            }
        };
    }

    componentDidMount() {
        Promise.all(
            [
                authoringStorage.getArticle(this.props.itemId).then((item) => {
                    return authoringStorage.getContentProfile(item).then((profile) => {
                        return {item, profile};
                    });
                }),
                waitForCssAnimation(),
            ],
        ).then((res) => {
            const [{item, profile}] = res;

            const nextState: IStateLoaded = {
                initialized: true,
                loading: false,
                itemOriginal: Object.freeze(item),
                itemWithChanges: item,
                profile: profile,
            };

            this.setState(nextState);
        });
    }

    save(state: IStateLoaded) {
        const original = state.itemOriginal;
        const patch = generatePatch(original, state.itemWithChanges);

        this.setState({
            ...state,
            loading: true,
        });

        authoringStorage.saveArticle(original._id, original._etag, patch).then((item: IArticle) => {
            const nextState: IStateLoaded = {
                ...state,
                loading: false,
                itemOriginal: Object.freeze(item),
                itemWithChanges: item,
            };

            this.setState(nextState);
        });
    }

    render() {
        const state = this.state;

        if (state.initialized !== true) {
            return null;
        }

        return (
            <div className="sd-authoring-react">

                {
                    state.loading && (
                        <Loader overlay />
                    )
                }

                <div>
                    <h3>{gettext('Toolbar')}</h3>

                    <Button
                        text={gettext('Close')}
                        onClick={() => {
                            this.props.onClose();
                        }}
                    />

                    <Button
                        text={gettext('Save')}
                        onClick={() => {
                            this.save(state);
                        }}
                    />

                    <br />
                    <br />
                </div>

                <div>
                    <h3>{gettext('Header')}</h3>

                    <AuthoringSection
                        fields={state.profile.header}
                        item={state.itemWithChanges}
                        onChange={(itemChanged) => {
                            const nextState: IStateLoaded = {
                                ...state,
                                itemWithChanges: itemChanged,
                            };

                            this.setState(nextState);
                        }}
                    />
                </div>

                <div>
                    <h3>{gettext('Content')}</h3>

                    <AuthoringSection
                        fields={state.profile.content}
                        item={state.itemWithChanges}
                        onChange={(itemChanged) => {
                            const nextState: IStateLoaded = {
                                ...state,
                                itemWithChanges: itemChanged,
                            };

                            this.setState(nextState);
                        }}
                    />
                </div>

            </div>
        );
    }
}
