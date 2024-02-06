import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';
import { UserContext } from '../App';

export default function Home () {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (user === null) {
      fetch('http://localhost:3000/auth', {
        credentials: 'include'
      }).then((res) => {
        if (res.status === 200) {
          setUser({});
          navigate('/search');
        }
      });
    }

    const qs = window.location.search;
    const params = new URLSearchParams(qs);
    const code = params.get('code');
    console.log('got code', code);
    if (code) {
      fetch('http://localhost:3000/token?' + params.toString(),
        {
          credentials: 'include'
        }).then(() => {
        setUser({});
        navigate('/search');
      }).catch((e) => {
        console.log(e);
      });
    }
  }, []);

  function Login () {
    fetch('http://localhost:3000/login').then((res) => {
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
    <div class="splash-container">
      <h1>Github Actions Dashboard</h1>
      <p class="description">Github Actions Dashboard is a visualization tool to help you identify what jobs are breaking in your workflow.</p>
      <button class="github-signin-btn" onClick={Login} >
        <FontAwesomeIcon style={{ marginRight: '1em' }} icon={faGithub}/>
        Log in with Github
      </button>
    </div>
  );
}
