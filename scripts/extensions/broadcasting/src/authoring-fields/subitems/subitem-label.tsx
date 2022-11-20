import * as React from 'react';
import {IVocabularyItem} from 'superdesk-api';
import {superdesk} from '../../superdesk';

const {getTextColor} = superdesk.utilities;

interface IProps {
    subitem: IVocabularyItem;
}

export class SubitemLabel extends React.PureComponent<IProps> {
    render() {
        const {name, color} = this.props.subitem;

        return (
            <span
                style={{
                    display: 'inline-block',
                    background: color ?? undefined,
                    color: color == null ? undefined : getTextColor(color),
                    padding: 4,
                    borderRadius: 4,
                }}
            >
                {name}
            </span>
        );
    }
}
