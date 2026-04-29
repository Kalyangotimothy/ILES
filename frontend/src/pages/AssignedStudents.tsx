import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { placementsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Placement } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Eye,
} from 'lucide-react';

export function AssignedStudentsPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isAcademic = user?.role === 'academic_supervisor';
  const pageTitle = isAcademic ? 'Assigned Students' : 'Assigned Interns';

  useEffect(() => {
    loadPlacements();
  }, []);

  const loadPlacements = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await placementsApi.getAll();
      setPlacements(data);
    } catch {
      setError('Failed to load assigned students');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Group placements by status
  const activePlacements = placements.filter(p => p.status === 'active');
  const pendingPlacements = placements.filter(p => p.status === 'pending');
  const completedPlacements = placements.filter(p => p.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
            isAcademic ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isAcademic ? <GraduationCap className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
            {placements.length} Total
          </span>
        </div>
        <p className="text-gray-500 mt-1">
          View and manage your assigned {isAcademic ? 'students' : 'interns'} and their internship progress
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active"
          value={activePlacements.length}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Pending"
          value={pendingPlacements.length}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard
          title="Completed"
          value={completedPlacements.length}
          icon={FileText}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
      </div>

      {placements.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No {isAcademic ? 'Students' : 'Interns'} Assigned</h3>
              <p className="text-gray-500 mt-2">
                You don't have any {isAcademic ? 'students' : 'interns'} assigned to you yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Placements */}
          {activePlacements.length > 0 && (
            <PlacementSection
              title="Active Placements"
              placements={activePlacements}
              expandedId={expandedId}
              onToggle={toggleExpand}
              isAcademic={isAcademic}
              statusColor="bg-green-100 text-green-700"
            />
          )}

          {/* Pending Placements */}
          {pendingPlacements.length > 0 && (
            <PlacementSection
              title="Pending Approval"
              placements={pendingPlacements}
              expandedId={expandedId}
              onToggle={toggleExpand}
              isAcademic={isAcademic}
              statusColor="bg-orange-100 text-orange-700"
            />
          )}

          {/* Completed Placements */}
          {completedPlacements.length > 0 && (
            <PlacementSection
              title="Completed Placements"
              placements={completedPlacements}
              expandedId={expandedId}
              onToggle={toggleExpand}
              isAcademic={isAcademic}
              statusColor="bg-gray-100 text-gray-700"
            />
          )}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: typeof Users;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PlacementSectionProps {
  title: string;
  placements: Placement[];
  expandedId: number | null;
  onToggle: (id: number) => void;
  isAcademic: boolean;
  statusColor: string;
}

function PlacementSection({ title, placements, expandedId, onToggle, isAcademic, statusColor }: PlacementSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-600" />
          {title} ({placements.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {placements.map((placement) => (
            <StudentCard
              key={placement.id}
              placement={placement}
              isExpanded={expandedId === placement.id}
              onToggle={() => onToggle(placement.id)}
              isAcademic={isAcademic}
              statusColor={statusColor}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface StudentCardProps {
  placement: Placement;
  isExpanded: boolean;
  onToggle: () => void;
  isAcademic: boolean;
  statusColor: string;
}

function StudentCard({ placement, isExpanded, onToggle, isAcademic, statusColor }: StudentCardProps) {
  const totalLogs = placement.logs_summary?.total || 0;
  const approvedLogs = placement.logs_summary?.approved || 0;
  const pendingLogs = placement.logs_summary?.pending_review || 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <div
        className="p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {placement.student_name?.charAt(0) || 'S'}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">{placement.student_name}</h3>
              <p className="text-sm text-gray-500">{placement.student_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Log Progress */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {approvedLogs}/{totalLogs} logs approved
              </span>
              {pendingLogs > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  {pendingLogs} pending
                </span>
              )}
            </div>

            {/* Status Badge */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {placement.status}
            </span>

            {/* Expand Icon */}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Organization info */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            {placement.organization}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(placement.start_date)} - {formatDate(placement.end_date)}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Placement Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Placement Details</h4>
              <div className="space-y-2 text-sm">
                <DetailRow label="Department" value={placement.department || 'N/A'} />
                <DetailRow label="Position" value={placement.position || 'N/A'} />
                <DetailRow label="Start Date" value={formatDate(placement.start_date)} />
                <DetailRow label="End Date" value={formatDate(placement.end_date)} />
              </div>
            </div>

            {/* Supervisor Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                {isAcademic ? 'Workplace Supervisor' : 'Academic Supervisor'}
              </h4>
              <div className="space-y-2 text-sm">
                <DetailRow
                  label="Name"
                  value={isAcademic
                    ? (placement.workplace_supervisor_name || 'Not assigned')
                    : (placement.academic_supervisor_name || 'Not assigned')
                  }
                />
              </div>
            </div>
          </div>

          {/* Log Summary */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Log Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <LogStatBox label="Total Logs" value={totalLogs} color="bg-blue-50 text-blue-700" />
              <LogStatBox label="Approved" value={approvedLogs} color="bg-green-50 text-green-700" />
              <LogStatBox label="Pending Review" value={pendingLogs} color="bg-orange-50 text-orange-700" />
              <LogStatBox
                label="Returned"
                value={placement.logs_summary?.returned || 0}
                color="bg-red-50 text-red-700"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/reviews">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Logs
              </Button>
            </Link>
            {isAcademic && (
              <Link to="/evaluations">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Evaluate
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}:</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function LogStatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-3 rounded-lg ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
