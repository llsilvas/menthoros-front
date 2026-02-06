import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

export default function HomePage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bem-vindo ao Menthoros
        </Typography>
        <Typography variant="body1" color="inherit" sx={{ opacity: 0.7 }}>
          Sistema de gerenciamento de atletas e treinamentos.
        </Typography>
      </Box>
    </Container>
  );
}
