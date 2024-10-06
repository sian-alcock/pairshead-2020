import React, {ReactElement, useState, useRef} from "react"
import MenuButton from "../../atoms/MenuButton/MenuButton"
import "./menu.scss"
import { Link } from "react-router-dom";
import Auth from "../../../lib/Auth";
import { IconButton } from "../../atoms/IconButton/IconButton";
import { AnimatePresence, motion } from 'framer-motion';
import FocusTrap from "../../hooks/useFocusTrap";
import useOnClickOutside from '../../hooks/useOnClickOutside';

interface ChildMenuItem {
  link: string;
  title: string;
  authenticated: boolean;
}

interface MenuItem  {
  parentItem: string;
  link: string;
  authenticated: boolean;
  key: number | undefined;
  items: ChildMenuItem[];
}

export type MenuProps = {
  menuItems: MenuItem[];
}

export default function Menu({menuItems}: MenuProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const noClickOutsideRef = useRef<HTMLInputElement>(null);

  const openMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  const closeMenu = (): void => {
    setIsOpen(false);
  };

  const openMenu = (): void => {
    setIsOpen(true);
    // Prevent body from scrolling when Header is open
    document.body.classList.add('lock-scroll');
  };

  useOnClickOutside(noClickOutsideRef, () => closeMenu());

  // Not sure how to make this work... what is it even doing?
  //   componentDidUpdate(prevProps) {
  //     if(prevProps.location.pathname !== this.props.location.pathname) {
  //       this.setState({ navbarOpen: false })
  //     }
  //   }

  return (
    <>
    <div className="menu__menu-button">
      <span>Menu</span>
      <IconButton
        icon="hamburger"
        onClick={openMenu}
        title="Open menu"
        ariaControls="header"
        ref={openMenuButtonRef}
        ariaExpanded={isOpen}
      />
    </div>
    {isOpen && <div className="menu__overlay"></div>}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="menu__open"
              initial={{ x: '100%' }}
              animate={{ x: '0' }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              key="menu__open"
              ref={noClickOutsideRef}
            >
              <FocusTrap>
                <div className="menu__nav">
                  <div className="menu__top-container">
                    <div className="menu__right-wrapper">
                      <div className="menu__menu-button menu__menu-button--close">
                        <span>Close</span>
                        <IconButton
                          icon="cross"
                          onClick={closeMenu}
                          title="Close menu"
                          ariaControls="menu"
                        />
                      </div>
                      
                      <ul className='menu__container'>
                          {menuItems.map((item) => <li className='menu__item' key={item.key}>
                          {item.authenticated ? Auth.isAuthenticated() && <Link to={item.link}><h2 className="menu__item-header">{item.parentItem}</h2></Link> : <Link to={item.link}><h2 className="menu__item-header">{item.parentItem}</h2></Link>}
                            <ul>{item.items.map((item, idx) => <li key={idx}>
                              {item.authenticated ? Auth.isAuthenticated() && <Link to={item.link} className="menu__item-link">{item.title}</Link> : <Link to={item.link} className="menu__item-link">{item.title}</Link>}
                            </li>)}</ul>
                          </li>
                          )}
                        </ul>
                    </div>
                  </div>
                </div>
              </FocusTrap>
            </motion.div>
          )}
          
        </AnimatePresence>
        </>
          )
        }
