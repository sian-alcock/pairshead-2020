export const headings = [
  "Id",
  "Crew",
  "Status",
  "Blade",
  "Bib",
  "Club",
  "Category",
  "Start seq#",
  "Finish seq#",
  "Penalty",
  "Start time",
  "Finish time",
  "Raw time",
  "Timing offset",
  "Race time",
  "Mas cat",
  "Mas adjust",
  "Mas adjusted time",
  "Time override",
  "TO",
  "Pos",
  "Pos Cat"
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
  {value: "start_sequence", label: "Start sequence, asc"},
  {value: "-start_sequence", label: "Start sequence, desc"},
  {value: "finish_sequence", label: "Finish sequence, asc"},
  {value: "-finish_sequence", label: "Finish sequence, desc"},
  {value: "club__name", label: "Club, asc"},
  {value: "-club__name", label: "Club, desc"},
  {value: "event_band", label: "Event, asc"},
  {value: "-event_band", label: "Event, desc"},
  {value: "bib_number", label: "Bib, asc"},
  {value: "-bib_number", label: "Bib, desc"},
  {value: "masters_adjustment", label: "Masters adjust, asc"},
  {value: "-masters_adjustment", label: "Masters adjust, desc"}
]
