// import React from 'react'
// import Select from 'react-select'
// import axios from 'axios'
// import { formatTimes, getImage } from '../../../lib/helpers'
// import Paginator from '../../common/Paginator'
// import CrewTimeCalculatedFieldsUpdate from '../../common/UpdateCrewTimeCalculatedFields'
// import PageTotals from '../../common/PageTotals'
// import Img from 'react-image'

// class ResultIndex extends React.Component {
//   constructor() {
//     super()
//     this.state= {
//       crews: [],
//       pageSize: 20,
//       pageNumber: 1,
//       searchTerm: sessionStorage.getItem('resultIndexSearch') || '',
//       crewsInCategory: [],
//       gender: 'all',
//       firstAndSecondCrewsBoolean: false,
//       closeFirstAndSecondCrewsBoolean: false
//     }

//     this.changePage = this.changePage.bind(this)
//     this.handleCategoryChange = this.handleCategoryChange.bind(this)
//     this.handlePagingChange = this.handlePagingChange.bind(this)
//     this.handleGenderChange = this.handleGenderChange.bind(this)
//     this.handleSearchKeyUp = this.handleSearchKeyUp.bind(this)
//     this.handleFirstAndSecondCrews = this.handleFirstAndSecondCrews.bind(this)
//     this.handleCloseCrews = this.handleCloseCrews.bind(this)
//     this.refreshData = this.refreshData.bind(this)

//   }

//   componentDidMount() {
//     axios.get('/api/results', {
//       params: {
//         page_size: 20,
//         gender: 'all',
//         page: 1,
//         categoryRank: 'all'
//       }
//     })
//       .then(res => this.setState({
//         totalCrews: res.data['count'],
//         crews: res.data['results'],
//         fastestMen2x: res.data['fastest_open_2x_time'].raw_time__min,
//         fastestFemale2x: res.data['fastest_female_2x_time'].raw_time__min,
//         fastestMenSweep: res.data['fastest_open_sweep_time'].raw_time__min,
//         fastestFemaleSweep: res.data['fastest_female_sweep_time'].raw_time__min,
//         fastestMixed2x: res.data['fastest_mixed_2x_time'].raw_time__min,
//         categories: this.getCategories(res.data['results']),
//         updateRequired: res.data['requires_ranking_update']
//       }).catch((error) => {
//         // here you will have access to error.response
//         console.log(error.response)
//       })
//       )
//   }

//   changePage(pageNumber, totalPages) {
//     if (
//       pageNumber > totalPages ||
//       pageNumber < 0
//     ) return null
//     this.setState({ pageNumber }, () => this.refreshData())
//   }

//   refreshData(queryString=null) {
//     if (typeof this._source !== typeof undefined) {
//       this._source.cancel('Operation cancelled due to new request')
//     }

//     // save the new request for cancellation
//     this._source = axios.CancelToken.source()

//     axios.get(`/api/results?${queryString}`, {
//       // cancel token used by axios
//       cancelToken: this._source.token,

//       params: {
//         page_size: this.state.pageSize,
//         gender: this.state.gender,
//         page: this.state.pageNumber,
//         categoryRank: this.state.firstAndSecondCrewsBoolean ? 'topTwo' : 'all'
//         // categoryRankClose: this.state.closeFirstAndSecondCrewsBoolean ? 'topTwoClose' : 'all'
//       }
//     })
//       .then(res => this.setState({ 
//         totalCrews: res.data['count'],
//         crews: res.data['results'],
//         updateRequired: res.data['requires_ranking_update'] 
//       })
//       )
//       .catch((error) => {
//         if (axios.isCancel(error) || error) {
//           this.setState({
//             loading: false,
//             message: 'Failed to get data'
//           })
//         }
//       })
//   }

//   getTopCrews(event, crews) {
//     // returns true if the 1st and 2nd crew in a category have a time within 2 seconds
//     const timeDifference = 2000
//     const crewsInCategory = crews.filter(crew => crew.event_band === event && !crew.time_only)
//     const raceTimes = crewsInCategory.map(crew => crew.category_position_time)
//     const sorted = raceTimes.slice().sort((a,b) => a - b)
//     const flagForReview = Math.abs(sorted[0]-sorted[1]) <= timeDifference ? true : false
//     // console.log(flagForReview)
//     return flagForReview
//   }

//   getCategories(data){
//     // Populate the category (event_band) pull down with all event_bands
//     console.log(data)
//     let eventBands = data.map(crew => crew.event_band)
//     eventBands = Array.from(new Set(eventBands)).sort()
//     console.log(eventBands)
//     const options = eventBands.map(option => {
//       return {label: option, value: option}
//     })
//     return [{label: 'All cats', value: ''}, ...options]
//   }

//   handleSearchKeyUp(e){
//     sessionStorage.setItem('resultIndexSearch', e.target.value)
//     this.setState({
//       searchTerm: e.target.value,
//       pageNumber: 1,
//       gender: 'all',
//       category: ''
//     }, () => this.refreshData(`search=${this.state.searchTerm}`)
//     )
//   }

//   handleCategoryChange(selectedOption){
//     if(!selectedOption.value) {
//       this.setState({
//         category: selectedOption.value,
//         gender: 'all',
//         searchTerm: '',
//         pageNumber: 1
//       }, () => this.refreshData())
//     } else {
//       this.setState({
//         category: selectedOption.value,
//         gender: 'all',
//         searchTerm: '',
//         pageNumber: 1
//       }, () => this.refreshData(`event_band=${this.state.category}`))
//     }
//   }

//   handlePagingChange(selectedOption){
//     this.setState({
//       pageSize: selectedOption.value,
//       pageNumber: 1
//     }, () => this.refreshData())
    
//   }

//   handleGenderChange(selectedOption){

//     this.setState({
//       gender: selectedOption.value,
//       pageNumber: 1
//     }, () => this.refreshData())
//   }
  

//   handleFirstAndSecondCrews(e){
//     this.setState({
//       firstAndSecondCrewsBoolean: e.target.checked
//     }, () => this.refreshData())
//   }

//   handleCloseCrews(e){
//     this.setState({
//       closeFirstAndSecondCrewsBoolean: e.target.checked
//     })
//   }

//   render() {

//     const totalPages = Math.ceil((this.state.totalCrews) / this.state.pageSize)
//     const pagingOptions = [{label: '20 crews', value: '20'}, {label: '50 crews', value: '50'}, {label: '100 crews', value: '100'}, {label: 'All crews', value: '500'}]
//     const genderOptions = [{label: 'All', value: 'all'}, {label: 'Open', value: 'Open'}, {label: 'Female', value: 'Female'}, {label: 'Mixed', value: 'Mixed'}]

//     return (

//       <section className="section">
//         <div className="container">

//           {(this.state.updateRequired && this.state.updateRequired > 0) ? <div className="box">
//             <CrewTimeCalculatedFieldsUpdate
//               refreshData={this.refreshData}
//               updateRequired={this.state.updateRequired}
//             />
//           </div> : ''}

//           <div className="columns no-print is-vtop">

//             <div className="column">
//               <label className="label has-text-left" htmlFor="searchResultsControl">Search</label>
//               <div className="field control has-icons-left" id="searchResultsControl">
//                 <span className="icon is-left">
//                   <i className="fas fa-search"></i>
//                 </span>
//                 <input className="input" id="search" placeholder="Search" value={this.state.searchTerm} onChange={this.handleSearchKeyUp} />
//               </div>
//             </div>

//             <div className="column">

//               <div className="field">
//                 <label className="label has-text-left" htmlFor="category">Select category</label>
//                 <div className="control">
//                   <Select
//                     id="category"
//                     onChange={this.handleCategoryChange}
//                     options={this.state.categories}
//                     placeholder='Category'
//                     value={this.state.category}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="column">

//               <div className="field">
//                 <label className="label has-text-left" htmlFor="paging">Page size</label>
//                 <div className="control">
//                   <Select
//                     id="paging"
//                     onChange={this.handlePagingChange}
//                     options={pagingOptions}
//                     placeholder='Page size'
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="column">

//               <div className="field">
//                 <label className="label has-text-left" htmlFor="gender">Select gender</label>
//                 <div className="control">
//                   <Select
//                     id="gender"
//                     onChange={this.handleGenderChange}
//                     options={genderOptions}
//                     placeholder='Gender'
//                     value={this.state.gender}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="column has-text-left">
//               <div className="field">
//                 <label className="checkbox" >
//                   <input type="checkbox"  className="checkbox" value="" onChange={this.handleFirstAndSecondCrews} />
//                   <small>Crews in 1st and 2nd place</small>
//                 </label>
//               </div>

//               <div className="field">
//                 <label className="checkbox" >
//                   <input type="checkbox"  className="checkbox" value="highlightCloseCrews" onChange={this.handleCloseCrews}/>
//                   <small>Highlight 1st/2nd crews within 2s&nbsp;❓</small>
//                 </label>
//               </div>
//             </div>

//           </div>
//           <div className="no-print">
//             <Paginator
//               pageNumber={this.state.pageNumber}
//               totalPages={totalPages}
//               changePage={this.changePage}
//             />
//           </div>
//           <PageTotals
//             totalCount={this.state.totalCrews}
//             entities='crews'
//             pageSize={this.state.pageSize}
//             pageNumber={this.state.pageNumber}  
//           />
//           <table className="table">
//             <thead>
//               <tr>
//                 <td>Overall position</td>
//                 <td>Number</td>
//                 <td>Time</td>
//                 <td>Masters adjust</td>
//                 <td colSpan='2'>Rowing club</td>
//                 <td>Crew</td>
//                 <td>Composite code</td>
//                 <td>Event</td>
//                 <td colSpan='4'>Pos in category</td>
//                 <td>Penalty</td>
//                 <td>TO</td>
//               </tr>
//             </thead>
//             <tfoot className="no-print">
//               <tr>
//                 <td>Overall position</td>
//                 <td>Number</td>
//                 <td>Time</td>
//                 <td>Masters adjust</td>
//                 <td colSpan='2'>Rowing club</td>
//                 <td>Crew</td>
//                 <td>Composite code</td>
//                 <td>Event</td>
//                 <td colSpan='4'>Pos in category</td>
//                 <td>Penalty</td>
//                 <td>TO</td>
//               </tr>
//             </tfoot>
//             <tbody>
//               {this.state.crews.map((crew) =>
//                 <tr key={crew.id}>
//                   <td>{!this.state.gender || this.state.gender === 'all' ? crew.overall_rank : crew.gender_rank}</td>
//                   <td>{crew.bib_number}</td>
//                   <td>{formatTimes(crew.published_time)}</td>
//                   <td>{!crew.masters_adjusted_time ? '' : formatTimes(crew.masters_adjusted_time)}</td>
//                   <td>{getImage(crew)}</td>
//                   <td>{crew.club.name}</td>
//                   <td>{!crew.competitor_names ? crew.name : crew.competitor_names }</td>
//                   <td>{crew.composite_code}</td>
//                   <td>{crew.event_band}</td>
//                   <td>{!crew.category_rank ? '' : crew.category_rank} </td>
//                   <td>{crew.category_rank === 1 ? <Img src="https://www.bblrc.co.uk/wp-content/uploads/2023/10/pennant_PH-2.jpg" width="20px" />  : ''} </td>
//                   <td>{crew.overall_rank === 1 || crew.published_time === this.state.fastestFemale2x || crew.published_time === this.state.fastestFemaleSweep || crew.published_time === this.state.fastestMixed2x ? <Img src="https://www.bblrc.co.uk/wp-content/uploads/2023/10/trophy_PH-2.jpg" width="20px" />  : ''} </td>
//                   <td>{this.getTopCrews(crew.event_band, this.state.crews) && this.state.closeFirstAndSecondCrewsBoolean ? '❓' : ''}</td>
//                   <td>{crew.penalty ? 'P' : ''}</td>
//                   <td>{crew.time_only ? 'TO' : ''}</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//           <div className="no-print">
//             <Paginator
//               pageNumber={this.state.pageNumber}
//               totalPages={totalPages}
//               changePage={this.changePage}
//             />
//           </div>
//         </div>
//       </section>
//     )
//   }
// }

// export default ResultIndex
