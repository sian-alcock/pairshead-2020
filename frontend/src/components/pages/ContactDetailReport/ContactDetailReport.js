import React from "react";
import axios from "axios";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";
import "./contactDetailReport.scss";

class ContactDetailReport extends React.Component {
  constructor() {
    super();
    this.state = {
      crews: [],
      pageNumber: 1,
      sortTerm: "bib_number"
    };

    this.handleSortChange = this.handleSortChange.bind(this);
  }

  componentDidMount() {
    axios
      .get("/api/crews/", {
        params: {
          page_size: 500,
          page: 1,
          order: "club",
          status: ["Accepted", "Scratched"]
        }
      })
      .then((res) =>
        this.setState({
          totalCrews: res.data["count"],
          crews: res.data["results"]
        })
      );
  }

  refreshData(queryString = null) {
    if (typeof this._source !== typeof undefined) {
      this._source.cancel("Operation cancelled due to new request");
    }

    // save the new request for cancellation
    this._source = axios.CancelToken.source();

    axios
      .get(`/api/crews?${queryString}`, {
        // cancel token used by axios
        cancelToken: this._source.token,

        params: {
          page_size: 500,
          order: this.state.sortTerm
        }
      })
      .then((res) =>
        this.setState({
          totalCrews: res.data["count"],
          crews: res.data["results"],
          loading: false
        })
      )
      .catch((error) => {
        if (axios.isCancel(error) || error) {
          this.setState({
            loading: false,
            message: "Failed to get data"
          });
        }
      });
  }

  handleSortChange(e) {
    this.setState({ sortTerm: e.target.value }, () => this.refreshData());
  }

  render() {
    !this.state.crews ? <h2>loading...</h2> : console.log(this.state.crews);
    const tableHeadings = ["Club", "Crew", "Category", "Contact details"];

    return (
      <>
        <Header />
        <Hero title={"On the day contact details"} />
        <section className="contact-detail-report__section">
          <div className="contact-detail-report__container">
            <div className="contact-detail-report__title">
              Pairs Head {new Date().getFullYear()} - On the day contact details - all crews
            </div>
            <div className="contact-detail-report__table-container">
              <table className="contact-detail-report__table table">
                <thead>
                  <tr>
                    {tableHeadings.map((heading, i) => (
                      <td key={i}>{heading}</td>
                    ))}
                  </tr>
                </thead>
                <tfoot className="no-print">
                  <tr>
                    {tableHeadings.map((heading, i) => (
                      <td key={i}>{heading}</td>
                    ))}
                  </tr>
                </tfoot>
                <tbody>
                  {this.state.crews.map((crew) => (
                    <tr key={crew.id}>
                      <td>{crew.club.name}</td>
                      <td>
                        {!crew.competitor_names ? crew.name : crew.competitor_names}
                        {!crew.bib_number ? "" : <br />}
                        {!crew.bib_number ? "" : `Crew no: ${crew.bib_number}`}
                      </td>
                      <td>
                        {crew.status}
                        {!crew.event_band ? "" : <br />}
                        {!crew.event_band ? "" : crew.event_band}
                      </td>

                      <td>
                        {!crew.otd_contact ? "" : crew.otd_contact}
                        {!crew.otd_home_phone ? "" : <br />}
                        {!crew.otd_home_phone ? "" : `Home: ${crew.otd_home_phone}`}
                        {!crew.otd_mobile_phone ? "" : <br />}
                        {!crew.otd_mobile_phone ? "" : `Mob: ${crew.otd_mobile_phone}`}
                        {!crew.otd_work_phone ? "" : <br />}
                        {!crew.otd_work_phone ? "" : `Work: ${crew.otd_work_phone}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </>
    );
  }
}

export default ContactDetailReport;
