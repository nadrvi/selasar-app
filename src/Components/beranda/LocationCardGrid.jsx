// src/components/LocationCardGrid.jsx
import React from 'react';
import LocationCard from './LocationCard';

const locations = [
  {
    image: 'path_to_cafe_image_1.jpg',
    name: 'Kopi Rumah Kaca',
    tags: ['Deadline mode', 'Cafe'],
    details: {
      noise: 'Low to Medium (Quiet & Cozy)',
      people: 'Medium (Moderately Crowded)',
      wifi: 'Excellent (High-Speed & Reliable)',
      power: 'Abundant (Available at 90% of tables)'
    },
    moodStatus: 'Good for focusing'
  },
  {
    image: 'path_to_lake_image.jpg',
    name: 'Kebon Raya Escape',
    tags: ['Healing', 'Nature'],
    details: {
      noise: 'Very Low to Low (Sylvan and Serene)',
      people: 'Few (Tranquil Garden)',
      wifi: 'Fair (Basic Outdoor Coverage)',
      power: 'Limited (Only at the main gazebo)'
    },
    moodStatus: 'Good'
  },
  {
    image: 'path_to_forest_image.jpg',
    name: 'Pine Forest Sanctuary',
    tags: ['Healing', 'Nature'],
    details: {
      noise: 'Very Low (Whispering Pines & Birds)',
      people: 'Few (Deep Forest Solitude)',
      wifi: 'None (Off-grid Experience)',
      power: 'Abundant (Accessible by a tree trunk bench)'
    },
    moodStatus: 'Good'
  },
  {
    image: 'path_to_cafe_image_2.jpg',
    name: 'Urban Nest Coffee',
    tags: ['Chill mode', 'Cafe'],
    details: {
      noise: 'Medium (Socializing Buzz)',
      people: 'Medium (Moderately Crowded)',
      wifi: 'Fair (Slow but Stable)',
      power: 'Limited (Available at 40% of tables)'
    },
    moodStatus: 'Good'
  }
];

const LocationCardGrid = () => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
      {locations.map((loc, index) => (
        <LocationCard key={index} locationData={loc} />
      ))}
    </div>
  );
};

export default LocationCardGrid;