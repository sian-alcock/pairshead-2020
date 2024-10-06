import React from "react"
const moment = require("moment")
const momentDurationFormatSetup = require("moment-duration-format")
momentDurationFormatSetup(moment)
typeof moment.duration.fn.format === "function"
typeof moment.duration.format === "function"
import image from "../assets/unknown_blades.png"
import Img from "react-image"


export const formatTimes = function formatTimes(timeInMs){
  const duration = moment.duration(timeInMs).format("h:mm:ss.SS")
  return duration
}

export const formatTimeDate = function formatTimeDate(timeInMs){
  const date = new Date(timeInMs)
  return date.toLocaleString()
}

export const getImage = function getImage(crew) {
  return <Img src={[`${crew.club.blade_image}`, `${image}`]} width="40px" />
}