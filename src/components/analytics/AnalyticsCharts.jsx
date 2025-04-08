import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import '../../styles/analytics.css';

const AnalyticsCharts = ({ monthlyStats, completionStats, title }) => {
  const COLORS = {
    light: {
      read: '#4CAF50',
      unread: '#FF5252',
      text: '#000000',
      grid: '#E0E0E0'
    },
    dark: {
      read: '#66BB6A',
      unread: '#FF6B6B',
      text: '#FFFFFF',
      grid: '#424242'
    }
  };

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const currentColors = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <div className="analytics-section">
      <div className="chart-container">
        <h3>Monthly Progress</h3>
        <div className="chart-wrapper">
          <BarChart
            width={500}
            height={300}
            data={monthlyStats}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={currentColors.grid} />
            <XAxis 
              dataKey="month" 
              stroke={currentColors.text}
              tick={{ fill: currentColors.text }}
            />
            <YAxis 
              stroke={currentColors.text}
              tick={{ fill: currentColors.text }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#424242' : '#FFFFFF',
                border: `1px solid ${currentColors.grid}`,
                color: currentColors.text
              }}
              labelStyle={{ color: currentColors.text }}
            />
            <Legend 
              wrapperStyle={{ color: currentColors.text }}
            />
            <Bar dataKey="read" name="Read" fill={currentColors.read} />
            <Bar dataKey="unread" name="Not Read" fill={currentColors.unread} />
          </BarChart>
        </div>
      </div>

      <div className="chart-container">
        <h3>Overall Completion</h3>
        <div className="chart-wrapper">
          <PieChart width={400} height={300}>
            <Pie
              data={completionStats}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {completionStats.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? currentColors.read : currentColors.unread} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#424242' : '#FFFFFF',
                border: `1px solid ${currentColors.grid}`,
                color: currentColors.text
              }}
              labelStyle={{ color: currentColors.text }}
            />
            <Legend 
              wrapperStyle={{ color: currentColors.text }}
            />
          </PieChart>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts; 