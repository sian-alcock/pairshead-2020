import React from "react"
import { createRoot } from "react-dom/client"
import { HashRouter, Route, Switch } from "react-router-dom"
import SecureRoute from "./components/common/SecureRoute"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import Home from "./components/pages/Home/Home"
import Info from "./components/pages/Info/Info"
import Register from "./components/auth/Register/Register"
import Login from "./components/auth/Login/Login"
import CrewManagementDashboard from "./components/pages/CrewManagementDashboard/CrewManagementDashboard"
import CrewTimeEdit from "./components/organisms/CrewsTable/components/CrewTimeEdit"
import ResultIndex from "./components/pages/ResultIndex/ResultIndex"
import GenerateResults from "./components/pages/GenerateResults/GenerateResults"
import ExportData from "./components/pages/ExportData/ExportData"
import CrewDrawReports from "./components/pages/CrewDrawReports/CrewDrawReports"
import CrewStartOrder from "./components/pages/CrewStartOrder/CrewStartOrder"
import GenerateStartOrder from "./components/pages/GenerateStartOrder/GenerateStartOrder"
import CrewStartByNumberLocation from "./components/pages/CrewStartByNumberLocation/CrewStartByNumberLocation"
import ContactDetailReport from "./components/pages/ContactDetailReport/ContactDetailReport"
import Footer from "./components/organisms/Footer/Footer"
import EventKeys from "./components/pages/EventKeys/EventKeys"
import CrewLabels from "./components/pages/CrewLabels/CrewLabels"
import Logistics from "./components/pages/Logistics/Logistics"
import Settings from "./components/pages/PHSettings/Settings"
import SetNumberLocations from "./components/pages/SetNumberLocations/SetNumberLocations"
import NumberLocationNew from "./components/pages/SetNumberLocations/NumberLocationNew"
import NumberLocationEdit from "./components/pages/SetNumberLocations/NumberLocationEdit"
// import RaceTimeIndex from "./components/pages/RaceTimes/RaceTimeIndex"
import RaceTimeEdit from "./components/organisms/RaceTimesTable/components/RaceTimeEdit"
import RaceTimesManagerDetail from "./components/organisms/RaceTimesManagerDetail/RaceTimesManagerDetail"
import TimingOffsetManagerDetail from "./components/organisms/TimingOffsetManager/TimingOffsetManagerDetail";
import MarshallingDivisions from "./components/pages/MarshallingDivisions/MarshallingDivisions";

import "./style.scss"

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query options
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Global mutation options
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <HashRouter>
          <Switch>
            <SecureRoute path="/generate-results/crew-management-dashboard/:id/edit" component={CrewTimeEdit} />
            <SecureRoute path="/generate-results/crew-management-dashboard" component={CrewManagementDashboard} />
            <SecureRoute path="/generate-results/race-times/:id/edit" component={RaceTimeEdit} />
            <SecureRoute path="/generate-results/export" component={ExportData} />
            <SecureRoute path="/generate-results/results" component={ResultIndex} />
            <SecureRoute path="/generate-results" component={GenerateResults} />
            <SecureRoute path="/settings/keys" component={EventKeys} />
            <SecureRoute path="/settings/info" component={Info} />
            <SecureRoute path="/settings/register" component={Register} />
            <SecureRoute path="/settings/race-time-manager/races/:id/edit" component={RaceTimesManagerDetail} />
            <SecureRoute path="/settings/race-time-manager/races/new" component={RaceTimesManagerDetail} />
            <SecureRoute path="/settings/timing-offset-manager/race-time-syncs/:id/edit" component={TimingOffsetManagerDetail} />
            <SecureRoute path="/settings/timing-offset-manager/race-time-syncs/new" component={TimingOffsetManagerDetail} />
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
            <SecureRoute path="/generate-start-order/marshalling-divisions" component={MarshallingDivisions} />
            <SecureRoute path="/generate-start-order" component={GenerateStartOrder} />
            <Route path="/login" component={Login} />
            <SecureRoute path="/" component={Home} />
          </Switch>
          <Footer />
        </HashRouter>
      </div>
      {/* Add React Query DevTools in development */}
      {/* {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById("root")

// New as of React v18.x
const root = createRoot(rootElement)

root.render(
  // <StrictMode>
  <App />
  // </StrictMode>
)