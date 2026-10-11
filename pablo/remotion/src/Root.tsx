import React from 'react';
import {Composition} from 'remotion';
import {VoyIgual} from './VoyIgual';
export const Root: React.FC = () => (
  <Composition id="VoyIgual" component={VoyIgual} durationInFrames={975} fps={30} width={1080} height={1920} />
);
