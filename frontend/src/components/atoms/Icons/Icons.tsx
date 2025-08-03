import React, { ReactElement } from "react";

export type IconType =
  | 'warning-mark'
  | 'fail-cross'
  | 'success-tick'
  | 'save'
  | 'edit'
  | 'add'
  | 'sort'
  | 'sort-asc'
  | 'sort-desc'
  | 'file'
  | 'upload'
  | 'download'
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
  | 'warning'
  | 'delete'
  | 'refresh';

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
    case "warning-mark":
      return (
        <svg 
          className="icon__warning-mark"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor">
            <path d="M440-400v-360h80v360h-80Zm0 200v-80h80v80h-80Z"/>
        </svg>
      )
    case "fail-cross":
      return (
        <svg 
          className="icon__fail-cross"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor">
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
        </svg>
      )
    case "success-tick":
    return (
      <svg
        className="icon__success-tick"
        aria-hidden={ariaHidden}
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor">
          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
      </svg>
    )
    case "save":
      return (
        <svg 
          className="icon__save"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor">
            <path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/>
        </svg>
      )
    case "edit":
      return (
        <svg 
          className="icon__edit"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor">
            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
        </svg>
      )
    case "add":
      return (
        <svg
          className="icon__plus"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px" viewBox="0 -960 960 960"
          width="24px" fill="currentColor"
        >
          <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
        </svg>
      )
    case "sort":
      return (
        <svg 
          className="icon__sort"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor">
          <path d="M440-80v-168l-64 64-56-56 160-160 160 160-56 56-64-64v168h-80ZM160-440v-80h640v80H160Zm320-120L320-720l56-56 64 64v-168h80v168l64-64 56 56-160 160Z"/>
        </svg>
      )
    case "sort-asc":
      return (
        <svg
        className="icon__sort-asc"
        aria-hidden={ariaHidden}
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor">
          <path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z"/>
          </svg>
      )
    case "sort-desc":
      return (
        <svg
          className="icon__sort-desc"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px" 
          fill="currentColor"
        >
            <path d="M480-240 240-480l56-56 144 144v-368h80v368l144-144 56 56-240 240Z"/>
        </svg>
      )
    case "file":
      return (
        <svg 
        className="icon__file"
        aria-hidden={ariaHidden}
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor">
          <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/>
          </svg>
      )
    case "upload":
      return (
        <svg 
          className="icon__upload"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor">
            <path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/>
            </svg>
      )
    case "download":
      return (
        <svg
          className="icon__download"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg" 
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#currentColor"
        >
          <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/>
        </svg>
      )
    case "chevron-down":
      return (
        <svg
          className="icon__chevron-down"
          aria-hidden={ariaHidden}
          width="24"
          height="24"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
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
          <path d="M0.999999 1L9 9L1 17" stroke="currentColor" strokeWidth="1.5" />
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
          aria-hidden={ariaHidden}
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
          className="icon__arrow-left"
          aria-hidden={ariaHidden}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
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
        case "delete":
          return(
            <svg
              className="icon__delete"
              aria-hidden={ariaHidden}
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="currentColor">
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
            </svg>
          )
          case "refresh":
          return(
            <svg               
            className="icon__delete"
              aria-hidden={ariaHidden}
              xmlns="http://www.w3.org/2000/svg"
              height="24px" viewBox="0 -960 960 960"
              width="24px"
              fill="currentColor">
                <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/>
              </svg>
          )
    default:
      return <></>;
  }
}
