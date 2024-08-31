import React, { ReactElement } from "react";

export type IconType =
  | 'chevron-down'
  | 'chevron-right'
  | 'arrow-right'
  | 'arrow-right-large'
  | 'hamburger'
  | 'cross'
  | 'slim-cross'
  | 'arrow-left'
  | 'search'
  | 'arrow-down'
  | 'home'
  | 'rocket'
  | 'menu'
  | 'success'
  | 'clock-spinner'
  | 'warning';

export type IconProps = {
  icon: IconType;
  name?: string;
  ariaHidden?: boolean;
};

export default function Icon({
  icon,
  ariaHidden = false
}: IconProps): ReactElement {
  switch (icon) {
    case "chevron-down":
      return (
        <svg
          className="icon__chevron-down"
          width="24"
          height="24"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden={ariaHidden}
        >
          <path d="M36 18L24 30L12 18" stroke="currentColor" strokeWidth="2" />
        </svg>
      );

    case "arrow-right":
      return (
        <svg
          className="icon__arrow-right"
          width="17"
          height="24"
          viewBox="0 0 17 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden={ariaHidden}
        >
          <path d="M0 12H12" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7L12 12L7 17" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg
          className="icon__chevron-right"
          width="11"
          height="18"
          viewBox="0 0 11 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden={ariaHidden}
        >
          <path d="M0.999999 1L9 9L1 17" stroke="black" strokeWidth="1.5" />
        </svg>
      );
    case "hamburger":
      return (
        <svg
          className=""
          width="12"
          height="11"
          viewBox="0 0 12 11"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden={ariaHidden}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.0002 2.25H0.000183105V0.75H12.0002V2.25ZM12.0002 6.25H0.000183105V4.75H12.0002V6.25ZM0.000183105 10.25H12.0002V8.75H0.000183105V10.25Z"
            fill="white"
          />
        </svg>
      );
    case "cross":
      return (
        <svg
          className=""
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden={ariaHidden}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.00006 6.06072L8.46973 9.53039L9.53039 8.46973L6.06072 5.00006L9.53039 1.53039L8.46973 0.469727L5.00006 3.9394L1.53039 0.469727L0.469727 1.53039L3.9394 5.00006L0.469727 8.46973L1.53039 9.53039L5.00006 6.06072Z"
            fill="black"
          />
        </svg>
      );
    case "arrow-left":
      return (
        <svg
          className="icon__arrow-left"
          width="14"
          height="12"
          viewBox="0 0 14 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14 6H2" stroke="white" strokeWidth="1.5" />
          <path d="M7 11L2 6L7 1" stroke="white" strokeWidth="1.5" />
        </svg>
      );
    case "search":
      return (
        <svg
          className="icon__search"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden={ariaHidden}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 16.5C9.51472 16.5 7.5 14.4853 7.5 12C7.5 9.51472 9.51472 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5ZM12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 13.3865 17.5297 14.6632 16.7399 15.6792L18.5303 17.4696L17.4697 18.5303L15.6792 16.7399C14.6632 17.5297 13.3865 18 12 18Z"
            fill="currentColor"
          />
        </svg>
      );
    case "arrow-down":
      return (
        <svg
          className="icon__arrow-down"
          width="26"
          height="30"
          viewBox="0 0 26 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden={ariaHidden}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.0001 25.5858L24.293 15.2929L25.7072 16.7071L13.7072 28.7071L13.0001 29.4142L12.293 28.7071L0.292969 16.7071L1.70718 15.2929L12.0001 25.5858V0H14.0001V25.5858Z"
            fill="currentColor"
          />
        </svg>
      );
    case "slim-cross":
      return (
        <svg
          className="icon__slim-cross"
          aria-hidden={ariaHidden}
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M25.4141 24.0001L33.7071 15.7071L32.2928 14.2929L23.9999 22.5859L15.7071 14.2931L14.2928 15.7073L22.5856 24.0001L14.2928 32.2929L15.7071 33.7071L23.9999 25.4143L32.2928 33.7073L33.7071 32.2931L25.4141 24.0001Z"
            fill="#0D0D0D"
          />
        </svg>
      );

    case "rocket":
      return (
        <svg
          className="icon__rocket"
          aria-hidden={ariaHidden}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 13C3.17 13 2.42 13.34 1.88 13.88C0.7 15.06 0 20 0 20C0 20 4.94 19.3 6.12 18.12C6.66 17.58 7 16.83 7 16C7 14.34 5.66 13 4 13ZM4.71 16.71C4.43 16.99 2.54 17.47 2.54 17.47C2.54 17.47 3.01 15.59 3.3 15.3C3.47 15.11 3.72 15 4 15C4.55 15 5 15.45 5 16C5 16.28 4.89 16.53 4.71 16.71ZM15.42 11.65C21.78 5.28999 19.66 0.339994 19.66 0.339994C19.66 0.339994 14.71 -1.78001 8.35 4.57999L5.86 4.07999C5.21 3.94999 4.53 4.15999 4.05 4.62999L0 8.68999L5 10.83L9.17 15L11.31 20L15.36 15.95C15.83 15.48 16.04 14.8 15.91 14.14L15.42 11.65ZM5.41 8.82999L3.5 8.00999L5.47 6.03999L6.91 6.32999C6.34 7.15999 5.83 8.02999 5.41 8.82999ZM11.99 16.5L11.17 14.59C11.97 14.17 12.84 13.66 13.66 13.09L13.95 14.53L11.99 16.5ZM14 10.24C12.68 11.56 10.62 12.64 9.96 12.97L7.03 10.04C7.35 9.38999 8.43 7.32999 9.76 5.99999C14.44 1.31999 17.99 2.00999 17.99 2.00999C17.99 2.00999 18.68 5.55999 14 10.24ZM13 8.99999C14.1 8.99999 15 8.09999 15 6.99999C15 5.89999 14.1 4.99999 13 4.99999C11.9 4.99999 11 5.89999 11 6.99999C11 8.09999 11.9 8.99999 13 8.99999Z"
            fill="currentColor"
          />
        </svg>
      );

    case "home":
      return (
        <svg
          className="icon__home"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" />
        </svg>
      );

    case "menu":
      return (
        <svg
          className="icon__menu"
          aria-hidden={ariaHidden}
          width="12"
          height="6"
          viewBox="0 0 12 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fillRule="evenodd" clipRule="evenodd" d="M0 1.5H12V0H0V1.5ZM0 6H8V4.5H0V6Z" fill="currentColor" />
        </svg>
      );
      case "success":
        return (
          <svg
            className="icon__success"
            aria-hidden={ariaHidden}
            width="24"
            height="28"
            viewBox="0 0 24 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect y="2" width="24" height="24" rx="12" fill="#3AAA35" />
            <path d="M17.3327 10L9.99935 17.3333L6.66602 14" stroke="#F7F7F7" strokeWidth="2" strokeLinecap="square" />
          </svg>
        );
      case "warning":
        return (
          <svg
          className="icon__warning"
          aria-hidden={ariaHidden}
            width="26"
            height="28"
            viewBox="0 0 26 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.7598 4.2589C14.004 2.8593 11.996 2.85931 11.2402 4.25891L1.09316 23.0497C0.373594 24.3822 1.33857 26 2.85297 26H23.147C24.6614 26 25.6264 24.3822 24.9068 23.0497L14.7598 4.2589Z"
              fill="#E30513"
            />
            <path fillRule="evenodd" clipRule="evenodd" d="M12 11V19H14V11H12ZM12 21V23H14V21H12Z" fill="#F7F7F7" />
          </svg>
        );

        case "clock-spinner":
          return (
            <svg className="icon__spinner" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z"/><rect x="11" y="6" rx="1" width="2" height="7"><animateTransform attributeName="transform" type="rotate" dur="9s" values="0 12 12;360 12 12" repeatCount="indefinite"/></rect><rect x="11" y="11" rx="1" width="2" height="9"><animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite"/></rect></svg>
          )

    default:
      return <></>;
  }
}
