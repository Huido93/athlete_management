import React, { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';

function Register(){

    let navigate = useNavigate();

    let [username, setUsername] = useState('')
    let [name, setName] = useState('')
    let [email, setEmail] = useState('')
    let [password, setPassword] = useState('')
    let [passwordCheck, setPasswordCheck] = useState('')
    let [role, setRole] = useState('')

    function handleSubmit (event) {
        event.preventDefault();
        axios.post('/register', {username, name, email, password, passwordCheck, role} )
        .then(()=>{navigate('/')})
        .catch(()=>{console.log('Server Error')})
    }

    return (
        <Container className="mt-5">
            <h1>Register</h1>
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="username" className="mb-3">
                    <Form.Label>Username:</Form.Label>
                    <Form.Control onChange={(e)=> setUsername(e.target.value)} type="text" value={username} name="username" required />
                </Form.Group>
                
                <Form.Group  controlId="name" className="mb-3">
                    <Form.Label>Name:</Form.Label>
                    <Form.Control onChange={(e)=> setName(e.target.value)} type="text" value={name} name="name" required />
                </Form.Group>
                
                <Form.Group controlId="email" className="mb-3">
                    <Form.Label>Email:</Form.Label>
                    <Form.Control onChange={(e)=> setEmail(e.target.value)} type="email" value={email}  name="email" required />
                </Form.Group>
                
                <Form.Group controlId="password" className="mb-3">
                    <Form.Label>Password:</Form.Label>
                    <Form.Control onChange={(e)=> setPassword(e.target.value)} type="password" value={password} name="password" required />
                </Form.Group>
                
                <Form.Group controlId="passwordCheck" className="mb-3">
                    <Form.Label>Password Check:</Form.Label>
                    <Form.Control onChange={(e)=> setPasswordCheck(e.target.value)} type="password" value={passwordCheck} name="passwordCheck" required />
                </Form.Group>
                
                <Form.Group controlId="role" className="mb-3">
                    <Form.Label>Role:</Form.Label>
                    <Form.Control onChange={(e)=> setRole(e.target.value)} as="select"  value={role} name="role" required>
                        <option value="athlete">Athlete</option>
                        <option value="coach">Coach</option>
                    </Form.Control>
                </Form.Group>
                
                <Button variant="primary" type="submit">
                    Register
                </Button>
            </Form>
    </Container>
    )
}

export default Register;
