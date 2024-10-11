import React from "react"
import { createRoot } from "react-dom/client"
import { HashRouter, Route, Switch } from "react-router-dom"
import SecureRoute from "./components/common/SecureRoute"

import Home from "./components/pages/Home/Home"
import Info from "./components/pages/Info/Info"
import Register from "./components/auth/Register"
import Login from "./components/auth/Login"
import CrewIndex from "./components/pages/CrewIndex/CrewIndexNew"
import CrewTimeEdit from "./components/pages/CrewIndex/CrewTimeEdit"
import RaceTimeIndex from "./components/pages/RaceTimes/RaceTimeIndex"
import RaceTimeEdit from "./components/pages/RaceTimes/RaceTimeEdit"
import ResultIndex from "./components/pages/ResultIndex/ResultIndexNew"
import GenerateResults from "./components/pages/GenerateResults/GenerateResults"
import ExportData from "./components/pages/ExportData/ExportData"
import CrewDrawReports from "./components/pages/CrewDrawReports/CrewDrawReports"
import CrewStartOrder from "./components/pages/CrewStartOrder/CrewStartOrder"
import GenerateStartOrder from "./components/pages/GenerateStartOrder/GenerateStartOrder"
import CrewStartByNumberLocation from "./components/pages/CrewStartByNumberLocation/CrewStartByNumberLocation"
import ContactDetailReport from "./components/pages/ContactDetailReport/ContactDetailReport"
import Footer from "./components/organisms/Footer/Footer"
import EventKeys from "./components/pages/EventKeys/EventKeys"
import EventKeyEdit from "./components/pages/EventKeys/EventKeyEdit"
import EventKeyNew from "./components/pages/EventKeys/EventKeyNew"
import CrewLabels from "./components/pages/CrewLabels/CrewLabels"
import Logistics from "./components/pages/Logistics/Logistics"
import Settings from "./components/pages/PHSettings/Settings"
import SetNumberLocations from "./components/pages/SetNumberLocations/SetNumberLocations"
import NumberLocationNew from "./components/pages/SetNumberLocations/NumberLocationNew"
import NumberLocationEdit from "./components/pages/SetNumberLocations/NumberLocationEdit"
import RaceInfo from "./components/pages/RaceInfo/RaceInfo"
import RaceInfoEdit from "./components/pages/RaceInfo/RaceInfoEdit"
import RaceInfoNew from "./components/pages/RaceInfo/RaceInfoNew"

import "@fortawesome/fontawesome-free/js/all.js"
import 'bulma'
import "./style.scss"


export default class App extends React.Component {


  render(){
    return(
      <div>
        <HashRouter>
          <Switch>
            <SecureRoute path="/generate-results/crews/:id/edit" component={CrewTimeEdit} />
            <SecureRoute path="/generate-results/crews" component={CrewIndex} />
            <SecureRoute path="/generate-results/race-times/:id/edit" component={RaceTimeEdit} />
            <SecureRoute path="/generate-results/race-times" component={RaceTimeIndex} />
            <SecureRoute path="/generate-results/export" component={ExportData} />
            <SecureRoute path="/generate-results/results" component={ResultIndex} />
            <SecureRoute path="/generate-results" component={GenerateResults} />
            <SecureRoute path="/settings/keys/:id/edit" component={EventKeyEdit} />
            <SecureRoute path="/settings/keys/new" component={EventKeyNew} />
            <SecureRoute path="/settings/keys" component={EventKeys} />
            <SecureRoute path="/settings/info" component={Info} />
            <SecureRoute path="/settings/register" component={Register} />
            <SecureRoute path="/settings/race-info/:id/edit" component={RaceInfoEdit} />
            <SecureRoute path="/settings/race-info/new" component={RaceInfoNew} />
            <SecureRoute path="/settings/race-info" component={RaceInfo} />
            <SecureRoute path="/settings" component={Settings} />
            <SecureRoute path="/logistics/crew-draw-reports" component={CrewDrawReports} />
            <SecureRoute path="/logistics/crew-labels" component={CrewLabels} />
            <SecureRoute path="/logistics/crew-on-the-day-contact" component={ContactDetailReport} />
            <SecureRoute path="/logistics/start-order-by-number-location" component={CrewStartByNumberLocation} />
            <SecureRoute path="/logistics" component={Logistics} />
            <SecureRoute path="/generate-start-order/crew-start-order" component={CrewStartOrder} />
            <SecureRoute path="/generate-start-order/set-number-locations/:id/edit" component={NumberLocationEdit} />
            <SecureRoute path="/generate-start-order/set-number-locations/new" component={NumberLocationNew} />
            <SecureRoute path="/generate-start-order/set-number-locations" component={SetNumberLocations} />
            <SecureRoute path="/generate-start-order" component={GenerateStartOrder} />
            <Route path="/login" component={Login} />
            <SecureRoute path="/" component={Home} />
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
