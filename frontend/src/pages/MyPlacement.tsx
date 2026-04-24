import { useState, useEffect } from 'react';
import { placementsApi, logsApi, placementDocumentsApi } from '@/services/api';
import type { Placement, PlacementCreate, WeeklyLog, PlacementStatus, PlacementDocument, PlacementDocumentType, FileUploadProgress } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FileUpload } from '@/components/ui/FileUpload';
import { FileList } from '@/components/ui/FileList';
import {
  Building2,
  Clock,
  User,
  Users,
  Briefcase,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Paperclip,
  Upload,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusConfig: Record<PlacementStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  active: { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-100' },
  completed: { label: 'Completed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export function MyPlacementPage() {
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [documents, setDocuments] = useState<PlacementDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [placementData, logsData] = await Promise.all([
        placementsApi.getActive().catch(() => null),
        logsApi.getAll().catch(() => ({ results: [] })),
      ]);
      setPlacement(placementData);
      setLogs(logsData.results || logsData || []);

      // Load documents if placement exists
      if (placementData) {
        const docs = await placementDocumentsApi.getByPlacement(placementData.id);
        setDocuments(docs || []);
      }
    } catch {
      setError('Failed to load placement data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await placementDocumentsApi.delete(documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch {
      setError('Failed to delete document');
    }
  };

  const handleDocumentUploaded = async () => {
    if (placement) {
      const docs = await placementDocumentsApi.getByPlacement(placement.id);
      setDocuments(docs || []);
    }
    setShowUploadModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!placement) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Placement</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Active Placement</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              You don't have an active internship placement yet. Please contact your academic supervisor or administrator to get assigned to a placement.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[placement.status];
  const startDate = new Date(placement.start_date);
  const endDate = new Date(placement.end_date);
  const today = new Date();

  // Calculate progress
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  // Calculate weeks
  const totalWeeks = Math.ceil(totalDays / 7);
  const currentWeek = Math.min(totalWeeks, Math.ceil(elapsedDays / 7));

  // Log statistics
  const submittedLogs = logs.filter(l => l.status !== 'draft').length;
  const approvedLogs = logs.filter(l => l.status === 'approved').length;
  const pendingLogs = logs.filter(l => l.status === 'submitted' || l.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Placement</h1>
          <p className="text-gray-500 mt-1">View your internship placement details</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Organization Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="text-lg font-semibold text-gray-900">{placement.organization}</p>
              </div>
              {placement.department && (
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="text-gray-900">{placement.department}</p>
                </div>
              )}
              {placement.position && (
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="text-gray-900">{placement.position}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-gray-900">
                  {formatDate(placement.start_date)} - {formatDate(placement.end_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Duration</p>
                <p className="text-gray-900">{totalWeeks} weeks ({totalDays} days)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Card */}
      {placement.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Week {currentWeek} of {totalWeeks}</span>
                  <span className="text-gray-900 font-medium">{progressPercent}% complete</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Started {formatDate(placement.start_date)}</span>
                <span>Ends {formatDate(placement.end_date)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supervisors Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            Supervisors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Workplace Supervisor</p>
                <p className="font-semibold text-gray-900">{placement.workplace_supervisor_name}</p>
                <p className="text-sm text-gray-500 mt-1">At {placement.organization}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Academic Supervisor</p>
                <p className="font-semibold text-gray-900">{placement.academic_supervisor_name}</p>
                <p className="text-sm text-gray-500 mt-1">University Advisor</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-gray-500" />
            Documents
          </CardTitle>
          {placement.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <FileList
            files={documents}
            onDelete={handleDeleteDocument}
            canDelete={placement.status === 'active'}
            showCaption={true}
          />
        </CardContent>
      </Card>

      {/* Logbook Statistics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            Logbook Summary
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/logs')}
            className="flex items-center gap-1"
          >
            View Logs
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Logs"
              value={logs.length.toString()}
              icon={FileText}
              color="text-gray-600"
              bgColor="bg-gray-100"
            />
            <StatCard
              label="Submitted"
              value={submittedLogs.toString()}
              icon={Clock}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatCard
              label="Approved"
              value={approvedLogs.toString()}
              icon={CheckCircle}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard
              label="Pending Review"
              value={pendingLogs.toString()}
              icon={AlertCircle}
              color="text-yellow-600"
              bgColor="bg-yellow-100"
            />
          </div>

          {logs.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                You haven't submitted any weekly logs yet. Start documenting your internship experience!
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => navigate('/logs')}
              >
                Create First Log
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && placement && (
        <DocumentUploadModal
          placementId={placement.id}
          onSuccess={handleDocumentUploaded}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}

interface DocumentUploadModalProps {
  placementId: number;
  onSuccess: () => void;
  onClose: () => void;
}

function DocumentUploadModal({ placementId, onSuccess, onClose }: DocumentUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<PlacementDocumentType>('other');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const documentTypes: { value: PlacementDocumentType; label: string }[] = [
    { value: 'placement_letter', label: 'Placement Letter' },
    { value: 'student_id', label: 'Student ID' },
    { value: 'agreement', label: 'Agreement' },
    { value: 'insurance', label: 'Insurance Certificate' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setIsUploading(true);
    setError('');

    const progress: FileUploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploadProgress(progress);

    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(prev => prev.map((p, idx) =>
        idx === i ? { ...p, status: 'uploading' } : p
      ));

      try {
        await placementDocumentsApi.upload(
          placementId,
          files[i],
          documentType,
          description,
          (percent) => {
            setUploadProgress(prev => prev.map((p, idx) =>
              idx === i ? { ...p, progress: percent } : p
            ));
          }
        );

        setUploadProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'complete', progress: 100 } : p
        ));
      } catch {
        hasError = true;
        setUploadProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'error', error: 'Upload failed' } : p
        ));
      }
    }

    setIsUploading(false);

    if (!hasError) {
      onSuccess();
    } else {
      setError('Some files failed to upload');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upload Document</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
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

            <div>
              <Label htmlFor="document_type">Document Type</Label>
              <select
                id="document_type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as PlacementDocumentType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document"
                className="mt-1"
              />
            </div>

            <FileUpload
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              maxSize={10}
              multiple={true}
              onFilesSelected={(newFiles) => setFiles(prev => [...prev, ...newFiles])}
              uploadProgress={uploadProgress}
              disabled={isUploading}
            />

            {files.length > 0 && uploadProgress.length === 0 && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{files.length} file(s) selected:</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={files.length === 0 || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
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

interface StatCardProps {
  label: string;
  value: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="text-center p-4 rounded-lg bg-gray-50">
      <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${bgColor} mb-2`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
