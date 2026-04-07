import { useState, useEffect } from 'react';
import { evaluationsApi } from '@/services/api';
import type { Evaluation, PlacementForEvaluation, EvaluationStats, Grade } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import {
  Clock,
  CheckCircle,
  FileText,
  Award,
  Users,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
  Lock,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';

const gradeColors: Record<Grade, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
};

export function EvaluationsPage() {
  const [pendingPlacements, setPendingPlacements] = useState<PlacementForEvaluation[]>([]);
  const [myEvaluations, setMyEvaluations] = useState<Evaluation[]>([]);
  const [stats, setStats] = useState<EvaluationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementForEvaluation | null>(null);
  const [showEvaluations, setShowEvaluations] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [pendingData, evaluationsData, statsData] = await Promise.all([
        evaluationsApi.getPendingPlacements(),
        evaluationsApi.getMyEvaluations(),
        evaluationsApi.getStats(),
      ]);
      setPendingPlacements(pendingData);
      setMyEvaluations(evaluationsData);
      setStats(statsData);
    } catch {
      setError('Failed to load evaluation data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = (placement: PlacementForEvaluation) => {
    setSelectedPlacement(placement);
  };

  const handleModalClose = () => {
    setSelectedPlacement(null);
  };

  const handleEvaluationSuccess = () => {
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
        <h1 className="text-3xl font-bold text-gray-900">Evaluations</h1>
        <p className="text-gray-500 mt-1">
          Evaluate intern placements and assign final grades
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Evaluations"
            value={stats.pending_evaluations}
            icon={Clock}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <StatCard
            title="Completed"
            value={stats.completed_evaluations}
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            title="Average Score"
            value={stats.average_score ? `${stats.average_score}%` : 'N/A'}
            icon={TrendingUp}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Grade Distribution"
            value={Object.keys(stats.grade_distribution).length > 0
              ? Object.entries(stats.grade_distribution).map(([g, c]) => `${g}:${c}`).join(' ')
              : 'N/A'}
            icon={Award}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
        </div>
      )}

      {/* Pending Placements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-orange-600" />
            Placements Awaiting Evaluation ({pendingPlacements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPlacements.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">All Evaluated!</h3>
              <p className="text-gray-500 mt-2">
                No placements are waiting for your evaluation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPlacements.map((placement) => (
                <div
                  key={placement.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {placement.student_name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({placement.student_number})
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {placement.organization}
                        {placement.department && ` - ${placement.department}`}
                        {placement.position && ` (${placement.position})`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(placement.start_date)} - {formatDate(placement.end_date)}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <FileText className="h-4 w-4" />
                          {placement.approved_logs_count}/{placement.logs_count} logs approved
                        </span>
                        {placement.average_supervisor_rating && (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Star className="h-4 w-4 fill-current" />
                            {placement.average_supervisor_rating} avg rating
                          </span>
                        )}
                        <span className="text-gray-500">
                          Supervisor: {placement.workplace_supervisor_name}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        onClick={() => handleEvaluate(placement)}
                        className="flex items-center gap-2"
                      >
                        <Award className="h-4 w-4" />
                        Evaluate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Evaluations History */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowEvaluations(!showEvaluations)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              My Evaluation History ({myEvaluations.length})
            </CardTitle>
            {showEvaluations ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </CardHeader>
        {showEvaluations && (
          <CardContent>
            {myEvaluations.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No evaluations submitted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {myEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {evaluation.student_name}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="text-gray-600">{evaluation.organization}</span>
                        {evaluation.is_locked && (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted {formatDate(evaluation.submitted_at)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Supervisor: {evaluation.supervisor_score}%</span>
                        <span>Academic: {evaluation.academic_score}%</span>
                        <span>Logbook: {evaluation.logbook_score}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">
                          {evaluation.total_score}%
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${gradeColors[evaluation.grade]}`}
                      >
                        {evaluation.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Evaluation Modal */}
      {selectedPlacement && (
        <EvaluationModal
          placement={selectedPlacement}
          onClose={handleModalClose}
          onSuccess={handleEvaluationSuccess}
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
  value: string | number;
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
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EvaluationModalProps {
  placement: PlacementForEvaluation;
  onClose: () => void;
  onSuccess: () => void;
}

function EvaluationModal({ placement, onClose, onSuccess }: EvaluationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [supervisorScore, setSupervisorScore] = useState<number>(0);
  const [academicScore, setAcademicScore] = useState<number>(0);
  const [logbookScore, setLogbookScore] = useState<number>(0);
  const [comments, setComments] = useState('');

  // Calculate weighted total and grade
  const totalScore = (supervisorScore * 0.4) + (academicScore * 0.3) + (logbookScore * 0.3);
  const grade = getGrade(totalScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await evaluationsApi.create({
        placement: placement.id,
        supervisor_score: supervisorScore,
        academic_score: academicScore,
        logbook_score: logbookScore,
        comments,
      });
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      if (error.response?.data) {
        const messages = Object.values(error.response.data).flat();
        setError(messages.join(', '));
      } else {
        setError('Failed to submit evaluation');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Evaluate Placement</CardTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          {/* Placement Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{placement.student_name}</h3>
                <p className="text-sm text-gray-500">{placement.student_number}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{placement.organization}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(placement.start_date)} - {formatDate(placement.end_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t border-gray-200">
              <span>{placement.approved_logs_count}/{placement.logs_count} logs approved</span>
              {placement.average_supervisor_rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  {placement.average_supervisor_rating} avg supervisor rating
                </span>
              )}
            </div>
          </div>

          {/* Evaluation Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Score Formula Explanation */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              <strong>Scoring Formula:</strong> Total = (Supervisor x 40%) + (Academic x 30%) + (Logbook x 30%)
            </div>

            {/* Supervisor Score */}
            <div>
              <Label htmlFor="supervisor_score">
                Workplace Supervisor Score (40% weight)
              </Label>
              <div className="flex items-center gap-4 mt-1">
                <Input
                  id="supervisor_score"
                  type="number"
                  min="0"
                  max="100"
                  value={supervisorScore}
                  onChange={(e) => setSupervisorScore(Number(e.target.value))}
                  className="w-24"
                  required
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={supervisorScore}
                  onChange={(e) => setSupervisorScore(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-20">
                  Weighted: {(supervisorScore * 0.4).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Academic Score */}
            <div>
              <Label htmlFor="academic_score">
                Academic Performance Score (30% weight)
              </Label>
              <div className="flex items-center gap-4 mt-1">
                <Input
                  id="academic_score"
                  type="number"
                  min="0"
                  max="100"
                  value={academicScore}
                  onChange={(e) => setAcademicScore(Number(e.target.value))}
                  className="w-24"
                  required
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={academicScore}
                  onChange={(e) => setAcademicScore(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-20">
                  Weighted: {(academicScore * 0.3).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Logbook Score */}
            <div>
              <Label htmlFor="logbook_score">
                Logbook Quality Score (30% weight)
              </Label>
              <div className="flex items-center gap-4 mt-1">
                <Input
                  id="logbook_score"
                  type="number"
                  min="0"
                  max="100"
                  value={logbookScore}
                  onChange={(e) => setLogbookScore(Number(e.target.value))}
                  className="w-24"
                  required
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={logbookScore}
                  onChange={(e) => setLogbookScore(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-20">
                  Weighted: {(logbookScore * 0.3).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Total Score Preview */}
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Calculated Total Score</p>
                  <p className="text-3xl font-bold text-gray-900">{totalScore.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Grade</p>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-2xl font-bold ${gradeColors[grade]}`}>
                    {grade}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Grade boundaries: A (80-100), B (70-79), C (60-69), D (50-59), F (&lt;50)
              </div>
            </div>

            {/* Comments */}
            <div>
              <Label htmlFor="comments">Comments (Optional)</Label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional comments about the student's performance..."
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Submit Evaluation
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

function getGrade(score: number): Grade {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
