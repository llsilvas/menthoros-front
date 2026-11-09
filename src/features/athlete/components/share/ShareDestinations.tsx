import { useMemo, useState } from 'react';
import { Alert, Box, Button } from '@mui/material';
import IosShareIcon from '@mui/icons-material/IosShare';
import DownloadIcon from '@mui/icons-material/Download';

export interface ShareDestinationsProps {
  blob: Blob | null;
  generating: boolean;
  error: Error | null;
  fileName: string;
  /**
   * Modelo com mapa sem consentimento (athlete-share-cards-mapa, D4): os destinos ficam habilitados,
   * mas o clique chama isto — que abre o aviso — em vez de compartilhar. Não há imagem para compartilhar.
   */
  onPedirConsentimento?: () => void;
}

function podeCompartilharArquivos(): boolean {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
  // Arquivo com conteúdo: alguns navegadores recusam sondagem com arquivo vazio.
  return navigator.canShare({ files: [new File(['x'], 'teste.png', { type: 'image/png' })] });
}

/** Destinos da imagem pronta: share sheet nativo (quando o navegador aceita arquivos) e download. */
export function ShareDestinations({ blob, generating, error, fileName, onPedirConsentimento }: ShareDestinationsProps) {
  const suportaShare = useMemo(podeCompartilharArquivos, []);
  const [falhaShare, setFalhaShare] = useState(false);

  const compartilhar = async () => {
    if (onPedirConsentimento) return onPedirConsentimento();
    if (!blob) return;
    setFalhaShare(false);
    try {
      await navigator.share({ files: [new File([blob], fileName, { type: 'image/png' })] });
    } catch (e) {
      // AbortError = o atleta fechou o share sheet; não é erro.
      if (!(e instanceof DOMException && e.name === 'AbortError')) setFalhaShare(true);
    }
  };

  const salvar = () => {
    if (onPedirConsentimento) return onPedirConsentimento();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    // Revogar no mesmo tick cancela o download em alguns navegadores (Safari).
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {error && <Alert severity="error">Não deu para gerar a imagem. Tente mudar uma opção ou recarregar.</Alert>}
      {falhaShare && <Alert severity="warning">Não deu para compartilhar — use Salvar.</Alert>}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {suportaShare && (
          <Button variant="contained" fullWidth startIcon={<IosShareIcon />} disabled={!blob && !onPedirConsentimento} onClick={compartilhar} sx={{ minHeight: 44 }}>
            {generating ? 'Gerando imagem…' : 'Compartilhar'}
          </Button>
        )}
        <Button
          variant={suportaShare ? 'outlined' : 'contained'}
          fullWidth
          startIcon={<DownloadIcon />}
          disabled={!blob && !onPedirConsentimento}
          onClick={salvar}
          sx={{ minHeight: 44 }}
        >
          {!suportaShare && generating ? 'Gerando imagem…' : 'Salvar'}
        </Button>
      </Box>
    </Box>
  );
}
