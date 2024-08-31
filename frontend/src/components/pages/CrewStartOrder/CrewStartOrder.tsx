import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import { Link } from "react-router-dom";
import BladeImage from "../../atoms/BladeImage/BladeImage";
import { tableHeadings, pagingOptions } from "./defaultProps"
import { CrewProps } from "../../components.types";
import Paginator from "../../molecules/Paginator/Paginator";
import PageTotals from "../../molecules/PageTotals/PageTotals";

import "./crewStartOrder.scss"
import Header from "../../organisms/Header/Header";

interface ResponseParamsProps {
  page_size?: string;
  page?: number;
  order?: string;
  status?: string | string[];
  masters?: boolean;
}

interface ResponseDataProps {
  count: number;
  requires_ranking_update: number;
  next: number | null;
  previous: number | null;
  results: CrewProps[];
}

export default function CrewStartOrder() {
  const [crews, setCrews] = useState<CrewProps[]>([]);
  const [totalCrews, setTotalCrews] = useState(0);
  const [pageSize, setPageSize] = useState("20");
  const [pageNumber, setPageNumber] = useState(1);
  
  const fetchData = async (url: string, params: ResponseParamsProps) => {
    console.log(url);
    console.log(params);
    try {
      const response: AxiosResponse = await axios.get(url, {
        params: params
      });

      const responseData: ResponseDataProps = response.data;

      setCrews(responseData.results);
      setTotalCrews(responseData.count);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/crews", {
      page_size: "20",
      page: 1,
      order: "bib_number",
      status: "Accepted"
    });
  }, []);

  const refreshData = async (refreshDataQueryString:string | null = null) => {
    fetchData(`/api/crews?${refreshDataQueryString}`, {
      page_size: pageSize,
      page: pageNumber,
      status: ["Accepted", "Scratched"],
    });
  };

  useEffect(() => {
    refreshData();
  }, [pageNumber, pageSize]);

  const changePage = (pageNumber: number, totalPages: number) => {
    if (pageNumber > totalPages || pageNumber < 0) return null;
    setPageNumber(pageNumber);
  };

  const handlePagingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(e.target.value)
    setPageNumber(1)
  }

  console.log(crews);

  const totalPages = Math.floor(totalCrews / Number(pageSize));

  return (
    <>
      <Header />
      <Hero title={"Crew start order"} />
      <section className="section">
        <div className="container">
          <div className="columns is-vtop">
            <div className="column column is-one-quarter">
              <div className="field">
                <label className="label has-text-left" htmlFor="paging">
                  Select page size
                </label>
                <div className="select control-full-width">
                  <select className="control-full-width" onChange={handlePagingChange}>
                    <option value=""></option>
                    {pagingOptions.map((option) =>
                      <option key={option.value} value={option.value}>{option.label}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <Paginator pageNumber={pageNumber} totalPages={totalPages} changePage={changePage} />
          <PageTotals
            totalCount={totalCrews}
            entities='crews'
            pageSize={pageSize}
            pageNumber={pageNumber}  
          />
          <div className="crew-index__table-container">
            <table className="crew-index__table table">
              <thead>
                <tr>
                  {tableHeadings.map((heading) => (
                    <td key={heading.name} colSpan={heading.colSpan}>{heading.name}</td>
                  ))}
                </tr>
              </thead>
              <tfoot>
                <tr>
                  {tableHeadings.map((heading) => (
                    <td key={heading.name} colSpan={heading.colSpan}>{heading.name}</td>
                  ))}
                </tr>
              </tfoot>
              <tbody>
              {crews.map(crew => <tr key={crew.id}>
                <td><Link to={`/crews/${crew.id}`}>{crew.id}</Link></td>
                <td>{!crew.competitor_names ? crew.name : crew.competitor_names}</td>
                <td>{crew.status}</td>
                <td>
                  <BladeImage crew={crew} />
                </td>
                <td>{!crew.bib_number ? '' : crew.bib_number}</td>
                <td>{crew.club.index_code}</td>
                <td>{crew.event_band}</td>
                <td>{crew.event_order}</td>
                <td>{crew.sculling_CRI}</td>
                <td>{crew.rowing_CRI}</td>
                <td>{crew.draw_start_score}</td>
                <td>{crew.calculated_start_order}</td>
                <td>{crew.host_club.name === 'Unknown club' ? `⚠️ ${crew.host_club.name}` : crew.host_club.name}</td>
                <td>{crew.number_location}</td>
                <td>{crew.marshalling_division}</td>
              </tr>
              )}
            </tbody>
            </table>
          </div>
          <Paginator pageNumber={pageNumber} totalPages={totalPages} changePage={changePage} />
        </div>
      </section>
    </>
  );
}
