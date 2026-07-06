import * as React from 'react';
import {ContentListItem, Icon, IconButton, Label} from 'superdesk-ui-framework/react';
import {IListEntry} from '../interfaces';
import {superdesk} from '../superdesk';
import {formatArticleTime} from '../utils';

const {gettext} = superdesk.localization;

function isPublishedState(state: string): boolean {
    return state === 'published' || state === 'corrected';
}

function getStateLabel(entry: IListEntry): string {
    if (entry.state === 'new') {
        return entry.publishSchedule != null ? gettext('Scheduled') : gettext('In progress');
    }

    switch (entry.state) {
        case 'in_progress':
            return gettext('In progress');
        case 'scheduled':
            return gettext('Scheduled');
        case 'draft':
            return gettext('Draft');
        case 'killed':
            return gettext('Killed');
        case 'recalled':
            return gettext('Recalled');
        default:
            return entry.state;
    }
}

interface IProps {
    entry: IListEntry;

    // list-pane extras; the picker pane renders a plain row
    index?: number;
    showExtras?: boolean;
    isDuplicate?: boolean;
    willBeTrimmed?: boolean;
    onPinUnpin?(): void;
    onRemove?(): void;
}

export class ArticleRow extends React.PureComponent<IProps> {
    render() {
        const {entry, index, showExtras, isDuplicate, willBeTrimmed} = this.props;

        const itemColum: Array<{
            itemRow: Array<{content: React.ReactNode}>;
            border?: boolean;
            fullwidth?: boolean;
        }> = [];

        if (showExtras === true) {
            itemColum.push({
                itemRow: [{
                    content: isDuplicate === true
                        ? (
                            <span title={gettext('Duplicate')}>
                                <Icon name="warning-sign" type="alert" />
                            </span>
                        )
                        : (
                            <span className="sd-list-item__serial-number">
                                {(index ?? 0) + 1}
                            </span>
                        ),
                }],
                border: false,
            });
        }

        if (entry.thumbnailUrl != null) {
            itemColum.push({
                itemRow: [{
                    content: (
                        <img
                            src={entry.thumbnailUrl}
                            className="sd-list-item__thumbnail"
                            style={{maxWidth: '60px'}}
                            alt=""
                        />
                    ),
                }],
                border: false,
            });
        }

        itemColum.push({
            itemRow: [
                {
                    content: (
                        <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                            {entry.title}
                        </span>
                    ),
                },
                {
                    content: (
                        <React.Fragment>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                {
                                    entry.updated != null && (
                                        <time
                                            title={entry.created == null
                                                ? undefined
                                                : gettext('created: {{date}}', {
                                                    date: formatArticleTime(entry.created),
                                                })}
                                        >
                                            {formatArticleTime(entry.updated)}
                                        </time>
                                    )
                                }
                            </span>
                            {
                                isPublishedState(entry.state)
                                    ? entry.category != null && (
                                        <Label text={entry.category} type="success" style="hollow" />
                                    )
                                    : entry.state.length > 0 && (
                                        <Label text={getStateLabel(entry)} type="warning" style="hollow" />
                                    )
                            }
                            {
                                entry.sticky && (
                                    <Label text={gettext('pinned')} type="alert" style="hollow" />
                                )
                            }
                        </React.Fragment>
                    ),
                },
            ],
            border: false,
            fullwidth: true,
        });

        return (
            <div
                style={{opacity: willBeTrimmed === true ? 0.5 : 1}}
                data-test-id="content-list-item"
                data-test-value={entry.contentId}
            >
                <ContentListItem
                    itemColum={itemColum}
                    locked={entry.sticky}
                    action={
                        showExtras === true
                            ? (
                                <React.Fragment>
                                    <IconButton
                                        icon="pin"
                                        ariaValue={entry.sticky ? gettext('Unpin') : gettext('Pin')}
                                        onClick={() => {
                                            this.props.onPinUnpin?.();
                                        }}
                                    />
                                    <IconButton
                                        icon="trash"
                                        ariaValue={gettext('Remove')}
                                        onClick={() => {
                                            this.props.onRemove?.();
                                        }}
                                    />
                                </React.Fragment>
                            )
                            : undefined
                    }
                />
            </div>
        );
    }
}
