import React from 'react';

const RatingLegend: React.FC = () => {
  // Generate matrix cells
  const generateMatrixCells = () => {
    const cells = [];

    // Headers
    cells.push(
      <div key="header" className="grid grid-cols-6 mb-1">
        <div className="text-center font-bold border p-2 bg-gray-100">Impact →<br />Likelihood ↓</div>
        {[1, 2, 3, 4, 5].map(impact => (
          <div key={`header-${impact}`} className="text-center font-bold border p-2 bg-gray-100">{impact}</div>
        ))}
      </div>
    );

    // Rows
    for (let likelihood = 5; likelihood >= 1; likelihood--) {
      const row = [
        <div key={`row-${likelihood}`} className="text-center font-bold border p-2 bg-gray-100">{likelihood}</div>
      ];

      for (let impact = 1; impact <= 5; impact++) {
        const rating = likelihood * impact;
        let bgClass = 'bg-green-100 text-green-800'; // Low (1-3)

        if (rating >= 4 && rating <= 9) {
          bgClass = 'bg-yellow-100 text-yellow-800'; // Medium (4-9)
        } else if (rating >= 10 && rating <= 14) {
          bgClass = 'bg-orange-100 text-orange-800'; // High (10-14)
        } else if (rating >= 15) {
          bgClass = 'bg-red-100 text-red-800'; // Critical (15-25)
        }

        row.push(
          <div 
            key={`cell-${likelihood}-${impact}`} 
            className={`text-center border p-2 font-medium ${bgClass}`}
          >
            {rating}
          </div>
        );
      }

      cells.push(
        <div key={`row-container-${likelihood}`} className="grid grid-cols-6">
          {row}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="w-full">
      <div className="mb-6">{generateMatrixCells()}</div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <div className="font-bold text-green-800">Low (1-3)</div>
        </div>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-bold text-yellow-800">Medium (4-9)</div>
        </div>
        <div className="p-3 bg-orange-50 border border-orange-200 rounded">
          <div className="font-bold text-orange-800">High (10-14)</div>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <div className="font-bold text-red-800">Critical (15-25)</div>
        </div>
      </div>
    </div>
  );
};

export default RatingLegend;