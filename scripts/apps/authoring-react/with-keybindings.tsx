
import React from 'react';

interface IProps {
    keyBindings: {
        [key: string]: () => void;
    };
}

export class WithKeyBindings extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    handleKeyUp(event: KeyboardEvent) {
        const matchingKeyBinding: string | null = Object.keys(this.props.keyBindings).find((hotkey) => {
            const split = hotkey.split('+');
            const altRequired = split.includes('alt');
            const shiftRequired = split.includes('shift');
            const ctrlRequired = split.includes('ctrl');

            return (altRequired ? event.altKey : !event.altKey)
            && (shiftRequired ? event.shiftKey : !event.shiftKey)
            && (ctrlRequired ? event.ctrlKey : !event.ctrlKey)
            && (split[split.length - 1] === event.key.toLowerCase());
        });

        if (matchingKeyBinding != null) {
            event.stopPropagation();

            this.props.keyBindings[matchingKeyBinding]();
        }
    }

    componentDidMount() {
        window.addEventListener('keyup', this.handleKeyUp);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    render(): React.ReactNode {
        return this.props.children;
    }
}
