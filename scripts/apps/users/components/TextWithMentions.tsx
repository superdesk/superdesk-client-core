import React from 'react';

// mentionRegexp matches mentions in the comment body. It captures $1(name), $2(type), $3(id)
// the format is: @[name](type:id)
// eslint-disable-next-line no-useless-escape
const mentionRegexp = /@\[([^\]]+)\]\((desk|user):([^\)]+)\)/g;

/*
 * @ngdoc React
 * @module superdesk.apps.users
 * @name TextWithMentions
 * @description Displays a text containing mentions.
 */

export interface IProps {
    message: string;
}

export const TextWithMentions: React.FunctionComponent<IProps> = ({message}) => {
    const n = message.length;

    const r = []; // array of components to render
    let m; // regexp match
    let lastEnd = 0; // end index of last match

    do {
        m = mentionRegexp.exec(message);

        if (m) {
            const [match, name, type, id] = m;

            if (lastEnd < m.index) {
                // push the previous slice of plain text
                r.push(message.slice(lastEnd, m.index));
            }
            if (type === 'user') {
                // push a user mention
                r.push(<a key={id} href={'/#/users/' + id}>{name}</a>);
            } else {
                // push a desk tag
                r.push(<span key={id}>{'#' + name.replace(' ', '_')}</span>);
            }
            // place lastEnd after last match
            lastEnd = m.index + match.length;
        }
    } while (m);

    if (lastEnd < n) {
        // push whatever is left
        r.push(message.slice(lastEnd, n));
    }

    return <div className="text-with-mentions">{r}</div>;
};
