import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Loader2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Building,
  Award,
  TrendingUp,
  Calendar,
  Star,
  XCircle,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user.full_name}
        </h1>
        <p className="text-gray-500 mt-1">
          {getRoleLabel(user.role)} Dashboard
        </p>
      </div>

      {user.role === 'student' && <StudentDashboard />}
      {user.role === 'workplace_supervisor' && <SupervisorDashboard />}
      {user.role === 'academic_supervisor' && <EvaluatorDashboard />}
      {user.role === 'admin' && <AdminDashboard />}
    </div>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    student: 'Student Intern',
    workplace_supervisor: 'Workplace Supervisor',
    academic_supervisor: 'Academic Supervisor',
    admin: 'Administrator',
  };
  return labels[role] || role;
}

// Student Dashboard
function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await dashboardApi.getStudentDashboard();
      setData(result);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <DashboardLoader />;
  }

  if (error) {
    return <DashboardError message={error} />;
  }

  const { placement, stats, evaluation, recent_logs, recent_reviews } = data;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Logs"
          value={stats.total_logs}
          icon={FileText}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Submitted"
          value={stats.submitted_logs}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard
          title="Approved"
          value={stats.approved_logs}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Current Score"
          value={evaluation ? `${evaluation.total_score}% (${evaluation.grade})` : '—'}
          icon={Award}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Active Placement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {placement ? (
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{placement.organization}</p>
                  {placement.department && <p className="text-gray-600">{placement.department}</p>}
                  {placement.position && <p className="text-gray-500">{placement.position}</p>}
                </div>
                <div className="pt-3 border-t border-gray-200 space-y-2 text-sm">
                  <p><span className="text-gray-500">Duration:</span> {formatDate(placement.start_date)} - {formatDate(placement.end_date)}</p>
                  <p><span className="text-gray-500">Workplace Supervisor:</span> {placement.workplace_supervisor}</p>
                  <p><span className="text-gray-500">Academic Supervisor:</span> {placement.academic_supervisor}</p>
                </div>
                <Link to="/placement">
                  <Button variant="outline" size="sm" className="mt-2">View Details</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-600">No active placement</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-green-600" />
              Weekly Logs
            </CardTitle>
            <Link to="/logs">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recent_logs && recent_logs.length > 0 ? (
              <div className="space-y-2">
                {recent_logs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium">Week {log.week_number}</span>
                    <StatusBadge status={log.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No logs yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      {recent_reviews && recent_reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Recent Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent_reviews.map((review: any) => (
                <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Week {review.week_number}</span>
                    <div className="flex items-center gap-2">
                      {review.rating && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-4 w-4 fill-current" />
                          {review.rating}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        review.decision === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {review.decision}
                      </span>
                    </div>
                  </div>
                  {review.comments && <p className="text-sm text-gray-600">{review.comments}</p>}
                  <p className="text-xs text-gray-400 mt-1">by {review.reviewer_name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Workplace Supervisor Dashboard
function SupervisorDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await dashboardApi.getSupervisorDashboard();
      setData(result);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <DashboardLoader />;
  if (error) return <DashboardError message={error} />;

  const { stats, interns, recent_reviews } = data;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assigned Interns"
          value={stats.assigned_interns}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pending_reviews}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
          link="/reviews"
        />
        <StatCard
          title="Reviews This Week"
          value={stats.reviews_this_week}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Avg. Rating Given"
          value={stats.average_rating ? `${stats.average_rating}/5` : '—'}
          icon={Star}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interns List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              My Interns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interns && interns.length > 0 ? (
              <div className="space-y-3">
                {interns.map((intern: any) => (
                  <div key={intern.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{intern.student_name}</p>
                      <p className="text-sm text-gray-500">{intern.organization}</p>
                    </div>
                    <div className="text-right">
                      {intern.pending_logs > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          {intern.pending_logs} pending
                        </span>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{intern.total_logs} total logs</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No interns assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-green-600" />
              Recent Reviews
            </CardTitle>
            <Link to="/reviews">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recent_reviews && recent_reviews.length > 0 ? (
              <div className="space-y-2">
                {recent_reviews.slice(0, 5).map((review: any) => (
                  <div key={review.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{review.student_name}</p>
                      <p className="text-xs text-gray-500">Week {review.week_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.rating && (
                        <span className="flex items-center gap-1 text-yellow-600 text-sm">
                          <Star className="h-3 w-3 fill-current" />
                          {review.rating}
                        </span>
                      )}
                      {review.decision === 'approved' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No reviews yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Review Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.total_reviews}</p>
              <p className="text-sm text-gray-500">Total Reviews</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.approved_count}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.returned_count}</p>
              <p className="text-sm text-gray-500">Returned</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Academic Supervisor (Evaluator) Dashboard
function EvaluatorDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await dashboardApi.getEvaluatorDashboard();
      setData(result);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <DashboardLoader />;
  if (error) return <DashboardError message={error} />;

  const { stats, pending_logs, pending_interns, recent_reviews, recent_evaluations } = data;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Reviews"
          value={stats.pending_reviews}
          icon={FileText}
          color="text-orange-600"
          bgColor="bg-orange-100"
          link="/reviews"
        />
        <StatCard
          title="Total Assigned"
          value={stats.total_assigned}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Reviews Given"
          value={stats.total_reviews}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Avg. Rating Given"
          value={stats.average_rating ? `${stats.average_rating}/5` : '—'}
          icon={Star}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Log Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Logs Awaiting Review
            </CardTitle>
            <Link to="/reviews">
              <Button variant="outline" size="sm">Review All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pending_logs && pending_logs.length > 0 ? (
              <div className="space-y-3">
                {pending_logs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{log.student_name}</p>
                      <p className="text-sm text-gray-500">Week {log.week_number} - {log.organization}</p>
                    </div>
                    <div className="text-right text-sm">
                      {log.is_late && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Late
                        </span>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">All logs reviewed!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-green-600" />
              My Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent_reviews && recent_reviews.length > 0 ? (
              <div className="space-y-2">
                {recent_reviews.map((review: any) => (
                  <div key={review.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{review.student_name}</p>
                      <p className="text-xs text-gray-500">Week {review.week_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.rating && (
                        <span className="flex items-center gap-1 text-yellow-600 text-sm">
                          <Star className="h-3 w-3 fill-current" />
                          {review.rating}
                        </span>
                      )}
                      {review.decision === 'approved' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No reviews yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Review Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.total_reviews}</p>
              <p className="text-sm text-gray-500">Total Reviews</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.approved_reviews}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.returned_reviews}</p>
              <p className="text-sm text-gray-500">Returned</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.reviews_this_week}</p>
              <p className="text-sm text-gray-500">This Week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Section Header */}
      <div className="border-t pt-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Final Evaluations</h2>
      </div>

      {/* Evaluation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pending Evaluations"
          value={stats.pending_evaluations}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
          link="/evaluations"
        />
        <StatCard
          title="Completed Evaluations"
          value={stats.completed_evaluations}
          icon={Award}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Average Score"
          value={stats.average_score ? `${stats.average_score}%` : '—'}
          icon={TrendingUp}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Evaluations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Awaiting Evaluation
            </CardTitle>
            <Link to="/evaluations">
              <Button variant="outline" size="sm">Evaluate</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pending_interns && pending_interns.length > 0 ? (
              <div className="space-y-3">
                {pending_interns.slice(0, 5).map((intern: any) => (
                  <div key={intern.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{intern.student_name}</p>
                      <p className="text-sm text-gray-500">{intern.organization}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-600">{intern.approved_logs}/{intern.logs_count} logs</p>
                      <StatusBadge status={intern.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">All evaluations complete!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Recent Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent_evaluations && recent_evaluations.length > 0 ? (
              <div className="space-y-2">
                {recent_evaluations.slice(0, 5).map((evaluation: any) => (
                  <div key={evaluation.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{evaluation.student_name}</p>
                      <p className="text-xs text-gray-500">{evaluation.organization}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{evaluation.total_score}%</span>
                      <GradeBadge grade={evaluation.grade} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No evaluations yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      {stats.grade_distribution && Object.keys(stats.grade_distribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              {['A', 'B', 'C', 'D', 'F'].map((grade) => (
                <div key={grade} className={`p-4 rounded-lg ${getGradeBgColor(grade)}`}>
                  <p className="text-2xl font-bold">{stats.grade_distribution[grade] || 0}</p>
                  <p className="text-sm font-medium">{grade}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Admin Dashboard
function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await dashboardApi.getAdminDashboard();
      setData(result);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <DashboardLoader />;
  if (error) return <DashboardError message={error} />;

  const { stats, recent_placements, top_organizations } = data;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.total_students}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Active Placements"
          value={stats.active_placements}
          icon={Building}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completion_rate}%`}
          icon={TrendingUp}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Avg. Score"
          value={stats.average_score ? `${stats.average_score}%` : '—'}
          icon={Award}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-xl font-bold">{stats.total_users}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <p className="text-sm text-gray-500">Supervisors</p>
          <p className="text-xl font-bold">{stats.total_supervisors}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <p className="text-sm text-gray-500">Academics</p>
          <p className="text-xl font-bold">{stats.total_academics}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <p className="text-sm text-gray-500">Total Evaluations</p>
          <p className="text-xl font-bold">{stats.total_evaluations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Placements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Recent Placements
            </CardTitle>
            <Link to="/placements">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recent_placements && recent_placements.length > 0 ? (
              <div className="space-y-2">
                {recent_placements.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{p.student_name}</p>
                      <p className="text-xs text-gray-500">{p.organization}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No placements yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-600" />
              Top Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {top_organizations && top_organizations.length > 0 ? (
              <div className="space-y-2">
                {top_organizations.slice(0, 5).map((org: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <p className="font-medium text-sm">{org.organization}</p>
                    <span className="text-sm text-gray-500">{org.count} interns</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      {stats.grade_distribution && Object.keys(stats.grade_distribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Overall Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              {['A', 'B', 'C', 'D', 'F'].map((grade) => (
                <div key={grade} className={`p-4 rounded-lg ${getGradeBgColor(grade)}`}>
                  <p className="text-2xl font-bold">{stats.grade_distribution[grade] || 0}</p>
                  <p className="text-sm font-medium">{grade}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Status Distribution */}
      {stats.log_status_counts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Log Status Overview ({stats.total_logs} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              {['draft', 'submitted', 'returned', 'reviewed', 'approved'].map((status) => (
                <div key={status} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold">{stats.log_status_counts[status] || 0}</p>
                  <p className="text-xs text-gray-500 capitalize">{status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Helper Components
function DashboardLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  bgColor: string;
  link?: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor, link }: StatCardProps) {
  const content = (
    <Card className={link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
    submitted: { color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
    returned: { color: 'bg-yellow-100 text-yellow-700', label: 'Returned' },
    reviewed: { color: 'bg-purple-100 text-purple-700', label: 'Reviewed' },
    approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
    pending: { color: 'bg-orange-100 text-orange-700', label: 'Pending' },
    active: { color: 'bg-green-100 text-green-700', label: 'Active' },
    completed: { color: 'bg-blue-100 text-blue-700', label: 'Completed' },
    cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
  };
  const { color, label } = config[status] || { color: 'bg-gray-100 text-gray-700', label: status };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-blue-100 text-blue-700',
    C: 'bg-yellow-100 text-yellow-700',
    D: 'bg-orange-100 text-orange-700',
    F: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[grade] || 'bg-gray-100 text-gray-700'}`}>
      {grade}
    </span>
  );
}

function getGradeBgColor(grade: string): string {
  const colors: Record<string, string> = {
    A: 'bg-green-100',
    B: 'bg-blue-100',
    C: 'bg-yellow-100',
    D: 'bg-orange-100',
    F: 'bg-red-100',
  };
  return colors[grade] || 'bg-gray-100';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
