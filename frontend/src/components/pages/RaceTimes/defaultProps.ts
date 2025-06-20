export const headings = [
  "Sequence",
  "Tap",
  "Start / Finish Tap",
  "Bib number",
  "Crew ID",
  "Crew name",
  "Competitors",
  "Category",
  "Race"
]

export const pagingOptions = [
  {label: "20 times", value: "20"},
  {label: "50 times", value: "50"},
  {label: "100 times", value: "100"},
  {label: "All times", value: "500"}
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