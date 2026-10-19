import { DEFAULT_COUNTRY, DEFAULT_DIAL_CODE } from 'app/utils/constant'

// Column definitions for different tabs
export const TABLE_COLUMNS = {
  reminders: [
    { id: 'checkbox', label: '', align: 'center', width: '50px' },
    { id: 'dueDate', label: 'Due Date', align: 'left', width: '100px' },
    { id: 'createdAt', label: 'Time', align: 'left', width: '100px' },
    { id: 'message', label: 'Message', align: 'left', width: '200px' },
    {
      id: 'customerName',
      label: 'Customer Name',
      align: 'left',
      width: '150px'
    },
    {
      id: 'addedBy',
      label: 'Added By',
      align: 'left',
      width: '120px'
    }
  ],
  tasks: [
    { id: 'taskName', label: 'Task Name', align: 'left', width: '150px' },
    { id: 'startDate', label: 'Start Date', align: 'left', width: '130px' },
    { id: 'dueDate', label: 'Due Date', align: 'left', width: '130px' },
    { id: 'assignTo', label: 'Assign To', align: 'left', width: '130px' },
    { id: 'priority', label: 'Priority', align: 'left', width: '100px' },
    { id: 'status', label: 'Status', align: 'left', width: '100px' }
  ],
  updates: [
    { id: 'message', label: 'Message', align: 'left', width: '170px' },
    { id: 'updatedBy', label: 'Added By', align: 'left', width: '80px' },
    { id: 'createdAt', label: 'Created At', align: 'left', width: '100px' },
    { id: 'actions', label: 'Actions', align: 'left', width: '80px' }
  ],
  announcements: [
    { id: 'title', label: 'Event', align: 'left', width: '100px' },
    { id: 'startDate', label: 'Start Date', align: 'left', width: '100px' },
    { id: 'endDate', label: 'End Date', align: 'left', width: '100px' },
    { id: 'addedBy', label: 'Added By', align: 'left', width: '160px' }
  ],
  latestActivity: [
    {
      id: 'description',
      label: 'Description',
      align: 'left',
      width: '60%'
    },
    { id: 'startDate', label: 'Date' },
    { id: 'user', label: 'Added By' }
  ]
}

// Status options
export const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed']

// Status color mappings
export const STATUS_COLORS = {
  Completed: {
    color: '#84cc16',
    bgColor: '#f0ffdc',
    borderColor: '#ceeba2'
  },
  'In Progress': {
    color: '#3b82f6',
    bgColor: '#f7faff',
    borderColor: '#b1cdfb'
  },
  'Not Started': {
    color: '#64748b',
    bgColor: '#f9fafb',
    borderColor: '#c1c7d1'
  }
}

// Initial lead form values
export const INITIAL_LEAD_VALUES = {
  customerName: '',
  companyName: [''],
  mobileNumber: [''],
  email: '',
  status: '',
  country: DEFAULT_COUNTRY,
  phoneCountryCode: DEFAULT_DIAL_CODE,
  state: null,
  city: null,
  products: [],
  zipCode: '',
  representative: '',
  inquiries: '',
  competitorName: '',
  competitorRate: '',
  remark: '',
  comments: '',
  quantity: '',
  unit: '',
  meeting: false,
  meetingType: '',
  requestSample: false,
  visitPlant: false,
  visitOffice: false,
  deliveryDestination: []
}

// Table container styles
export const TABLE_CONTAINER_SX = {
  padding: '0 10px',
  maxHeight: 400,
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '6px',
    height: '6px'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'grey',
    borderRadius: '5px'
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#555'
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1'
  }
}
