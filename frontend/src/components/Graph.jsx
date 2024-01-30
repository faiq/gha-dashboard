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

export function Graph({repository, jobBreakDown, workflowName}) {
  const options = {
    plugins: {
      title: {
        display: true,
        text: `Breakdown for ${repository} ${workflowName}`,
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
  const labels = jobBreakDown.map((job) => { 
    return job.date
  });
  const graphData = {
    labels,  
    datasets: [
      {
        label: 'Success',
        backgroundColor: '#3D7E63',
        data: jobBreakDown.map((res) => { return res.jobResults.passed.length } )
      },
      {
        label: 'Fail',
        backgroundColor: '#DD5F5D',
        data: jobBreakDown.map((res) => { return res.jobResults.failed.length } )
      }

    ],
  };
  return (
    <Bar options={options} data={graphData} width={100} height={30}/>
  )
}
