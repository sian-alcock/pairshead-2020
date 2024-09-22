import React, { ReactElement, Suspense } from "react"
import image from "../../../assets/unknown_blades.png"
import {useImage} from "react-image"
import { CrewProps } from "../../components.types"

interface BladeImageProps {
  crew: CrewProps;
}

function BladeImageComponent({crew}:BladeImageProps) {
  const {src} = useImage({
    srcList: [`${crew.club.blade_image}`, `${image}`],
  })

  return <img src={src} alt={"club blade"} width="40px"/>
}

export default function BladeImage({crew}:BladeImageProps):ReactElement {
  return (
    <Suspense>
      <BladeImageComponent crew={crew} />
    </Suspense>  )
}