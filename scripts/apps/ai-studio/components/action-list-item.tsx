import React from 'react';
import {Dropdown, IconButton, Label, Spacer, SvgIconIllustration, Text} from 'superdesk-ui-framework/react';
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

export function ActionListItem({action, profiles, selected, onEdit, onDelete}: IProps) {
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
                    // The menu renders in a portal, so its clicks would otherwise also open the action
                    <span data-test-id="ai-action-menu" onClick={(event) => event.stopPropagation()}>
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
                <Spacer v gap="4">
                    <Spacer h gap="8" justifyContent="start" noGrow>
                        <Text noMargin>{action.name}</Text>
                        {action.active === false && (
                            <Label text={gettext('Inactive')} style="translucent" type="default" />
                        )}
                    </Spacer>
                    <Text size="x-small" color="light" noMargin>
                        {gettext('Content profiles:')} <strong>{getProfileNames(action, profiles)}</strong>
                        &nbsp;&nbsp;&nbsp;
                        {gettext('Max. characters:')}{' '}
                        <strong>{maxCharacters ?? gettext('from content profile')}</strong>
                    </Text>
                </Spacer>
            </BoxedListItem>
        </div>
    );
}
