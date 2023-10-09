import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from '../App';

export default function Home() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (user === null) {
      fetch("http://localhost:3000/auth", {
        credentials: 'include',
      }).then((res) => {
        if (res.status === 200) {
          setUser({});
          navigate("/search");
          return
        }
      })
    }

    let qs = window.location.search;
    let params = new URLSearchParams(qs);
    let code = params.get("code");
    if (code){
      fetch("http://localhost:3000/token?"+params.toString(),
        {
          credentials: 'include',
        }).then(() =>{
          setUser({});
          navigate("/search");
          return
      }).catch((e) => {
        console.log(e);
      })
    }
  }, [])

  function Login () {
    fetch("http://localhost:3000/login").then((res) =>{
      if (res.status === 200) {
        return res.json();
      }
    }).then(data => {
      window.location.assign(data.url);
    })
    .catch((e) => {
      console.log(e);
    });
  }

  return (
    <div className="mx-auto grid grid-cols-5 gap-20 lg:w-10/12 w-12/12 pt-60">
      <div className="col-span-2 pt-16 ">
        <h1 className="text-5xl font-bold">Github Actions Dashboard</h1>
        <p className="mb-12 text-gray-400 text-md">
        </p>
        <button
          className="bg-black text-white px-6 py-2.5 rounded-full cursor-pointer text-center text-md font-semibold uppercase tracking-wider"
          onClick={Login}
        >
          <FontAwesomeIcon icon={faGithub} className="pr-2"/>
          Log in with Github
        </button>
      </div>
      <div className="rounded-full col-span-3">
        demo video went here
      </div>
    </div>
  );
}
