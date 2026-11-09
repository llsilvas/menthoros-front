import { useRef, useState, type ChangeEvent } from 'react';
import { Alert, Box, Button } from '@mui/material';
import AddPhotoIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { formatKm } from '../../../../utils/formatKm';
import {
  MAP_MODELS, SHARE_MODEL_DEFAULT_FORMAT, type ShareCardData, type ShareFormat, type ShareModel,
} from '../../types/ShareCard';
import { ShareCardFrame } from './ShareCardFrame';
import { PlanVsActualCard } from './PlanVsActualCard';
import { SplitsCard } from './SplitsCard';
import { WeekCard } from './WeekCard';
import { RouteCard } from './RouteCard';
import { PhotoBackground, PhotoStickersCard } from './PhotoStickersCard';
import { ShareSignature } from './ShareSignature';
import { ShareFormatPicker, ShareModelPicker, ShareOptionSwitch } from './ShareControls';
import { ShareDestinations } from './ShareDestinations';
import { TrajectoryShareConsentDialog } from '../privacy/TrajectoryShareConsentDialog';
import { useShareImage } from '../../hooks/useShareImage';
import { usePhotoStickers } from '../../hooks/usePhotoStickers';
import { useTrajectoryShareConsent } from '../../hooks/useTrajectoryShareConsent';

export interface ShareWorkoutViewProps {
  data: ShareCardData;
}

function descricaoDoCard(model: ShareModel, data: ShareCardData): string {
  switch (model) {
    case 'plano': return `Card Plano × realizado: ${data.plano?.titulo ?? ''}`;
    case 'parciais': return `Card Parciais: ${data.parciais?.splits.length ?? 0} voltas`;
    case 'rota': return `Card Rota: trajeto de ${data.rota?.distanciaKm != null ? `${formatKm(data.rota.distanciaKm)} km` : data.rota?.duracao ?? ''}`;
    case 'stickers': return 'Card Foto: sua foto com adesivos do treino';
    default: return `Card Semana: ${formatKm(data.semana.totalKm)} km em ${data.semana.treinos} treino(s)`;
  }
}

/** Tela de compartilhar com dados prontos: prévia do card, controles e destinos da imagem. */
export function ShareWorkoutView({ data }: ShareWorkoutViewProps) {
  const [model, setModel] = useState<ShareModel>(data.availableModels[0]);
  const [format, setFormat] = useState<ShareFormat>(SHARE_MODEL_DEFAULT_FORMAT[data.availableModels[0]]);
  const [mostrarFc, setMostrarFc] = useState(true);
  const [mostrarAssessoria, setMostrarAssessoria] = useState(true);
  const [avisoAberto, setAvisoAberto] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const temMapa = data.rota !== null;
  const consent = useTrajectoryShareConsent(temMapa);
  const stickers = usePhotoStickers();

  const comMapa = MAP_MODELS.has(model);
  const precisaConsentimento = comMapa && !consent.granted;
  const semFoto = model === 'stickers' && !stickers.foto;

  // FC só muda os cards Plano e Rota. Consentimento e foto entram na versão: concedido, a imagem é gerada.
  const versao = [
    model, format, (model === 'plano' || model === 'rota') && mostrarFc, mostrarAssessoria,
    comMapa && consent.granted, model === 'stickers' ? stickers.fotoId : '',
    model === 'stickers' ? JSON.stringify(stickers.posicoes) : '',
  ].join('|');
  // Lido logo antes da captura (D4): modelo com mapa sem consentimento, ou Foto sem foto, não vira PNG.
  const imagem = useShareImage(cardRef, versao, () => !precisaConsentimento && !semFoto);

  const escolherModelo = (m: ShareModel) => {
    setModel(m);
    setFormat(SHARE_MODEL_DEFAULT_FORMAT[m]);
  };

  const usarSemMapa = () => {
    setAvisoAberto(false);
    const semMapa = data.availableModels.find((m) => !MAP_MODELS.has(m));
    if (semMapa) escolherModelo(semMapa);
  };

  const confirmarConsentimento = async () => {
    if (await consent.confirmar()) setAvisoAberto(false);
  };

  const aoEscolherFoto = (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) void stickers.escolherFoto(arquivo);
    e.target.value = '';
  };

  const ehStickers = model === 'stickers';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <ShareCardFrame
          ref={cardRef}
          format={format}
          ariaLabel={descricaoDoCard(model, data)}
          background={ehStickers && stickers.foto ? <PhotoBackground foto={stickers.foto} /> : undefined}
          // No card Foto a assinatura é um adesivo; no rodapé ela duplicaria.
          footer={ehStickers ? undefined : <ShareSignature signature={data.signature} visible={mostrarAssessoria} />}
        >
          {model === 'plano' && data.plano && <PlanVsActualCard view={data.plano} mostrarFc={mostrarFc} />}
          {model === 'parciais' && data.parciais && <SplitsCard view={data.parciais} />}
          {model === 'semana' && <WeekCard view={data.semana} />}
          {model === 'rota' && data.rota && <RouteCard view={data.rota} mostrarFc={mostrarFc} />}
          {ehStickers && data.rota && (
            <PhotoStickersCard
              view={data.rota}
              foto={stickers.foto}
              posicoes={stickers.posicoes}
              onMover={stickers.mover}
              signature={data.signature}
              mostrarAssessoria={mostrarAssessoria}
            />
          )}
        </ShareCardFrame>
      </Box>

      {ehStickers && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <input ref={inputFotoRef} type="file" accept="image/*" hidden onChange={aoEscolherFoto} data-testid="input-foto" />
          <Button variant="outlined" startIcon={<AddPhotoIcon />} onClick={() => inputFotoRef.current?.click()} disabled={stickers.carregando} sx={{ minHeight: 44 }}>
            {stickers.carregando ? 'Preparando foto…' : stickers.foto ? 'Trocar foto' : 'Escolher foto'}
          </Button>
          {stickers.error && <Alert severity="error">Não deu para usar esta foto — tente outra.</Alert>}
        </Box>
      )}

      <ShareModelPicker models={data.availableModels} value={model} onChange={escolherModelo} />
      <ShareFormatPicker value={format} onChange={setFormat} />
      <Box>
        <ShareOptionSwitch label="Mostrar FC" checked={mostrarFc} onChange={setMostrarFc} />
        <ShareOptionSwitch label="Mostrar assessoria" checked={mostrarAssessoria} onChange={setMostrarAssessoria} />
      </Box>
      <ShareDestinations
        {...imagem}
        fileName={`menthoros-${model}-${format}.png`}
        onPedirConsentimento={precisaConsentimento && !semFoto ? () => { consent.limparErro(); setAvisoAberto(true); } : undefined}
      />

      <TrajectoryShareConsentDialog
        open={avisoAberto}
        salvando={consent.salvando}
        desatualizado={consent.desatualizado}
        erro={consent.actionError}
        onConfirmar={() => void confirmarConsentimento()}
        onRecusar={usarSemMapa}
        onFechar={() => setAvisoAberto(false)}
        rotuloRecusar="Usar modelo sem mapa"
      />
    </Box>
  );
}
