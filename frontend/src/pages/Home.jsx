import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css"

const AUTH_ENDPOINT = "https://github.com/login/oauth/authorize"
const data = {
  "client_id": process.env.REACT_APP_CLIENT_ID,
  "redirect_uri": "http://localhost:3000/",
  "scope": ["repo"]
}

export default function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    let token = localStorage.getItem("token");
    if (token) {
      navigate("/search");
      return
    }
    let qs = window.location.search;
    let params = new URLSearchParams(qs);
    let code = params.get("code");
    if (code && !token){
      console.log("calling backend!!");
      fetch("http://localhost:3000/getToken?"+params.toString()).then((response) =>{
        let data = response.json()
        console.log(data);
        return data;
      }).then((res) => {
        console.log('this is res '+res);
        if (res.access_token){
          localStorage.setItem("token", res.access_token);
        }
      }).catch((e) => {
        console.log(e);
      })
    }
  }, [])
  const searchParams = new URLSearchParams(data);
  return (
    <div class="splash-container">
      <h1>Github Actions Dashboard</h1>
      <p class="description">Github Actions Dashboard is a visualization tool to help you identify what jobs are breaking in your workflow.</p>
      <a href={`${AUTH_ENDPOINT}?${searchParams.toString()}`} class="github-signin-btn">
        <FontAwesomeIcon style={{ marginRight: '1em'}} icon={faGithub}/>
        Log in with Github
      </a>
    </div>
  );
}
