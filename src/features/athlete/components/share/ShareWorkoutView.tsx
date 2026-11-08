import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { SHARE_MODEL_DEFAULT_FORMAT, type ShareCardData, type ShareFormat, type ShareModel } from '../../types/ShareCard';
import { GarminAttribution } from './GarminAttribution';
import { ShareCardFrame } from './ShareCardFrame';
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

  const attribution = model === 'plano' ? data.plano?.attribution
    : model === 'parciais' ? data.parciais?.attribution
    : data.semana.attribution;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <ShareCardFrame
          format={format}
          ariaLabel={`Card ${model} do treino`}
          footer={<ShareSignature signature={data.signature} visible={mostrarAssessoria} />}
        >
          {/* Corpo de cada modelo entra na seção 3; aqui só a atribuição, que é obrigatória. */}
          <GarminAttribution attribution={attribution ?? null} />
          <Typography sx={{ fontSize: 12 }} data-fc={mostrarFc}>{model}</Typography>
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
