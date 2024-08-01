import './App.css';
import { useSelector, useDispatch } from 'react-redux';
import { Route, Routes, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Container, Nav, Navbar, Button} from 'react-bootstrap';
import axios from './axios.js'
import Login from './routes/login.js'
import Home from './routes/home.js'
import Register from './routes/register.js'
import WorkoutSessions from './routes/sessions.js'
import NewSession from './routes/newSession.js'
import WorkoutLogs from './routes/workoutLogs.js'
import Profile from './routes/profile.js';
import Analytics from './routes/analytics.js';
import { logoutUser } from "./store/userSlice.js"


function App() {

  return (
      <>
        <NavigationBar />
        <Routes>
          <Route path="/" element={ <Home /> } />
          <Route path="/login" element={ <Login /> } />
          <Route path="/register" element={ <Register /> } />
          <Route path="/newsession" element={ <NewSession /> } />
          <Route path="/sessions" element={ <WorkoutSessions /> } />
          <Route path="/workoutlogs/:id" element={ <WorkoutLogs /> } />
          <Route path="/profile/:id" element={ <Profile /> } />
          <Route path="/analytics" element={ <Analytics /> } />
        </Routes>
      </>
  );
}

function NavigationBar(){

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();

async function handleLogout() {
  try {
    // await axios.post('/logout');
    dispatch(logoutUser());
    navigate('/');
  } catch (error) {
    console.error('Logout failed', error);
  }
}
  
  return(
    <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand onClick={()=>{ 
            navigate('/');
            }}
            style={{ cursor: 'pointer' }}
            >🏋️‍♂️Athlete Management</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => navigate('/sessions')}>Sessions</Nav.Link>
              <Nav.Link onClick={() => navigate('/analytics')}>Analytics</Nav.Link>
              <Nav.Link onClick={() => navigate('/programs')}>Workout Programs</Nav.Link>
            </Nav>
            <Nav className="ms-auto">   
              {user && (
                <>
                <Nav.Link onClick={() => navigate(`/profile/${user._id}`)}>My Profile</Nav.Link>
                <Button onClick={handleLogout} variant="primary">
                  Logout
                </Button>
                </>
              )}
          </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
  )
}

export default App;
