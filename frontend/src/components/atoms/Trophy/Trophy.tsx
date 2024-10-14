import React, { ReactElement, Suspense } from "react"
import image from "../../../assets/phfav.png"
import {useImage} from "react-image"

function TrophyImageComponent() {
  const {src} = useImage({
    srcList: ["https://www.bblrc.co.uk/wp-content/uploads/2023/10/trophy_PH-2.jpg", `${image}`],
  })

  return <img src={src} width="20px"/>
}

export default function TrophyImage():ReactElement {
  return (
    <Suspense>
      <TrophyImageComponent />
    </Suspense>  )
}