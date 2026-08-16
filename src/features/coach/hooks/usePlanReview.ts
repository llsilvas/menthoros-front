import { useCallback, useRef, useState } from 'react';
import type { ReviewActionResult } from '../../../hooks/useCoachPlanReview';

interface UsePlanReviewParams {
  selectedPlanId: string | null;
  reviewAprovar: (planId: string) => Promise<ReviewActionResult>;
  reviewRejeitar: (planId: string, reason: string) => Promise<ReviewActionResult>;
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
  const emVoo = useRef(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Ajustar carga antes da próxima revisão');

  const handleApprovePlan = useCallback(async () => {
    // Trava local contra duplo clique: `isActing` só sobe depois do primeiro await, e dois cliques
    // rápidos disparavam duas aprovações do mesmo plano.
    if (!selectedPlanId || emVoo.current) return;
    emVoo.current = true;
    try {
      const resultado = await reviewAprovar(selectedPlanId);
      if (!resultado.ok) return;
      await reviewFetchPendentes();
      reloadDashboard();
      await fetchSelectedProfile();
    } finally {
      emVoo.current = false;
    }
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
    const resultado = await reviewRejeitar(selectedPlanId, normalizedReason);
    if (!resultado.ok) return;
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
