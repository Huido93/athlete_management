import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, CardBody } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux';
import { fetchUser } from '../store/userSlice';
import Select from 'react-select';
import { Line } from 'react-chartjs-2';
import axios from './../axios.js';
import './../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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

  function Analytics(){
    const [exercises, setExercises] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [chartData, setChartData] = useState(null);

    const metrics = [
        { value: 'max_weight', label: 'Max Weight' },
        { value: 'workout_volume', label: 'Workout Volume' }
    ];

    useEffect(() => {
        const fetchExercises = async () => {
        try {
            const response = await axios.get(`/my-exercises`);
            const exerciseOptions = response.data.map(exercise => ({
            value: exercise,
            label: exercise
            }));
            setExercises(exerciseOptions);
        } catch (error) {
            console.error('Error fetching exercises:', error);
        }
        };

        fetchExercises();
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchWorkoutData = async () => {
            if (selectedExercise && selectedMetric) {
              try {
                const response = await axios.get(`/workout-data`, {
                  params: {
                    exercise: selectedExercise.value,
                    metric: selectedMetric.value
                  }
                });
                if (isMounted) {
                  const data = response.data;
                  setChartData({
                    labels: data.map(item => item.date),
                    datasets: [
                      {
                        label: selectedMetric.label,
                        data: data.map(item => item.value),
                        borderColor: 'rgba(75,192,192,1)',
                        backgroundColor: 'rgba(75,192,192,0.2)',
                        fill: true
                      }
                    ]
                  });
                }else {
                    console.warn('No data available for the selected exercise and metric');
                    setChartData(null); // Clear chart data if no data is available
                }
              } catch (error) {
                console.error('Error fetching workout data:', error);
              }
            }
          };
        
        fetchWorkoutData();

        return () => {
            isMounted = false;
        };
    }, [selectedExercise, selectedMetric]);

    return (
        <div className="container mt-5">
      <h2 className="mb-4">Exercise Metrics Chart</h2>
      <p className="mb-4">
        운동과 지표를 선택하면 차트에서 해당 데이터를 확인할 수 있습니다. 운동 진행 상황을 추적하고 시간 경과에 따른 운동 성과를 분석해보세요.
      </p>
      <div className="mb-3">
        <Select
          options={exercises}
          onChange={setSelectedExercise}
          placeholder="Select Exercise"
        />
      </div>
      <div className="mb-3">
        <Select
          options={metrics}
          onChange={setSelectedMetric}
          placeholder="Select Metric"
        />
      </div>
      {chartData ? (
        <Line
          data={chartData}
          options={{
            scales: {
              x: { title: { display: true, text: 'Date' }, type: 'category' },
              y: { title: { display: true, text: selectedMetric.label } }
            }
          }}
        />
      ) : (
        <p>No data available for the selected exercise and metric.</p>
      )}
    </div>
    );
}

export default Analytics;