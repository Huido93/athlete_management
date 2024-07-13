import './../App.css';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Form, Modal } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import useAuthCheck from '../hook/authCheck';
import axios from 'axios'
// import { fetchUser, loginUser, logoutUser } from './store/userSlice';


function Profile () {

  useAuthCheck();

    const user = useSelector((state) => state.user.data);

    let { id } = useParams();
    const [profileInfo, setProfileInfo] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [connection, setConnection] = useState(false);
  
    const handleShow = () => setShowModal(true);
    const handleClose = () => setShowModal(false);

    // Fetch user info based on the id parameter
    useEffect(() => {
      const fetchProfile = async () => {
        try {
          let response = await axios.get(`/profileinfo/${id}`);
          setProfileInfo(response.data);
        } catch (error) {
          console.error('Error fetching profile info:', error);
        }
      };

      const fetchConnection = async () => {
        try {
          let response = await axios.get(`/fetchconnection/${user._id}`);
          if (response.status === 200) {
            setConnection(response.data.status)
          } else {
            console.log('Connection not found');
            return null;
          }
        } catch (error) {
          console.error('Error fetching connection:', error);
          return null;
        }
      };

      fetchProfile();
      fetchConnection();
    }, [id]);

    const checkRole = async (idArray) => {
      try {
        let response = await axios.post('/checkrole', {idArray})
        let roles = {};
        let roleCount = { athlete: 0, coach: 0 }
        for (const [key, value] of Object.entries(response.data)){
          roles[value] = key;
          if (value === 'athlete'){
            roleCount.athlete += 1
          } else{ roleCount.coach += 1}
        }
        if(roleCount.athlete == 1 && roleCount.coach == 1){
          return roles;
        } else{return false}
      } catch (error) {
        console.error('Error checking role:', error);
      }
    }

    const handleConnect = async() => {
      let idArray = [user._id, profileInfo._id]
      // Checks role of user and profile. 
      // If they are athlete and coach, it returns an object with {role: id}. if not, returns false
      let roles = await checkRole(idArray)
      if(roles ==  false){
        console.log('Connection must be made between coach and athlete')
      }else{
        try {
          await axios.post('/makeconnection',{roles})
        } catch (error) {
          console.error('Error inserting connection', error)
        }
      }
    }

    if (!profileInfo) {
      return <div>Loading...</div>; // You can replace this with a loading spinner if desired
    }

    let connectionInfo;

    if (!user || !profileInfo) {
      connectionInfo = <p>Loading...</p>;
    } else if (user._id === profileInfo._id) {
      connectionInfo = <Button variant="primary">Edit information</Button>;
    } else if (connection === 'pending') {
      connectionInfo = (
        <>
          <h6>Connection Request Sent</h6>
          <p>The system is waiting for confirmation from the coach(athlete)</p>
        </>
      );
    } else {
      connectionInfo = <Button variant="dark" className="me-2" onClick={handleConnect}>Connect</Button>;
    }

    return(
      <Container className="mt-5">
        <Card className="mb-4">
          <Card.Img variant="top" src="https://via.placeholder.com/800x200" alt="Cover Image" />
          <Card.Body className="text-center">
            <div className="profile-img">
              <img
                src="https://via.placeholder.com/150"
                alt="Profile"
                className="rounded-circle"
                style={{ width: '150px', height: '150px', marginTop: '-75px', border: '5px solid white' }}
              />
            </div>
            { profileInfo &&
              <>
                <Card.Title>{profileInfo.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{profileInfo.email}</Card.Subtitle>
                <Card.Text>{profileInfo.role}</Card.Text>
              </>
            }
            {
              <div>{connectionInfo}</div>
            }
          </Card.Body>
        </Card>
        
        
        {/* <Card>
          <Card.Body>
            <Row>
              <Col md={3}>
                <img
                  src="https://via.placeholder.com/100"
                  alt="Profile Thumbnail"
                  className="img-thumbnail"
                />
              </Col>
              <Col md={9}>
                <h5>Select profile photo</h5>
                <Button variant="link">Choose Image</Button>
                <p>JPG, GIF or PNG. Max size of 800K</p>
              </Col>
            </Row>
          </Card.Body>
        </Card> */}
      </Container>
    );
}

export default Profile