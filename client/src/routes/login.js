import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'
import { Container, Form, Button } from 'react-bootstrap';
import { loginUser, fetchUser } from '../store/userSlice';
import 'bootstrap/dist/css/bootstrap.min.css';

function Login() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  

  function handleSubmit (event){
    // Prevent the default form submission behavior (which would reload the page)
    event.preventDefault();
    
    dispatch(loginUser({ username, password }))
    .unwrap()
    .then(() => {
      dispatch(fetchUser()); // Fetch user data after login
      navigate('/');
    })
    .catch(() => {
      console.log('Failed to login');
    });
  }

  return (
    <Container className="mt-5">
      <h1>Login</h1>
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