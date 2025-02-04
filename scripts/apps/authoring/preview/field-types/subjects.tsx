import React from 'react';
import {SmallTags} from 'core/ui/components/SmallTags';

interface IProps {
    subjects: Array<{qcode: string; name: string}>;
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
