import { useLocation } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Graph() {
  const location = useLocation();
  const data=location.state
  const options = {
    plugins: {
      title: {
        display: true,
        text: `Breakdown for ${data.repository} ${data.workflowName}`,
      },
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };
  const labels = data.jobBreakDown.map((job) => { 
    return job.date
  });
  const graphData = {
    labels,  
    datasets: [
      {
        label: 'Success',
        backgroundColor: '#3D7E63',
        data: data.jobBreakDown.map((res) => { return res.jobResults.passed.length } )
      },
      {
        label: 'Fail',
        backgroundColor: '#DD5F5D',
        data: data.jobBreakDown.map((res) => { return res.jobResults.failed.length } )
      }

    ],
  };
  return (
    <Bar options={options} data={graphData} width={100} height={30}/>
  )
}
