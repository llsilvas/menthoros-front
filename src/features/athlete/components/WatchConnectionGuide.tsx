import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Chip, Link, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { DISPOSITIVO_MARCA_LABELS, type DispositivoMarca } from '../../../types/Onboarding';
import { semantic, surface } from '../../../theme/tokens';
import {
    ROTULO_POSICIONAMENTO,
    WATCH_COMPATIBILITY,
    compatibilidadeDe,
    type WatchCompatibility,
} from '../watchCompatibility';

export interface WatchConnectionGuideProps {
    /** Marca do onboarding; sem ela, todas as marcas ficam fechadas e o atleta é orientado a informá-la. */
    marcaAtual?: DispositivoMarca;
    conectado: boolean;
    /** Visão do treinador ("o que pedir ao atleta"): esconde o texto de ação do atleta. */
    modoLeitura?: boolean;
}

function formatarVerificadoEm(aaaaMm: string): string {
    const [ano, mes] = aaaaMm.split('-');
    return `${mes}/${ano}`;
}

function GuiaDaMarca({ item }: { item: WatchCompatibility }) {
    const cor = item.posicionamento === 'SUPORTADO' ? semantic.success[500] : semantic.info[500];
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Chip
                label={ROTULO_POSICIONAMENTO[item.posicionamento]}
                size="small"
                sx={{ alignSelf: 'flex-start', color: cor, bgcolor: `${cor}1F`, border: `1px solid ${cor}4D` }}
            />
            <Box component="ol" sx={{ m: 0, pl: 2.5, color: surface[200], fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {item.passos.map((passo) => (
                    <li key={passo}>{passo}</li>
                ))}
            </Box>
            {item.avisos?.map((aviso) => (
                <Alert key={aviso} severity="warning" sx={{ bgcolor: `${semantic.warning[500]}1A`, color: surface[100] }}>
                    {aviso}
                </Alert>
            ))}
            {item.appParceiro && (
                <Typography sx={{ color: surface[300], fontSize: '0.85rem' }}>
                    App de terceiro:{' '}
                    {item.appParceiro.map((app, i) => (
                        <span key={app.nome}>
                            {i > 0 && ' · '}
                            <Link href={app.url} target="_blank" rel="noopener noreferrer">
                                {app.nome}
                            </Link>
                        </span>
                    ))}
                </Typography>
            )}
            <Typography sx={{ color: surface[500], fontSize: '0.75rem' }}>
                Informações de {formatarVerificadoEm(item.verificadoEm)}
            </Typography>
        </Box>
    );
}

export function WatchConnectionGuide({ marcaAtual, conectado, modoLeitura = false }: WatchConnectionGuideProps) {
    const atual = marcaAtual ? compatibilidadeDe(marcaAtual) : undefined;
    const outras = WATCH_COMPATIBILITY.filter((c) => c.marca !== marcaAtual);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {!modoLeitura && (
                <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
                    {conectado
                        ? 'Conectado. Confira se o relógio está recebendo os treinos.'
                        : 'Antes de conectar, veja o que o seu relógio precisa.'}
                </Typography>
            )}

            {atual ? (
                <Box>
                    <Typography sx={{ color: surface[50], fontWeight: 600, mb: 1 }}>
                        {DISPOSITIVO_MARCA_LABELS[atual.marca]}
                    </Typography>
                    <GuiaDaMarca item={atual} />
                </Box>
            ) : (
                <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
                    Informe seu relógio no onboarding para ver o passo a passo da sua marca.
                </Typography>
            )}

            {outras.length > 0 && (
                <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', color: surface[100], '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMore sx={{ color: surface[300] }} />}>
                        <Typography sx={{ fontSize: '0.9rem' }}>Outro relógio?</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {outras.map((item) => (
                            <Accordion key={item.marca} disableGutters elevation={0} sx={{ bgcolor: 'transparent', color: surface[100] }}>
                                <AccordionSummary expandIcon={<ExpandMore sx={{ color: surface[300] }} />}>
                                    <Typography sx={{ fontSize: '0.9rem' }}>{DISPOSITIVO_MARCA_LABELS[item.marca]}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <GuiaDaMarca item={item} />
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </AccordionDetails>
                </Accordion>
            )}
        </Box>
    );
}

export default WatchConnectionGuide;
