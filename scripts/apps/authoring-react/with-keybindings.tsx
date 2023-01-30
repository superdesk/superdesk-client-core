
import React from 'react';

interface IProps {
    keybindings: {
        [key: string]: () => void;
    };
}

export class WithKeybindings extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    handleKeyUp(event: KeyboardEvent) {
        for (const [hotkey, fn] of Object.entries(this.props.keybindings)) {
            const splitted = hotkey.split('+');
            const altRequired = splitted.includes('alt');
            const shiftRequired = splitted.includes('shift');
            const ctrlRequired = splitted.includes('ctrl');

            if (
                altRequired ? event.altKey : !event.altKey
                && (shiftRequired ? event.shiftKey : !event.shiftKey)
                && (ctrlRequired ? event.ctrlKey : !event.ctrlKey)
                && (splitted[splitted.length - 1] === event.key.toLowerCase())
            ) {
                fn();
                event.stopPropagation();
                break;
            }
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
