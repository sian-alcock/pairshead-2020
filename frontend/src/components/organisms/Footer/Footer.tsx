import React, { ReactElement } from "react"
import "./footer.scss"

export default function Header ():ReactElement {

  return(
    <footer className="footer__section no-print">
    <div className="footer__container">
      <p>Pairs Head of the River Race is organized by <a href="https://www.bblrc.co.uk/pairshead/">Barnes Bridge Ladies Rowing Club.</a>  
      </p>
    </div>
  </footer>
  )
}