import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, CardBody } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux';
import { fetchUser } from '../store/userSlice';
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css';


function Home(){
  
    const [show, setShow] = useState(false);

    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);

    return(
        <Container className="mt-5">
            <Row className="justify-content-center">
            <Col md={10}>
                <Card className="text-center shadow-lg">
                <Card.Body>
                    <Card.Title as="h2" className="mb-4">
                    Welcome to the Athlete Management System
                    </Card.Title>
                    <Card.Text> 
                        <Greetings />
                    </Card.Text>
                    <SearchCoach show={show} handleClose={handleClose} />
                </Card.Body>
                </Card>
            </Col>
            </Row>
            <CoachCard handleShow={handleShow} />
        </Container>
    )
}

function CoachCard({handleShow}){
    return(
        <Row className="justify-content-center">
            <Col md={10}>
                <Card className="text-center shadow-lg">
                    <Card.Body>
                        <Row className="align-items-center">
                            <Col md={8}>
                                A list of coaches
                            </Col>
                            <Col md={4}>
                                <Button variant="primary" onClick={handleShow}>
                                    Search Coach
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
}

function SearchCoach({show, handleClose} ) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        
        const result = await axios.get(`/searchcoach/${email}`);
        navigate(`/profile/${result.data._id}`);  
        handleClose();    
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Search Coach by Email</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSearch}>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control 
                            type="email" 
                            placeholder="Enter coach's email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="mt-3">
                        Search
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

function Greetings(){

    const navigate = useNavigate()
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.data);

    useEffect(() => {
        if (!user) {
          dispatch(fetchUser());
        }
      }, [user, dispatch]);

    
    if(user){
        return(<h3>Welcome, {user.name}!</h3>)
    } else{
        return(
            <>
            <Row className="justify-content-center">
                <Col md={10} className="d-flex justify-content-between">
                    <Button onClick={()=>{navigate('/login')}} variant="primary" className="mt-3 flex-grow-1 mx-2">Login</Button>
                    <Button onClick={()=>{navigate('/register')}} variant="outline-primary" className="mt-3 flex-grow-1 mx-2">Register</Button>
                </Col>
            </Row>
            </>
        )
    }
}

export default Home;

  