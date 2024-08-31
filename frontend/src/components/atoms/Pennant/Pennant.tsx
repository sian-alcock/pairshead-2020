import React, { ReactElement, Suspense } from "react"
import {useImage} from "react-image"

function PennantImageComponent() {
  const {src} = useImage({
    srcList: ["https://www.bblrc.co.uk/wp-content/uploads/2023/10/pennant_PH-2.jpg"],
  })

  return <img src={src} width="20px"/>
}

export default function PennantImage():ReactElement {
  return (
    <Suspense>
      <PennantImageComponent />
    </Suspense>  )
}