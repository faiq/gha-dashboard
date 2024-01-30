import { useState, useEffect } from "react";
import MakeHeaders from "../utils/headers";
import "../styles/lookup.css"
import "../styles/table.css"
import { Graph } from "../components/Graph.jsx"
import { TableRow, Table, TableHeader } from "../components/Table.jsx"

let page = 0;
export default function Lookup() {
  const [repositories, setRepositories] = useState([]);
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [selected, setSelected] = useState("");
  const [workflows, setWorkflows] = useState([]);
  const [jobBreakDown, setJobBreakDown] = useState([]);
  const [repository, setRepository] = useState("");
  const [workflow, setWorkflow] = useState("");
  const [failureCountMap, setFailureCountMap] = useState({});
  useEffect(() => {
    if (suggestedRepositories.length > 0 || selected.length === 0 || suggestedRepositories.includes(selected)) {
      return
    }
    page++;
    let token = localStorage.getItem("token")
    const searchParams = new URLSearchParams({
        "per_page": 100,
        "page": page
    })
    fetch("https://api.github.com/user/repos?"+searchParams.toString(), {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer "+token,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }).then((response) =>{
      let data = response.json();
      return data
    }).then((data) => {
      let newdata = data.map(item=>{
        return {
          "name": item["full_name"],
          "id": item.id
        };
      });
      setRepositories(repositories => repositories.concat(newdata));
    }).catch((err) => {
      console.log("failed with err", err);
    });
  }, [suggestedRepositories, selected])

  function filterRepositories (e) {
    setSelected(e.target.value);
    const value = e.target.value;
    if (value.length === 0) {
      setSuggestedRepositories([]);
      return;
    }
    if (value.length > 2) {
      const regex = new RegExp(`${value}`, `i`);
      if (repositories.length === 0) {
        return;
      }
      let suggested = repositories.filter(v => regex.test(v.name));
      setSuggestedRepositories(suggested);
    }
  }

  async function fetchWorkflows (repoName) {
    let token = localStorage.getItem("token")
    fetch(`https://api.github.com/repos/${repoName}/actions/workflows`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer "+token,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }).then((response) =>{
      let data = response.json();
      return data
    }).then((data) => {
      console.log(data);
      let fetchedWorkflows = data.workflows.map(item=>{
        return {
          "name": item.name,
          "id": item.id
        };
      });
      setWorkflows(fetchedWorkflows);
    }).catch((err) => {
      console.log("failed with to fetch workflows with err", err);
    })
  }

  async function fetchJobData(jobObject) {
    let token = localStorage.getItem("token")
    return fetch(jobObject.jobs_url+"?per_page=100",
      {
        headers: MakeHeaders(token),
      }
    ).then(response => {
      if (response.status === 200) {
        return response.json();
      }
    }).catch(error => ({ status: 'rejected', reason: error }));
  }

  async function getWorkflowData (e) {
    e.preventDefault();
    let repository=e.target.repository.value;
    let workflow=e.target.workflow.value;
    setRepository(repository);
    setWorkflow(workflow);
    let workflowID=-1;
    for (const i in workflows) {
      let cand=workflows[i]
      if (cand.name === workflow) {
        workflowID=cand.id;
      }
    }
    let token = localStorage.getItem("token");
    let workflowStatus = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/${workflowID}/runs`,
      {
        headers: MakeHeaders(token),
      }
    ).then((response) => {
      if (response.status === 200) {
        let data = response.json();
        return data
      }
    }).catch((err) => {
      console.log("failed with to fetch workflows with err", err);
    })
    const promises = workflowStatus.workflow_runs.map(fetchJobData);
    const jobStatus = await Promise.allSettled(promises);
    let failureCount = {};
    let jobBreakDown = jobStatus.map((resObj) => {
      let nonSkippedResults = {
        passed: [],
        failed: []
      }
      for (let i = 0; i < resObj.value.jobs.length; i++) {
        let job = resObj.value.jobs[i];
        if (job.conclusion  === "success") {
          nonSkippedResults.passed.push({
            name: job.name,
            conclusion: job.conclusion,
          });
        } else if (job.conclusion === "failure") {
          nonSkippedResults.failed.push({
            name: job.name,
            conclusion: job.conclusion,
          })
          if (!(job.name in failureCount))  {
            failureCount[job.name] = 0;
          }
          failureCount[job.name] += 1;
        }
      }
      return {
        jobResults: nonSkippedResults,
        id: resObj.value.jobs[0].run_id,
        date: resObj.value.jobs[0].started_at.split("T")[0],
      }
    })
    setJobBreakDown(jobBreakDown);
    setFailureCountMap(failureCount);
  }


  function setSelectedFromList(repo) {
    setSelected(repo.name);
    setSuggestedRepositories([]);
    fetchWorkflows(repo.name)
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
                      {suggestedRepositories.map((repo)=>{
                        return <li className="type-ahead-item"
                                key={repo.id} onClick={() => {
                                  setSelectedFromList(repo)
                                  }}>{repo.name}</li>
                      })}
                    </ul>
                </div>

                <div className="select-workflow">
                    <label>Select Workflow:</label>
                      {
                      workflows ? (
                        <select id="selectOption" name="workflow" required>
                          {workflows.map((workflow) => {
                            return <option className="text-center">{workflow.name}</option>
                          })}
                        </select>
                    ) : (
                      <div></div>
                    )
                    }
                </div>

                <button type="submit">Search</button>
            </form>
          </div>
          {
          (jobBreakDown.length) > 0 ? (
            <div className="placeholder-container">
              <div className="placeholder">
                <h2> Most Frequently Broken </h2>
                <Table
                  TableRows={Object.keys(failureCountMap).map((k) => (
                    <TableRow rowData={[k, failureCountMap[k]]}></TableRow>
                  ))
                  }
                  Header=<TableHeader headers={["job name", "times broken"]}/>
                  tableClassName="styled-table"
                />
              </div>
              <div className="placeholder">
                <h2>Graph Breakdown</h2>
                  <Graph repository={repository} jobBreakDown={jobBreakDown} workflowName={workflow} />
              </div>
            </div>
            ) : (
            <div></div>
          )
          }
    </div>
  )
}
