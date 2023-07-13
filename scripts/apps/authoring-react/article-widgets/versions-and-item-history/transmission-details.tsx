import React from 'react';
import {IHistoryItem} from 'apps/authoring/versioning/history/HistoryController';
import {IArticle, IRestApiResponse} from 'superdesk-api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {IPublishQueueItem} from 'superdesk-interfaces/PublishQueueItem';
import {gettext} from 'core/utils';
import {IconButton, Modal} from 'superdesk-ui-framework/react';
import {showModal} from '@superdesk/common';
import {TimeElem} from 'apps/search/components/TimeElem';
import {Spacer} from 'core/ui/components/Spacer';

interface IProps {
    article: IArticle;
    historyItem: IHistoryItem;
}

interface IState {
    queueItems: Array<IPublishQueueItem> | null;
}

function tryShowingFormattedJson(maybeJson: string) {
    try {
        const parsed = JSON.parse(maybeJson);

        return (
            <pre>{JSON.stringify(parsed, null, 2)}</pre>
        );
    } catch {
        return <span>{maybeJson}</span>;
    }
}

export class TransmissionDetails extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            queueItems: null,
        };
    }

    componentDidMount() {
        httpRequestJsonLocal<IRestApiResponse<IPublishQueueItem>>({
            method: 'GET',
            path: this.props.article._type === 'legal_archive' ? '/legal_publish_queue' : '/publish_queue',
            urlParams: {
                max_results: 20,
                where: {
                    $and: [
                        {item_id: this.props.historyItem.item_id},
                        {item_version: this.props.historyItem.version},
                    ],
                },
            },
        }).then((res) => {
            this.setState({queueItems: res._items});
        });
    }

    render() {
        const {queueItems} = this.state;

        if (queueItems == null) {
            return null;
        }

        if (queueItems.length < 1) {
            return (
                <div>{gettext('Item has not been transmitted to any subscriber')}</div>
            );
        }

        return (
            <Spacer v gap="8" noWrap> {/** if show_transmission_details && hasItems */}
                {
                    queueItems.map((queueItem, i) => (
                        <Spacer h gap="8" noGrow alignItems="center" key={i}>
                            {(() => {
                                if (queueItem.state === 'error') {
                                    return (
                                        <div>
                                            {
                                                gettext(
                                                    'Error sending as {{name}} to {{destination}} at {{date}}',
                                                    {
                                                        name: () => <strong>{queueItem.unique_name}</strong>,
                                                        destination: queueItem.destination.name,
                                                        date: () => <TimeElem date={queueItem.completed_at} />,
                                                    },
                                                )
                                            }
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div>
                                            {
                                                gettext(
                                                    'Sent/Queued as {{name}} to {{destination}} at {{date}}',
                                                    {
                                                        name: () => <strong>{queueItem.unique_name}</strong>,
                                                        destination: queueItem.destination.name,
                                                        date: () => <TimeElem date={queueItem.completed_at} />,
                                                    },
                                                )
                                            }
                                        </div>
                                    );
                                }
                            })()}

                            <IconButton
                                icon="eye-open"
                                size="small"
                                ariaValue={gettext('View item')}
                                onClick={() => {
                                    showModal(({closeModal}) => (
                                        <Modal
                                            visible
                                            zIndex={1050}
                                            size="large"
                                            position="center"
                                            onHide={closeModal}
                                            headerTemplate={gettext('Item sent to Subscriber')}
                                        >
                                            <div>
                                                {tryShowingFormattedJson(queueItem.formatted_item)}
                                            </div>
                                        </Modal>
                                    ));
                                }}
                            />
                        </Spacer>
                    ))
                }
            </Spacer>
        );
    }
}
