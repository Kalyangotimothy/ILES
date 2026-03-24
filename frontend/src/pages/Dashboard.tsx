import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export function DashboardPage() {
  const { user } = useAuth();

  const roleLabels = {
    student: 'Student Intern',
    workplace_supervisor: 'Workplace Supervisor',
    academic_supervisor: 'Academic Supervisor',
    admin: 'Administrator',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.full_name}
        </h1>
        <p className="text-gray-500 mt-1">
          {user && roleLabels[user.role]} Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'student' && (
          <>
            <DashboardCard title="Active Placement" value="1" description="Current internship" />
            <DashboardCard title="Logs Submitted" value="8" description="Weekly logs" />
            <DashboardCard title="Pending Reviews" value="2" description="Awaiting supervisor" />
            <DashboardCard title="Current Score" value="—" description="Not yet evaluated" />
          </>
        )}

        {user?.role === 'workplace_supervisor' && (
          <>
            <DashboardCard title="Assigned Interns" value="5" description="Under your supervision" />
            <DashboardCard title="Pending Reviews" value="12" description="Logs to review" />
            <DashboardCard title="Reviews This Week" value="8" description="Completed reviews" />
            <DashboardCard title="Avg. Rating Given" value="8.2" description="Out of 10" />
          </>
        )}

        {user?.role === 'academic_supervisor' && (
          <>
            <DashboardCard title="Assigned Interns" value="10" description="For evaluation" />
            <DashboardCard title="Pending Evaluations" value="3" description="To be completed" />
            <DashboardCard title="Completed Evaluations" value="7" description="This semester" />
            <DashboardCard title="Avg. Score Given" value="72.5" description="Out of 100" />
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <DashboardCard title="Total Interns" value="150" description="Registered students" />
            <DashboardCard title="Active Placements" value="120" description="Currently ongoing" />
            <DashboardCard title="Completion Rate" value="85%" description="This semester" />
            <DashboardCard title="Avg. Final Score" value="71.2" description="All evaluations" />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Activity feed will be displayed here once the system is fully connected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
