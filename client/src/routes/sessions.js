import React, { useState, useEffect } from 'react';
import axios from './../axios.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import useAuthCheck from '../hook/authCheck';
import { useNavigate } from 'react-router-dom'
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const WorkoutSessions = () => {

  useAuthCheck();

  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('list');

  let navigate = useNavigate();

  const fetchSessions = async () => {
    try {
        const response = await axios.get('/sessions');
        setSessions(response.data);
    } catch (error) {
        console.error('Error fetching sessions:', error);
    }
  };

  useEffect(() => {
    fetchSessions();  
  },[]);

  return (
    <>
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center">
          <h1>My Workout Sessions</h1>
          <button className="btn btn-primary" onClick={()=>{navigate('/newsession')}}>Create New Session</button>
        </div>

        <ul className="nav nav-tabs mt-3" id="viewTabs" role="tablist">
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
              id="list-tab"
              data-toggle="tab"
              href="#listView"
              role="tab"
              aria-controls="list"
              aria-selected={activeTab === 'list'}
              onClick={() => setActiveTab('list')}
            >
              List View
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
              id="calendar-tab"
              data-toggle="tab"
              href="#calendarView"
              role="tab"
              aria-controls="calendar"
              aria-selected={activeTab === 'calendar'}
              onClick={() => setActiveTab('calendar')}
            >
              Calendar View
            </a>
        </li> 
        </ul>
        <div className="tab-content mt-3">
          <div className={`tab-pane fade ${activeTab === 'list' ? 'show active' : ''}`} id="listView" role="tabpanel" aria-labelledby="list-tab">
            <ListView sessions={sessions} />
          </div>
          <div className={`tab-pane fade ${activeTab === 'calendar' ? 'show active' : ''}`} id="calendarView" role="tabpanel" aria-labelledby="calendar-tab">
            <CalendarView sessions={sessions} navigate={navigate} />
          </div>
        </div>
      </div>
    </>
  );
};

const ListView = ({sessions, fetchSessions}) => {

  let navigate = useNavigate();

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleDelete = async (sessionId) => {
    const confirmed = window.confirm('Are you sure you want to delete this session and all associated workout logs?');
    if (confirmed) {
      try {
        await axios.delete(`/delete-session/${sessionId}`);
        // Fetch sessions again to update the state
        fetchSessions();
        alert('Session and associated workout logs deleted successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

    return (
      <div>
        {sortedSessions.length > 0 ? (
          <ul className="list-group">
            {sortedSessions.map((session) => (
              <li key={session._id} className="list-group-item d-flex justify-content-between align-items-center">
                <p onClick={()=>{navigate(`/workoutlogs/${session._id}`)}} >{session.name}</p>
                <div>
                  <span style={{ marginRight: '10px' }} >{session.formattedDate}</span>
                  <button 
                    className="btn btn-danger btn-sm" 
                    style={{ backgroundColor: '#d9534f', borderColor: '#d43f3a' }} 
                    onClick={() => handleDelete(session._id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No Sessions created</p>
        )}
      </div>
    );
};

const CalendarView = ({ sessions, navigate }) => {
  const events = sessions.map(session => ({
    title: session.name,
    start: new Date(session.date),
    end: new Date(session.date), // Assuming sessions are one-day events. Adjust as necessary.
    allDay: true,
    resource: session
  }));

  const handleSelectEvent = (event) => {
    navigate(`/workoutlogs/${event.resource._id}`);
  };

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500 }}
      onSelectEvent={handleSelectEvent}
    />
  );
};

export default WorkoutSessions;


  