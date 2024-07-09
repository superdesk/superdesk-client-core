import React from 'react';
import {Map} from 'immutable';
import {IExtensionActivationResult, IRestApiResponse} from 'superdesk-api';
import {getHistoryItems, IHistoryItem, getOperationLabel} from 'apps/authoring/versioning/history/HistoryController';
import {TimeElem} from 'apps/search/components';
import {gettext} from 'core/utils';
import {Spacer} from 'core/ui/components/Spacer';
import {Card} from 'core/ui/components/Card';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {IHighlight} from 'apps/highlights/services/HighlightsService';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {TransmissionDetails} from './transmission-details';

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

interface IState {
    historyItems: Array<IHistoryItem> | null;
    highlights: Map<IHighlight['_id'], IHighlight> | null;
}

export class HistoryTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            historyItems: null,
            highlights: null,
        };

        this.getHighlightsLabel = this.getHighlightsLabel.bind(this);
    }

    getHighlightsLabel(id: IHighlight['_id'], fallbackLabel: string): string {
        return this.state.highlights.get(id)?.name ?? fallbackLabel;
    }

    componentDidMount() {
        Promise.all([
            getHistoryItems(this.props.article),
            httpRequestJsonLocal<IRestApiResponse<IHighlight>>({method: 'GET', path: '/highlights'}),
        ]).then(([historyItems, highlightsResponse]) => {
            this.setState({
                historyItems,
                highlights: Map(highlightsResponse._items.map((item) => [item._id, item])),
            });
        });
    }

    render() {
        const {historyItems} = this.state;

        if (historyItems == null) {
            return null;
        }

        const BaseHistoryItem: React.ComponentType<{items: Array<IHistoryItem>, current: number}> = (props) => {
            const {items, current, children} = props;
            const item = items[current];
            const itemPrevious = items[current - 1];
            const showVersion = item.version > 0 && item.version !== itemPrevious?.version;

            return (
                <Card>
                    <Spacer v gap="8" noWrap>
                        <Spacer h gap="8" noWrap>
                            <div>
                                <TimeElem date={item._created} />
                            </div>

                            {
                                showVersion && (
                                    <div>
                                        {gettext('Version: {{n}}', {n: item.version})}
                                    </div>
                                )
                            }
                        </Spacer>

                        {children}
                    </Spacer>
                </Card>
            );
        };

        return (
            <Spacer v gap="8">
                {
                    historyItems.map((item, i) => {
                        if (item.operation === 'create') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        <strong>{gettext('Created by')}</strong>
                                        &nbsp;
                                        {item.displayName}
                                    </div>

                                    {
                                        item.desk != null && (
                                            <div>{item.desk} / {item.stage}</div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'update') {
                            if (item.update.operation === 'deschedule') {
                                return (
                                    <BaseHistoryItem items={historyItems} current={i} key={i}>
                                        <div>
                                            <strong>{gettext('Descheduled by')}</strong>
                                            &nbsp;
                                            {item.displayName}
                                        </div>

                                        <div>
                                            {gettext('Updated fields:')}
                                            &nbsp;
                                            {item.fieldsUpdated}
                                        </div>
                                    </BaseHistoryItem>
                                );
                            } else {
                                return (
                                    <BaseHistoryItem items={historyItems} current={i} key={i}>
                                        <div>
                                            <strong>{gettext('Updated by')}</strong>
                                            &nbsp;
                                            {item.displayName}
                                        </div>

                                        <div>
                                            {gettext('Updated fields:')}
                                            &nbsp;
                                            {item.fieldsUpdated}
                                        </div>
                                    </BaseHistoryItem>
                                );
                            }
                        } else if (item.operation === 'duplicated_from') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        <strong>{gettext('Duplicated by')}</strong>
                                        &nbsp;
                                        {item.displayName}
                                    </div>

                                    {
                                        item.update.duplicate_id != null && (
                                            <div>
                                                <Button
                                                    text={gettext('View source item')}
                                                    onClick={() => {
                                                        openArticle(item.update.duplicate_id, 'view');
                                                    }}
                                                    size="small"
                                                    style="hollow"
                                                />
                                            </div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'duplicate') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        <strong>{gettext('Duplicate created by')}</strong>
                                        &nbsp;
                                        {item.displayName}
                                    </div>

                                    {
                                        item.update.duplicate_id != null && (
                                            <div>
                                                <Button
                                                    text={gettext('View source item')}
                                                    onClick={() => {
                                                        openArticle(item.update.duplicate_id, 'view');
                                                    }}
                                                    size="small"
                                                    style="hollow"
                                                />
                                            </div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'translate') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        <strong>{gettext('Translated by')}</strong>
                                        &nbsp;
                                        {item.displayName}
                                    </div>

                                    {
                                        item.update.duplicate_id != null && (
                                            <div>
                                                <Button
                                                    text={gettext('View source item')}
                                                    onClick={() => {
                                                        openArticle(item.update.duplicate_id, 'view');
                                                    }}
                                                    size="small"
                                                    style="hollow"
                                                />
                                            </div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'spike') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        <strong>{gettext('Spiked by')}</strong>
                                        &nbsp;
                                        {item.displayName}
                                    </div>

                                    {
                                        item.desk != null && (
                                            <div>{gettext('from:')} {item.desk} / {item.stage}</div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'unspike') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        <strong>{gettext('Unspiked by')}</strong>
                                        &nbsp;
                                        {item.displayName}
                                    </div>

                                    {
                                        item.desk != null && (
                                            <div>{gettext('from:')} {item.desk} / {item.stage}</div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'move') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        <strong>{gettext('Moved by')}</strong>
                                        &nbsp;
                                        {item.displayName}
                                    </div>

                                    {
                                        item.desk != null && (
                                            <div>{gettext('from:')} {item.desk} / {item.stage}</div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'fetch') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        <strong>{gettext('Fetched by')}</strong>
                                        &nbsp;
                                        {item.displayName}
                                    </div>

                                    {
                                        item.desk != null && (
                                            <div>{gettext('from:')} {item.desk} / {item.stage}</div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'mark' && item.update.highlight_id !== null) {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Marked for highlight {{x}} by {{user}}',
                                            {
                                                x: this.getHighlightsLabel(
                                                    item.update.highlight_id,
                                                    item.update.highlight_name,
                                                ),
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'unmark' && item.update.highlight_id !== null) {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Unmarked from highlight({{x}}) by {{user}}',
                                            {
                                                x: this.getHighlightsLabel(
                                                    item.update.highlight_id,
                                                    item.update.highlight_name,
                                                ),
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'mark' && item.update.desk_id !== null) {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Marked for desk {{x}} by {{user}}',
                                            {
                                                x: this.getHighlightsLabel(
                                                    item.update.highlight_id,
                                                    item.update.highlight_name,
                                                ),
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'unmark' && item.update.desk_id !== null) {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Unmarked from desk({{x}}) by {{user}}',
                                            {
                                                x: this.getHighlightsLabel(
                                                    item.update.highlight_id,
                                                    item.update.highlight_name,
                                                ),
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'export_highlight') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        <strong>{gettext('Exported by')}</strong>
                                        &nbsp;
                                        {item.displayName}
                                    </div>

                                    {
                                        item.update.highlight_id != null && (
                                            <div>
                                                {gettext(
                                                    'from highlight: {{x}}',
                                                    {
                                                        x: this.getHighlightsLabel(
                                                            item.update.highlight_id,
                                                            item.update.highlight_name,
                                                        ),
                                                    },
                                                )}
                                            </div>
                                        )
                                    }

                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'create_highlight' && item.update.highlight_id != null) {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Created from highlight({{x}}) by {{user}}',
                                            {
                                                x: this.getHighlightsLabel(
                                                    item.update.highlight_id,
                                                    item.update.highlight_name,
                                                ),
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>

                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'link') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext('Linked by {{user}}', {user: item.displayName})}
                                    </div>

                                    <div>
                                        <Button
                                            text={gettext('View linked item')}
                                            onClick={() => {
                                                openArticle(item.update.linked_to, 'view');
                                            }}
                                            size="small"
                                            style="hollow"
                                        />
                                    </div>

                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'take') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Take created by {{user}}',
                                            {
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>

                                    <Spacer h gap="4">
                                        <div>{gettext('Taken as a rewrite of')}</div>
                                        <Button
                                            text={gettext('item')}
                                            onClick={() => {
                                                openArticle(item.update.rewrite_of, 'view');
                                            }}
                                            size="small"
                                            style="hollow"
                                        />
                                    </Spacer>
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'reopen') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Reopened by {{user}}',
                                            {
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'unlink') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Unlinked by {{user}}',
                                            {
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>

                                    {
                                        (() => {
                                            if (item.update.rewrite_of != null) {
                                                return gettext('Rewrite link is removed');
                                            } else if (item.update.rewritten_by != null) {
                                                return gettext('Rewritten link is removed');
                                            } else if (item.update == null) {
                                                return gettext('Take link is removed');
                                            }
                                        })()
                                    }

                                </BaseHistoryItem>
                            );
                        } else if (
                            item.operation === 'cancel_correction'
                            || item.update?.operation === 'cancel_correction'
                        ) {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Correction cancelled by {{user}}',
                                            {
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>

                                    {
                                        item.update != null && (
                                            <div>{gettext('Correction link is removed')}</div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (item.operation === 'rewrite') {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <div>
                                        {gettext(
                                            'Rewritten by {{user}}',
                                            {
                                                user: item.displayName,
                                            },
                                        )}
                                    </div>

                                    {
                                        item.update?.rewritten_by != null && (
                                            <div>
                                                <Button
                                                    text={gettext('View item')}
                                                    onClick={() => {
                                                        openArticle(item.update.rewritten_by, 'view');
                                                    }}
                                                    size="small"
                                                    style="hollow"
                                                />
                                            </div>
                                        )
                                    }
                                </BaseHistoryItem>
                            );
                        } else if (
                            item.operation === 'publish'
                            || item.operation === 'correct'
                            || item.operation === 'kill'
                            || item.operation === 'takedown'
                            || item.operation === 'unpublish'
                        ) {
                            return (
                                <BaseHistoryItem items={historyItems} current={i} key={i}>
                                    <strong>
                                        {getOperationLabel(item.operation, item.update.state)} {item.displayName}
                                    </strong>

                                    <ToggleBox variant="simple" title={gettext('Details')}>
                                        <TransmissionDetails article={this.props.article} historyItem={item} key={i} />
                                    </ToggleBox>
                                </BaseHistoryItem>
                            );
                        } else {
                            return null;
                        }
                    })
                }
            </Spacer>
        );
    }
}
