
import React from 'react';
import { HelpArea } from '../types';

interface HelpAreaSelectorProps {
  selectedArea: HelpArea;
  onSelectArea: (area: HelpArea) => void;
}

const AREAS: HelpArea[] = ['Planning', 'UI/UX Design', 'Code', 'General'];

const HelpAreaSelector: React.FC<HelpAreaSelectorProps> = ({ selectedArea, onSelectArea }) => {
  return (
    <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-400">Help with:</span>
        <div className="flex items-center gap-2">
            {AREAS.map(area => (
                <button
                    key={area}
                    onClick={() => onSelectArea(area)}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                        selectedArea === area
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    {area}
                </button>
            ))}
        </div>
    </div>
  );
};

export default HelpAreaSelector;
