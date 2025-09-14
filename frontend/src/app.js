import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Switch } from "react-router-dom";
import SecureRoute from "./components/common/SecureRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import Home from "./components/pages/Home/Home";
import Info from "./components/pages/Info/Info";
import Register from "./components/auth/Register/Register";
import Login from "./components/auth/Login/Login";
import CrewManagementDashboard from "./components/pages/CrewManagementDashboard/CrewManagementDashboard";
import CrewTimeEdit from "./components/organisms/CrewsTable/components/CrewTimeEdit";
import ResultIndex from "./components/pages/ResultIndex/ResultIndex";
import CrewDrawReports from "./components/pages/CrewDrawReports/CrewDrawReports";
import CrewStartOrder from "./components/pages/CrewStartOrder/CrewStartOrder";
import CrewStartByNumberLocation from "./components/pages/CrewStartByNumberLocation/CrewStartByNumberLocation";
import ContactDetailReport from "./components/pages/ContactDetailReport/ContactDetailReport";
import Footer from "./components/organisms/Footer/Footer";
import EventKeys from "./components/pages/EventKeys/EventKeys";
import CrewLabels from "./components/pages/CrewLabels/CrewLabels";
import ReportsAndDataExports from "./components/pages/ReportsAndDataExports/ReportsAndDataExports";
import Settings from "./components/pages/PHSettings/Settings";
import SetNumberLocations from "./components/pages/SetNumberLocations/SetNumberLocations";
import NumberLocationNew from "./components/pages/SetNumberLocations/NumberLocationNew";
import NumberLocationEdit from "./components/pages/SetNumberLocations/NumberLocationEdit";
import RaceTimeEdit from "./components/organisms/RaceTimesTable/components/RaceTimeEdit";
import RaceTimesManagerDetail from "./components/organisms/RaceTimesManagerDetail/RaceTimesManagerDetail";
import TimingOffsetManagerDetail from "./components/organisms/TimingOffsetManager/TimingOffsetManagerDetail";
import MarshallingDivisions from "./components/pages/MarshallingDivisions/MarshallingDivisions";
import ManageRaceTimes from "./components/pages/ManageRaceTimes/ManageRaceTimes";
import ManagePenalties from "./components/pages/ManagePenalties/ManagePenalties";
import ManagingOriginalEventCategories from "./components/pages/ManageOriginalEventCategories/ManageOriginalEventCategories";

import "./style.scss";

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query options
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      // Global mutation options
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <HashRouter>
          <Switch>
            <SecureRoute path="/crew-management-dashboard/:id/edit" component={CrewTimeEdit} />
            <SecureRoute path="/crew-management-dashboard" component={CrewManagementDashboard} />
            <SecureRoute path="/race-times/:id/edit" component={RaceTimeEdit} />
            <SecureRoute path="/results" component={ResultIndex} />
            <SecureRoute path="/manage-penalties" component={ManagePenalties} />
            <SecureRoute path="/manage-original-event-categories" component={ManagingOriginalEventCategories} />
            <SecureRoute path="/settings/keys" component={EventKeys} />
            <SecureRoute path="/settings/info" component={Info} />
            <SecureRoute path="/settings/register" component={Register} />
            <SecureRoute path="/manage-race-times/:id/edit" component={RaceTimesManagerDetail} />
            <SecureRoute path="/manage-race-times/new" component={RaceTimesManagerDetail} />
            <SecureRoute path="/manage-race-times/race-time-syncs/:id/edit" component={TimingOffsetManagerDetail} />
            <SecureRoute path="/manage-race-times/race-time-syncs/new" component={TimingOffsetManagerDetail} />
            <SecureRoute path="/manage-race-times" component={ManageRaceTimes} />
            <SecureRoute path="/settings" component={Settings} />
            <SecureRoute path="/reports/crew-draw-reports" component={CrewDrawReports} />
            <SecureRoute path="/reports/crew-labels" component={CrewLabels} />
            <SecureRoute path="/reports/crew-on-the-day-contact" component={ContactDetailReport} />
            <SecureRoute path="/reports/start-order-by-number-location" component={CrewStartByNumberLocation} />
            <SecureRoute path="/reports" component={ReportsAndDataExports} />
            <SecureRoute path="/crew-start-order" component={CrewStartOrder} />
            <SecureRoute path="/set-number-locations/:id/edit" component={NumberLocationEdit} />
            <SecureRoute path="/set-number-locations/new" component={NumberLocationNew} />
            <SecureRoute path="/set-number-locations" component={SetNumberLocations} />
            <SecureRoute path="/marshalling-divisions" component={MarshallingDivisions} />
            <Route path="/login" component={Login} />
            <SecureRoute path="/" component={Home} />
          </Switch>
          <Footer />
        </HashRouter>
      </div>
      {/* Add React Query DevTools in development */}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById("root");

// New as of React v18.x
const root = createRoot(rootElement);

root.render(
  // <StrictMode>
  <App />
  // </StrictMode>
);
