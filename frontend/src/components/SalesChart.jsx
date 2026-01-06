import React, { useRef, useMemo } from 'react';
import { Card, Spin, Typography } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

const { Title: AntTitle } = Typography;

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SalesChart = ({ data }) => {
  const chartRef = useRef(null);

  // Prepare chart data with memoization to prevent re-renders
  const chartData = useMemo(() => ({
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), // 24-hour format
    datasets: [
      {
        label: 'Orders Today',
        data: Array(24).fill(0).map((_, hour) => {
          const hourData = data.find(item => parseInt(item.hour) === hour);
          return hourData ? parseInt(hourData.order_count) : 0;
        }),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#1f2937',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#1f2937',
        pointHoverBorderWidth: 3,
      },
    ],
  }), [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => `Hour: ${context[0].label}`,
          label: (context) => {
            const value = context.parsed.y;
            return [
              `Orders: ${value}`,
              value > 0 ? `${value > 1 ? 'Busy' : 'Moderate'} activity` : 'No orders'
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
            weight: '500'
          },
          padding: 8,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
            weight: '500'
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
    },
    elements: {
      point: {
        hitRadius: 10,
      },
    },
  };

  return (
    <Card 
      title="Today's Orders by Hour" 
      style={{ 
        backgroundColor: '#2d3748',
        borderColor: '#4a5568',
        borderRadius: '12px',
        height: '300px'  // Changed from 500px
      }}
    >
      <div style={{ 
        position: 'relative', 
        height: '440px', 
        width: '100%',
        padding: '10px 0'
      }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default SalesChart;
