import React from 'react';
import {Label} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

interface IProps {
    label: string;
    icon?: {name: string, color?: string};
    privateTag?: boolean;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    'data-test-id'?: string;
}

export class DropdownOption extends React.PureComponent<IProps> {
    render() {
        const {label, icon, privateTag, onClick} = this.props;

        return (
            <button
                className="content-create-dropdown--option"
                onClick={onClick}
                data-test-id={this.props['data-test-id']}
                aria-label={label}
            >
                {
                    icon != null && (
                        <i className={`icon-${icon.name}`} style={icon.color == null ? {} : {color: icon.color}} />
                    )
                }
                <span>{label}</span>

                {
                    privateTag === true && (
                        <Label
                            text={gettext('Private')}
                            size="small"
                        />
                    )
                }
            </button>
        );
    }
}
