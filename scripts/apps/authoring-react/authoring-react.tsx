import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';
import {getContentProfile, IContentProfileV2} from './data-layer';

interface IProps {
    itemId: IArticle['_id'];
    onClose(): void;
}

interface IStateLoaded {
    loading: false;
    item: IArticle;
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
                        return {
                            item,
                            profile,
                        };
                    });
                }),
                waitForCssAnimation(),
            ],
        ).then((res) => {
            const [{item, profile}] = res;

            this.setState({loading: false, item, profile});
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

                    {
                        state.profile.header.map((field) => (
                            <div key={field.name}>
                                <label>{field.name}</label>
                                <div>{state.item[field.name]}</div>
                            </div>
                        )).toArray()
                    }
                </div>

                <div>
                    <h3>{gettext('Content')}</h3>

                    {
                        state.profile.content.map((field) => (
                            <div key={field.name}>
                                <label>{field.name}</label>
                                <div>{state.item[field.name]}</div>
                            </div>
                        )).toArray()
                    }
                </div>

            </div>
        );
    }
}
