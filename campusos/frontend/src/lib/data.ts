export type WorkloadStatus = 'Healthy' | 'Heavy' | 'Overloaded' | 'Light'

export type Teacher = {
  id: string
  name: string
  email: string
  department: string
  subjects: string[]
  branch: string
  hours: number
  classes: number
  status: WorkloadStatus
  attendanceRate: number
  role: string
  phone: string
  joined: string
}

export const teachers: Teacher[] = [
  { id: 't1', name: 'Sarah Mensah', email: 'sarah.m@campusos.io', department: 'Mathematics', subjects: ['Mathematics', 'Statistics'], branch: 'Main Campus', hours: 18, classes: 6, status: 'Healthy', attendanceRate: 97.2, role: 'Senior Teacher', phone: '+233 24 118 9042', joined: 'Jan 2022' },
  { id: 't2', name: 'Daniel Okafor', email: 'daniel.o@campusos.io', department: 'Sciences', subjects: ['Physics', 'Chemistry'], branch: 'Main Campus', hours: 26, classes: 9, status: 'Heavy', attendanceRate: 94.8, role: 'Teacher', phone: '+233 20 553 8871', joined: 'Aug 2021' },
  { id: 't3', name: 'Michael Adeyemi', email: 'michael.a@campusos.io', department: 'Sciences', subjects: ['Biology', 'Chemistry'], branch: 'East Branch', hours: 34, classes: 12, status: 'Overloaded', attendanceRate: 91.4, role: 'Teacher', phone: '+233 27 902 1140', joined: 'Sep 2020' },
  { id: 't4', name: 'Grace Boateng', email: 'grace.b@campusos.io', department: 'Languages', subjects: ['English', 'Literature'], branch: 'Main Campus', hours: 21, classes: 7, status: 'Healthy', attendanceRate: 98.6, role: 'Coordinator', phone: '+233 24 771 2093', joined: 'Feb 2019' },
  { id: 't5', name: 'James Owusu', email: 'james.o@campusos.io', department: 'Humanities', subjects: ['History', 'Geography'], branch: 'East Branch', hours: 15, classes: 5, status: 'Light', attendanceRate: 96.1, role: 'Teacher', phone: '+233 55 128 4471', joined: 'Nov 2023' },
  { id: 't6', name: 'Fatima Bello', email: 'fatima.b@campusos.io', department: 'Mathematics', subjects: ['Mathematics', 'Further Maths'], branch: 'Main Campus', hours: 29, classes: 10, status: 'Heavy', attendanceRate: 93.2, role: 'Senior Teacher', phone: '+233 24 440 9982', joined: 'Mar 2021' },
  { id: 't7', name: 'David Kimani', email: 'david.k@campusos.io', department: 'ICT', subjects: ['Computer Science', 'ICT'], branch: 'West Branch', hours: 22, classes: 8, status: 'Healthy', attendanceRate: 95.5, role: 'Teacher', phone: '+233 20 337 1029', joined: 'Jul 2022' },
  { id: 't8', name: 'Amina Yusuf', email: 'amina.y@campusos.io', department: 'Sciences', subjects: ['Chemistry'], branch: 'West Branch', hours: 17, classes: 6, status: 'Healthy', attendanceRate: 97.8, role: 'Teacher', phone: '+233 27 665 0043', joined: 'Oct 2023' },
]

export type ClassRow = {
  id: string
  name: string
  teacher: string
  students: number
  schedule: string
  room: string
  attendance: number
  status: 'Active' | 'Archived'
  subject: string
  branch: string
}

export const classes: ClassRow[] = [
  { id: 'c1', name: 'Form 4A', teacher: 'Sarah Mensah', students: 32, schedule: 'Mon, Wed, Fri · 08:00', room: 'Room 204', attendance: 95.2, status: 'Active', subject: 'Mathematics', branch: 'Main Campus' },
  { id: 'c2', name: 'Form 5B', teacher: 'Daniel Okafor', students: 28, schedule: 'Mon–Thu · 10:00', room: 'Lab 301', attendance: 92.8, status: 'Active', subject: 'Physics', branch: 'Main Campus' },
  { id: 'c3', name: 'Form 4C', teacher: 'Sarah Mensah', students: 30, schedule: 'Tue, Thu · 14:00', room: 'Room 204', attendance: 96.1, status: 'Active', subject: 'Mathematics', branch: 'Main Campus' },
  { id: 'c4', name: 'Form 3A', teacher: 'Grace Boateng', students: 34, schedule: 'Daily · 09:00', room: 'Room 112', attendance: 98.4, status: 'Active', subject: 'English', branch: 'Main Campus' },
  { id: 'c5', name: 'Form 6 Sci', teacher: 'Michael Adeyemi', students: 24, schedule: 'Mon, Wed · 11:00', room: 'Lab 305', attendance: 89.7, status: 'Active', subject: 'Biology', branch: 'East Branch' },
  { id: 'c6', name: 'Form 5A', teacher: 'Fatima Bello', students: 29, schedule: 'Tue, Fri · 08:00', room: 'Room 208', attendance: 93.5, status: 'Active', subject: 'Further Maths', branch: 'Main Campus' },
  { id: 'c7', name: 'CS Cohort 2', teacher: 'David Kimani', students: 22, schedule: 'Wed, Fri · 13:00', room: 'Computer Lab', attendance: 94.9, status: 'Active', subject: 'Computer Science', branch: 'West Branch' },
  { id: 'c8', name: 'Form 2B', teacher: 'James Owusu', students: 31, schedule: 'Mon, Thu · 10:00', room: 'Room 104', attendance: 91.2, status: 'Active', subject: 'History', branch: 'East Branch' },
]

export type Room = { id: string; name: string; capacity: number; status: 'Occupied' | 'Available' | 'Maintenance'; building: string; type: string; utilization: number }
export const rooms: Room[] = [
  { id: 'r1', name: 'Room 204', capacity: 40, status: 'Occupied', building: 'Block B', type: 'Classroom', utilization: 82 },
  { id: 'r2', name: 'Room 301', capacity: 30, status: 'Available', building: 'Block C', type: 'Classroom', utilization: 54 },
  { id: 'r3', name: 'Lab 305', capacity: 24, status: 'Occupied', building: 'Science Wing', type: 'Laboratory', utilization: 71 },
  { id: 'r4', name: 'Computer Lab', capacity: 28, status: 'Occupied', building: 'Block A', type: 'Computer Lab', utilization: 88 },
  { id: 'r5', name: 'Room 112', capacity: 36, status: 'Available', building: 'Block B', type: 'Classroom', utilization: 63 },
  { id: 'r6', name: 'Hall 1', capacity: 120, status: 'Maintenance', building: 'Main Hall', type: 'Auditorium', utilization: 22 },
  { id: 'r7', name: 'Room 208', capacity: 38, status: 'Occupied', building: 'Block B', type: 'Classroom', utilization: 77 },
  { id: 'r8', name: 'Lab 301', capacity: 26, status: 'Available', building: 'Science Wing', type: 'Laboratory', utilization: 59 },
]

export type LeaveReq = { id: string; teacher: string; type: string; from: string; to: string; days: number; reason: string; status: 'Pending' | 'Approved' | 'Rejected' }
export const leaveRequests: LeaveReq[] = [
  { id: 'l1', teacher: 'Sarah Mensah', type: 'Medical leave', from: '30 Sep', to: '01 Oct', days: 2, reason: 'Scheduled medical appointment and recovery.', status: 'Pending' },
  { id: 'l2', teacher: 'Daniel Okafor', type: 'Casual leave', from: '02 Oct', to: '02 Oct', days: 1, reason: 'Family commitment.', status: 'Pending' },
  { id: 'l3', teacher: 'James Owusu', type: 'Study leave', from: '05 Oct', to: '09 Oct', days: 5, reason: 'Attending certification exam.', status: 'Pending' },
  { id: 'l4', teacher: 'Grace Boateng', type: 'Annual leave', from: '18 Sep', to: '20 Sep', days: 3, reason: 'Annual vacation.', status: 'Approved' },
  { id: 'l5', teacher: 'Amina Yusuf', type: 'Medical leave', from: '12 Sep', to: '13 Sep', days: 2, reason: 'Sick leave.', status: 'Rejected' },
]

export type Task = { id: string; title: string; assignee: string; due: string; priority: 'High' | 'Medium' | 'Low'; status: 'To Do' | 'In Progress' | 'Completed' }
export const tasks: Task[] = [
  { id: 'k1', title: 'Prepare Form 5 examination materials', assignee: 'Sarah Mensah', due: '2 Oct', priority: 'High', status: 'In Progress' },
  { id: 'k2', title: 'Submit Q3 attendance summary', assignee: 'Grace Boateng', due: '30 Sep', priority: 'High', status: 'To Do' },
  { id: 'k3', title: 'Update Physics lab inventory', assignee: 'Daniel Okafor', due: '4 Oct', priority: 'Medium', status: 'To Do' },
  { id: 'k4', title: 'Review new teacher applications', assignee: 'James Owusu', due: '6 Oct', priority: 'Low', status: 'In Progress' },
  { id: 'k5', title: 'Finalize term timetable draft', assignee: 'Fatima Bello', due: '29 Sep', priority: 'High', status: 'Completed' },
  { id: 'k6', title: 'Distribute parent-evening notices', assignee: 'David Kimani', due: '1 Oct', priority: 'Medium', status: 'Completed' },
  { id: 'k7', title: 'Set up computer lab for CS mock', assignee: 'David Kimani', due: '3 Oct', priority: 'Medium', status: 'To Do' },
]

export type Announce = { id: string; title: string; body: string; audience: string; author: string; time: string; tag: 'General' | 'Schedule' | 'Emergency' | 'Meeting'; read: boolean }
export const announcements: Announce[] = [
  { id: 'a1', title: 'Term 1 examination schedule released', body: 'The examination timetable for Term 1 is now published. Please review your invigilation assignments and confirm availability by Friday.', audience: 'All teachers', author: 'Academic Office', time: '2h ago', tag: 'Schedule', read: false },
  { id: 'a2', title: 'Staff meeting — Thursday 3:30 PM', body: 'Monthly all-staff meeting in Hall 1. Agenda includes term review and the new attendance policy rollout.', audience: 'Main Campus', author: 'Principal', time: '5h ago', tag: 'Meeting', read: false },
  { id: 'a3', title: 'Water outage in Science Wing tomorrow', body: 'Maintenance will shut off water in the Science Wing from 8–11 AM. Labs 305 and 301 sessions are relocated to Block B.', audience: 'Sciences dept.', author: 'Facilities', time: '1d ago', tag: 'Emergency', read: true },
  { id: 'a4', title: 'New grading rubric now in effect', body: 'The updated grading rubric applies from this term. Documentation is available in the resources library.', audience: 'All teachers', author: 'Academic Office', time: '2d ago', tag: 'General', read: true },
]

export type Assignment = { id: string; title: string; className: string; teacher: string; subject: string; due: string; submitted: number; total: number; status: 'Draft' | 'Published' | 'Completed' }
export const assignments: Assignment[] = [
  { id: 'as1', title: 'Quadratic Equations — Problem Set 4', className: 'Form 4A', teacher: 'Sarah Mensah', subject: 'Mathematics', due: '3 Oct', submitted: 24, total: 32, status: 'Published' },
  { id: 'as2', title: 'Newton’s Laws lab report', className: 'Form 5B', teacher: 'Daniel Okafor', subject: 'Physics', due: '5 Oct', submitted: 12, total: 28, status: 'Published' },
  { id: 'as3', title: 'Essay: Themes in Macbeth', className: 'Form 3A', teacher: 'Grace Boateng', subject: 'English', due: '1 Oct', submitted: 34, total: 34, status: 'Completed' },
  { id: 'as4', title: 'Cell division worksheet', className: 'Form 6 Sci', teacher: 'Michael Adeyemi', subject: 'Biology', due: '7 Oct', submitted: 0, total: 24, status: 'Draft' },
  { id: 'as5', title: 'Python functions exercise', className: 'CS Cohort 2', teacher: 'David Kimani', subject: 'Computer Science', due: '4 Oct', submitted: 18, total: 22, status: 'Published' },
]

export type Exam = { id: string; title: string; className: string; subject: string; date: string; time: string; room: string; invigilator: string; status: 'Scheduled' | 'Grading' | 'Completed' }
export const exams: Exam[] = [
  { id: 'e1', title: 'Mathematics Mid-Term', className: 'Form 4A', subject: 'Mathematics', date: '8 Oct', time: '09:00', room: 'Hall 1', invigilator: 'Sarah Mensah', status: 'Scheduled' },
  { id: 'e2', title: 'Physics Mid-Term', className: 'Form 5B', subject: 'Physics', date: '9 Oct', time: '11:00', room: 'Hall 1', invigilator: 'Daniel Okafor', status: 'Scheduled' },
  { id: 'e3', title: 'English Language', className: 'Form 3A', subject: 'English', date: '2 Oct', time: '09:00', room: 'Room 112', invigilator: 'Grace Boateng', status: 'Grading' },
  { id: 'e4', title: 'Biology Practical', className: 'Form 6 Sci', subject: 'Biology', date: '26 Sep', time: '13:00', room: 'Lab 305', invigilator: 'Michael Adeyemi', status: 'Completed' },
]

/* Live operations for management dashboard */
export type LiveClass = { id: string; subject: string; room: string; teacher: string; className: string; time: string; state: 'in-progress' | 'starting' | 'cancelled' }
export const liveClasses: LiveClass[] = [
  { id: 'lv1', subject: 'Mathematics', room: 'Room 204', teacher: 'Sarah Mensah', className: 'Form 4A', time: '08:00–09:00', state: 'in-progress' },
  { id: 'lv2', subject: 'Physics', room: 'Lab 301', teacher: 'Daniel Okafor', className: 'Form 5B', time: '08:00–09:30', state: 'in-progress' },
  { id: 'lv3', subject: 'English', room: 'Room 112', teacher: 'Grace Boateng', className: 'Form 3A', time: '09:00–10:00', state: 'starting' },
  { id: 'lv4', subject: 'Biology', room: 'Lab 305', teacher: 'Michael Adeyemi', className: 'Form 6 Sci', time: '09:00–10:30', state: 'starting' },
  { id: 'lv5', subject: 'History', room: 'Room 104', teacher: 'James Owusu', className: 'Form 2B', time: '08:30–09:30', state: 'cancelled' },
]

/* Timetable grid */
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
export const SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
export type Session = { id: string; day: string; slot: string; subject: string; className: string; teacher: string; room: string; span?: number }
export const sessions: Session[] = [
  { id: 's1', day: 'Mon', slot: '08:00', subject: 'Mathematics', className: 'Form 4A', teacher: 'Sarah Mensah', room: 'Room 204' },
  { id: 's2', day: 'Mon', slot: '10:00', subject: 'Physics', className: 'Form 5B', teacher: 'Daniel Okafor', room: 'Lab 301' },
  { id: 's3', day: 'Mon', slot: '11:00', subject: 'Biology', className: 'Form 6 Sci', teacher: 'Michael Adeyemi', room: 'Lab 305' },
  { id: 's4', day: 'Mon', slot: '14:00', subject: 'History', className: 'Form 2B', teacher: 'James Owusu', room: 'Room 104' },
  { id: 's5', day: 'Tue', slot: '08:00', subject: 'Further Maths', className: 'Form 5A', teacher: 'Fatima Bello', room: 'Room 208' },
  { id: 's6', day: 'Tue', slot: '09:00', subject: 'English', className: 'Form 3A', teacher: 'Grace Boateng', room: 'Room 112' },
  { id: 's7', day: 'Tue', slot: '14:00', subject: 'Mathematics', className: 'Form 4C', teacher: 'Sarah Mensah', room: 'Room 204' },
  { id: 's8', day: 'Wed', slot: '08:00', subject: 'Mathematics', className: 'Form 4A', teacher: 'Sarah Mensah', room: 'Room 204' },
  { id: 's9', day: 'Wed', slot: '11:00', subject: 'Biology', className: 'Form 6 Sci', teacher: 'Michael Adeyemi', room: 'Lab 305' },
  { id: 's10', day: 'Wed', slot: '13:00', subject: 'Computer Science', className: 'CS Cohort 2', teacher: 'David Kimani', room: 'Computer Lab' },
  { id: 's11', day: 'Thu', slot: '09:00', subject: 'English', className: 'Form 3A', teacher: 'Grace Boateng', room: 'Room 112' },
  { id: 's12', day: 'Thu', slot: '10:00', subject: 'History', className: 'Form 2B', teacher: 'James Owusu', room: 'Room 104' },
  { id: 's13', day: 'Thu', slot: '14:00', subject: 'Mathematics', className: 'Form 4C', teacher: 'Sarah Mensah', room: 'Room 204' },
  { id: 's14', day: 'Fri', slot: '08:00', subject: 'Mathematics', className: 'Form 4A', teacher: 'Sarah Mensah', room: 'Room 204' },
  { id: 's15', day: 'Fri', slot: '08:00', subject: 'Further Maths', className: 'Form 5A', teacher: 'Fatima Bello', room: 'Room 208' },
  { id: 's16', day: 'Fri', slot: '13:00', subject: 'Computer Science', className: 'CS Cohort 2', teacher: 'David Kimani', room: 'Computer Lab' },
]

/* Teacher (Sarah) daily schedule */
export const teacherToday: Session[] = [
  { id: 'tt1', day: 'Mon', slot: '08:00', subject: 'Mathematics', className: 'Form 4A', teacher: 'Sarah Mensah', room: 'Room 204' },
  { id: 'tt2', day: 'Mon', slot: '10:00', subject: 'Statistics', className: 'Form 5B', teacher: 'Sarah Mensah', room: 'Room 301' },
  { id: 'tt3', day: 'Mon', slot: '14:00', subject: 'Mathematics', className: 'Form 4C', teacher: 'Sarah Mensah', room: 'Room 204' },
]

const STUDENT_NAMES = [
  'Abena Asante', 'Kwame Nkrumah', 'Zainab Musa', 'Emeka Obi', 'Lindiwe Dube', 'Tunde Bakare',
  'Naledi Khumalo', 'Yaw Darko', 'Chiamaka Eze', 'Kofi Adjei', 'Amara Nwosu', 'Sipho Ndlovu',
  'Efua Owusu', 'Musa Ibrahim', 'Thandiwe Zulu', 'Kelechi Uche', 'Adwoa Serwaa', 'Bongani Sithole',
  'Ngozi Okeke', 'Kojo Antwi', 'Fatoumata Diallo', 'Chinedu Okonkwo', 'Ama Ofori', 'Sekou Traore',
  'Nomvula Mokoena', 'Ibrahima Sow', 'Akosua Frimpong', 'Oluwaseun Ade', 'Palesa Molefe', 'Yusuf Hassan',
  'Nana Yaa Boakye', 'Tariro Moyo',
]

export type Student = { id: string; name: string; status: 'Present' | 'Absent' | 'Late' | null }
export const roster: Student[] = Array.from({ length: 32 }, (_, i) => ({
  id: `st${i + 1}`,
  name: STUDENT_NAMES[i] ?? `Student ${String(i + 1).padStart(2, '0')}`,
  status: null,
}))

/* Activity timeline */
export const activity = [
  { time: '09:05', text: 'Marked attendance for Form 4A', by: 'Sarah Mensah' },
  { time: '10:15', text: 'Published Mathematics assignment — Problem Set 4', by: 'Sarah Mensah' },
  { time: '11:20', text: 'Approved leave request for Grace Boateng', by: 'Admin' },
  { time: '12:40', text: 'Requested medical leave (2 days)', by: 'Sarah Mensah' },
  { time: '13:15', text: 'Resolved schedule conflict in Room 204', by: 'Admin' },
]

/* Analytics trend data */
export const attendanceTrend = [
  { label: 'Mon', value: 96.2 }, { label: 'Tue', value: 94.8 }, { label: 'Wed', value: 95.6 },
  { label: 'Thu', value: 93.1 }, { label: 'Fri', value: 94.9 }, { label: 'Sat', value: 97.2 },
]
export const workloadDist = [
  { label: 'Mathematics', value: 47 }, { label: 'Sciences', value: 77 }, { label: 'Languages', value: 36 },
  { label: 'Humanities', value: 15 }, { label: 'ICT', value: 22 },
]
