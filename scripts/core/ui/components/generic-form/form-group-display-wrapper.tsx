import React from 'react';
import {omit} from 'lodash';

import {ToggleBox} from 'superdesk-ui-framework';
import {isIFormGroupCollapsible} from './interfaces/form';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IFormGroup} from 'superdesk-api';

interface IProps<T extends object> {
    group: IFormGroup<T>;
}

// allows wrapping the form group into a custom display component, for example a toggle box
export class FormGroupDisplayWrapper<T extends object> extends React.Component<IProps<T>> {
    render() {
        const {group} = this.props;

        if (group.type === 'inline') {
            return <div {...omit(this.props, ['group'])} />;
        } else if (isIFormGroupCollapsible(group.type)) {
            return (
                <ToggleBox
                    variant="simple"
                    title={group.type.label}
                    initiallyOpen={group.type.openByDefault}
                >
                    {this.props.children}
                </ToggleBox>
            );
        } else {
            assertNever(group.type);
        }
    }
}
