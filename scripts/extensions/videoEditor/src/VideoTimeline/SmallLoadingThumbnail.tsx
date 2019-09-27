import * as React from 'react';

export function SmallLoadingThumbnail() {
    return (
        <svg
            width="200px"
            height="200px"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid"
            className="lds-eclipse"
            style={{ animationPlayState: 'running', animationDelay: '0s', background: 'none' }}
        >
            <path
                stroke="none"
                d="M10 50A40 40 0 0 0 90 50A40 42 0 0 1 10 50"
                fill="#00E0FF"
                style={{ animationPlayState: 'running', animationDelay: '0s' }}
            >
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    calcMode="linear"
                    values="0 50 51;360 50 51"
                    keyTimes="0;1"
                    dur="1s"
                    begin="0s"
                    repeatCount="indefinite"
                    style={{ animationPlayState: 'running', animationDelay: '0s' }}
                ></animateTransform>
            </path>
        </svg>
    );
}
