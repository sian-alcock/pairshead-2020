import React from "react"
import Icon from "../Icons/Icons";
import "./progressMessage.scss"

interface  ProgressMessageProps {
  message: string;
  status: 'loading' | 'success' | 'error';
}

export default function ({message, status}:ProgressMessageProps) {
  return (
    <div className="progress-message">
        <div className="progress-message__container">
          <span className="progress-message__icon">
            {status === 'loading' && <Icon icon={"clock-spinner"} />}
            {status === 'success' && <Icon icon={"success"}/>}
            {status === 'error' && <Icon icon={"warning"}/>}
          </span>
            {message}
        </div>
    </div>
  )
}