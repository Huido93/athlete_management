import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { loginUser, fetchUser } from '../store/userSlice';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from './../axios.js'

function Login() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
   

  function handleSubmit (event){
    // Prevent the default form submission behavior (which would reload the page)
    event.preventDefault();
    
    dispatch(loginUser({ username, password }))
    .unwrap()
    .then(() => {
      dispatch(fetchUser()); // Fetch user data after login
      setLoginStatus({ type: 'success', message: 'Login successful!' });
      setTimeout(() => navigate('/'), 1000); // Navigate to home after a short delay
    })
    .catch((error) => {
      let message = 'Failed to login. Please try again.';
        if (error.message) {
          message = error.message;
        }
        setLoginStatus({ type: 'danger', message });
      });
  }

  return (
    <Container className="mt-5">
      <h1>Login</h1>
      {loginStatus && (
        <Alert variant={loginStatus.type} onClose={() => setLoginStatus(null)} dismissible>
          {loginStatus.message}
        </Alert>
      )}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formUsername">
          <Form.Label>Username:</Form.Label>
          <Form.Control onChange={
            (e) => {setUsername(e.target.value)}} 
            type="text" name="username" value={username} required />
        </Form.Group>
        <Form.Group controlId="formPassword" className="mt-3">
          <Form.Label>Password:</Form.Label>
          <Form.Control onChange={
            (e) =>{setPassword(e.target.value)}
          } type="password" name="password" value={password} required />
        </Form.Group>
        <Button variant="primary" type="submit" className="mt-3"> Login </Button>
      </Form>
    </Container>
  );
}
  
export default Login;