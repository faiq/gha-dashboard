import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MakeHeaders from "../utils/headers";

let page = 0;
export default function Lookup() {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState([]);
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [selected, setSelected] = useState("");
  const [workflows, setWorkflows] = useState([]);
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
        }
      }
      return {
        jobResults: nonSkippedResults,
        id: resObj.value.jobs[0].run_id,
        date: resObj.value.jobs[0].started_at.split("T")[0],
      }
    })
    navigate("/graph", {
      state: {
        jobBreakDown: jobBreakDown,
        workflowName: workflow,
        repository: repository
      }
    })
}


  function setSelectedFromList(repo) {
    setSelected(repo.name);
    setSuggestedRepositories([]);
    fetchWorkflows(repo.name)
  }

  return (
    <div className="flex flex-col justify-center items-center mx-auto h-auto text-center max-w-lg">
        <div className="w-full">
          <form onSubmit={getWorkflowData} className="mb-8">
            <label>Search For a Repository</label>
            <input
              className="w-full border-grey-light p-3 rounded-lg focus:ring-primary focus:border-primary border-black border-2 text-lg font-semibold mr-3 outline-none "
              type="text"
              placeholder="Repository Name ..."
              onChange={filterRepositories}
              onFocus={(event) => {
                event.target.setAttribute('autocomplete', 'off');
              }}
              value={selected}
              name="repository"
            />
              <ul className="max-h-[100px] overflow-y-auto">
                {suggestedRepositories.map((repo)=>{
                  return <li className="w-full p-3 text-center block rounded-lg border-grey-light border-2"
                          key={repo.id} onClick={() => {
                            console.log(repositories);
                            setSelectedFromList(repo)
                            }}>{repo.name}</li>
                })}
              </ul>
              <label>Select a workflow to graph</label>
            {
              workflows ? (
              <select
                placeholder="Workflow Name ..."
                name="workflow"
              >
              {workflows.map((workflow) => {
                return <option className="text-center">{workflow.name}</option>
              })}
              </select>
              ) : (
                <div></div>
              )
            }
            <button
              className="text-black px-5 rounded-lg py-3 cursor-pointer text-center text-lg font-semibold tracking-wide"
              type={"submit"}
            >
              Search
            </button>
          </form>
        </div>
    </div>
  )
}
