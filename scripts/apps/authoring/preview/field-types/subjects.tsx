import React from 'react';
import {ISubject} from 'superdesk-api';
import {SmallTags} from 'core/ui/components/SmallTags';

interface IProps {
    subjects: Array<ISubject>;
}

export class SubjectsPreview extends React.Component<IProps> {
    render() {
        return (
            <SmallTags
                tags={this.props.subjects.map(({qcode, name}) => ({id: qcode, label: name}))}
            />
        );
    }
}
