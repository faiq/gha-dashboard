import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="mx-auto grid grid-cols-5 gap-20 lg:w-10/12 w-12/12 pt-60">
      <div className="col-span-2 pt-16 ">
        <h1 className="text-5xl font-bold">Github Actions Dashboard</h1>
        <p className="mb-12 text-gray-400 text-md">
        </p>
        <a
          className="bg-black text-white px-6 py-2.5 rounded-full cursor-pointer text-center text-md font-semibold uppercase tracking-wider"
          href={`${AUTH_ENDPOINT}?${searchParams.toString()}`}
        >
          <FontAwesomeIcon icon={faGithub} className="pr-2"/>
          Log in with Github
        </a>
      </div>
      <div className="rounded-full col-span-3">
        demo video went here
      </div>
    </div>
  );
}
