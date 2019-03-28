import React from 'react';
import {omit} from 'lodash';

import {ToggleBoxNext} from 'superdesk-ui-framework';
import {IFormGroup, isIFormGroupCollapsible} from './interfaces/form';
import {assertNever} from 'core/helpers/typescript-helpers';

interface IProps {
    group: IFormGroup;
}

// allows wrapping the form group into a custom display component, for example a toggle box
export class FormGroupDisplayWrapper extends React.Component<IProps> {
    render() {
        const {group} = this.props;

        if (group.type === 'inline') {
            return <div {...omit(this.props, ['group'])} />;
        } else if (isIFormGroupCollapsible(group.type)) {
            return (
                <ToggleBoxNext
                    title={group.type.label}
                    isOpen={group.type.openByDefault}
                >
                    {this.props.children}
                </ToggleBoxNext>
            );
        } else {
            assertNever(group.type);
        }
    }
}
