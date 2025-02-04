import React from 'react';

interface IProps {
    tags: Array<{id: string; label: string}>;
}

export class SmallTags extends React.PureComponent<IProps> {
    render() {
        return (
            <div style={{display: 'flex'}}>
                {this.props.tags.map((tag) => (
                    <span key={tag.id} className="small-tag" style={{marginInlineEnd: 4}}>{tag.label}</span>
                ))}
            </div>
        );
    }
}
