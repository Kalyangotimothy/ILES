import { useState, useEffect } from 'react';
import { logsApi, placementsApi, logTemplatesApi, logAttachmentsApi } from '@/services/api';
import type { WeeklyLog, Placement, LogStatus, LogTemplate, LogAttachment, FileUploadProgress } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from "@/components/ui/label";
import { StructuredTextarea } from '@/components/ui/StructuredTextarea';
import { FileUpload } from '@/components/ui/FileUpload';
import { FileList } from '@/components/ui/FileList';
import {
  Plus,
  Edit,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Loader2,
  Paperclip,
} from 'lucide-react';

const statusConfig: Record<LogStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Clock },
  returned: { label: 'Returned', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  reviewed: { label: 'Reviewed', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export function MyLogsPage() {
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WeeklyLog | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [logsData, placementData] = await Promise.all([
        logsApi.getAll(),
        placementsApi.getActive().catch(() => null),
      ]);
      setLogs(logsData.results || logsData);
      setPlacement(placementData);
    } catch {
      setError('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLog = async (logId: number) => {
    setSubmittingId(logId);
    try {
      await logsApi.submit(logId);
      await loadData();
    } catch {
      setError('Failed to submit log');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCreateNew = () => {
    setEditingLog(null);
    setIsModalOpen(true);
  };

  const handleEdit = (log: WeeklyLog) => {
    setEditingLog(log);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const handleSaveSuccess = () => {
    handleModalClose();
    loadData();
  };

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
          <h1 className="text-3xl font-bold text-gray-900">My Logs</h1>
          <p className="text-gray-500 mt-1">
            {placement ? `${placement.organization} - ${placement.position || 'Intern'}` : 'No active placement'}
          </p>
        </div>
        {placement && (
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Log Entry
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!placement && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Active Placement</h3>
            <p className="text-gray-500 mt-2">
              You need an active placement to create weekly logs.
            </p>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 && placement && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Logs Yet</h3>
            <p className="text-gray-500 mt-2">
              Start by creating your first weekly log entry.
            </p>
            <Button onClick={handleCreateNew} className="mt-4">
              Create First Log
            </Button>
          </CardContent>
        </Card>
      )}

      {logs.length > 0 && (
        <div className="grid gap-4">
          {logs.map((log) => {
            const status = statusConfig[log.status];
            const StatusIcon = status.icon;
            const canEdit = log.status === 'draft' || log.status === 'returned';
            const canSubmit = log.status === 'draft' || log.status === 'returned';

            return (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Week {log.week_number}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                        {log.is_late && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Late
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(log.week_start_date)} - {formatDate(log.week_end_date)}
                      </p>
                      <p className="text-gray-700 mt-3 line-clamp-2">
                        {log.activities}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>{log.hours_worked} hours worked</span>
                        {log.submitted_at && (
                          <span>Submitted {formatDate(log.submitted_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(log)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      {canSubmit && (
                        <Button
                          size="sm"
                          onClick={() => handleSubmitLog(log.id)}
                          disabled={submittingId === log.id}
                          className="flex items-center gap-1"
                        >
                          {submittingId === log.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isModalOpen && placement && (
        <LogEntryModal
          log={editingLog}
          placementId={placement.id}
          onClose={handleModalClose}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface LogEntryModalProps {
  log: WeeklyLog | null;
  placementId: number;
  onClose: () => void;
  onSuccess: () => void;
}

function LogEntryModal({ log, placementId, onClose, onSuccess }: LogEntryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    week_number: log?.week_number || 1,
    week_start_date: log?.week_start_date || '',
    week_end_date: log?.week_end_date || '',
    activities: log?.activities || '',
    challenges: log?.challenges || '',
    skills_learned: log?.skills_learned || '',
    hours_worked: log?.hours_worked || 40,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        placement: placementId,
      };

      if (log) {
        await logsApi.update(log.id, data);
      } else {
        await logsApi.create(data);
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      if (error.response?.data) {
        const messages = Object.values(error.response.data).flat();
        setError(messages.join(', '));
      } else {
        setError('Failed to save log entry');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{log ? 'Edit Log Entry' : 'New Log Entry'}</CardTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="week_number">Week Number</Label>
                <Input
                  id="week_number"
                  type="number"
                  min="1"
                  value={formData.week_number}
                  onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="week_start_date">Start Date</Label>
                <Input
                  id="week_start_date"
                  type="date"
                  value={formData.week_start_date}
                  onChange={(e) => setFormData({ ...formData, week_start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="week_end_date">End Date</Label>
                <Input
                  id="week_end_date"
                  type="date"
                  value={formData.week_end_date}
                  onChange={(e) => setFormData({ ...formData, week_end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="activities">Activities Performed</Label>
              <textarea
                id="activities"
                value={formData.activities}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the activities you performed during this week..."
              />
            </div>

            <div>
              <Label htmlFor="challenges">Challenges Encountered (Optional)</Label>
              <textarea
                id="challenges"
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe any challenges you faced..."
              />
            </div>

            <div>
              <Label htmlFor="skills_learned">Skills Learned (Optional)</Label>
              <textarea
                id="skills_learned"
                value={formData.skills_learned}
                onChange={(e) => setFormData({ ...formData, skills_learned: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What new skills did you learn or develop?"
              />
            </div>

            <div>
              <Label htmlFor="hours_worked">Hours Worked</Label>
              <Input
                id="hours_worked"
                type="number"
                min="0"
                max="168"
                step="0.5"
                value={formData.hours_worked}
                onChange={(e) => setFormData({ ...formData, hours_worked: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
