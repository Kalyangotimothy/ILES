import { useState, useEffect } from 'react';
import { usersApi, placementsApi, reviewsApi, evaluationsApi } from '@/services/api';
import type { User, Placement } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  ClipboardCheck,
  Award,
  BarChart3,
  Loader2,
  FileDown,
} from 'lucide-react';

interface ReportStats {
  totalUsers: number;
  totalStudents: number;
  totalSupervisors: number;
  totalPlacements: number;
  activePlacements: number;
  completedPlacements: number;
  pendingPlacements: number;
  totalReviews: number;
  totalEvaluations: number;
}

export function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<string>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [usersData, placementsData, reviewsData, evaluationsData] = await Promise.all([
        usersApi.getAll(),
        placementsApi.getAll(),
        reviewsApi.getStats().catch(() => ({ total_reviews: 0 })),
        evaluationsApi.getStats().catch(() => ({ completed_evaluations: 0 })),
      ]);

      setUsers(usersData);
      setPlacements(placementsData);

      // Calculate statistics
      const statsData: ReportStats = {
        totalUsers: usersData.length,
        totalStudents: (usersData as User[]).filter((u) => u.role === 'student').length,
        totalSupervisors: (usersData as User[]).filter(
          (u) => u.role === 'workplace_supervisor' || u.role === 'academic_supervisor'
        ).length,
        totalPlacements: placementsData.length,
        activePlacements: (placementsData as Placement[]).filter((p) => p.status === 'active').length,
        completedPlacements: (placementsData as Placement[]).filter((p) => p.status === 'completed').length,
        pendingPlacements: (placementsData as Placement[]).filter((p) => p.status === 'pending').length,
        totalReviews: reviewsData.total_reviews || 0,
        totalEvaluations: evaluationsData.completed_evaluations || 0,
      };

      setStats(statsData);
    } catch (err) {
      setError('Failed to load report data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = (data: unknown[], filename: string) => {
    if (data.length === 0) return;

    // Convert data to CSV
    const headers = Object.keys(data[0] as object).join(',');
    const rows = data.map((row) =>
      Object.values(row as object)
        .map((val) => `"${val}"`)
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportUsers = () => {
    const exportData = users.map((user) => ({
      ID: user.id,
      'Student Number': user.student_number,
      'Full Name': user.full_name,
      Email: user.email,
      Role: user.role,
      Organization: user.organization || 'N/A',
      Status: user.is_active ? 'Active' : 'Inactive',
    }));
    exportToCSV(exportData, 'users-report');
  };

  const handleExportPlacements = () => {
    const exportData = placements.map((placement) => ({
      ID: placement.id,
      Student: placement.student_name,
      'Student Number': placement.student_number,
      Organization: placement.organization,
      Department: placement.department || 'N/A',
      Position: placement.position || 'N/A',
      'Start Date': placement.start_date,
      'End Date': placement.end_date,
      Status: placement.status,
      'Workplace Supervisor': placement.workplace_supervisor_name || 'Not assigned',
      'Academic Supervisor': placement.academic_supervisor_name || 'Not assigned',
    }));
    exportToCSV(exportData, 'placements-report');
  };

  const handleExportPlacementsByStatus = (status: string) => {
    const filtered = placements.filter((p) => p.status === status);
    const exportData = filtered.map((placement) => ({
      ID: placement.id,
      Student: placement.student_name,
      Organization: placement.organization,
      'Start Date': placement.start_date,
      'End Date': placement.end_date,
      'Workplace Supervisor': placement.workplace_supervisor_name || 'Not assigned',
      'Academic Supervisor': placement.academic_supervisor_name || 'Not assigned',
    }));
    exportToCSV(exportData, `placements-${status}-report`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">
            Generate and export system reports
          </p>
        </div>
        <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.totalStudents || 0} students, ${stats?.totalSupervisors || 0} supervisors`}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <MetricCard
          title="Active Placements"
          value={stats?.activePlacements || 0}
          subtitle={`${stats?.totalPlacements || 0} total placements`}
          icon={ClipboardCheck}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <MetricCard
          title="Total Reviews"
          value={stats?.totalReviews || 0}
          subtitle="Log reviews completed"
          icon={FileText}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <MetricCard
          title="Evaluations"
          value={stats?.totalEvaluations || 0}
          subtitle="Completed evaluations"
          icon={Award}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReportTypeButton
          icon={Users}
          title="Users Report"
          description="Export all users data"
          onClick={handleExportUsers}
          isActive={selectedReport === 'users'}
          onSelect={() => setSelectedReport('users')}
        />
        <ReportTypeButton
          icon={ClipboardCheck}
          title="Placements Report"
          description="Export all placements"
          onClick={handleExportPlacements}
          isActive={selectedReport === 'placements'}
          onSelect={() => setSelectedReport('placements')}
        />
        <ReportTypeButton
          icon={BarChart3}
          title="Status Report"
          description="Placements by status"
          onClick={() => {}}
          isActive={selectedReport === 'status'}
          onSelect={() => setSelectedReport('status')}
        />
      </div>

      {/* Detailed Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-gray-600" />
            Generate Detailed Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Placements Summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-gray-600" />
                Placements Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReportCard
                  title="Active Placements"
                  count={stats?.activePlacements || 0}
                  color="bg-green-100 text-green-700"
                  onExport={() => handleExportPlacementsByStatus('active')}
                />
                <ReportCard
                  title="Pending Approval"
                  count={stats?.pendingPlacements || 0}
                  color="bg-orange-100 text-orange-700"
                  onExport={() => handleExportPlacementsByStatus('pending')}
                />
                <ReportCard
                  title="Completed"
                  count={stats?.completedPlacements || 0}
                  color="bg-blue-100 text-blue-700"
                  onExport={() => handleExportPlacementsByStatus('completed')}
                />
              </div>
            </div>

            {/* User Distribution */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                User Distribution
              </h3>
              <div className="space-y-2">
                <DistributionBar
                  label="Students"
                  count={stats?.totalStudents || 0}
                  total={stats?.totalUsers || 1}
                  color="bg-blue-500"
                />
                <DistributionBar
                  label="Workplace Supervisors"
                  count={users.filter((u) => u.role === 'workplace_supervisor').length}
                  total={stats?.totalUsers || 1}
                  color="bg-purple-500"
                />
                <DistributionBar
                  label="Academic Supervisors"
                  count={users.filter((u) => u.role === 'academic_supervisor').length}
                  total={stats?.totalUsers || 1}
                  color="bg-green-500"
                />
                <DistributionBar
                  label="Administrators"
                  count={users.filter((u) => u.role === 'admin').length}
                  total={stats?.totalUsers || 1}
                  color="bg-red-500"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button onClick={handleExportUsers} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export All Users
              </Button>
              <Button onClick={handleExportPlacements} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export All Placements
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof Users;
  color: string;
  bgColor: string;
}

function MetricCard({ title, value, subtitle, icon: Icon, color, bgColor }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReportTypeButtonProps {
  icon: typeof FileText;
  title: string;
  description: string;
  onClick: () => void;
  isActive: boolean;
  onSelect: () => void;
}

function ReportTypeButton({ icon: Icon, title, description, onClick, isActive, onSelect }: ReportTypeButtonProps) {
  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-gray-100'}`}>
          <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-600'}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            size="sm"
            className="mt-3 flex items-center gap-2"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ReportCardProps {
  title: string;
  count: number;
  color: string;
  onExport: () => void;
}

function ReportCard({ title, count, color, onExport }: ReportCardProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{count}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface DistributionBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function DistributionBar({ label, count, total, color }: DistributionBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
