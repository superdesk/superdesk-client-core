import * as React from 'react';
import {ContentListItem, Icon, IconButton, Label} from 'superdesk-ui-framework/react';
import {IListEntry} from '../interfaces';
import {superdesk} from '../superdesk';
import {formatArticleTime} from '../utils';

const {gettext} = superdesk.localization;
const {getClass} = superdesk.utilities.CSS;

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

    // picker-pane extra; true when this article is already in the list (left pane)
    alreadyInList?: boolean;
}

export class ArticleRow extends React.PureComponent<IProps> {
    render() {
        const {entry, index, showExtras, isDuplicate, willBeTrimmed, alreadyInList} = this.props;

        // Dim the row when it will be trimmed (list pane) or when it is already
        // in the list (picker pane), so already-added articles read as unavailable.
        const dimmed = willBeTrimmed === true || alreadyInList === true;

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
                    content: entry.dangling
                        ? (
                            <em
                                className="sd-overflow-ellipsis sd-text--light"
                                data-test-id="content-list-item--dangling"
                            >
                                {gettext('Article no longer available')}
                            </em>
                        )
                        : (
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
                        </React.Fragment>
                    ),
                },
            ],
            border: showExtras === true,
            fullwidth: true,
        });

        // rendered as a column rather than via the `action` prop,
        // so the buttons stay visible without hovering
        if (showExtras === true) {
            itemColum.push({
                itemRow: [{
                    content: (
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span className={entry.sticky ? getClass('pin-toggle--pinned') : undefined}>
                                <IconButton
                                    icon="pin"
                                    ariaValue={entry.sticky ? gettext('Unpin') : gettext('Pin')}
                                    onClick={() => {
                                        this.props.onPinUnpin?.();
                                    }}
                                />
                            </span>
                            <IconButton
                                icon="trash"
                                ariaValue={gettext('Remove')}
                                onClick={() => {
                                    this.props.onRemove?.();
                                }}
                            />
                        </div>
                    ),
                }],
                border: false,
            });
        }

        return (
            <div
                style={{opacity: dimmed ? 0.5 : 1}}
                title={alreadyInList === true ? gettext('Already in this list') : undefined}
                data-test-id="content-list-item"
                data-test-value={entry.contentId}
            >
                <ContentListItem
                    itemColum={itemColum}
                    locked={entry.sticky}
                />
            </div>
        );
    }
}
