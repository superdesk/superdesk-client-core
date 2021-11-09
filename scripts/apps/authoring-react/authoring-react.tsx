import React from 'react';
import {IArticle} from 'superdesk-api';
import {
    Button,
    ButtonGroup,
    Loader,
    SubNav,
    IconButton,
} from 'superdesk-ui-framework';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {gettext} from 'core/utils';
import {IContentProfileV2, authoringStorage} from './data-layer';
import {AuthoringSection} from './authoring-section';
import {previewItems} from 'apps/authoring/preview/fullPreviewMultiple';
import {EditorTest} from './ui-framework-authoring-test';
import {uiFrameworkAuthoringPanelTest} from 'appConfig';
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
                    return authoringStorage.getContentProfile(item.autosaved ?? item.saved).then((profile) => {
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
                itemOriginal: Object.freeze(item.saved),
                itemWithChanges: item.autosaved ?? item.saved,
                profile: profile,
            };

            this.setState(nextState);
        });
    }

    componentDidUpdate(_prevProps, prevState: IState) {
        if (
            this.state.initialized
            && prevState.initialized
            && this.state.itemWithChanges !== prevState.itemWithChanges
        ) {
            authoringStorage.autosave.schedule(this.state.itemWithChanges);
        }
    }

    save(state: IStateLoaded) {
        this.setState({
            ...state,
            loading: true,
        });

        authoringStorage.saveArticle(state.itemWithChanges, state.itemOriginal).then((item: IArticle) => {
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

        if (uiFrameworkAuthoringPanelTest) {
            return (
                <div className="sd-authoring-react">
                    <EditorTest />
                </div>
            );
        }

        return (
            <div className="sd-authoring-react">

                {
                    state.loading && (
                        <Loader overlay />
                    )
                }

                <Layout.AuthoringFrame
                    header={(
                        <SubNav>
                            <ButtonGroup align="right" padded>
                                <Button
                                    text={gettext('Close')}
                                    style="hollow"
                                    onClick={() => {
                                        this.setState({
                                            ...state,
                                            loading: true,
                                        });

                                        authoringStorage.closeAuthoring(
                                            state.itemWithChanges,
                                            state.itemOriginal,
                                            () => this.props.onClose(),
                                        ).then(() => {
                                            this.setState({
                                                ...state,
                                                loading: false,
                                            });
                                        });
                                    }}
                                />

                                <Button
                                    text={gettext('Save')}
                                    style="filled"
                                    type="primary"
                                    disabled={state.itemWithChanges === state.itemOriginal}
                                    onClick={() => {
                                        this.save(state);
                                    }}
                                />
                            </ButtonGroup>
                        </SubNav>
                    )}
                    main={(
                        <Layout.AuthoringMain
                            toolBar={(
                                <React.Fragment>
                                    <ButtonGroup align="right">
                                        <IconButton
                                            icon="preview-mode"
                                            ariaValue={gettext('Print preview')}
                                            onClick={() => {
                                                previewItems([state.itemOriginal]);
                                            }}
                                        />
                                    </ButtonGroup>
                                </React.Fragment>
                            )}
                            authoringHeader={(
                                <div>
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
                            )}
                        >
                            <div>
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
                        </Layout.AuthoringMain>
                    )}
                />
            </div>
        );
    }
}
