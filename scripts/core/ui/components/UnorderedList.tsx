import React, {CSSProperties} from 'react';

interface IProps {
    items: Array<string>;
}

// Defaults taken from Chromium 96
const defaultStyles: CSSProperties = {
    listStyleType: 'disc',
    marginBlockStart: 13,
    marginBlockEnd: 13,
    paddingInlineStart: 40,
};

export class UnorderedList extends React.PureComponent<IProps> {
    render() {
        return (
            <ul style={defaultStyles}>
                {
                    this.props.items.map((item, i) => <li key={i}>{item}</li>)
                }
            </ul>
        );
    }
}
