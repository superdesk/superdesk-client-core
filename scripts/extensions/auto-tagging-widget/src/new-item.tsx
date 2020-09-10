import * as React from 'react';
import { ITagGroup, getGroupLabel, INewItem } from './auto-tagging';
import { ISuperdesk } from 'superdesk-api';

import { Input, Select, Option } from 'superdesk-ui-framework/react';

interface IProps {
    item: Partial<INewItem>;
    onChange(item: Partial<INewItem>): void;
    save(item: INewItem): void;
    cancel(): void;
}

export function getNewItemComponent(superdesk: ISuperdesk): React.ComponentType<IProps> {
    const { gettext } = superdesk.localization;

    return class NewItem extends React.PureComponent<IProps> {
        render() {
            const { item, onChange, save, cancel } = this.props;
            const savingDisabled = (item.title?.trim().length ?? 0) < 1 || item?.group == null;

            return (
                <div className="sd-card auto-tagging-widget__card-absolute">
                    <div className="sd-card__header sd-card__header--white">
                        <div className="sd-card__heading">{gettext('Add keyword')}</div>
                    </div>
                    <div className="sd-card__content">
                        <div className='form__row'>
                            <Input label={gettext('Title')}
                                value={item.title ?? ''}
                                onChange={(event) => {
                                    onChange({
                                        ...item,
                                        title: event,
                                    });
                                }} />
                        </div>

                        <div className='form__row'>
                            <Select label={gettext('Type')} value={item.group ?? ''}
                                onChange={(event) => {
                                    const group = event === '' ? undefined : event as ITagGroup;

                                    onChange({
                                        ...item,
                                        group: group,
                                    });
                                }}>
                                <Option>{gettext('Select type')}</Option>
                                {
                                    Object.values(ITagGroup)
                                        .map((group) => (
                                            <Option key={group} value={group}>{getGroupLabel(group, superdesk)}</Option>
                                        ))
                                }
                            </Select>
                        </div>
                    </div>
                    <div className="sd-card__footer">
                        <button className="btn btn--primary"
                            disabled={savingDisabled}
                            onClick={() => {
                                const title = item.title;
                                const group = item.group;

                                if (title != null && group != null) {
                                    save({ title: title, group: group });
                                }
                            }}>
                            {gettext('Add')}
                        </button>

                        <button className="btn" onClick={() => cancel()}>
                            {gettext('Cancel')}
                        </button>
                    </div>
                </div>
            );
        }
    };
}
