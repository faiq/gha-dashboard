import { useState, useEffect, useContext } from 'react';
import '../styles/lookup.css';
import '../styles/table.css';
import { Graph } from '../components/Graph.jsx';
import { TableRow, Table, TableHeader } from '../components/Table.jsx';
import { UserContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL, COMMON_HEADERS } from './consts';
export default function Lookup () {
  const [repositories, setRepositories] = useState({});
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [selected, setSelected] = useState('');
  const [workflows, setWorkflows] = useState({});
  const [jobBreakDown, setJobBreakDown] = useState([]);
  const [repository, setRepository] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [failureCountMap, setFailureCountMap] = useState({});
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  async function getRepositories () {
    const data = await fetch(`${BACKEND_URL}/repositories`, {
      credentials: 'include',
      method: 'POST',
      headers: COMMON_HEADERS,
      mode: 'cors',
      cache: 'no-cache',
      body: JSON.stringify(repositories)
    });
    const fetchedRepositories = await data.json();
    return fetchedRepositories;
  }

  useEffect(() => {
    if (user === null || user === undefined || !user.set) {
      navigate('/');
      return;
    }
    getRepositories().then((newRepositories) => {
      setRepositories(newRepositories);
    });
  }, []);

  async function filterAndFetchRepositories (e) {
    setSelected(e.target.value);
    const value = e.target.value;
    if (value.length === 0) {
      setSuggestedRepositories([]);
      return;
    }
    // TODO: move this to a trie datastructure.
    if (value.length > 2) {
      const regex = new RegExp(`${value}`, 'i');
      if (repositories.length === 0) {
        const newRepositories = await getRepositories();
        setRepositories(newRepositories);
      }
      const suggested = Object.keys(repositories).filter((id) => {
        const name = repositories[id];
        return regex.test(name);
      }).map((k) => repositories[k]);
      if (suggested.length === 0) {
        const newRepositories = await getRepositories();
        setRepositories(newRepositories);
      }
      setSuggestedRepositories(suggested);
    }
  }

  async function fetchWorkflows (repoName) {
    const searchParams = new URLSearchParams({
      repoName
    });
    console.log(repoName);
    const data = await fetch(`${BACKEND_URL}/workflows?` + searchParams.toString(), {
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
    const response = await fetch(`${BACKEND_URL}/runs`,
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
    // TODO add failure screen
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
    setSelected(repo);
    setSuggestedRepositories([]);
    fetchWorkflows(repo);
  }

  return (
        <div className="container">
          <div className="form-container">
            <form onSubmit={getWorkflowData} className="form" id="myForm">
                <div className="type-ahead-container">
                    <label for="repositoryName">Repository Name:</label>
                    <input value={selected} type="text" id="repositoryName" name="repository" className="type-ahead-input" placeholder="Type to search..." required
                      onChange={filterAndFetchRepositories}
                      onFocus={(event) => {
                        event.target.setAttribute('autocomplete', 'off');
                      }}
                    />
                    <ul className="type-ahead-dropdown">
                      {suggestedRepositories.forEach((repo, i) => {
                        return <li className="type-ahead-item"
                                key={i} onClick={() => {
                                  setSelectedFromList(repo);
                                }}>{repo}</li>;
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
