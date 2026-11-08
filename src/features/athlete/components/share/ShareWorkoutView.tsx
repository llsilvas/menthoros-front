import { useRef, useState } from 'react';
import { Box } from '@mui/material';
import { formatKm } from '../../../../utils/formatKm';
import { SHARE_MODEL_DEFAULT_FORMAT, type ShareCardData, type ShareFormat, type ShareModel } from '../../types/ShareCard';
import { ShareCardFrame } from './ShareCardFrame';
import { PlanVsActualCard } from './PlanVsActualCard';
import { SplitsCard } from './SplitsCard';
import { WeekCard } from './WeekCard';
import { ShareSignature } from './ShareSignature';
import { ShareFormatPicker, ShareModelPicker, ShareOptionSwitch } from './ShareControls';
import { ShareDestinations } from './ShareDestinations';
import { useShareImage } from '../../hooks/useShareImage';

export interface ShareWorkoutViewProps {
  data: ShareCardData;
}

/** Tela de compartilhar com dados prontos: prévia do card, controles e destinos da imagem. */
export function ShareWorkoutView({ data }: ShareWorkoutViewProps) {
  const [model, setModel] = useState<ShareModel>(data.availableModels[0]);
  const [format, setFormat] = useState<ShareFormat>(SHARE_MODEL_DEFAULT_FORMAT[data.availableModels[0]]);
  const [mostrarFc, setMostrarFc] = useState(true);
  const [mostrarAssessoria, setMostrarAssessoria] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  // FC só aparece no card Plano — nos outros a chave não muda a imagem.
  const imagem = useShareImage(cardRef, `${model}|${format}|${model === 'plano' && mostrarFc}|${mostrarAssessoria}`);

  const escolherModelo = (m: ShareModel) => {
    setModel(m);
    setFormat(SHARE_MODEL_DEFAULT_FORMAT[m]);
  };

  const ariaLabel = model === 'plano' ? `Card Plano × realizado: ${data.plano?.titulo ?? ''}`
    : model === 'parciais' ? `Card Parciais: ${data.parciais?.splits.length ?? 0} voltas`
    : `Card Semana: ${formatKm(data.semana.totalKm)} km em ${data.semana.treinos} treino(s)`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <ShareCardFrame
          ref={cardRef}
          format={format}
          ariaLabel={ariaLabel}
          footer={<ShareSignature signature={data.signature} visible={mostrarAssessoria} />}
        >
          {model === 'plano' && data.plano && <PlanVsActualCard view={data.plano} mostrarFc={mostrarFc} />}
          {model === 'parciais' && data.parciais && <SplitsCard view={data.parciais} />}
          {model === 'semana' && <WeekCard view={data.semana} />}
        </ShareCardFrame>
      </Box>
      <ShareModelPicker models={data.availableModels} value={model} onChange={escolherModelo} />
      <ShareFormatPicker value={format} onChange={setFormat} />
      <Box>
        <ShareOptionSwitch label="Mostrar FC" checked={mostrarFc} onChange={setMostrarFc} />
        <ShareOptionSwitch label="Mostrar assessoria" checked={mostrarAssessoria} onChange={setMostrarAssessoria} />
      </Box>
      <ShareDestinations {...imagem} fileName={`menthoros-${model}-${format}.png`} />
    </Box>
  );
}
