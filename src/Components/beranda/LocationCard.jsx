// src/components/LocationCard.jsx
import 'react';
import { Zap, Users, Wifi, Target, Sparkles, CheckCircle2 } from 'lucide-react';

const LocationCard = ({ locationData }) => {
  return (
    <div className="w-full bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm flex flex-col">
      {/* Location Image with Title Overlay */}
      <div className="relative h-60 w-full">
        <img 
          src={locationData.image} 
          alt={locationData.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <h2 className="text-3xl font-serif font-bold text-white">
            {locationData.name}
          </h2>
        </div>
      </div>

      {/* Tags & Details */}
      <div className="p-6 space-y-5">
        
        {/* Tag Pills */}
        <div className="flex space-x-2 items-center">
          {locationData.tags.map(tag => (
            <span key={tag} className="bg-[#EBE3D5] text-[#5F4B41] text-xs px-4 py-1.5 rounded-full border border-neutral-200 shadow-inner">
              {tag}
            </span>
          ))}
        </div>

        {/* Location Details Grid */}
        <div className="space-y-4 pt-4 border-t border-neutral-200 text-neutral-800">
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Target className="h-5 w-5 text-[#5F4B41] mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-neutral-600">Noise Level</div>
                  <div className="text-sm">{locationData.details.noise}</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Wifi className="h-5 w-5 text-[#5F4B41] mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-neutral-600">WiFi Connection</div>
                  <div className="text-sm">{locationData.details.wifi}</div>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Users className="h-5 w-5 text-[#5F4B41] mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-neutral-600">People</div>
                  <div className="text-sm">{locationData.details.people}</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Zap className="h-5 w-5 text-[#5F4B41] mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-neutral-600">Power Outlets</div>
                  <div className="text-sm">{locationData.details.power}</div>
                </div>
              </div>
            </div>

          </div>

          <div className="border-b border-neutral-200 w-full"></div>

        </div>

        {/* Mood Section */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-1.5 text-[#5F4B41]">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">Mood :</span>
          </div>
          <div className="flex items-center space-x-2 bg-[#5F4B41] text-white px-5 py-2 rounded-full shadow-md">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold">{locationData.moodStatus}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LocationCard;