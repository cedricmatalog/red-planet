/**
 * Base URL for the API
 */
const API_URL = 'http://localhost:3000';

/**
 * Represents a workplace entity from the API
 */
interface Workplace {
  /** Unique identifier for the workplace */
  id: number;
  /** Name of the workplace */
  name: string;
  /** Status code (0=ACTIVE, 1=SUSPENDED, 2=CLOSED) */
  status: number;
}

/**
 * Represents a shift entity from the API
 */
interface Shift {
  /** Unique identifier for the shift */
  id: number;
  /** ISO string timestamp when the shift starts */
  startAt: string;
  /** ISO string timestamp when the shift ends */
  endAt: string;
  /** ID of the workplace that posted this shift */
  workplaceId: number;
  /** ID of the worker who claimed this shift, or null if unclaimed */
  workerId: number | null;
  /** ISO string timestamp when the shift was cancelled, or null if not cancelled */
  cancelledAt: string | null;
}

/**
 * Generic API response structure with pagination support
 * @template T - The type of data contained in the response
 */
interface ApiResponse<T> {
  /** Array of data items returned by the API */
  data: T;
  /** Pagination links */
  links?: {
    /** URL to the next page of results, or undefined if there are no more pages */
    next?: string;
  };
}

/**
 * Object to track workplace activity metrics
 */
interface WorkplaceActivity {
  /** Name of the workplace */
  name: string;
  /** Number of completed shifts */
  shifts: number;
}

/**
 * Fetches all workplaces from the API, handling pagination automatically
 * @returns {Promise<Workplace[]>} Array of all workplaces
 */
async function fetchAllWorkplaces(): Promise<Workplace[]> {
  let url = `${API_URL}/workplaces`;
  const workplaces: Workplace[] = [];

  while (url) {
    try {
      const response = await fetch(url);
      const data = await response.json() as ApiResponse<Workplace[]>;
      workplaces.push(...data.data);
      
      // Handle pagination
      url = data.links?.next || '';
    } catch (error) {
      console.error('Error fetching workplaces:', error);
      break;
    }
  }

  return workplaces;
}

/**
 * Fetches all shifts from the API, handling pagination automatically
 * @returns {Promise<Shift[]>} Array of all shifts
 */
async function fetchAllShifts(): Promise<Shift[]> {
  let url = `${API_URL}/shifts`;
  const shifts: Shift[] = [];

  while (url) {
    try {
      const response = await fetch(url);
      const data = await response.json() as ApiResponse<Shift[]>;
      shifts.push(...data.data);
      
      // Handle pagination
      url = data.links?.next || '';
    } catch (error) {
      console.error('Error fetching shifts:', error);
      break;
    }
  }

  return shifts;
}

/**
 * Main function to identify and display the top active workplaces
 * 
 * The function:
 * 1. Fetches all workplaces and shifts from the API
 * 2. Filters for active workplaces (status code 0)
 * 3. Counts completed shifts for each workplace
 * 4. Sorts workplaces by shift count and takes the top 3
 * 5. Outputs the results in the required format
 * 
 * @returns {Promise<void>}
 */
async function getTopWorkplaces(): Promise<void> {
  try {
    // Fetch all workplaces and shifts
    const workplaces = await fetchAllWorkplaces();
    const shifts = await fetchAllShifts();

    // Filter active workplaces (status 0 = ACTIVE)
    const activeWorkplaces = workplaces.filter(workplace => workplace.status === 0);

    // Count completed shifts for each workplace
    const workplaceActivity: WorkplaceActivity[] = activeWorkplaces.map(workplace => {
      // Count shifts that have a worker assigned and haven't been cancelled
      const completedShifts = shifts.filter(shift => 
        shift.workplaceId === workplace.id && 
        shift.workerId !== null && 
        shift.cancelledAt === null
      ).length;

      return {
        name: workplace.name,
        shifts: completedShifts
      };
    });

    // Sort workplaces by number of shifts (descending)
    workplaceActivity.sort((a, b) => b.shifts - a.shifts);

    // Take top 3 workplaces
    const topWorkplaces = workplaceActivity.slice(0, 3);

    // Print the results in the required format (multi-line, pretty-printed)
    console.log('[');
    topWorkplaces.forEach((wp, idx) => {
      const comma = idx < topWorkplaces.length - 1 ? ',' : '';
      console.log(`  { name: "${wp.name}", shifts: ${wp.shifts} }${comma}`);
    });
    console.log(']');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
getTopWorkplaces();
