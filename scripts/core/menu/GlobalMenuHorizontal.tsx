import React from "react";
import {flatMap} from "lodash";
import {extensions} from "core/extension-imports.generated";

export class GlobalMenuHorizontal extends React.PureComponent {
    render() {
        const globalMenuHorizontalItems = flatMap(
            Object.values(extensions).map(({activationResult}) => activationResult),
            (activationResult) =>
                activationResult.contributions != null
                && activationResult.contributions.globalMenuHorizontal != null
                    ? activationResult.contributions.globalMenuHorizontal
                    : [],
        );

        return (
            <div>
                {globalMenuHorizontalItems.map((Component, i) => (<Component key={i} />))}
            </div>
        );
    }
}
