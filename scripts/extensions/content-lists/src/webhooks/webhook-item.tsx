import * as React from 'react';
import {ContentListItem, IconButton, Label} from 'superdesk-ui-framework/react';
import {IContentList, IWebhook} from '../interfaces';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;
const {getRelativeOrAbsoluteDateTime} = superdesk.localization;

interface IProps {
    webhook: IWebhook;
    lists: Array<IContentList>;

    // not available while the editor panel is open (matches "Manage Agendas")
    onEdit: (() => void) | null;

    onDelete(): void;
}

export class WebhookItem extends React.PureComponent<IProps> {
    render() {
        const {webhook, lists, onEdit} = this.props;

        const enabled = webhook.enabled !== false;
        const excludedListNames = (webhook.excluded_lists ?? [])
            .map((listId) => lists.find(({_id}) => _id === listId)?.name)
            .filter((name): name is string => name != null);

        return (
            <div data-test-id="webhook-item" data-test-value={webhook.url}>
                <ContentListItem
                    activated={enabled}
                    itemColum={[
                        {
                            itemRow: [
                                {
                                    content: (
                                        <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                                            {webhook.url}
                                        </span>
                                    ),
                                },
                                {
                                    content: (
                                        <React.Fragment>
                                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                                {
                                                    webhook._updated != null && (
                                                        <time>
                                                            {
                                                                gettext('updated {{date}}', {
                                                                    date: getRelativeOrAbsoluteDateTime(
                                                                        webhook._updated,
                                                                        'HH:mm, DD.MM.YYYY',
                                                                    ),
                                                                })
                                                            }
                                                        </time>
                                                    )
                                                }
                                            </span>
                                            {
                                                excludedListNames.map((name) => (
                                                    <Label
                                                        key={name}
                                                        text={name}
                                                        type="alert"
                                                        style="hollow"
                                                    />
                                                ))
                                            }
                                            <Label
                                                text={enabled ? gettext('enabled') : gettext('disabled')}
                                                type={enabled ? 'success' : 'warning'}
                                                style="filled"
                                            />
                                        </React.Fragment>
                                    ),
                                },
                            ],
                            border: false,
                            fullwidth: true,
                        },
                    ]}
                    action={(
                        <React.Fragment>
                            {
                                onEdit != null && (
                                    <IconButton
                                        icon="pencil"
                                        ariaValue={gettext('Edit')}
                                        onClick={() => {
                                            onEdit();
                                        }}
                                    />
                                )
                            }
                            <IconButton
                                icon="trash"
                                ariaValue={gettext('Remove')}
                                onClick={() => {
                                    this.props.onDelete();
                                }}
                            />
                        </React.Fragment>
                    )}
                />
            </div>
        );
    }
}
