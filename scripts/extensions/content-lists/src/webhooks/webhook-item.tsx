import * as React from 'react';
import {BoxedListItem, Dropdown, IconButton, Label} from 'superdesk-ui-framework/react';
import {IWebhook} from '../interfaces';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;
const {getRelativeOrAbsoluteDateTime} = superdesk.localization;
const {getClass} = superdesk.utilities.CSS;

interface IProps {
    webhook: IWebhook;
    selected: boolean;

    // not available while the editor panel is open (matches "Manage Agendas")
    onEdit: (() => void) | null;

    onDelete(): void;
}

export class WebhookItem extends React.PureComponent<IProps> {
    render() {
        const {webhook, selected, onEdit} = this.props;

        const enabled = webhook.enabled !== false;

        return (
            <BoxedListItem
                type={enabled ? 'success' : 'warning'}
                clickable={onEdit != null}
                selected={selected}
                onClick={() => {
                    onEdit?.();
                }}
                slideInActions
                actions={(
                    <Dropdown
                        items={[
                            ...(onEdit == null ? [] : [{
                                label: gettext('Edit'),
                                icon: 'pencil',
                                onSelect: () => {
                                    onEdit();
                                },
                            }]),
                            {
                                label: gettext('Remove'),
                                icon: 'trash',
                                onSelect: () => {
                                    this.props.onDelete();
                                },
                            },
                        ]}
                    >
                        <IconButton
                            icon="dots-vertical"
                            size="small"
                            ariaValue={gettext('Actions')}
                            onClick={() => false}
                        />
                    </Dropdown>
                )}
            >
                <div
                    className={getClass('webhook-item')}
                    data-test-id="webhook-item"
                    data-test-value={webhook.url}
                >
                    <span className={getClass('webhook-item-url')}>{webhook.url}</span>
                    {
                        !enabled && (
                            <Label
                                text={gettext('Disabled')}
                                type="warning"
                                style="translucent"
                            />
                        )
                    }
                    {
                        webhook._updated != null && (
                            <time className={getClass('webhook-updated-time')}>
                                {
                                    gettext('updated {{date}}', {
                                        date: getRelativeOrAbsoluteDateTime(webhook._updated, 'HH:mm, DD.MM.YYYY'),
                                    })
                                }
                            </time>
                        )
                    }
                </div>
            </BoxedListItem>
        );
    }
}
