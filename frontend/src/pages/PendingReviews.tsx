import { useState, useEffect } from 'react';
import { reviewsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { PendingLogForReview, ReviewStats, SupervisorReview, ReviewDecision } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Star,
  AlertTriangle,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

export function PendingReviewsPage() {
  const { user } = useAuth();
  const [pendingLogs, setPendingLogs] = useState<PendingLogForReview[]>([]);
  const [myReviews, setMyReviews] = useState<SupervisorReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<PendingLogForReview | null>(null);
  const [showReviews, setShowReviews] = useState(false);

  const isAcademic = user?.role === 'academic_supervisor';
  const supervisorType = isAcademic ? 'Academic Supervisor' : 'Workplace Supervisor';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [pendingData, reviewsData, statsData] = await Promise.all([
        reviewsApi.getPendingLogs(),
        reviewsApi.getMyReviews(),
        reviewsApi.getStats(),
      ]);
      setPendingLogs(pendingData);
      setMyReviews(reviewsData);
      setStats(statsData);
    } catch {
      setError('Failed to load review data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewLog = (log: PendingLogForReview) => {
    setSelectedLog(log);
  };

  const handleModalClose = () => {
    setSelectedLog(null);
  };

  const handleReviewSuccess = () => {
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
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Pending Reviews</h1>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
            isAcademic ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isAcademic ? <GraduationCap className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
            {supervisorType}
          </span>
        </div>
        <p className="text-gray-500 mt-1">
          Review weekly logs submitted by your assigned {isAcademic ? 'students' : 'interns'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Pending Reviews"
            value={stats.pending_reviews}
            icon={Clock}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <StatCard
            title="Total Reviews"
            value={stats.total_reviews}
            icon={FileText}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Approved"
            value={stats.approved_count}
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            title="Returned"
            value={stats.returned_count}
            icon={XCircle}
            color="text-red-600"
            bgColor="bg-red-100"
          />
          <StatCard
            title="Assigned Interns"
            value={stats.assigned_interns}
            icon={Users}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
        </div>
      )}

      {/* Pending Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Logs Awaiting Your Review ({pendingLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLogs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
              <p className="text-gray-500 mt-2">
                No logs are waiting for your review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {log.student_name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({log.student_number})
                        </span>
                        {log.is_late && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            Late
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {log.organization} - Week {log.week_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(log.week_start_date)} - {formatDate(log.week_end_date)}
                      </p>
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">Activities:</p>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {log.activities}
                        </p>
                      </div>
                      {log.challenges && (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Challenges:</p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {log.challenges}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>{log.hours_worked} hours worked</span>
                        {log.submitted_at && (
                          <span>Submitted {formatDate(log.submitted_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        onClick={() => handleReviewLog(log)}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Reviews History */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              My Review History ({myReviews.length})
            </CardTitle>
            {showReviews ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </CardHeader>
        {showReviews && (
          <CardContent>
            {myReviews.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No reviews submitted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {myReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {review.student_name}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="text-gray-600">Week {review.log_week_number}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Reviewed {formatDate(review.reviewed_at)}
                      </p>
                      {review.comments && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                          "{review.comments}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {review.rating && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-4 w-4 fill-current" />
                          {review.rating}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          review.decision === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {review.decision === 'approved' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {review.decision === 'approved' ? 'Approved' : 'Returned'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Review Modal */}
      {selectedLog && (
        <ReviewModal
          log={selectedLog}
          onClose={handleModalClose}
          onSuccess={handleReviewSuccess}
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

interface StatCardProps {
  title: string;
  value: number;
  icon: typeof Clock;
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

interface ReviewModalProps {
  log: PendingLogForReview;
  onClose: () => void;
  onSuccess: () => void;
}

function ReviewModal({ log, onClose, onSuccess }: ReviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [decision, setDecision] = useState<ReviewDecision>('approved');
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (decision === 'returned' && !comments.trim()) {
      setError('Comments are required when returning a log');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await reviewsApi.create({
        log: log.id,
        decision,
        comments,
        rating,
      });
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      if (error.response?.data) {
        const messages = Object.values(error.response.data).flat();
        setError(messages.join(', '));
      } else {
        setError('Failed to submit review');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Review Log Entry</CardTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          {/* Log Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{log.student_name}</h3>
                <p className="text-sm text-gray-500">{log.student_number}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">Week {log.week_number}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(log.week_start_date)} - {formatDate(log.week_end_date)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Activities:</p>
              <p className="text-sm text-gray-600 mt-1">{log.activities}</p>
            </div>

            {log.challenges && (
              <div>
                <p className="text-sm font-medium text-gray-700">Challenges:</p>
                <p className="text-sm text-gray-600 mt-1">{log.challenges}</p>
              </div>
            )}

            {log.skills_learned && (
              <div>
                <p className="text-sm font-medium text-gray-700">Skills Learned:</p>
                <p className="text-sm text-gray-600 mt-1">{log.skills_learned}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t border-gray-200">
              <span>{log.hours_worked} hours worked</span>
              {log.is_late && (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Late Submission
                </span>
              )}
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <Label>Decision</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="approved"
                    checked={decision === 'approved'}
                    onChange={() => setDecision('approved')}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="returned"
                    checked={decision === 'returned'}
                    onChange={() => setDecision('returned')}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="flex items-center gap-1 text-red-700">
                    <XCircle className="h-4 w-4" />
                    Return for Revision
                  </span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="rating">Rating (Optional, 1-5)</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(rating === num ? undefined : num)}
                    className={`p-2 rounded-lg transition-colors ${
                      rating === num
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <Star className={`h-5 w-5 ${rating && rating >= num ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="comments">
                Comments {decision === 'returned' && <span className="text-red-500">*</span>}
              </Label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                required={decision === 'returned'}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  decision === 'returned'
                    ? 'Explain what needs to be revised...'
                    : 'Optional feedback for the student...'
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className={
                  decision === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : decision === 'approved' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Log
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Return Log
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
