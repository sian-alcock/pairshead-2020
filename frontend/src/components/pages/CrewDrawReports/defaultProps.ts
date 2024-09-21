export const headings = [
    "Crew No",
    "Division",
    "Category",
    "Club",
    "ComCode",
  ];
  
  export const pagingOptions = [
    {label: "20 crews", value: "20"},
    {label: "50 crews", value: "50"},
    {label: "100 crews", value: "100"},
    {label: "All crews", value: "500"}
  ]
  
  export const sortingOptions = [
    {value: "crew", label: "Crew A-Z"},
    {value: "-crew", label: "Crew Z-A"},
    {value: "club__name", label: "Club, asc"},
    {value: "-club__name", label: "Club, desc"},
    {value: "event_band", label: "Event, asc"},
    {value: "-event_band", label: "Event, desc"},
    {value: "bib_number", label: "Bib, asc"},
    {value: "-bib_number", label: "Bib, desc"},
  ]
  