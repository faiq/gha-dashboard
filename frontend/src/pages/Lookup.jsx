import { useState, useEffect, useContext } from 'react';
import '../styles/lookup.css';
import '../styles/table.css';
import { Graph } from '../components/Graph.jsx';
import { TableRow, Table, TableHeader } from '../components/Table.jsx';
import { UserContext } from '../App';
import { useNavigate } from 'react-router-dom';
export default function Lookup () {
  const [repositories, setRepositories] = useState([]);
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [selected, setSelected] = useState('');
  const [workflows, setWorkflows] = useState({});
  const [jobBreakDown, setJobBreakDown] = useState([]);
  const [repository, setRepository] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [failureCountMap, setFailureCountMap] = useState({});
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  useEffect(() => {
    async function getAllUsersRepositories () {
      console.log(user);
      if (user === null) {
        navigate('/');
        return;
      }
      const data = await fetch('/repositories', {
        credentials: 'include'
      });
      const repositories = await data.json();
      setRepositories(repositories);
    }
    getAllUsersRepositories();
  }, []);

  function filterRepositories (e) {
    setSelected(e.target.value);
    const value = e.target.value;
    console.log(value);
    if (value.length === 0) {
      setSuggestedRepositories([]);
      return;
    }
    // TODO: move this to a trie datastructure.
    if (value.length > 2) {
      const regex = new RegExp(`${value}`, 'i');
      if (repositories.length === 0) {
        return;
      }
      const suggested = repositories.filter(v => regex.test(v.name));
      setSuggestedRepositories(suggested);
    }
  }

  async function fetchWorkflows (repoName) {
    const searchParams = new URLSearchParams({
      repoName
    });
    console.log(repoName);
    const data = await fetch('/workflows?' + searchParams.toString(), {
      credentials: 'include'
    });
    if (!data.ok) {
      return;
    }
    const workflows = await data.json();
    setWorkflows(workflows);
  }

  async function getWorkflowData (e) {
    e.preventDefault();
    const repository = e.target.repository.value;
    const workflow = e.target.workflow.value;
    setRepository(repository);
    setWorkflow(workflow);
    const workflowID = workflows[workflow];
    const postData = {
      repository,
      workflowID
    };
    const response = await fetch('/runs',
      {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(postData),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    // TODO add failure scren
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    const jobBreakDown = data.jobBreakDown;
    const failureCount = data.failureCount;
    setJobBreakDown(jobBreakDown);
    setFailureCountMap(failureCount);
  }
  function setSelectedFromList (repo) {
    setSelected(repo.name);
    setSuggestedRepositories([]);
    fetchWorkflows(repo.name);
  }

  return (
        <div className="container">
          <div className="form-container">
            <form onSubmit={getWorkflowData} className="form" id="myForm">
                <div className="type-ahead-container">
                    <label for="repositoryName">Repository Name:</label>
                    <input value={selected} type="text" id="repositoryName" name="repository" className="type-ahead-input" placeholder="Type to search..." required
                      onChange={filterRepositories}
                      onFocus={(event) => {
                        event.target.setAttribute('autocomplete', 'off');
                      }}
                    />
                    <ul className="type-ahead-dropdown">
                      {suggestedRepositories.map((repo) => {
                        return <li className="type-ahead-item"
                                key={repo.id} onClick={() => {
                                  setSelectedFromList(repo);
                                }}>{repo.name}</li>;
                      })}
                    </ul>
                </div>

                <div className="select-workflow">
                    <label>Select Workflow:</label>
                      {
                      workflows
                        ? (
                        <select id="selectOption" name="workflow" required>
                          {Object.keys(workflows).map((workflowName) => {
                            return <option className="text-center">{workflowName}</option>;
                          })}
                        </select>
                          )
                        : (
                      <div></div>
                          )
                    }
                </div>
                <button type="submit">Search</button>
            </form>
          </div>
          {
          (jobBreakDown.length) > 0
            ? (
            <div className="placeholder-container">
              <div className="placeholder">
                <h2> Most Frequently Broken </h2>
                <Table
                  TableRows={Object.keys(failureCountMap).map((k) => (
                    <TableRow rowData={[k, failureCountMap[k]]}></TableRow>
                  ))
                  }
                  Header=<TableHeader headers={['job name', 'times broken']}/>
                  tableClassName="styled-table"
                />
              </div>
              <div className="placeholder">
                <h2>Graph Breakdown</h2>
                  <Graph repository={repository} jobBreakDown={jobBreakDown} workflowName={workflow} />
              </div>
            </div>
              )
            : (
            <div></div>
              )
          }
    </div>
  );
}
