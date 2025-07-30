import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { RaceProps, CrewProps } from '../../components.types';
import './resultsComparison.scss'
import { FormSelect } from '../../atoms/FormSelect/FormSelect';
import TextButton from '../../atoms/TextButton/TextButton';

// Types

interface CrewResult {
  crew_id: number;
  crew_name: string;
  club_name: string;
  bib_number: number | null;
  raw_time: number;
  race_time: number;
  published_time: number;
  formatted_time: string;
  penalty: number;
}

interface CategoryResult {
  winner: CrewResult | null;
  runner_up: CrewResult | null;
  total_crews: number;
}

interface ComparisonResult {
  start_race: string;
  finish_race: string;
  results: Record<string, CategoryResult>;
}

interface ComparisonData {
  comparison1: ComparisonResult;
  comparison2: ComparisonResult;
}

interface RaceSelection {
  start_race_id: string | null;
  finish_race_id: string | null;
}

// API functions
const fetchRaces = async (): Promise<RaceProps[]> => {
  const response = await fetch('/api/races/');
  if (!response.ok) {
    throw new Error('Failed to fetch races');
  }
  return response.json();
};

const compareResults = async (data: {
  comparison1: RaceSelection;
  comparison2: RaceSelection;
}): Promise<ComparisonData> => {
  const response = await fetch('/api/results-comparison/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.getAttribute('value') || '',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to compare results');
  }
  
  return response.json();
};

// Main component
const ResultsComparison: React.FC = () => {
  const [comparison1, setComparison1] = useState<RaceSelection>({
    start_race_id: null,
    finish_race_id: null,
  });
  
  const [comparison2, setComparison2] = useState<RaceSelection>({
    start_race_id: null,
    finish_race_id: null,
  });

  const [hasSetDefaults, setHasSetDefaults] = useState(false);

  // Fetch available races
  const { data: racesData, isLoading: racesLoading, error: racesError } = useQuery({
    queryKey: ['races'],
    queryFn: fetchRaces,
  });

  // Compare results mutation
  const compareResultsMutation = useMutation({
    mutationFn: compareResults,
    onError: (error) => {
      console.error('Comparison failed:', error);
    },
  });

  // Set default race selections when races are loaded
  React.useEffect(() => {
    if (racesData && !hasSetDefaults) {
      const races = racesData || [];
      
      // Find default races
      const defaultStartRace = races.find(race => race.default_start);
      const defaultFinishRace = races.find(race => race.default_finish);
      
      // Find the next race in the list for comparison 2 (first race that's not a default)
      const nextRace = races.find(race => 
        race.id !== defaultStartRace?.id && race.id !== defaultFinishRace?.id
      ) || races[0]; // Fallback to first race if no other race found
      
      if (defaultStartRace && defaultFinishRace) {
        setComparison1({
          start_race_id: defaultStartRace.id,
          finish_race_id: defaultFinishRace.id,
        });
        
        // For comparison 2, use the next race for both start and finish
        if (nextRace) {
          setComparison2({
            start_race_id: nextRace.id,
            finish_race_id: nextRace.id,
          });
        }
        
        setHasSetDefaults(true);
      }
    }
  }, [racesData, hasSetDefaults]);

  const handleCompare = () => {
    if (
      comparison1.start_race_id && comparison1.finish_race_id &&
      comparison2.start_race_id && comparison2.finish_race_id
    ) {
      compareResultsMutation.mutate({ comparison1, comparison2 });
    }
  };

  const canCompare = Boolean(
    comparison1.start_race_id && comparison1.finish_race_id &&
    comparison2.start_race_id && comparison2.finish_race_id
  );

  if (racesLoading) return <div className="results-comparison__loading">Loading races...</div>;
  if (racesError) return <div className="results-comparison__error">Error loading races</div>;

  const races = racesData || [];
  const raceOptions = races.map((race) => ({label: `${race.name}(${race.race_id})`, value: race.id}))

  return (
    <div className="results-comparison">
      <div className="results-comparison__header">
        <h2 className="results-comparison__title">Results Comparison</h2>
        <p className="results-comparison__description">
          Compare winners and runners-up between different start/finish race combinations
        </p>
      </div>

      <div className="results-comparison__selectors">
        <div className="results-comparison__comparison-group">
          <h3 className="results-comparison__group-title">Comparison 1</h3>
          <FormSelect
            label="Start race"
            selectOptions={raceOptions}
            value={comparison1.start_race_id || ''}
            onChange={(e) => setComparison1(prev => ({ ...prev, start_race_id: e.target.value }))} 
            fieldName={'start_race_1'}
            title={''}
            />
          <FormSelect
            label="Finish race"
            selectOptions={raceOptions}
            value={comparison1.finish_race_id || ''}
            onChange={(e) => setComparison1(prev => ({ ...prev, finish_race_id: e.target.value }))}
            fieldName={'finish_race_1'}
            title={''}
            />
        </div>

        <div className="results-comparison__comparison-group">
          <h3 className="results-comparison__group-title">Comparison 2</h3>
          <FormSelect
            label="Start race"
            selectOptions={raceOptions}
            value={comparison2.start_race_id || ''}
            onChange={(e) => setComparison2(prev => ({ ...prev, start_race_id: e.target.value }))}
            fieldName={'start_race_2'}
            title={''}
            />
          <FormSelect
            label="Finish race"
            selectOptions={raceOptions}
            value={comparison2.finish_race_id || ''}
            onChange={(e) => setComparison2(prev => ({ ...prev, finish_race_id: e.target.value }))}
            fieldName={'finish_race_2'}
            title={''}
            />
        </div>
      </div>

      <div className="results-comparison__actions">
        <TextButton
          onClick={handleCompare}
          disabled={!canCompare || compareResultsMutation.isPending}
          loading={compareResultsMutation.isPending}
          label={compareResultsMutation.isPending ? 'Comparing...' : 'Compare results'}
        />
      </div>

      {compareResultsMutation.error && (
        <div className="results-comparison__error">
          Error: {compareResultsMutation.error.message}
        </div>
      )}

      {compareResultsMutation.data && (
        <ComparisonResults data={compareResultsMutation.data} />
      )}
    </div>
  );
};

// Comparison results component using Tanstack React Table
interface ComparisonResultsProps {
  data: ComparisonData;
}

interface TableRow {
  category: string;
  comp1_winner: CrewResult | null;
  comp1_runner_up: CrewResult | null;
  comp1_total: number;
  comp2_winner: CrewResult | null;
  comp2_runner_up: CrewResult | null;
  comp2_total: number;
}

const ComparisonResults: React.FC<ComparisonResultsProps> = ({ data }) => {
  // Transform data for React Table
  const tableData = useMemo((): TableRow[] => {
    const categories = new Set([
      ...Object.keys(data.comparison1.results),
      ...Object.keys(data.comparison2.results),
    ]);

    return Array.from(categories).map(category => {
      const comp1Result = data.comparison1.results[category];
      const comp2Result = data.comparison2.results[category];

      return {
        category,
        comp1_winner: comp1Result?.winner || null,
        comp1_runner_up: comp1Result?.runner_up || null,
        comp1_total: comp1Result?.total_crews || 0,
        comp2_winner: comp2Result?.winner || null,
        comp2_runner_up: comp2Result?.runner_up || null,
        comp2_total: comp2Result?.total_crews || 0,
      };
    });
  }, [data]);

  const columnHelper = createColumnHelper<TableRow>();

  const columns = useMemo((): ColumnDef<TableRow, any>[] => [
    columnHelper.accessor('category', {
      header: 'Category',
      cell: (info) => (
        <div className="results-table__category">{info.getValue()}</div>
      ),
    }),
    columnHelper.group({
      header: `${data.comparison1.start_race} → ${data.comparison1.finish_race}`,
      columns: [
        columnHelper.accessor('comp1_winner', {
          header: 'Winner',
          cell: (info) => <CrewResultCell crew={info.getValue()} />,
        }),
        columnHelper.accessor('comp1_runner_up', {
          header: 'Runner-up',
          cell: (info) => <CrewResultCell crew={info.getValue()} />,
        }),
        columnHelper.accessor('comp1_total', {
          header: 'Total',
          cell: (info) => (
            <div className="results-table__total">{info.getValue()}</div>
          ),
        }),
      ],
    }),
    columnHelper.group({
      header: `${data.comparison2.start_race} → ${data.comparison2.finish_race}`,
      columns: [
        columnHelper.accessor('comp2_winner', {
          header: 'Winner',
          cell: (info) => <CrewResultCell crew={info.getValue()} />,
        }),
        columnHelper.accessor('comp2_runner_up', {
          header: 'Runner-up',
          cell: (info) => <CrewResultCell crew={info.getValue()} />,
        }),
        columnHelper.accessor('comp2_total', {
          header: 'Total',
          cell: (info) => (
            <div className="results-table__total">{info.getValue()}</div>
          ),
        }),
      ],
    }),
  ], [data.comparison1.start_race, data.comparison1.finish_race, data.comparison2.start_race, data.comparison2.finish_race, columnHelper]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="results-comparison__results">
      <h3 className="results-comparison__results-title">Comparison Results</h3>
      <div className="results-table">
        <table className="results-table__table">
          <thead className="results-table__head">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="results-table__header-row">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="results-table__header">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="results-table__body">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="results-table__row">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="results-table__cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Crew result cell component
interface CrewResultCellProps {
  crew: CrewResult | null;
}

const CrewResultCell: React.FC<CrewResultCellProps> = ({ crew }) => {
  if (!crew) {
    return <div className="crew-result--empty">—</div>;
  }

  return (
    <div className="crew-result">
      <div className="crew-result__name">{crew.crew_name}</div>
      <div className="crew-result__club">{crew.club_name}</div>
      <div className="crew-result__time">{crew.formatted_time}</div>
      {crew.bib_number && (
        <div className="crew-result__bib">#{crew.bib_number}</div>
      )}
      {crew.penalty > 0 && (
        <div className="crew-result__penalty">+{crew.penalty}s</div>
      )}
    </div>
  );
};

export default ResultsComparison;