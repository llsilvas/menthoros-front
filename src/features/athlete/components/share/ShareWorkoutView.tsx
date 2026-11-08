import { useState } from 'react';
import { Box } from '@mui/material';
import { formatKm } from '../../../../utils/formatKm';
import { SHARE_MODEL_DEFAULT_FORMAT, type ShareCardData, type ShareFormat, type ShareModel } from '../../types/ShareCard';
import { ShareCardFrame } from './ShareCardFrame';
import { PlanVsActualCard } from './PlanVsActualCard';
import { SplitsCard } from './SplitsCard';
import { WeekCard } from './WeekCard';
import { ShareSignature } from './ShareSignature';
import { ShareFormatPicker, ShareModelPicker, ShareOptionSwitch } from './ShareControls';

export interface ShareWorkoutViewProps {
  data: ShareCardData;
}

/** Tela de compartilhar com dados prontos: prévia do card e controles. Destinos chegam na seção 4. */
export function ShareWorkoutView({ data }: ShareWorkoutViewProps) {
  const [model, setModel] = useState<ShareModel>(data.availableModels[0]);
  const [format, setFormat] = useState<ShareFormat>(SHARE_MODEL_DEFAULT_FORMAT[data.availableModels[0]]);
  const [mostrarFc, setMostrarFc] = useState(true);
  const [mostrarAssessoria, setMostrarAssessoria] = useState(true);

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
    </Box>
  );
}
