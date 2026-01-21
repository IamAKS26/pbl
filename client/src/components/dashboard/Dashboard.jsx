import { useAuth } from '../../context/AuthContext';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

const Dashboard = () => {
    const { user } = useAuth();

    if (user?.role === 'Teacher') {
        return <TeacherDashboard />;
    }

    return <StudentDashboard />;
};

export default Dashboard;
