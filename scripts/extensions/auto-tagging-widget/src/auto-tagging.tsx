import * as React from 'react';
import {IArticle, ISuperdesk} from 'superdesk-api';

interface ITag {
    uuid: string;
    title: string;
    weight: number;
    media_topic: Array<any>;
}

interface IAutoTaggingResponse {
    analysis: {
        topic: Array<ITag>;
        category: Array<ITag>;
        place: Array<ITag>;
    };
}

interface IProps {
    article: IArticle;
}

interface IState {
    response: IAutoTaggingResponse | null;
}

export function getAutoTaggingComponent(superdesk: ISuperdesk, label: string) {
    const {httpRequestJsonLocal} = superdesk;
    const {gettext} = superdesk.localization;

    return class AutoTagging extends React.PureComponent<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                response: null,
            };
        }
        componentDidMount() {
            httpRequestJsonLocal<IAutoTaggingResponse>({
                method: 'POST',
                path: '/ai/',
                payload: {
                    service: 'imatrics',
                    item_id: this.props.article._id,
                },
            }).then((response) => {
                this.setState({
                    response,
                });
            });
        }
        render() {
            const {response} = this.state;

            return (
                <div>
                    <div>
                        <span>{label}</span>
                        <button
                            onClick={() => {
                                console.log('test');
                            }}
                        >
                            +
                        </button>
                    </div>

                    {
                        response == null
                            ? (<div>{gettext('loading...')}</div>)
                            : (
                                <div>
                                    <h4>Topic</h4>

                                    <ul>
                                        {
                                            (response.analysis.topic).map((item: ITag) => {
                                                return (<li key={item.uuid}>{item.title}</li>);
                                            })
                                        }
                                    </ul>

                                    <h4>Category</h4>

                                    <ul>
                                        {
                                            (response.analysis.category).map((item: ITag) => {
                                                return (<li key={item.uuid}>{item.title}</li>);
                                            })
                                        }
                                    </ul>

                                    <h4>Place</h4>

                                    <ul>
                                        {
                                            (response.analysis.place).map((item: ITag) => {
                                                return (<li key={item.uuid}>{item.title}</li>);
                                            })
                                        }
                                    </ul>
                                </div>
                            )
                    }
                </div>
            );
        }
    };
}
