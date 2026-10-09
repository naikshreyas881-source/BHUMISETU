import React from 'react';
import { ShieldCheck, CloudRain, Clock, Sprout, Layers } from 'lucide-react';

export interface FactorDetail {
  score: number;
  max_weight: number;
  explanation: string;
  data_source: string;
}

export interface PriorityData {
  overall_score: number;
  breakdown: Record<string, FactorDetail>;
  plain_language_explanation: string;
  missing_information?: string[];
  limitations?: string[];
}

interface PriorityMeterProps {
  priority: PriorityData | null;
  isLoading?: boolean;
}

export const PriorityMeter: React.FC<PriorityMeterProps> = ({ priority, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 animate-pulse text-xs text-gray-500 text-center">
        Computing agronomic priority assessment...
      </div>
    );
  }

  if (!priority) return null;

  const score = priority.overall_score;
  const getScoreColor = () => {
    if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-gray-700 bg-gray-50 border-gray-300';
  };

  const getBarColor = (val: number, max: number) => {
    const ratio = val / max;
    if (ratio >= 0.7) return 'bg-emerald-500';
    if (ratio >= 0.4) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3 text-xs">
      {/* Overall Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-forest-700" />
          <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
            Explainable Priority Score
          </span>
        </div>

        <div className={`px-2.5 py-0.5 rounded-full font-black text-xs border ${getScoreColor()}`}>
          {score} / 100
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-gray-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        ></div>
      </div>

      {/* Factor Breakdown */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {priority.breakdown.urgency && (
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>Urgency</span>
              </span>
              <span>{priority.breakdown.urgency.score}/{priority.breakdown.urgency.max_weight}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-full rounded-full ${getBarColor(priority.breakdown.urgency.score, priority.breakdown.urgency.max_weight)}`}
                style={{ width: `${(priority.breakdown.urgency.score / priority.breakdown.urgency.max_weight) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {priority.breakdown.weather_risk && (
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
              <span className="flex items-center space-x-1">
                <CloudRain className="w-3 h-3 text-sky-500" />
                <span>Weather</span>
              </span>
              <span>{priority.breakdown.weather_risk.score}/{priority.breakdown.weather_risk.max_weight}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-full rounded-full ${getBarColor(priority.breakdown.weather_risk.score, priority.breakdown.weather_risk.max_weight)}`}
                style={{ width: `${(priority.breakdown.weather_risk.score / priority.breakdown.weather_risk.max_weight) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {priority.breakdown.crop_readiness && (
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
              <span className="flex items-center space-x-1">
                <Sprout className="w-3 h-3 text-leaf-500" />
                <span>Crop Stage</span>
              </span>
              <span>{priority.breakdown.crop_readiness.score}/{priority.breakdown.crop_readiness.max_weight}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-full rounded-full ${getBarColor(priority.breakdown.crop_readiness.score, priority.breakdown.crop_readiness.max_weight)}`}
                style={{ width: `${(priority.breakdown.crop_readiness.score / priority.breakdown.crop_readiness.max_weight) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {priority.breakdown.farm_impact && (
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
              <span className="flex items-center space-x-1">
                <Layers className="w-3 h-3 text-amber-500" />
                <span>Acreage</span>
              </span>
              <span>{priority.breakdown.farm_impact.score}/{priority.breakdown.farm_impact.max_weight}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-full rounded-full ${getBarColor(priority.breakdown.farm_impact.score, priority.breakdown.farm_impact.max_weight)}`}
                style={{ width: `${(priority.breakdown.farm_impact.score / priority.breakdown.farm_impact.max_weight) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Agronomic Plain-Language Explanation */}
      <p className="text-[11px] text-gray-600 bg-cream-50 p-2 rounded-lg border border-cream-200 leading-relaxed font-sans">
        {priority.plain_language_explanation}
      </p>
    </div>
  );
};
