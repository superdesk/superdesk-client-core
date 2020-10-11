import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createPopper } from '@popperjs/core';
import { useId } from "react-id-generator";

export interface IMenuItem {
    label: string;
    icon?: string;
    onSelect(): void;
}

export interface ISubmenu {
    type: 'submenu';
    label: string;
    icon?: string;
    items: Array<IMenuItem | ISubmenu | IMenuGroup | 'divider'>;
}

export interface IMenuGroup {
    type: 'group';
    label?: string;
    items: Array<IMenuItem | ISubmenu | IMenuGroup | 'divider'>;
}

interface IMenu {
    label?: string;
    align?: 'left' | 'right';
    items: Array<IMenuItem | ISubmenu | IMenuGroup | 'divider'>;
    header?: Array<IMenuItem | ISubmenu | IMenuGroup | 'divider'>;
    footer?: Array<IMenuItem | ISubmenu | IMenuGroup | 'divider'>;
    append?: boolean;
    children: React.ReactNode;
}

export const Dropdown = ({
    items,
    header,
    footer,
    children,
    append,
    align,
}: IMenu) => {
    const [open, setOpen] = React.useState(false);
    const [change, setChange] = React.useState(false);
    const [menuID] = useId();
    const DROPDOWN_ID = "react-placeholder";
    const ref = React.useRef(null);
    const refSubMenu = React.useRef(null);
    const buttonRef = React.useRef(null);
    const refButtonSubMenu = React.useRef(null);
    const headerElements = header?.map((el, index) => {
        return each(el, index);
    });

    const dropdownElements = items.map((el, index) => {
        return each(el, index);
    });

    const footerElements = footer?.map((el, index) => {
        return each(el, index);
    });
    React.useEffect(() => {
        const existingElement = document.getElementById(DROPDOWN_ID);
        if (!existingElement) {
            const el = document.createElement("div");
            el.id = DROPDOWN_ID;
            // style placeholder
            el.style.position = 'absolute';
            el.style.top = '0';
            el.style.left = '0';
            el.style.width = '1px';
            el.style.height = '1px';

            document.body.appendChild(el);
        }

    }, [change]);

    React.useLayoutEffect(() => {
        if (append && change) {
            addInPlaceholder();
        }
        setChange(true);

    }, [open]);

    // structure for append menu
    function createAppendMenu() {
        if (header && footer) {
            return (
                <div className='dropdown__menu dropdown__menu--has-head-foot'
                    id={menuID}
                    ref={ref}>
                    <ul className='dropdown__menu-header'>
                        {headerElements}
                    </ul>
                    <ul className='dropdown__menu-body'>
                        {dropdownElements}
                    </ul>
                    <ul className='dropdown__menu-footer dropdown__menu-footer--has-list '>
                        {footerElements}
                    </ul>
                </div>
            );
        } else if (header) {
            return (
                <div className='dropdown__menu dropdown__menu--has-head-foot'
                    id={menuID}
                    ref={ref}>
                    <ul className='dropdown__menu-header'>
                        {headerElements}
                    </ul>
                    <ul className='dropdown__menu-body'>
                        {dropdownElements}
                    </ul>
                </div>
            );
        } else if (footer) {
            return (
                <div className='dropdown__menu dropdown__menu--has-head-foot'
                    id={menuID}
                    ref={ref}>
                    <ul className='dropdown__menu-body'>
                        {dropdownElements}
                    </ul>
                    <ul className='dropdown__menu-footer dropdown__menu-footer--has-list '>
                        {footerElements}
                    </ul>
                </div>
            );
        } else {
            return (
                <ul className='dropdown__menu '
                    id={menuID}
                    ref={ref}>
                    {dropdownElements}
                </ul>
            );
        }
    }

    // toggle menu
    function toggleDisplay() {
        if (!open) {
            setOpen(true);
            if (!append) {
                let menuRef = ref.current;
                let toggleRef = buttonRef.current;
                if (toggleRef && menuRef) {
                    createPopper(toggleRef, menuRef, {
                        placement: checkAlign() ? 'bottom-end' : 'bottom-start',
                    });
                }
            } else {
                setTimeout(() => {
                    let menuRef: any = ref.current;
                    let toggleRef = buttonRef.current;
                    if (toggleRef && menuRef) {
                        createPopper(toggleRef, menuRef, {
                            placement: checkAlign() ? 'bottom-end' : 'bottom-start',
                            strategy: 'fixed',
                        });
                        menuRef.style.display = 'block';
                    }
                }, 0);

            }
            document.addEventListener('click', closeMenu);
        } else {
            setOpen(false);
        }
    }

    function closeMenu() {
        document.removeEventListener('click', closeMenu);
        setOpen(false);
    }

    function checkAlign() {
        if (align === 'right') {
            return true;
        } else {
            return false;
        }
    }

    function addInPlaceholder() {
        const placeholder = document.getElementById(DROPDOWN_ID);
        let menu = createAppendMenu();
        if (open) {
            return ReactDOM.render(menu, placeholder);
        } else {
            const menuDOM = document.getElementById(menuID);
            if (menuDOM) {
                menuDOM.style.display = 'none';
            }
        }
    }

    function each(item: any, index: number) {
        if (item['type'] === 'submenu') {
            let submenuItems: any = [];
            item['items'].forEach((el: any, key: number) => {
                submenuItems.push(each(el, key));
            });
            return (
                <li key={index}>
                    <div className='dropdown' >
                        <button
                            ref={refButtonSubMenu}
                            className='dropdown__toggle dropdown-toggle'
                            onMouseOver={() => {
                                let subMenuRef = refSubMenu.current;
                                let subToggleRef = refButtonSubMenu.current;
                                if (subMenuRef && subToggleRef) {
                                    createPopper(subToggleRef, subMenuRef, {
                                        placement: 'right-start',
                                    });
                                }
                            }}
                            onClick={item['onSelect']}>
                            {item['icon'] ? <i className={'icon-' + item['icon']}></i> : null}
                            {item['label']}
                        </button>
                        <ul ref={refSubMenu}
                            className='dropdown__menu'>
                            {submenuItems}
                        </ul>
                    </div>
                </li>
            );
        } else if (item['type'] === 'group') {
            let groupItems: any = [];
            item['items'].forEach((el: any, key: number) => {
                groupItems.push(each(el, key));
            });
            return (
                <React.Fragment key={index}>
                    <li>
                        <div className="dropdown__menu-label">{item['label']}</div>
                    </li>
                    {groupItems}
                </React.Fragment>
            );
        } else if (item === 'divider') {
            return (<li className="dropdown__menu-divider" key={index}></li>);
        } else {
            return (
                <DropdownItem
                    key={index}
                    label={item['label']}
                    icon={item['icon']}
                    onSelect={item['onSelect']} />);
        }
    }

    return (
        <div className={'dropdown ' + (open ? 'open' : '')} >
            {typeof children === 'object' ?
                (React.isValidElement(children) ?
                    <div ref={buttonRef} style={{ display: 'content' }}>
                        {React.cloneElement(children, {
                            className: children.props.className ? (children.props.className + ' dropdown__toggle dropdown-toggle') : 'dropdown__toggle dropdown-toggle',
                            onClick: toggleDisplay,
                            ref: buttonRef,
                        })}
                    </div> : null)
                :
                <button ref={buttonRef}
                    className=' dropdown__toggle dropdown-toggle'
                    onClick={toggleDisplay}>
                    {children}
                    <span className="dropdown__caret"></span>
                </button>}

            {append ?
                null : (function() {
                    if (header && footer) {
                        return (
                            <div className='dropdown__menu dropdown__menu--has-head-foot' ref={ref} >
                                <ul className='dropdown__menu-header'>
                                    {headerElements}
                                </ul>
                                <ul className='dropdown__menu-body'>
                                    {dropdownElements}
                                </ul>
                                <ul className='dropdown__menu-footer dropdown__menu-footer--has-list '>
                                    {footerElements}
                                </ul>
                            </div>
                        );
                    } else if (header) {
                        return (
                            <div className='dropdown__menu dropdown__menu--has-head-foot' ref={ref} >
                                <ul className='dropdown__menu-header'>
                                    {headerElements}
                                </ul>
                                <ul className='dropdown__menu-body'>
                                    {dropdownElements}
                                </ul>
                            </div>
                        );
                    } else if (footer) {
                        return (
                            <div className='dropdown__menu dropdown__menu--has-head-foot' ref={ref} >
                                <ul className='dropdown__menu-body'>
                                    {dropdownElements}
                                </ul>
                                <ul className='dropdown__menu-footer dropdown__menu-footer--has-list '>
                                    {footerElements}
                                </ul>
                            </div>
                        );
                    } else {
                        return (
                            <ul className='dropdown__menu' ref={ref} >
                                {dropdownElements}
                            </ul>
                        );
                    }
                })()}
        </div >
    );
};

const DropdownItem = ({
    label,
    icon,
    onSelect,
}: IMenuItem) => {
    return (
        <li><button onClick={onSelect}><i className={icon ? ('icon-' + icon) : ''}></i>{label}</button></li>
    );

};
