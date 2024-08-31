import React from "react"
import { createRoot } from "react-dom/client"
import { HashRouter, Route, Switch } from "react-router-dom"
import SecureRoute from "./components/common/SecureRoute"

import Home from "./components/pages/Home/Home"
import Info from "./components/pages/Info/Info"
import Register from "./components/auth/Register"
import Login from "./components/auth/Login"
import CrewIndex from "./components/pages/CrewIndex/CrewIndexNew"
import CrewTimeEdit from "./components/crews/CrewTimeEdit"
import RaceTimeIndex from "./components/crews/RaceTimeIndex"
import RaceTimeEdit from "./components/crews/RaceTimeEdit"
import ResultIndex from "./components/pages/ResultIndex/ResultIndexNew"
import ImportData from "./components/crews/ImportData"
import ExportData from "./components/crews/ExportData"
import DrawMenu from "./components/crews/DrawMenu"
import CrewDrawReport from "./components/crews/CrewDrawReport"
import CrewStartOrder from "./components/pages/CrewStartOrder/CrewStartOrder"
import GenerateStartOrder from "./components/pages/GenerateStartOrder/GenerateStartOrder"
import CrewStartByNumberLocation from "./components/pages/CrewStartByNumberLocation/CrewStartByNumberLocation"
import ContactDetailReport from "./components/crews/CrewJuniorContactDetails"
import Footer from "./components/organisms/Footer/Footer"
import EventKeys from "./components/pages/EventKeys/EventKeys"
import EventKeyEdit from "./components/pages/EventKeys/EventKeyEdit"
import EventKeyNew from "./components/pages/EventKeys/EventKeyNew"
import CrewLabels from "./components/pages/CrewLabels/CrewLabels"

import "@fortawesome/fontawesome-free/js/all.js"
import 'bulma'
import "./style.scss"


export default class App extends React.Component {


  render(){
    return(
      <div>
        <HashRouter>
          <Switch>
            <SecureRoute path="/crews/:id" component={CrewTimeEdit} />
            <SecureRoute path="/crews" component={CrewIndex} />
            <SecureRoute path="/crew-labels" component={CrewLabels} />
            <SecureRoute path="/race-times/:id" component={RaceTimeEdit} />
            <SecureRoute path="/race-times" component={RaceTimeIndex} />
            <SecureRoute path="/summary" component={Home} />
            <SecureRoute path="/keys/new" component={EventKeyNew} />
            <SecureRoute path="/keys/:id" component={EventKeyEdit} />
            <SecureRoute path="/keys" component={EventKeys} />
            <SecureRoute path="/import" component={ImportData} />
            <SecureRoute path="/export" component={ExportData} />
            <SecureRoute path="/draw-menu" component={DrawMenu} />
            <SecureRoute path="/crew-draw-report" component={CrewDrawReport} />
            <SecureRoute path="/crew-on-the-day-contact" component={ContactDetailReport} />
            <SecureRoute path="/generate-start-order" component={GenerateStartOrder} />
            <SecureRoute path="/crew-start-order" component={CrewStartOrder} />
            <SecureRoute path="/crew-start-order-by-host" component={CrewStartByNumberLocation} />
            <SecureRoute path="/info" component={Info} />
            <SecureRoute path="/register" component={Register} />
            <Route path="/login" component={Login} />
            <Route path="/" component={ResultIndex} />
          </Switch>
          <Footer />
        </HashRouter>
      </div>
    )
  }
}

const rootElement = document.getElementById("root")

// New as of React v18.x
const root = createRoot(rootElement)

root.render(
  // <StrictMode>
  <App />
  // </StrictMode>
)
