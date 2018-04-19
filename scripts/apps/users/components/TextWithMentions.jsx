import React from 'react';
import PropTypes from 'prop-types';

// mentionRegexp matches mentions in the comment body. It captures $1(name), $2(type), $3(id)
// the format is: @[name](type:id)
const mentionRegexp = /@\[([^\]]+)\]\((desk|user):([^\)]+)\)/g;

/*
 * @ngdoc React
 * @module superdesk.apps.users
 * @name TextWithMentions
 * @description Displays a text containing mentions.
 */
export const TextWithMentions = ({children, ...props}) => {
    const msg = children;
    const n = msg.length;

    let r = []; // array of components to render
    let m; // regexp match
    let lastEnd = 0; // end index of last match

    do {
        m = mentionRegexp.exec(msg);

        if (m) {
            let [match, name, type, id] = m;

            if (lastEnd < m.index) {
                // push the previous slice of plain text
                r.push(msg.slice(lastEnd, m.index));
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
        r.push(msg.slice(lastEnd, n));
    }

    return <div className="text-with-mentions" {...props}>{r}</div>;
};

TextWithMentions.propTypes = {
    children: PropTypes.string.isRequired,
};
