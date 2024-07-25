import axios from './../axios';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function useAuthCheck() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get('/protected'); 
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate('/login'); // Redirect to login if not authenticated
        }
      }
    };

    checkAuth();
  }, [navigate]);
}

export default useAuthCheck;