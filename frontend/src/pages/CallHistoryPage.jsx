import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import CallHistory from '../components/CallHistory';
import Navbar from '../components/Navbar';

const CallHistoryPage = () => {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!authUser) {
      navigate('/login');
    }
  }, [authUser, navigate]);

  if (!authUser) return null;
  
  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <CallHistory />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallHistoryPage;
