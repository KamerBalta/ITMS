import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { apiClient } from '../api/client';

// #12: Eski /tasks/{uuid} linkleri (gecmis bildirimlerde, kaydedilmis linklerde vb.)
// kirik kalmasin diye -- UUID'yi gercek gorevin Issue Key'ine cevirip /browse/{key}'e
// yonlendiriyoruz. Bu bilesen yalnizca GECICI bir kopru, yeni URL'ler hep /browse/ uretir.
export function LegacyTaskIdRedirect() {
  const { taskId } = useParams<{ taskId: string }>();
  const [issueKey, setIssueKey] = useState<string | null | 'not-found'>(null);

  useEffect(() => {
    if (!taskId) return;
    apiClient
      .get(`/tasks/${taskId}`)
      .then((res) => setIssueKey(res.data.issueKey))
      .catch(() => setIssueKey('not-found'));
  }, [taskId]);

  if (issueKey === 'not-found') return <Navigate to="/dashboard" replace />;
  if (!issueKey) return <p className="text-muted p-6">Yönlendiriliyor...</p>;

  return <Navigate to={`/browse/${issueKey}`} replace />;
}