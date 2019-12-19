import * as React from 'react';

export class BarIcon extends React.PureComponent {
    render() {
        return (
            /* Material Design icon, released under Apache 2.0 License
             * https://github.com/google/material-design-icons/blob/master/LICENSE
             */
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="30"
                viewBox="0 0 24 24"
                style={{position: 'absolute', top: -10}}
            >
                <path fill="none" d="M0 0h24v24H0V0z" />
                <path
                    d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
                    fill="white"
                />
            </svg>
        );
    }
}
