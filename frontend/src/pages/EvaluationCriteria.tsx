import { useState, useEffect } from 'react';
import { criteriaApi } from '@/services/api';
import type { EvaluationCriteria } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Scale,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export function EvaluationCriteriaPage() {
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<EvaluationCriteria | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await criteriaApi.getAll();
      setCriteria(data.results || data);
    } catch {
      setError('Failed to load evaluation criteria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCriteria(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: EvaluationCriteria) => {
    setEditingCriteria(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await criteriaApi.delete(id);
      await loadData();
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete criteria');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCriteria(null);
  };

  const handleSaveSuccess = () => {
    handleModalClose();
    loadData();
  };

  // Calculate total weight
  const totalWeight = criteria
    .filter(c => c.is_active)
    .reduce((sum, c) => sum + Number(c.weight_percent), 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Evaluation Criteria</h1>
          <p className="text-gray-500 mt-1">
            Manage the criteria used for academic evaluations
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Criteria
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Weight Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-700">Total Weight (Active Criteria)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                {totalWeight}%
              </span>
              {totalWeight === 100 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <span className="text-sm text-orange-600">(should equal 100%)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria List */}
      {criteria.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Criteria Defined</h3>
            <p className="text-gray-500 mt-2">
              Create evaluation criteria to start scoring students.
            </p>
            <Button onClick={handleCreate} className="mt-4">
              Create First Criteria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {criteria.map((item) => (
            <Card key={item.id} className={`${!item.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-gray-600 mt-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-6 mt-3 text-sm">
                      <span className="text-gray-500">
                        Max Score: <span className="font-medium text-gray-700">{item.max_score}</span>
                      </span>
                      <span className="text-gray-500">
                        Weight: <span className="font-medium text-gray-700">{item.weight_percent}%</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    {deleteConfirm === item.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Confirm
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <CriteriaModal
          criteria={editingCriteria}
          onClose={handleModalClose}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}

interface CriteriaModalProps {
  criteria: EvaluationCriteria | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CriteriaModal({ criteria, onClose, onSuccess }: CriteriaModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: criteria?.name || '',
    description: criteria?.description || '',
    max_score: criteria?.max_score || 100,
    weight_percent: criteria?.weight_percent || 0,
    is_active: criteria?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (criteria) {
        await criteriaApi.update(criteria.id, formData);
      } else {
        await criteriaApi.create(formData);
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      if (error.response?.data) {
        const messages = Object.values(error.response.data).flat();
        setError(messages.join(', '));
      } else {
        setError('Failed to save criteria');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{criteria ? 'Edit Criteria' : 'New Criteria'}</CardTitle>
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

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Technical Skills"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what this criteria evaluates..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_score">Max Score</Label>
                <Input
                  id="max_score"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weight_percent">Weight (%)</Label>
                <Input
                  id="weight_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.weight_percent}
                  onChange={(e) => setFormData({ ...formData, weight_percent: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="is_active" className="mb-0">Active</Label>
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
                  'Save Criteria'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
