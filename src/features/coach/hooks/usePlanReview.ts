import { useCallback, useState } from 'react';

interface UsePlanReviewParams {
  selectedPlanId: string | null;
  reviewAprovar: (planId: string) => Promise<boolean>;
  reviewRejeitar: (planId: string, reason: string) => Promise<boolean>;
  reviewFetchPendentes: () => Promise<void>;
  reloadDashboard: () => void;
  fetchSelectedProfile: () => Promise<void>;
}

export function usePlanReview({
  selectedPlanId,
  reviewAprovar,
  reviewRejeitar,
  reviewFetchPendentes,
  reloadDashboard,
  fetchSelectedProfile,
}: UsePlanReviewParams) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Ajustar carga antes da próxima revisão');

  const handleApprovePlan = useCallback(async () => {
    if (!selectedPlanId) return;
    const ok = await reviewAprovar(selectedPlanId);
    if (!ok) return;
    await reviewFetchPendentes();
    reloadDashboard();
    await fetchSelectedProfile();
  }, [fetchSelectedProfile, reloadDashboard, reviewAprovar, reviewFetchPendentes, selectedPlanId]);

  const openRejectDialog = useCallback(() => {
    setRejectReason('Ajustar carga antes da próxima revisão');
    setRejectDialogOpen(true);
  }, []);

  const closeRejectDialog = useCallback(() => {
    setRejectDialogOpen(false);
  }, []);

  const handleRejectPlan = useCallback(async (reason: string) => {
    if (!selectedPlanId) return;
    const normalizedReason = reason.trim();
    if (!normalizedReason) return;
    const ok = await reviewRejeitar(selectedPlanId, normalizedReason);
    if (!ok) return;
    setRejectDialogOpen(false);
    await reviewFetchPendentes();
    reloadDashboard();
    await fetchSelectedProfile();
  }, [fetchSelectedProfile, reloadDashboard, reviewFetchPendentes, reviewRejeitar, selectedPlanId]);

  return {
    rejectDialogOpen,
    rejectReason,
    setRejectReason,
    handleApprovePlan,
    openRejectDialog,
    closeRejectDialog,
    handleRejectPlan,
  };
}
