# Radiology Management Information System (RMIS)

A comprehensive web-based radiology management system designed to centralize key radiology workflows, including patient scheduling, imaging order management, report creation, and results distribution.

## Project Overview

This RMIS prototype enhances radiology workflow efficiency and supports accurate and timely diagnosis by:

- Digitizing patient scheduling and imaging order management
- Tracking imaging procedures from request to reporting
- Providing structured, digital radiology reports
- Facilitating communication between radiologists, technologists, and clinicians
- Improving data accuracy, integrity, and accessibility
- Reducing delays and enhancing service delivery in the radiology department

## Key Features

### Admin Dashboard
- **Overview Dashboard**: Real-time KPIs, workflow tracking, and operational alerts
- **Imaging Requests Management**: Queue management with approval/rejection workflow
- **Scheduling & Resources**: Calendar-based appointment scheduling with resource tracking
- **Radiology Reports**: Report management with status tracking and turnaround metrics
- **Patient Directory**: Comprehensive patient information and history
- **Critical Results Notification**: Urgent findings tracking with acknowledgment workflow
- **User Management**: Role-based access control with user account management
- **Audit Logs**: Complete activity tracking for compliance and security

### Physician Dashboard
- **Overview Dashboard**: Quick access to patient stats, pending results, and critical alerts
- **My Patients**: Patient list with diagnosis, pending/completed studies tracking
- **Order Imaging**: Streamlined imaging order form with priority levels and clinical indication
- **Results & Reports**: View radiology reports with findings, impressions, and recommendations
- **Critical Alerts**: Real-time notifications for urgent findings requiring immediate action
- **Patient Detail View**: Comprehensive patient information with study history
- **Report Actions**: Download, print, and share reports with patients

### Radiologist Dashboard
- **Overview Dashboard**: Productivity metrics, pending studies, and daily activity tracking
- **My Worklist**: Prioritized list of studies awaiting interpretation with STAT/Urgent filtering
- **Create Report**: Comprehensive reporting interface with structured sections
  - Technique, Findings, Impression, Recommendations
  - Critical finding flagging with automatic physician notification
  - Draft, Preliminary, and Final report status
  - Template integration for efficient reporting
- **My Reports**: Personal report history with turnaround time tracking
- **Report Templates**: Library of standardized templates by category (Neuro, Chest, Abdomen, MSK)
  - Pre-populated technique and findings sections
  - Usage statistics and quick access
- **Quick Actions**: Voice dictation, compare studies, measurements

### Technician Dashboard
- **Overview Dashboard**: Daily scan metrics, queue length, equipment status, and performance tracking
- **Scan Queue**: Manage scheduled imaging procedures
  - Priority-based queue (STAT, Urgent, Routine)
  - Patient demographics and study details
  - Contrast and special instructions alerts
  - Status tracking (Scheduled, Checked In, In Progress, Completed)
  - Workflow management from check-in to completion
- **Patient Check-In**: Register patient arrival and pre-scan verification
  - Safety screening questionnaire completion
  - Informed consent documentation
  - Patient preparation checklist
  - Identity verification workflow
- **Equipment Status**: Monitor and manage imaging equipment
  - Real-time equipment status (Active, Idle, Maintenance, Offline)
  - Utilization tracking and capacity planning
  - Maintenance schedule tracking
  - Issue logging and history
- **Quality Control**: Equipment testing and quality assurance
  - Daily QC test logging (calibration, image quality, radiation dose)
  - Pass/Fail/Warning result tracking
  - QC checklist and compliance tracking
  - Equipment performance documentation

### Critical Results Notification System
- Real-time tracking of critical and urgent findings
- Multi-channel notification support (Phone, SMS, Email, In-Person)
- Acknowledgment and escalation workflow
- Response time metrics
- Complete audit trail for patient safety compliance

### User & Role Management
- Four role types: Admin, Radiologist, Technician, Physician
- User account creation and deactivation
- Activity tracking with last login timestamps
- Search and filter capabilities
- Role-based access control foundation

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Default Login
- **Admin Role**: Access admin dashboard with full system management
- **Physician Role**: Access physician portal for patient care and imaging orders
- **Radiologist Role**: Access radiologist workstation for reading studies and creating reports
- **Technician Role**: Access technician console for scan operations and equipment management
- Select role on login page to access respective dashboard

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin dashboard components
│   │   ├── AdminSidebar.tsx
│   │   ├── ImagingRequestsPanel.tsx
│   │   ├── SchedulingPanel.tsx
│   │   ├── ReportsPanel.tsx
│   │   ├── PatientsPanel.tsx
│   │   ├── CriticalResultsPanel.tsx
│   │   ├── UserManagementPanel.tsx
│   │   ├── AuditLogsPanel.tsx
│   │   └── ...
│   ├── physician/      # Physician portal components
│   │   ├── PhysicianSidebar.tsx
│   │   ├── MyPatientsPanel.tsx
│   │   ├── OrderImagingPanel.tsx
│   │   ├── ResultsPanel.tsx
│   │   ├── CriticalAlertsPanel.tsx
│   │   └── ...
│   ├── radiologist/    # Radiologist workstation components
│   │   ├── RadiologistSidebar.tsx
│   │   ├── WorklistPanel.tsx
│   │   ├── ReportingPanel.tsx
│   │   ├── MyReportsPanel.tsx
│   │   ├── TemplatesPanel.tsx
│   │   └── ...
│   └── technician/     # Technician console components
│       ├── TechnicianSidebar.tsx
│       ├── ScanQueuePanel.tsx
│       ├── PatientCheckInPanel.tsx
│       ├── EquipmentStatusPanel.tsx
│       ├── QualityControlPanel.tsx
│       └── ...
├── pages/
│   ├── LoginPage.tsx
│   ├── AdminDashboardPage.tsx
│   ├── PhysicianDashboardPage.tsx
│   ├── RadiologistDashboardPage.tsx
│   └── TechnicianDashboardPage.tsx
└── ...
```

## Future Enhancements

- DICOM/PACS integration for image viewing
- HL7 interface for EMR/HIS integration
- Billing and insurance management
- Advanced analytics and reporting
- Equipment maintenance tracking
- Patient portal for results access

## License

This is a prototype project for educational purposes.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
