import React, { useEffect, useState } from 'react';
import Canvas from '../components/Canvas';
import {
  createExponentialFadeInCurve,
  createExponentialFadeOutCurve,
  sleep,
} from '../libs/funcs';
import { AudioContext, type TOscillatorType } from 'standardized-audio-context';

const actx = new AudioContext();
const out = actx.destination;
actx.suspend();

const osc = actx.createOscillator();
osc.start();

const gainNode = actx.createGain();
gainNode.gain.value = 0.1;

const analyser = actx.createAnalyser();

osc.connect(gainNode);
gainNode.connect(analyser);
gainNode.connect(out);

let gainLevel = gainNode.gain.value;
let globalPlaying = false;
const fadeDuration = 0.5;
const sampleRate = actx.sampleRate;
const exponent = 3;

const GainInput: React.FC = () => {
  const [gain, setGain] = useState(gainNode.gain.value);

  const handleGainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    gainLevel = value;
    setGain(value);
    if (globalPlaying)
      gainNode.gain.linearRampToValueAtTime(value, actx.currentTime + 0.01);
  };

  return (
    <>
      <label id="gain-label" className="invisible absolute" htmlFor="gain">
        Gain level:
      </label>
      <input
        className="w-full max-w-sm accent-green-600"
        onChange={(e) => handleGainChange(e)}
        type="range"
        id="gain"
        min="0"
        step="0.006"
        max="0.6"
        value={gain}
        aria-labelledby="gain-label"
      />
    </>
  );
};

const FreqInput: React.FC = () => {
  const [frequency, setFrequency] = useState(osc.frequency.value);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showTip, setShowTip] = useState<boolean>(false);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) return;
    setFrequency(value);
  };
  const setFrequencyValue = () => {
    setEditMode(false);
    osc.frequency.linearRampToValueAtTime(frequency, actx.currentTime + 0.1);
  };


  return (
    <div className='max-h-14 max-w-sm'>
      {editMode ? (
        <>
          <label id="freq-label" className="invisible absolute" htmlFor="freq">
            Frequency:
          </label>
          <input
            className="max-h-14 rounded-lg border-2 border-green-600 bg-green-950 text-center text-5xl text-green-300 accent-green-700"
            onChange={(e) => handleFrequencyChange(e)}
            autoFocus
            id="freq"
            type="number"
            min="20"
            max="20000"
            value={frequency}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setFrequencyValue();
            }}
            onBlur={() => setFrequencyValue()}
            onWheel={(e) => { e.stopPropagation() }}
            aria-labelledby="freq-label"
          />
        </>
      ) : (
        <>
          <span
            className="cursor-pointer p-3 text-center text-5xl text-green-300 accent-green-700"
            onClick={() => { toggleEditMode(); setShowTip(false) }}
            id='freq'
            onMouseOver={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
          >
            {frequency} <span className='text-3xl'>Hz</span>
          </span>
          <span className={`m-auto block text-center text-xs ${showTip ? '' : 'invisible'}`}>
            Click to edit frequency
          </span>
        </>
      )}
    </div>
  );
};

const TypeInput: React.FC = () => {
  const [type, setType] = useState(osc.type);

  const handleTypeChange = (type: TOscillatorType) => {
    setType(type);
    osc.type = type;
  };

  const active = 'bg-green-500 text-green-950';

  return (
    <div className="flex max-w-lg rounded-lg border-2 border-green-500 bg-green-950 text-green-300">
      <button
        onClick={() => handleTypeChange('sine')}
        className={`p-2 font-medium  ${type === 'sine' && active}`}
      >
        Sine
      </button>
      <button
        onClick={() => handleTypeChange('triangle')}
        className={`p-2 font-medium ${type === 'triangle' && active}`}
      >
        Triangle
      </button>
      <button
        onClick={() => handleTypeChange('square')}
        className={`p-2 font-medium ${type === 'square' && active}`}
      >
        Square
      </button>
      <button
        onClick={() => handleTypeChange('sawtooth')}
        className={`p-2 font-medium ${type === 'sawtooth' && active}`}
      >
        Sawtooth
      </button>
    </div>
  );
};

const TogglePlay: React.FC = () => {
  const [playing, setPlaying] = useState(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      toggleState();
      event.preventDefault();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [playing]);

  const active = 'border-green-600 bg-green-950 text-green-300';
  const inactive = 'border-red-600 bg-red-950 text-red-300';

  const toggleState = () => {
    if (playing) {
      const fadeCurve = createExponentialFadeOutCurve(
        fadeDuration,
        sampleRate,
        exponent,
        gainLevel
      );
      gainNode.gain.setValueCurveAtTime(
        fadeCurve,
        actx.currentTime,
        fadeDuration
      );
      // await actx.suspend();
      setPlaying(false);
      globalPlaying = false;
    } else {
      if (actx.state == 'suspended') actx.resume();
      const fadeCurve = createExponentialFadeInCurve(
        fadeDuration,
        sampleRate,
        exponent,
        gainLevel
      );
      gainNode.gain.setValueCurveAtTime(
        fadeCurve,
        actx.currentTime,
        fadeDuration
      );
      setPlaying(true);
      globalPlaying = true;
    }
  };

  return (
    <button
      className={`rounded-lg border-2 p-2 px-5 ${playing ? inactive : active}`}
      onClick={() => toggleState()}
    >
      {playing ? 'Stop' : 'Play'}
    </button>
  );
};

const Container: React.FC = () => {
  return (
    <React.StrictMode>
      <div className="mt-7 flex flex-col items-center gap-y-5">
        <div className="h-20 w-full">
          <Canvas analyser={analyser} type="time" />
        </div>
        <FreqInput />
        <TogglePlay />
        <GainInput />
        <TypeInput />
      </div>
    </React.StrictMode>
  );
};

export default Container;
