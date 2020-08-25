import * as React from 'react';
import {ITagGroup, getGroupLabel, INewItem} from './auto-tagging';
import {ISuperdesk} from 'superdesk-api';

interface IProps {
    item: Partial<INewItem>;
    onChange(item: Partial<INewItem>): void;
    save(item: INewItem): void;
    cancel(): void;
}

export function getNewItemComponent(superdesk: ISuperdesk): React.ComponentType<IProps> {
    const {gettext} = superdesk.localization;

    return class NewItem extends React.PureComponent<IProps> {
        render() {
            const {item, onChange, save, cancel} = this.props;
            const savingDisabled = (item.title?.trim().length ?? 0) < 1 || item?.group == null;

            return (
                <div>
                    <h4>{gettext('Add new')}</h4>

                    <label>{gettext('Title')}</label>

                    <input
                        type="text"
                        value={item.title ?? ''}
                        onChange={(event) => {
                            onChange({
                                ...item,
                                title: event.target.value,
                            });
                        }}
                    />

                    <label>{gettext('Group')}</label>

                    <select
                        value={item.group ?? ''}
                        onChange={(event) => {
                            const group = event.target.value === '' ? undefined : event.target.value as ITagGroup;

                            onChange({
                                ...item,
                                group: group,
                            });
                        }}
                    >
                        <option value="" />
                        {
                            Object.values(ITagGroup)
                                .map((group) => (
                                    <option key={group} value={group}>{getGroupLabel(group, superdesk)}</option>
                                ))
                        }
                    </select>

                    <div>
                        <button
                            disabled={savingDisabled}
                            onClick={() => {
                                const title = item.title;
                                const group = item.group;

                                if (title != null && group != null) {
                                    save({title: title, group: group});
                                }
                            }}
                        >
                            {gettext('Save')}
                        </button>

                        <button
                            onClick={() => cancel()}
                        >
                            {gettext('Cancel')}
                        </button>
                    </div>
                </div>
            );
        }
    };
}
