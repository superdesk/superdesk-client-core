import React from 'react';
import {Dropdown, IconButton, Label, SvgIconIllustration, Text} from 'superdesk-ui-framework/react';
import {BoxedListItem} from 'superdesk-ui-framework/react/components/Lists';
import type {IContentProfile} from 'superdesk-api';
import {gettext} from 'core/utils';
import type {IAIAction} from '../interfaces';
import {getActionTypeIllustration} from '../helpers/labels';

interface IProps {
    action: IAIAction;
    profiles: Array<IContentProfile>;
    selected: boolean;
    onEdit(): void;
    onDelete(): void;
}

function getProfileNames(action: IAIAction, profiles: Array<IContentProfile>): string {
    if ((action.content_profiles ?? []).length < 1) {
        return gettext('All');
    }

    return action.content_profiles
        .map((id) => profiles.find(({_id}) => _id === id)?.label ?? id)
        .join(' / ');
}

export class ActionListItem extends React.PureComponent<IProps> {
    render() {
        const {action, profiles, selected, onEdit, onDelete} = this.props;
        const maxCharacters = action.parameters?.max_characters;

        return (
            <div className="ai-studio-action-item" data-test-id="ai-action-item" data-test-value={action.name}>
                <BoxedListItem
                    alignVertical="center"
                    density="compact"
                    clickable
                    selected={selected}
                    media={<SvgIconIllustration illustration={getActionTypeIllustration(action.action_type)} />}
                    onClick={onEdit}
                    actions={(
                        // The menu is rendered in a portal outside the actions element, so a click in
                        // it would otherwise reach the row and open the action as well
                        <span onClick={(event) => event.stopPropagation()}>
                            <Dropdown
                                align="right"
                                items={[
                                    {
                                        label: <span data-test-id="ai-action-edit">{gettext('Edit')}</span>,
                                        icon: 'pencil',
                                        onSelect: onEdit,
                                    },
                                    {
                                        label: <span data-test-id="ai-action-delete">{gettext('Delete')}</span>,
                                        icon: 'trash',
                                        onSelect: onDelete,
                                    },
                                ]}
                            >
                                <IconButton
                                    icon="dots-vertical"
                                    size="small"
                                    ariaValue={gettext('Actions')}
                                    onClick={() => undefined}
                                />
                            </Dropdown>
                        </span>
                    )}
                >
                    <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                            <Text noMargin>{action.name}</Text>
                            {action.active === false && (
                                <Label text={gettext('Inactive')} style="translucent" type="default" />
                            )}
                        </div>
                        <Text size="x-small" color="light" noMargin>
                            {gettext('Content profiles:')} <strong>{getProfileNames(action, profiles)}</strong>
                            &nbsp;&nbsp;&nbsp;
                            {gettext('Max. characters:')}{' '}
                            <strong>{maxCharacters ?? gettext('from content profile')}</strong>
                        </Text>
                    </div>
                </BoxedListItem>
            </div>
        );
    }
}
