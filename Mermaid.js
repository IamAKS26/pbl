graph TD
    %% Entry Point
Start((Start))-- > Auth{ Authenticated ?}
Auth-- No-- > Login[Login / Sign Up]
Login-- > DB_Auth[(MongoDB: Users)]
Auth-- Yes-- > Role{User Role }

    %% TEACHER FLOW ==========================
    Role-- Teacher-- > T_Dash[Teacher Dashboard]
    
    %% T1: Project Creation
T_Dash-- > T_Create[Create Project Roadmap]
T_Create-- > T_Define[Define Phases & Tasks]
T_Define-- > DB_Proj[(MongoDB: Projects)]

    %% T2: Monitoring
T_Dash-- > T_Monitor[View Class Kanban]
T_Monitor-- > T_Alert{Analytics Engine }
T_Alert-- "No Activity > 3 Days" -- > RedFlag[Display Red Alert]
T_Alert-- "Active" -- > NormalView[Show Progress Heatmap]
    
    %% T3: Assessment
T_Dash-- > T_Feed[Review Evidence Feed]
T_Feed-- > T_Grade[Grade / Comment on "Moment"]
T_Grade-- > Notify_S[Notify Student]

    %% STUDENT FLOW ==========================
    Role-- Student-- > S_Dash[Student Dashboard]
    
    %% S1: Task Management
S_Dash-- > S_Board[View Team Kanban]
S_Board-- > S_Move[Drag Task Card]
S_Move-- "Socket.io" -- > Sync_T[Update Teacher View]
    
    %% S2: Evidence Capture
S_Board-- > S_Task[Open Task Details]
S_Task-- > S_Upload[Click 'Add Evidence']
S_Upload-- > S_Select{Media Type }
    
    %% S3: GCP Integration Point
S_Select-- Image / Video-- > API_Sign[Request Signed URL]
API_Sign-- > GCP_Bucket[(Google Cloud Storage)]
GCP_Bucket-- Returns URL-- > DB_Task[(MongoDB: Evidence Link)]

    %% S4: Completion
DB_Task-- > S_Submit[Mark Task as Review Ready]
S_Submit-- > Notify_T[Notify Teacher]

    %% Styling
    classDef teacher fill: #e1f5fe, stroke:#01579b, stroke - width: 2px;
    classDef student fill: #e8f5e9, stroke:#1b5e20, stroke - width: 2px;
    classDef tech fill: #fff3e0, stroke: #e65100, stroke - width: 2px, stroke - dasharray: 5 5;

class T_Dash, T_Create, T_Define, T_Monitor, T_Feed, T_Grade teacher;
class S_Dash, S_Board, S_Move, S_Task, S_Upload, S_Submit student;
class GCP_Bucket, DB_Auth, DB_Proj, DB_Task, Sync_T tech;