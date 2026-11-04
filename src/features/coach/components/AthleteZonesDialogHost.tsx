import { AthleteZonesDialog } from './AthleteZonesDialog';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';

interface AthleteZonesDialogHostProps {
  open: boolean;
  atletaId: string;
  nomeAtleta?: string;
  onClose: () => void;
  onSalvo?: () => void;
}

function Carregado(props: Omit<AthleteZonesDialogHostProps, 'open'>) {
  const { zones, loading } = useAthleteTrainingZones(props.atletaId);
  // O formulário deriva dos valores vigentes na montagem: só abre depois do GET, senão nasce vazio.
  if (loading) return null;
  return <AthleteZonesDialog open zonas={zones} {...props} />;
}

/**
 * Abre o cadastro de zonas para quem não tem as zonas em mãos (ex.: listagem de atletas). O
 * `PlanoDetalhePanel` já tem o hook e usa o `AthleteZonesDialog` direto.
 */
export function AthleteZonesDialogHost({ open, ...resto }: AthleteZonesDialogHostProps) {
  return open ? <Carregado {...resto} /> : null;
}
