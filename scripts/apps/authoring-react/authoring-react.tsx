import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';
import {getContentProfile, IContentProfileV2} from './data-layer';
import {AuthoringSection} from './authoring-section';

interface IProps {
    itemId: IArticle['_id'];
    onClose(): void;
}

interface IStateLoaded {
    loading: false;
    itemOriginal: IArticle;
    itemWithChanges: IArticle;
    profile: IContentProfileV2;
}

type IState = {loading: true} | IStateLoaded;

function waitForCssAnimation(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(
            () => {
                resolve();
            },

            // transition time taken from styles/sass/layouts.scss #authoring-container
            500,
        );
    });
}

function fetchArticle(id: IArticle['_id']): Promise<IArticle> {
    // TODO: take published items into account
    return dataApi.findOne<IArticle>('archive', id);
}

export class AuthoringReact extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
        };
    }

    componentDidMount() {
        Promise.all(
            [
                fetchArticle(this.props.itemId).then((item) => {
                    return getContentProfile(item).then((profile) => {
                        return {item, profile};
                    });
                }),
                waitForCssAnimation(),
            ],
        ).then((res) => {
            const [{item, profile}] = res;

            const nextState: IStateLoaded = {
                loading: false,
                itemOriginal: Object.freeze(item),
                itemWithChanges: item,
                profile: profile,
            };

            this.setState(nextState);
        });
    }

    render() {
        const state = this.state;

        if (state.loading === true) {
            return null;
        }

        return (
            <div className="sd-authoring-react">
                <div>
                    <h3>{gettext('Toolbar')}</h3>

                    <Button
                        text={gettext('Close')}
                        onClick={() => {
                            this.props.onClose();
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
