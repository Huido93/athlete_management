import React, { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'
import axios from './../axios.js';
import moment from 'moment';
import useAuthCheck from '../hook/authCheck';


function NewSession() {

    useAuthCheck();

    let navigate = useNavigate();

    function getTimeOfDay(hour) {
        if (hour >= 4 && hour < 8) {
          return 'Early Morning';
        } else if (hour >= 8 && hour < 12) {
          return 'Morning';
        } else if (hour >= 12 && hour < 16) {
          return 'Afternoon';
        } else if (hour >= 16 && hour < 20) {
          return 'Evening';
        } else {
          return 'Night';
        }
      }

    let date = new Date()
    let hour = date.getHours()
    const timeOfDay = getTimeOfDay(hour);
    const defaultSessionName = `${moment().format('YYYY-MM-DD')} ${timeOfDay} Workout Session`;

    const [sessionName, setSessionName] = useState(defaultSessionName);

    const handleSubmit = (event) => {
        event.preventDefault();
        
        axios.post('/newSession', {sessionName} )
        .then(()=>{
            console.log('Form submitted with session name:', sessionName);
            navigate('/')})
        .catch(()=>{console.log('Server Error')})

    };

    return (
        <Container className="mt-5">
            <h1>Create New Workout Session</h1>
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="sessionName" className="mb-3">
                    <Form.Label>Session Name:</Form.Label>
                    <Form.Control
                        type="text"
                        className="form-control"
                        name="sessionName"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        required
                    />
                </Form.Group>
                <Button type="submit" className="btn btn-primary">Create Session</Button>
            </Form>
        </Container>
    );
}

export default NewSession;
