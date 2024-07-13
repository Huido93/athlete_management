import './../App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Card, Row, Col, Container, Form, Button, Accordion, Modal } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import useAuthCheck from '../hook/authCheck';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPersonChalkboard } from '@fortawesome/free-solid-svg-icons';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';


function WorkoutLogs(){

  useAuthCheck();

  let {id} = useParams();
  const [session, setSession] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [needsFetch, setNeedsFetch] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id, needsFetch]);

  const fetchData = async() =>{
    try {
      let response = await axios.get(`/workoutlogs/${id}`)
      setSession(response.data.session);
      setWorkouts(response.data.workouts);
      setNeedsFetch(false);
    } catch (error) {
      console.error('Error fetching data: ', error);
    }}

  const handleEdit = (index) => {
    setEditIndex(index)
  }

  const calculateSummary = () => {
    const summary = {};

    workouts.forEach(workout => {
      const { exercise, weight, reps } = workout;

      if (!summary[exercise]) {
        summary[exercise] = {
          sets: 0,
          totalWeight: 0,
          totalReps: 0,
          totalVolume: 0
        };
      }

      summary[exercise].sets += 1;
      summary[exercise].totalWeight += weight;
      summary[exercise].totalReps += reps;
      summary[exercise].totalVolume += weight * reps;
    });

    for (const exercise in summary) {
      summary[exercise].averageWeight = summary[exercise].totalWeight / summary[exercise].sets;
      summary[exercise].averageReps = summary[exercise].totalReps / summary[exercise].sets;
    }

    return summary;
  };

  const summary = calculateSummary();

  return(
    <>
      <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col md={9}>
          <Card className='margin-btm'>
            <Card.Header>Summary</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="d-flex justify-content-center align-items-center">
                  <DoughnutChart summary={summary} />
                </Col>
                <Col md={6}>
                  <Accordion>
                    {Object.keys(summary).map((exercise, i) => (
                      <Accordion.Item eventKey={i.toString()} key={i}>
                        <Accordion.Header>
                          <strong>{exercise}</strong> 
                          <span className="ms-3">Sets: {summary[exercise].sets}</span>
                        </Accordion.Header>
                        <Accordion.Body>
                          <p><strong>Average Weight (kg):</strong> {summary[exercise].averageWeight.toFixed(2)}</p>
                          <p><strong>Average Reps:</strong> {summary[exercise].averageReps.toFixed(2)}</p>
                          <p><strong>Total Volume:</strong> {summary[exercise].totalVolume}</p>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header className="bg-light">
               {session ? `Workout Logs for ${session.name}` : 'Loading...'}
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Exercise</th>
                    <th>Weight (kg)</th>
                    <th>Reps</th>
                    <th>Edit/Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    workouts.map((workout, i) => (
                      <WorkoutTableRow 
                      // if editIndex matches the current row index, editStatus will equal true
                      key={i} workout={workout} editStatus={editIndex === i} handleEdit={handleEdit} setNeedsFetch={setNeedsFetch} index={i} />
                    ))
                  }
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <InputForm id={id} workouts={workouts} setWorkouts={setWorkouts} setNeedsFetch={setNeedsFetch} />
        </Col>
      </Row>
      <div className="coach-icon">
        <FontAwesomeIcon icon={faPersonChalkboard} modalShow={modalShow} onClick={()=>{
          setModalShow(true);
        }} />
      </div>
      <CoachModal show={modalShow} onHide={()=>setModalShow(false)} />
    </Container>
    </>
  )
}

function DoughnutChart({summary}){

  ChartJS.register(ArcElement, Tooltip, Legend);
  
  const generateColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      colors.push(`hsl(${(i * 360) / numColors}, 70%, 50%)`);
    }
    return colors;
  };

  const exerciseNames = Object.keys(summary);
  const setsData = exerciseNames.map(exercise => summary[exercise].sets);
  const colors = generateColors(exerciseNames.length);

  const data = {
    labels: exerciseNames,
    datasets: [
      {
        data: setsData,
        backgroundColor: colors,
        hoverBackgroundColor: colors
      }
    ]
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return(
    <div style={{ width: '300px', height: '300px' }}>
      <Doughnut data={data} options={options} />
    </div>
  )

}

function InputForm({id, workouts, setWorkouts, setNeedsFetch}){

  const [newWorkout, setNewWorkout] = useState({exercise: '', weight: '', reps: ''});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWorkout({ ...newWorkout, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/workoutlogs/${id}`, newWorkout);
      setWorkouts([...workouts, response.data]);
      setNewWorkout({ exercise: '', weight: '', reps: '' });
      setNeedsFetch(true);
    } catch (error) {
      console.error('Error submitting data: ', error);
    }
  };

  return(
    <Card>
      <Card.Header className="bg-light">
          Input New workout
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group as={Row} className="mb-3" controlId="formExercise">
            <Form.Label column sm={5}>Exercise</Form.Label>
            <Col sm={7}>
              <Form.Control type="text" name="exercise" value={newWorkout.exercise} onChange={handleInputChange} required />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3" controlId="formWeight">
            <Form.Label column sm={5}>Weight (kg)</Form.Label>
            <Col sm={7}>
              <Form.Control type="number" name="weight" value={newWorkout.weight} onChange={handleInputChange} required/>
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3" controlId="formReps">
            <Form.Label column sm={5}>Reps</Form.Label>
            <Col sm={7}>
              <Form.Control type="number" name="reps" value={newWorkout.reps} onChange={handleInputChange} required />
            </Col>
          </Form.Group>
          <Button type="submit">Add Workout</Button>
        </Form>
      </Card.Body>
    </Card>
  )
}

function WorkoutTableRow({workout, index, editStatus, handleEdit, setNeedsFetch}){
  const workoutId = workout._id;
  const [editedWorkout, setEditedWorkout] = useState(workout);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedWorkout(() => ({
      ...workout, [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(`/editworkout/${workoutId}`, editedWorkout);
      if (response.status === 200) {
        console.log('Workout updated successfully:', response.data);
        handleEdit(null);
        setNeedsFetch(true);
      }
    } catch (error) {
      console.error('Error updating workout:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/deleteworkout/${workoutId}`)
      if (response.status === 200) {
        console.log('Workout deleted successfully:', response.data);
        setNeedsFetch(true);
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  }

  return(
    <tr>
      <td> {index + 1} </td>
      <td> 
        {editStatus ? (
          <Form.Control type="text" name="exercise" value={editedWorkout.exercise} onChange={handleInputChange} />
        ) : (
          workout.exercise
        )}
      </td>
      <td>
        {editStatus ? (
          <Form.Control type="number" name="weight" value={editedWorkout.weight} onChange={handleInputChange} />
        ) : (
          workout.weight
        )}
      </td>
      <td>
        {editStatus ? (
          <Form.Control type="number" name="reps" value={editedWorkout.reps} onChange={handleInputChange} />
        ) : (
          workout.reps
        )}
      </td>
      <td className="text-center">
        {
          !editStatus ? (
            <>
              <FontAwesomeIcon icon={faEdit} className="me-3" style={{ cursor: 'pointer' }} onClick={()=>{handleEdit(index);}} />
              <FontAwesomeIcon icon={faTrash} style={{ cursor: 'pointer' }} onClick={()=>{handleDelete();}} />
            </> 
            ): <Button type='submit' onClick={()=>{handleSave();}}> Save </Button>
        }
      </td>
    </tr>
  ) 
}

function CoachModal (props) {

  const [programs,setPrograms] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        let response = await axios.get('/programs');
        setPrograms(response.data.programs)
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    }

    fetchData();

  },[])

  console.log(programs)
   
  return(
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Workout Program
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {
        programs ? (
          <>
            {programs.map((program, index) => (
              <>
                <h5> By Coach {program.coach_id} </h5>
                <p key={index}>{program.content}</p>
              </>
            ))}
          </>
        ) : (
          <p>Loading...</p> // Display a loading message while fetching data
        )
        }
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}
  

export default WorkoutLogs