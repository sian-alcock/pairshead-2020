import React from "react";
import image from "../assets/unknown_blades.png";
import Img from "react-image";

export const formatTimes = function formatTimes(timeInMs) {
  const totalMs = Math.abs(timeInMs);
  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  // Calculate centiseconds first, then round to tenths
  const centiseconds = Math.floor((totalMs % 1000) / 10);
  const tenthsOfSeconds = Math.floor(centiseconds / 10);

  if (totalMs >= 1000 * 60 * 60) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${tenthsOfSeconds.toString()}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${tenthsOfSeconds.toString()}`;
};

export const formatTimeDate = function formatTimeDate(timeInMs) {
  const date = new Date(timeInMs);
  return date.toLocaleString();
};

export const getImage = function getImage(crew) {
  return <Img src={[`${crew.club.blade_image}`, `${image}`]} width="40px" />;
};

export const formatVarianceTime = function formatVarianceTime(timeInMs) {
  const totalMs = Math.abs(timeInMs);
  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
  const milliseconds = totalMs % 1000;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${Math.floor(
      milliseconds / 10
    )
      .toString()
      .padStart(2, "0")}`;
  } else if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${Math.floor(milliseconds / 10)
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${seconds}.${Math.floor(milliseconds / 10)
      .toString()
      .padStart(2, "0")}`;
  }
};
