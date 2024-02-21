import React from 'react'
import ReactDOM from 'react-dom'


import { HashRouter, Route, Switch } from 'react-router-dom'
// import { ToastContainer } from 'react-toastify'

import Home from './components/pages/Home'
import Info from './components/pages/Info'
import Register from './components/auth/Register'
import Login from './components/auth/Login'
import CrewIndex from './components/crews/CrewIndex'
import CrewTimeEdit from './components/crews/CrewTimeEdit'
import RaceTimeIndex from './components/crews/RaceTimeIndex'
import RaceTimeEdit from './components/crews/RaceTimeEdit'
import ResultIndex from './components/crews/ResultIndex'
import ImportData from './components/crews/ImportData'
import ExportData from './components/crews/ExportData'
import DrawMenu from './components/crews/DrawMenu'
import CrewDrawReport from './components/crews/CrewDrawReport'
import CrewStartOrder from './components/crews/CrewStartOrder'
import GenerateStartOrder from './components/crews/GenerateStartOrder'
import CrewStartByHostClub from './components/crews/CrewStartByHostClub'
import ContactDetailReport from './components/crews/CrewJuniorContactDetails'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Header from './components/common/Header'
import EventKeys from './components/events/EventKeys'
import EventKeyEdit from './components/events/EventKeyEdit'
import EventKeyNew from './components/events/EventKeyNew'


// import 'react-toastify/dist/ReactToastify.css'
import '@fortawesome/fontawesome-free/js/all.js'
import 'bulma'
import './style.scss'


class App extends React.Component {


  render(){
    return(
      <div>
        <HashRouter>
          <Header />
          <Navbar />
          <Switch>
            <Route path="/crews/:id" component={CrewTimeEdit} />
            <Route path="/crews" component={CrewIndex} />
            <Route path="/race-times/:id" component={RaceTimeEdit} />
            <Route path="/race-times" component={RaceTimeIndex} />
            <Route path="/summary" component={Home} />
            <Route path="/keys/new" component={EventKeyNew} />
            <Route path="/keys/:id" component={EventKeyEdit} />
            <Route path="/keys" component={EventKeys} />
            <Route path="/import" component={ImportData} />
            <Route path="/export" component={ExportData} />
            <Route path="/draw-menu" component={DrawMenu} />
            <Route path="/crew-draw-report" component={CrewDrawReport} />
            <Route path="/crew-on-the-day-contact" component={ContactDetailReport} />
            <Route path="/generate-start-order" component={GenerateStartOrder} />
            <Route path="/crew-start-order" component={CrewStartOrder} />
            <Route path="/crew-start-order-by-host" component={CrewStartByHostClub} />
            <Route path="/info" component={Info} />
            <Route path="/register" component={Register} />
            <Route path="/login" component={Login} />
            <Route path="/" component={ResultIndex} />
          </Switch>
          <Footer />
        </HashRouter>
      </div>
    )
  }
}


ReactDOM.render(
  <App />,
  document.getElementById('root')
)
