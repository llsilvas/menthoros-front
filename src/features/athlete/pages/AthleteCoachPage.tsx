import { Box } from '@mui/material';
import CoachChatPanel from '../components/CoachChatPanel';
import type { CoachInfo } from '../components/CoachChatPanel';

const mockCoach: CoachInfo = {
  id: 'coach-1',
  name: 'Coach Menthoros',
  isOnline: true,
};

export default function AthleteCoachPage() {
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
      }}
    >
      <CoachChatPanel
        athleteId="athlete-1"
        coach={mockCoach}
        messages={[]}
        onSendText={async (text) => console.log('send text:', text)}
        onSendAudio={async (_blob, ms) => console.log('send audio:', ms, 'ms')}
      />
    </Box>
  );
}
