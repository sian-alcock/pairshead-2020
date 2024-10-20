import React from "react"
import Icon from "../../atoms/Icons/Icons"

const MastersCalculations = ({ fastestMen2x, fastestFemale2x, fastestMenSweep, fastestFemaleSweep, fastestMixed2x, mastersAdjustmentsApplied, mastersAdjustmentsRequired, handleMastersAdjustments }) => {
  return (
    <div className="masters-calculation__container">
      <details className="masters-calculation__details">
        <summary className="masters-calculation__summary">Masters calculations
          <i className="masters-calculation__icon">
            <Icon icon={"chevron-down"}  />
          </i>
        </summary>
        <div className="masters-calculation__content">
          <div className="columns">
            <div className="column">
              <table className="table">
                <thead>
                  <tr>
                    <td></td>
                    <td>Fastest times</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Fastest men 2x</td>
                    <td>{fastestMen2x}</td>
                  </tr>
                  <tr>
                    <td>Fastest women 2x</td>
                    <td>{fastestFemale2x}</td>
                  </tr>
                  <tr>
                    <td>Fastest men 2-</td>
                    <td>{fastestMenSweep}</td>
                  </tr>
                  <tr>
                    <td>Fastest women 2-</td>
                    <td>{fastestFemaleSweep}</td>
                  </tr>
                  <tr>
                    <td>Fastest mixed 2x</td>
                    <td>{fastestMixed2x}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="column">
              <div className="field"><small>Number of masters crews that require adjustment: {mastersAdjustmentsRequired}</small></div>
              <div className="field">
                <label className="checkbox" htmlFor="crewsWithMastersAdjustments">
                  <input type="checkbox"  className="checkbox" id="crewsWithMastersAdjustments" onChange={handleMastersAdjustments} />
                  <small>Crews with masters adjustments applied ({mastersAdjustmentsApplied})</small>
                </label>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}

export default MastersCalculations