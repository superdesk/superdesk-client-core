import * as React from 'react';
import {IVocabularyItem} from 'superdesk-api';
import {Label} from 'superdesk-ui-framework';

interface IProps {
    subitem: IVocabularyItem;
}

export class SubitemLabel extends React.PureComponent<IProps> {
    render() {
        const {name, color} = this.props.subitem;

        return (
            <Label
                text={name}
                hexColor={color}
                style="translucent"
                size="normal"
            />
        );
    }
}
