import { useState, useEffect } from 'react';
import { placementsApi, usersApi } from '@/services/api';
import type { Placement, PlacementStatus, User } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Building2,
  Calendar,
  User as UserIcon,
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Search,
} from 'lucide-react';

const statusConfig: Record<PlacementStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
};

interface PlacementFormData {
  student: number | '';
  workplace_supervisor: number | '';
  academic_supervisor: number | '';
  organization: string;
  department: string;
  position: string;
  start_date: string;
  end_date: string;
  status: PlacementStatus;
}

const initialFormData: PlacementFormData = {
  student: '',
  workplace_supervisor: '',
  academic_supervisor: '',
  organization: '',
  department: '',
  position: '',
  start_date: '',
  end_date: '',
  status: 'pending',
};

export function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [workplaceSupervisors, setWorkplaceSupervisors] = useState<User[]>([]);
  const [academicSupervisors, setAcademicSupervisors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlacementStatus | 'all'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PlacementFormData>(initialFormData);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [placementsData, studentsData, wpSupervisors, acSupervisors] = await Promise.all([
        placementsApi.getAll(),
        usersApi.getByRole('student'),
        usersApi.getByRole('workplace_supervisor'),
        usersApi.getByRole('academic_supervisor'),
      ]);
      setPlacements(placementsData);
      setStudents(studentsData);
      setWorkplaceSupervisors(wpSupervisors);
      setAcademicSupervisors(acSupervisors);
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const handleEdit = (placement: Placement) => {
    setFormData({
      student: placement.student,
      workplace_supervisor: placement.workplace_supervisor,
      academic_supervisor: placement.academic_supervisor,
      organization: placement.organization,
      department: placement.department || '',
      position: placement.position || '',
      start_date: placement.start_date,
      end_date: placement.end_date,
      status: placement.status,
    });
    setIsEditing(true);
    setEditingId(placement.id);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.student || !formData.workplace_supervisor || !formData.academic_supervisor) {
      setFormError('Please select student and both supervisors');
      return;
    }

    if (!formData.organization.trim()) {
      setFormError('Organization is required');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setFormError('Start and end dates are required');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setFormError('End date must be after start date');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        student: formData.student,
        workplace_supervisor: formData.workplace_supervisor,
        academic_supervisor: formData.academic_supervisor,
        organization: formData.organization,
        department: formData.department || undefined,
        position: formData.position || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
      };

      if (isEditing && editingId) {
        await placementsApi.update(editingId, payload);
      } else {
        await placementsApi.create(payload);
      }

      setShowModal(false);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } };
      if (error.response?.data?.non_field_errors) {
        setFormError(error.response.data.non_field_errors[0]);
      } else if (error.response?.data?.detail) {
        setFormError(error.response.data.detail);
      } else {
        setFormError('Failed to save placement');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await placementsApi.delete(id);
      setDeleteConfirm(null);
      loadData();
    } catch {
      setError('Failed to delete placement');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPlacements = placements.filter((p) => {
    const matchesSearch =
      p.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.workplace_supervisor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.academic_supervisor_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Placements</h1>
          <p className="text-gray-500 mt-1">Manage internship placements</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Placement
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by student, organization, or supervisor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PlacementStatus | 'all')}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Placements Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Placements ({filteredPlacements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlacements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No placements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500">Student</th>
                    <th className="pb-3 font-medium text-gray-500">Organization</th>
                    <th className="pb-3 font-medium text-gray-500">Workplace Supervisor</th>
                    <th className="pb-3 font-medium text-gray-500">Academic Supervisor</th>
                    <th className="pb-3 font-medium text-gray-500">Period</th>
                    <th className="pb-3 font-medium text-gray-500">Status</th>
                    <th className="pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPlacements.map((placement) => {
                    const status = statusConfig[placement.status];
                    const StatusIcon = status.icon;
                    return (
                      <tr key={placement.id} className="hover:bg-gray-50">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{placement.student_name}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <div>
                              <div>{placement.organization}</div>
                              {placement.department && (
                                <div className="text-xs text-gray-500">{placement.department}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                            {placement.workplace_supervisor_name}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            {placement.academic_supervisor_name}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div className="text-sm">
                              <div>{new Date(placement.start_date).toLocaleDateString()}</div>
                              <div className="text-gray-500">
                                to {new Date(placement.end_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(placement)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {deleteConfirm === placement.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(placement.id)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Confirm'
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(placement.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Edit Placement' : 'New Placement'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Select */}
                <div className="space-y-2">
                  <Label htmlFor="student">Student *</Label>
                  <select
                    id="student"
                    value={formData.student}
                    onChange={(e) =>
                      setFormData({ ...formData, student: e.target.value ? Number(e.target.value) : '' })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.student_number})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Organization */}
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization *</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. ABC Corporation"
                    required
                  />
                </div>

                {/* Workplace Supervisor */}
                <div className="space-y-2">
                  <Label htmlFor="workplace_supervisor">Workplace Supervisor *</Label>
                  <select
                    id="workplace_supervisor"
                    value={formData.workplace_supervisor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workplace_supervisor: e.target.value ? Number(e.target.value) : '',
                      })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    required
                  >
                    <option value="">Select a workplace supervisor</option>
                    {workplaceSupervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.organization || 'No org'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Academic Supervisor */}
                <div className="space-y-2">
                  <Label htmlFor="academic_supervisor">Academic Supervisor *</Label>
                  <select
                    id="academic_supervisor"
                    value={formData.academic_supervisor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        academic_supervisor: e.target.value ? Number(e.target.value) : '',
                      })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    required
                  >
                    <option value="">Select an academic supervisor</option>
                    {academicSupervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.organization || 'No org'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Engineering"
                  />
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g. Software Developer Intern"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>

                {/* Status */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as PlacementStatus })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    'Update Placement'
                  ) : (
                    'Create Placement'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
