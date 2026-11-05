import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FonteAttribution } from './FonteAttribution';

describe('FonteAttribution', () => {
    it('GARMIN + "Forerunner 970" → "Garmin Forerunner 970"', () => {
        render(<FonteAttribution fonteDados="GARMIN" deviceName="Forerunner 970" />);
        expect(screen.getByText('Garmin Forerunner 970')).toBeInTheDocument();
    });

    it('GARMIN + "Garmin Fenix 8" não duplica a marca', () => {
        render(<FonteAttribution fonteDados={{ value: 'GARMIN' }} deviceName="Garmin Fenix 8" />);
        expect(screen.getByText('Garmin Fenix 8')).toBeInTheDocument();
    });

    it.each([undefined, null, '', '  ', 'unknown', 'UNKNOWN'])('GARMIN com modelo %j → "Garmin"', (deviceName) => {
        render(<FonteAttribution fonteDados="GARMIN" deviceName={deviceName} />);
        expect(screen.getByText('Garmin')).toBeInTheDocument();
    });

    it.each(['INTERVALS_ICU', 'STRAVA', 'MANUAL', undefined])('fonte %j não renderiza nada', (fonte) => {
        const { container } = render(<FonteAttribution fonteDados={fonte} deviceName="Forerunner 970" />);
        expect(container).toBeEmptyDOMElement();
    });
});
