import React, { useEffect, useState, useRef, useCallback } from 'react';
import './home.css';
import { Home, LayoutDashboard, User, LifeBuoy, Users, Gamepad, Lock, Handshake, Info, ClipboardList, Gift, X, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import LeaderPage from './leader.jsx';
import ProfilePage from './ProfilePage.jsx';
import SupportPage from './SupportPage.jsx';
import ReferEarnPage from './refer.jsx';
import Footer from './Footer.jsx'; // adjust the path if needed
import DashboardPage from './Dashboard.jsx';
import Leaderboard from './Leaderboard.jsx';
import Login from './Login.jsx';
import OfferTracker from '../utils/OfferTracker';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

// Recent Activity Section Component
const RecentActivitySection = ({ handleProtectedClick }) => {
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/received-postbacks`);
      if (response.ok) {
        const data = await response.json();
        setRecentActivities(data.slice(0, 6)); // Show only 6 recent activities
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const ActivityCard = ({ activity }) => {
    const userName = activity.userData?.userName || activity.user_name || 'Anonymous';
    const platform = activity.userData?.platform || activity.platform || 'Platform';
    const points = activity.userData?.points || activity.points || 0;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff&size=50`;

    return (
      <div className="activity-card-display">
        <img src={avatar} alt={userName} className="activity-avatar" />
        <div className="activity-info">
          <h4>{userName}</h4>
          <p>{platform}</p>
          <span className="activity-points">+{points} pts</span>
        </div>
      </div>
    );
  };

  if (loading || recentActivities.length === 0) return null;

  return (
    <section className="recent-activity-section game-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="section-title-with-icon">🎯 Recent Activity</h2>
        <button className="view-all-button" onClick={() => handleProtectedClick(() => window.location.hash = '#dashboard')}>
          View All
        </button>
      </div>
      <div className="activity-carousel">
        {recentActivities.map((activity, index) => (
          <ActivityCard key={activity._id || index} activity={activity} />
        ))}
      </div>
    </section>
  );
};

// Game/Offer click handler for tracking with new OfferTracker system
const handleGameClick = async (game) => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('gamepro_token'); // Fixed: use gamepro_token
    if (!token) {
      console.log('User not authenticated, skipping offer tracking');
      return;
    }

    // Determine if this is an offer or game
    const isOffer = game.type === 'offers' || game.type === 'surveys' || game.type === 'watch-videos';
    
    if (isOffer) {
      // Use new OfferTracker for offers and surveys
      const offerName = game.title || game.name || 'Unknown Offer';
      const offerUrl = game.link || game.url || `${window.location.origin}/go/${game.id}`;
      const offerPartner = game.partner || game.provider || 'Gaming Platform';
      const rewardAmount = parseFloat(game.reward || game.value || game.displayValue || 10);

      console.log('🎯 Tracking offer/survey click:', offerName);
      
      // Check if this is specifically a survey
      if (game.type === 'surveys') {
        // Use survey-specific tracking
        const logId = await OfferTracker.trackSurveyClickAndComplete(
          game.id, 
          offerName, 
          offerUrl, 
          rewardAmount
        );
        
        if (logId) {
          console.log('✅ Survey click tracked with ID:', logId);
        }
      } else {
        // Use regular offer tracking
        const logId = await OfferTracker.trackOfferClick(offerName, offerUrl, offerPartner, rewardAmount);
        
        if (logId) {
          console.log('✅ Offer click tracked with ID:', logId);
          
          // Simulate completion after 5 seconds (when user would complete the offer)
          setTimeout(async () => {
            await OfferTracker.completeOffer(offerName, offerPartner, rewardAmount, logId);
          }, 5000);
        }
      }
    } else {
      // Keep old tracking for games (non-offers)
      const userId = window.localStorage.getItem('gamepro_user_id') || 'anonymous_' + Date.now();

      const payload = {
        gameId: game.id ?? game._id ?? String(game.title),
        gameTitle: game.title ?? game.name ?? null,
        userId,
        page: window.location.pathname,
        extra: {
          type: game.type ?? null,
          value: game.value ?? game.displayValue ?? null
        },
        timestamp: new Date().toISOString(),
      };

      console.log('🎮 Tracking game click:', payload.gameTitle);
      
      fetch(`${API_ENDPOINTS.API_BASE_URL}/api/track-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      .then(response => {
        console.log('Game tracking response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log("✅ Game tracked successfully:", payload.gameTitle, data);
      })
      .catch(err => console.warn("❌ Game tracking failed:", err));
    }

  } catch (err) {
    console.error("❌ Click tracking failed (outer):", err);
  }
};



const truncate = (str) => {
  if (!str) return '';
  const words = str.split(' ');
  const half = Math.ceil(words.length / 2);
  return words.slice(0, half).join(' ');
};

const showContactMessage = () => {
  const messageBox = document.createElement('div');
  messageBox.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
  messageBox.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative text-center">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome!</h2>
      <p class="text-gray-700 dark:text-gray-300 mb-6">Our team will contact you soon.</p>
      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300" onclick="this.parentNode.parentNode.remove()">OK</button>
    </div>
  `;
  document.body.appendChild(messageBox);
};


function ProfileDetailModal({ onClose, userName, userBalance, userAvatar, onAddBalance, onWithdrawBalance }) {
  const canWithdraw = userBalance >= 10;

  const handleAddClick = () => {
    console.log("Add button clicked. Implement actual add money logic here.");
    onClose();
  };

  const handleWithdrawClick = () => {
    if (canWithdraw) {
      onWithdrawBalance(10);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          User Profile
        </h2>
        <div className="flex flex-col items-center space-y-4">
          <div className="user-avatar">
            <img src={userAvatar} alt="User Avatar" width={80} height={80} className="rounded-full" />
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-white">{userName}</span>
          <div className="flex items-center space-x-2 text-lg text-gray-700 dark:text-gray-300">
            <Wallet size={20} />
            <span>Balance: ${userBalance.toFixed(2)}</span>
          </div>
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleAddClick}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md text-base hover:bg-green-600 transition-colors"
            >
              <TrendingUp size={20} className="mr-2" /> Add
            </button>
            <button
              onClick={handleWithdrawClick}
              disabled={!canWithdraw}
              className={`flex items-center px-4 py-2 rounded-md text-base transition-colors ${
                canWithdraw ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <TrendingDown size={20} className="mr-2" /> Withdraw
            </button>
          </div>
          {!canWithdraw && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              You need at least $10 to withdraw.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const renderStars = (rating) => {
  if (rating === null) return null;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(<span key={`full-${i}`} className="star-icon full-star">★</span>);
  }
  if (hasHalfStar) {
    stars.push(<span key="half" className="star-icon half-star">★</span>);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<span key={`empty-${i}`} className="star-icon empty-star">★</span>);
  }
  return <div className="task-card-stars">{stars}</div>;
};

const gradient1 = 'linear-gradient(to bottom right, #d400ffff, #00C0FF)';
const gradient2 = 'linear-gradient(to bottom right, #00BFFF, #32CD32, #FFD700)';

const offerPartners = [
  { id: 'timewall', name: 'TimeWall', image: 'https://placehold.co/60x60/4CAF50/FFFFFF?text=TW', rating: 4.8, bonusPercentage: 20, backgroundImage: '/imgs.jpg' },
  { id: 'torox', name: 'Torox', image: 'https://placehold.co/60x60/00BFFF/FFFFFF?text=TRX', rating: 4.5, bonusPercentage: 20, backgroundImage: '/img2.jpg' },
  { id: 'adgatemedia', name: 'AdGateMedia', image: 'https://placehold.co/60x60/8A2BE2/FFFFFF?text=AGM', rating: 4.2, bonusPercentage: 50, backgroundImage: '/img3.jpg' },
  { id: 'mmwall', name: 'MM Wall', image: 'https://placehold.co/60x60/FFD700/FFFFFF?text=MMW', rating: 4.0, bonusPercentage: 50, backgroundImage: '/imgs.jpg' },
  { id: 'mychips', name: 'MyChips', image: 'https://placehold.co/60x60/FF69B4/FFFFFF?text=MC', rating: 4.1, bonusPercentage: 50, backgroundImage: '/img2.jpg' },
  { id: 'adscendmedia', name: 'AdscendMedia', image: 'https://placehold.co/60x60/1E90FF/FFFFFF?text=ASM', rating: 4.3, bonusPercentage: 50, backgroundImage: '/img3.jpg' },
  { id: 'revu', name: 'RevU+', image: 'https://placehold.co/60x60/00FF7F/FFFFFF?text=RU', rating: 4.6, bonusPercentage: 50, backgroundImage: '/imgs.jpg' },
  { id: 'lootably', name: 'Lootably', image: 'https://placehold.co/60x60/4682B4/FFFFFF?text=LB', rating: 4.7, bonusPercentage: 50, backgroundImage: '/img2.jpg' },
  { id: 'ayetstudios', name: 'Ayet Studios', image: 'https://placehold.co/60x60/9370DB/FFFFFF?text=AS', rating: 4.4, bonusPercentage: 50, backgroundImage: '/img3.jpg' },
  { id: 'bitlabs-offer', name: 'Bitlabs', image: 'https://placehold.co/60x60/FF8C00/FFFFFF?text=BL', rating: 4.0, bonusPercentage: 50, backgroundImage: '/imgs.jpg' },
];

const gameCategories = [
  {
    title: 'Gaming Offers',
    isGrid: false,
    cardSize: 'large',
    gradient: gradient1,
    games: [
      { id: 1, type: 'GAME', title: 'Summer Break', genre: 'Role Playing', rating: '4.9', image: '/app.jpg', value: '$5.62', condition: 'Reach level 50', url: 'https://www.towerofgod.com/', fullDescription: 'A popular mobile RPG based on the webtoon. Dive into the world of the Tower and challenge its floors. Earn rewards by reaching specific levels and completing story acts.', completionSteps: ['Download & Install', 'Complete Tutorial', 'Reach Level 50'] },
      { id: 2, type: 'GAME', title: 'Ever Legion', genre: 'Role Playing', rating: '4.4', image: '/ba.jpg', value: '$3.30', condition: 'Complete Act 3', url: 'https://www.browndust2.com/', fullDescription: 'A tactical turn-based RPG with stunning anime-style graphics. Collect unique characters and build your ultimate team. This task requires completing the main story up to Act 3.', completionSteps: ['Download & Install', 'Complete Act 1', 'Complete Act 2', 'Complete Act 3'] },
      { id: 3, type: 'GAME', title: 'Colorwood Sort', genre: 'Role Playing', rating: '4.6', image: '/bes.jpeg', value: '$6.02', condition: 'Defeat Calamity', url: 'https://wutheringwaves.kurogames.com/', fullDescription: 'An open-world action RPG with a vast world to explore and challenging bosses. Master unique combat styles and uncover the mysteries of this post-apocalyptic world. Defeat the Calamity boss to earn this reward.', completionSteps: ['Download & Install', 'Reach designated area', 'Defeat Calamity Boss'] },
      { id: 4, type: 'GAME', title: 'Smash Party', genre: 'Action RPG', rating: '4.7', image: '/call.jpeg', value: '$11.59', condition: 'Unlock Inazuma', url: 'https://genshin.hoyoverse.com/', fullDescription: 'Explore the vast open world of Teyvat, solve puzzles, and engage in elemental combat. This task requires you to progress through the main story until you unlock the Inazuma region.', completionSteps: ['Download & Install', 'Complete Archon Quests', 'Unlock Inazuma Region'] },
      { id: 5, type: 'GAME', title: 'Sea Block 1010', genre: 'Turn-based RPG', rating: '4.8', image: '/civi.jpg', value: '$3.02', condition: 'Clear Forgotten Hall', url: 'https://hsr.hoyoverse.com/', fullDescription: 'Embark on an interstellar journey aboard the Astral Express in this turn-based RPG. Strategize your team and clear the challenging Forgotten Hall content to earn your reward.', completionSteps: ['Download & Install', 'Reach Equilibrium Level 2', 'Clear Forgotten Hall Stage 1'] },
      { id: 11, type: 'GAME', title: 'Multi Dice', genre: 'Battle Royale', rating: '4.2', image: '/dead.jpg', value: '$26.00', condition: 'Win 5 matches', url: 'https://pubgmobile.com/', fullDescription: 'Jump into intense battle royale action. Survive against 99 other players to be the last one standing. Win 5 classic matches to complete this task.', completionSteps: ['Download & Install', 'Complete 5 Classic Matches', 'Achieve 5 Wins'] },
      { id: 12, type: 'GAME', title: 'Vegas Keno by...', genre: 'Battle Royale', rating: '4.3', image: '/dia.jpeg', value: '$48.11', condition: 'Get 10 kills', url: 'https://ff.garena.com/', fullDescription: 'A fast-paced battle royale experience optimized for mobile. Land, loot, and eliminate opponents. Get a total of 10 kills across multiple matches to earn your reward.', completionSteps: ['Download & Install', 'Play Matches', 'Achieve 10 Kills'] },
    ]
  },
  {
    title: 'Other Offers',
    isGrid: false,
    cardSize: 'small',
    gradient: gradient2,
    games: [
        { id: 101, type: 'APP', title: 'Alibaba.com', genre: 'Shopping', rating: '4.0', image: '/epi.jpg', value: '$0.21', condition: 'Register & Browse', url: '#', fullDescription: 'Sign up for Alibaba.com and browse through 5 product categories.', completionSteps: ['Register', 'Browse 5 categories'] },
        { id: 102, type: 'APP', title: 'Catalyse Resea..', genre: 'Research', rating: '4.1', image: '/fact.jpg', value: '$0.24', condition: 'Complete 1 survey', url: '#', fullDescription: 'Complete your first survey on Catalyse Research platform.', completionSteps: ['Sign Up', 'Complete 1 survey'] },
        { id: 103, type: 'APP', title: 'Mintalise', genre: 'Health', rating: '3.8', image: '/g2.jpg', value: '$0.04', condition: 'Install & Open', url: '#', fullDescription: 'Install the Mintalise app and open it for the first time.', completionSteps: ['Install App', 'Open App'] },
        { id: 104, type: 'APP', title: 'Vegas Keno by...', genre: 'Casino', rating: '4.2', image: '/g3.jpg', value: '$48.11', condition: 'Reach Level 10', url: '#', fullDescription: 'Play Vegas Keno and reach level 10 to earn your reward.', completionSteps: ['Install App', 'Play Game', 'Reach Level 10'] },
    ]
  },
];

const initialTasks = [
  {
    id: 't_premium',
    title: 'Premium Survey',
    shortTitle: 'Premium...',
    description: 'Exclusive high-reward survey.',
    fullDescription: 'This is a premium survey offering a higher reward for your valuable insights. It may require more detailed responses. Complete it to unlock other surveys.',
    completionSteps: ['Click "Start Survey"', 'Complete all sections', 'Submit'],
    estimatedTime: 15,
    reward: 10,
    displayValue: '$0.10',
    difficulty: 'Medium',
    type: 'surveys',
    tags: ['Premium', 'High Reward'],
    isCompleted: false,
    progress: 0,
    image: '/g4.jpeg',
    displayCondition: '2 mins',
    cardSize: 'mini-survey',
    gradient: 'linear-gradient(to bottom right, #FFD700, #FFA500)',
    isPremium: true,
    isLocked: false,
    starRating: 4.5,
  },
  {
    id: 't_available_regular',
    title: 'Complete Daily Survey',
    shortTitle: 'High-paying survey',
    description: 'Share your opinions on various topics and earn coins.',
    fullDescription: 'Participate in our daily survey. It covers a range of topics from consumer habits to social trends. Your feedback helps companies improve their products and services. Ensure you answer truthfully to qualify for the reward.',
    completionSteps: ['Click "Start Survey"', 'Answer all questions', 'Submit your responses'],
    estimatedTime: 10,
    reward: 30,
    displayValue: '$0.30',
    difficulty: 'Easy',
    type: 'surveys',
    tags: ['New', 'High Reward'],
    isCompleted: false,
    progress: 0,
    image: '/g5.jpeg',
    displayCondition: '2 mins',
    cardSize: 'mini-survey',
    gradient: 'linear-gradient(to bottom right, #00FF7F, #00BFFF)',
    isPremium: false,
    isLocked: false,
    starRating: 4.0,
  },
  ...Array.from({ length: 20 }).map((_, i) => ({
    id: `t_locked_${i + 1}`,
    title: `Locked Survey ${i + 1}`,
    shortTitle: 'High-paying survey',
    description: 'Complete an available survey to unlock.',
    fullDescription: 'This survey is currently locked. Complete any available survey to gain access to this and other locked surveys.',
    completionSteps: [],
    estimatedTime: 0,
    reward: 0,
    displayValue: `$${(Math.random() * (10 - 1) + 1).toFixed(2)}`,
    difficulty: 'Locked',
    type: 'surveys',
    tags: ['Locked'],
    isCompleted: false,
    progress: 0,
    image: `/g6.jpeg`,
    displayCondition: `${Math.floor(Math.random() * (15 - 2) + 2)} mins`,
    cardSize: 'mini-survey',
    gradient: 'linear-gradient(to bottom right, #2e4d4d, #00ffcc)',
    isPremium: false,
    isLocked: true,
    starRating: null,
  })),
];

const categories = [
  { id: 'all', name: 'All Tasks' },
  { id: 'surveys', name: 'Surveys' },
  { id: 'offers', name: 'Offers' },
  { id: 'games', name: 'Games' },
  { id: 'watch-videos', name: 'Watch Videos' },
];

function LotteryDetailModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('prizes');
  const [timeLeft, setTimeLeft] = useState('');

  const calculateEndTime = () => {
    const now = new Date();
    const endDate = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000) + (45 * 60 * 60 * 1000) + (53 * 1000));
    return endDate;
  };

  const [lotteryEndDate] = useState(calculateEndTime());

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = lotteryEndDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timerInterval);
        setTimeLeft('Lottery Ended!');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [lotteryEndDate]);

  const lotteryDetails = {
    lotteryNumber: 12,
    totalPrize: '$35,000',
    numWinners: '2,500',
    tickets: 0,
    howItWorks: [
      {
        title: 'Enrollment',
        description: 'No extra steps—as long as you have tickets available they will be included in the next lottery.',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-check">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 11 2 2 4-4" />
          </svg>
        )
      },
      {
        title: 'Tickets',
        description: 'Every cent you earn = 1 lottery ticket.',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket">
            <path d="M2 9a3 3 0 0 1 0 6v-6Z" />
            <path d="M22 9a3 3 0 0 0 0 6v-6Z" />
            <path d="M13 5H6a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
            <path d="M14 5h4a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2h-4" />
          </svg>
        )
      },
      {
        title: 'Ticket Multiplier',
        description: 'Completing bonus rewards increases your multiplier for this offer and applies retroactively to previous tickets. For example, 2x = 2 tickets per $0.01 earned.',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        )
      },
      {
        title: 'Random Draws & Fair Winners',
        description: 'A winner is picked at random from all tickets. More tickets = higher chances, but everyone has a shot!',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shuffle">
            <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-9.7c.8-1.1 2-1.7 3.3-1.7H22" />
            <path d="m18 21 4-4-4-4" />
            <path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l6.1 9.7c.8 1.1 2 1.7 3.3 1.7H22" />
            <path d="m18 3 4 4-4 4" />
          </svg>
        )
      },
      {
        title: 'Prizes & Announcements',
        description: 'Winners are announced weekly via a Freecash notification and email. Prizes are awarded once the winner returns to Freecash and claims them.',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        )
      }
    ],
    prizes: [
      { rank: '1st', reward: '$10,000' },
      { rank: '2nd', reward: '$3,000' },
      { rank: '3rd', reward: '$2,000' },
      { rank: '4th - 10th', reward: '$700' },
      { rank: '11th - 100th', reward: '$100' },
      { rank: '101st - 1000th', reward: '$5' },
      { rank: '1001st - 2500th', reward: '$1' },
    ],
    previousWinners: [
      { rank: '1st', user: 'UserA', reward: '$10,000' },
      { rank: '2nd', user: 'UserB', reward: '$3,000' },
      { rank: '3rd', user: 'UserC', reward: '$2,000' },
      { rank: '4th', user: 'UserD', reward: '$700' },
    ],
  };

  return (
    <div className="lottery-modal-overlay" onClick={onClose}>
      <div className="lottery-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="lottery-modal-close-button" onClick={onClose}>&times;</button>

        <div className="lottery-header">
          <h2>Lottery #{lotteryDetails.lotteryNumber} - {timeLeft}</h2>
        </div>

        <div className="lottery-main-display">
          <div className="lottery-prize-circle">
            <span className="lottery-total-prize">{lotteryDetails.totalPrize}</span>
            <span className="lottery-winners-count">{lotteryDetails.numWinners} WINNERS</span>
          </div>
          <div className="lottery-tickets-overlay">
            <svg className="ticket-icon-large" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="#FFD700" stroke="#B8860B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v-6Z" /><path d="M22 9a3 3 0 0 0 0 6v-6Z" /><path d="M13 5H6a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><path d="M14 5h4a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2h-4" />
            </svg>
            <svg className="ticket-icon-large" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="#FFD700" stroke="#B8860B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v-6Z" /><path d="M22 9a3 3 0 0 0 0 6v-6Z" /><path d="M13 5H6a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><path d="M14 5h4a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2h-4" />
            </svg>
          </div>
        </div>
        <p className="lottery-ticket-info">{lotteryDetails.tickets} tickets</p>

        <div className="lottery-tabs">
          <button
            className={`lottery-tab-button ${activeTab === 'prizes' ? 'active' : ''}`}
            onClick={() => setActiveTab('prizes')}
          >
            Prizes
          </button>
          <button
            className={`lottery-tab-button ${activeTab === 'previousWinners' ? 'active' : ''}`}
            onClick={() => setActiveTab('previousWinners')}
          >
            Previous Winners
          </button>
        </div>

        <div className="lottery-tab-content">
          {activeTab === 'prizes' && (
            <table className="prizes-table">
              <thead>
                <tr>
                  <th>Picks</th>
                  <th>Rewards</th>
                </tr>
              </thead>
              <tbody>
                {lotteryDetails.prizes.map((prize, index) => (
                  <tr key={index}>
                    <td>{prize.rank}</td>
                    <td>{prize.reward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'previousWinners' && (
            <ul className="previous-winners-list">
              {lotteryDetails.previousWinners.map((winner, index) => (
                <li key={index}>
                  <strong>{winner.rank}:</strong> {winner.user} (Won {winner.reward})
                </li>
              ))}
              {lotteryDetails.previousWinners.length === 0 && (
                <li>No previous winners yet.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Updated ItemDetailModal Component with new design
function ItemDetailModal({ item, onClose, onViewLottery, handleProtectedClick }) {
  if (!item) return null;

  // Mock data for rewards to match the new design
  const itemRewards = [
    { 
      type: 'Complete Level 5', 
      label: 'Newr pu tegeR', 
      value: '150 Coins', 
      image: 'https://placehold.co/50x50/8A2BE2/FFFFFF?text=P1' 
    },
    { 
      type: 'Complete Level 5', 
      label: 'Sonf ora ercidatios', 
      value: '150 Coins', 
      image: 'https://placehold.co/50x50/4CAF50/FFFFFF?text=P2' 
    },
    { 
      type: 'Defeat 10 Enemies', 
      label: 'Yourplie cooine 10 Scoips', 
      value: '95 Coins', 
      image: 'https://placehold.co/50x50/C71585/FFFFFF?text=P3' 
    },
    { 
      type: 'Defeat 10 Enemies', 
      label: 'Sourplodden yourands', 
      value: '150 Coins', 
      image: 'https://placehold.co/50x50/00C0FF/FFFFFF?text=P4' 
    },
    { 
      type: 'Complete', 
      label: 'Vourpuetand inntedreds', 
      value: '150 Coins', 
      image: 'https://placehold.co/50x50/8A2BE2/FFFFFF?text=P5' 
    },
  ];

  const handleActionClick = () => {
    handleProtectedClick(() => {
      // Check for survey link field first, then fallback to url
      const surveyUrl = item.link || item.url;
      if (surveyUrl) {
        window.open(surveyUrl, '_blank');
      } else {
        console.log(`Starting task: ${item.title || item.name}`);
        // Show a message if no URL is available
        alert('Survey link not available. Please contact support.');
      }
      onClose();
    });
  };

  const renderEmptyStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className="text-green-400 text-2xl">☆</span>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-600" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-white">{item.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-3xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
       <div className="relative flex flex-col lg:flex-row rounded-2xl overflow-hidden">
        {/* Background Image with Fixed Height */}
        <div className="absolute top-0 left-0 w-full">
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-97 h-72 object-cover"
            onError={(e) => e.target.src = 'https://placehold.co/800x400/1a1a2e/16213e?text=Game+Image'} 
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/0"></div>
        </div>

        {/* Left Section */}
        <div className="relative z-10 lg:w-7/10 w-full p-6 flex flex-col justify-start mt-72">
          <h2 className="text-3xl font-bold text-white mb-4">{item.title}</h2>

          <div className="flex items-center gap-4 mb-6">
            <button 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 
                         text-white font-bold py-3 px-6 rounded-xl flex items-center gap-3 transition-all duration-300 shadow-lg"
              onClick={handleActionClick}
            >
              ▶ Play and Earn
            </button>
            <div className="bg-black/70 text-white font-bold text-lg py-2 px-4 rounded-xl border border-gray-600">
              {item.value}
            </div>
          </div>
        </div>

        {/* Right Side Content */}
        <div className="relative z-20 lg:w-3/10 w-full p-6 
                        bg-gray-900/50 backdrop-blur-md 
                        border-l border-gray-700 rounded-r-2xl">
          <h3 className="text-2xl font-bold text-white mb-6">Rewards</h3>

          <div className="space-y-4">
            {itemRewards.map((reward, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-sm rounded-xl border border-gray-600 hover:bg-black/60 transition-all duration-300"
              >
                <img 
                  src={reward.image} 
                  alt="reward icon" 
                  className="w-12 h-12 rounded-lg"
                  onError={(e) => e.target.src = 'https://placehold.co/50x50/4CAF50/FFFFFF?text=R'} 
                />
                <div className="flex-1">
                  <div className="text-white font-medium text-lg">{reward.type}</div>
                  <div className="text-gray-300 text-sm">{reward.label}</div>
                </div>
                <div className="text-yellow-400 font-bold text-lg">
                  {reward.value}
                </div>
              </div>
            ))}
          </div>
          
          {/* Description */}
          <div className="mt-8">
            <h4 className="text-xl font-bold text-white mb-4">Description</h4>
            <p className="text-gray-200 leading-relaxed">
              {item.fullDescription || item.description || 'No detailed description available.'}
            </p>
          </div>
          
          {/* Steps */}
          <div className="mt-6">
            <h4 className="text-xl font-bold text-white mb-4">Steps</h4>
            <ul className="space-y-2">
              {item.completionSteps && item.completionSteps.length > 0 ? (
                item.completionSteps.map((step, index) => (
                  <li key={index} className="text-gray-200 flex items-center gap-3">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))
              ) : (
                <li className="text-gray-200">No specific steps provided.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
            
      </div>
    </div>
  );
}

const getCategoryIcon = (categoryId) => {
  switch (categoryId) {
    case 'all':
      return (
        <svg xmlns="http://www.w3.org/24/24" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <line x1="3" x2="21" y1="9" y2="9" />
          <line x1="3" x2="21" y1="15" y2="15" />
          <line x1="9" x2="9" y1="3" y2="21" />
          <line x1="15" x2="15" y1="3" y2="21" />
        </svg>
      );
    case 'surveys':
      return <ClipboardList size={24} />;
    case 'offers':
      return (
        <svg xmlns="http://www.w3.org/24/24" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gift">
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13" />
          <path d="M19 12v9" />
          <path d="M5 12v9" />
          <path d="M10 8H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4v6Z" />
          <path d="M14 8h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-4v6Z" />
        </svg>
      );
    case 'games':
      return <img src="/icon17.png" alt="Games" style={{ width: 24, height: 24 }} />;
    case 'watch-videos':
      return (
        <svg xmlns="http://www.w3.org/24/24" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play-square">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="m10 8 6 4-6 4Z" />
        </svg>
      );
    default:
      return null;
  }
};

function TaskCard({ task, onClick, handleProtectedClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const getIconSrc = (type) => {
    switch (type) {
      case 'games':
      case 'game':
        return '/icon17.png';
      case 'app':
      case 'offers':
      case 'surveys':
        return '/icon18.png';
      case 'watch-videos':
        return '/icon18.png';
      default:
        return 'https://placehold.co/24x24/808080/FFFFFF?text=I';
    }
  };

  const handleShowClick = (e) => {
  e.stopPropagation();
  // track the task (works for games/offers too)
  handleGameClick(task);
  handleProtectedClick(() => onClick(task));
};


  const getButtonText = (type) => {
    switch (type) {
      case 'offers':
      case 'surveys':
      case 'watch-videos':
        return 'Start Offer';
      case 'games':
      case 'game':
      case 'app':
        return 'Play Game';
      default:
        return 'Play Now';
    }
  };

  return (
    <div
      className={`task-card task-card-${task.cardSize || 'medium'} ${isHovered ? 'hovered-blur' : ''} ${task.isLocked ? 'locked' : ''} ${task.isPremium ? 'premium' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--card-border-gradient': task.gradient }}
    >
      <div className="card-top-section relative">
        <img
          src={task.image}
          alt={task.title}
          className="task-icon"
          onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=I'}
        />
      </div>

      <div className="task-card-details-main">
        {task.isPremium ? (
          <>
            <h3 className="task-card-title">{task.shortTitle || task.title}</h3>
            <p className="task-card-condition">{task.displayCondition}</p>
            <div className="task-card-value-and-stars">
                <p className="task-card-value">{task.displayValue}</p>
                {renderStars(task.starRating)}
            </div>
          </>
        ) : (
          <>
            <h3
                className="task-card-title offer-title"
                title={task.title}
              >
                {task.shortTitle || task.title}
              </h3>
                      
            <div className="task-card-value-and-stars">
                <p className="task-card-value">{task.displayValue}</p>
                {renderStars(task.starRating)}
            </div>
            {!task.isLocked && <p className="task-card-condition">{task.displayCondition}</p>}
          </>
        )}
      </div>

      {isHovered && !task.isLocked && (
        <button className="show-button" onClick={handleShowClick}>
          <svg className="play-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#00ff00ff"/>
            <polygon points="10 8 16 12 10 16 10 8" fill="#FFFFFF"/>
          </svg>
          <span>{getButtonText(task.type)}</span>
        </button>
      )}

      {task.isLocked && (
        <div className="task-locked-overlay">
          <Lock size={30} />
        </div>
      )}
    </div>
  );
}

function GameCardComponent({ game, cardSize, gradient, handleShowButtonClick, handleProtectedClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const getIconSrc = (type) => {
    switch (type) {
      case 'GAME':
        return '/icon17.png';
      case 'APP':
        return '/icon18.png';
      default:
        return 'https://placehold.co/24x24/808080/FFFFFF?text=I';
    }
  };

  const getButtonText = (type) => {
    switch (type) {
      case 'offers':
      case 'surveys':
      case 'watch-videos':
        return 'Start Offer';
      case 'games':
      case 'game':
      case 'app':
        return 'Play Now';
      default:
        return 'Play Now';
    }
  };

  const handleClick = (e) => {
  if (e && e.stopPropagation) e.stopPropagation();
  // send tracking
  handleGameClick(game);
  // then do the existing protected action (open modal / navigate)
  handleProtectedClick(() => handleShowButtonClick(game, e));
};


  return (
    <div
      key={game.id}
      className={`game-card game-card-${cardSize || 'medium'} ${isHovered ? 'hovered-blur' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--card-border-gradient': gradient }}
    >
      <div className="card-top-section relative">
        <img src={game.image} alt={game.title} className="game-icon" onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=G'} />
      </div>
      {game.type === 'GAME' && (
          <div className="game-icon-badge">
            <span>GAME</span>
          </div>
        )}

      <div className="game-details-main">
       <h3 className="game-title-overlay" title={game.title}> {game.shortTitle || truncate(game.title)} </h3>
        <p className="game-value-overlay">{game.value}</p>
        <p className="game-condition-overlay">{game.condition}</p>
      </div>
      {isHovered && (
        <button className="show-button" onClick={handleClick}>
          <svg className="play-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="transparent" />
            <polygon points="10 8 16 12 10 16 10 8" fill="#FFFFFF"/>
          </svg>
          <span>{getButtonText(game.type)}</span>
        </button>
      )}
    </div>
  );
}

function SidebarCategoryCard({ category, isActive, onClick, handleProtectedClick }) {
  const handleClick = () => {
    handleProtectedClick(() => onClick(category.id));
  };

  return (
    <div
      className={`sidebar-category-card ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      <div className="card-top-section">
        {getCategoryIcon(category.id)}
      </div>
      <div className="category-details-main">
        <h3 className="category-title">{category.name}</h3>
      </div>
    </div>
  );
}

function PartnerCard({ partner, handleProtectedClick }) {
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${partner.id}-${i}`} className="star-icon full-star">★</span>);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${partner.id}-${i}`} className="star-icon empty-star">★</span>);
    }
    return <div className="partner-stars">{stars}</div>;
  };

  const handleClick = () => {
    handleProtectedClick(() => {
      console.log(`Clicked on partner: ${partner.name}`);
    });
  };

  return (
    <div
      className={`partner-card ${partner.type === 'survey-card' ? 'survey-card-special' : ''}`}
      style={{ backgroundImage: partner.backgroundImage ? `url(${partner.backgroundImage})` : (partner.gradient ? partner.gradient : 'none') }}
      onClick={handleClick}
    >
      {partner.bonusPercentage && (
        <div className="partner-bonus-badge">+{partner.bonusPercentage}%</div>
      )}
      <div className="partner-logo-container">
        <img src={partner.image} alt={partner.name} className="partner-logo" onError={(e) => e.target.src = 'https://placehold.co/60x60/808080/FFFFFF?text=P'} />
      </div>
      {partner.specialText ? (
        <p className="partner-special-text">{partner.specialText}</p>
      ) : (
        <>
          <h4 className="partner-name">{partner.name}</h4>
          {renderStars(partner.rating)}
        </>
      )}
    </div>
  );
}

function TasksListingPage({ onBack, initialCategory = 'all', handleProtectedClick }) {
  const [rewardRange, setRewardRange] = useState([0, 1000]);
  const [estimatedTime, setEstimatedTime] = useState([0, 180]);
  const [selectedTaskType, setSelectedTaskType] = useState(initialCategory);
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLotteryModal, setShowLotteryModal] = useState(false);

  const filteredAndSortedTasks = useCallback(() => {
    let filtered = [];

    const allAvailableItems = [
      ...initialTasks,
      ...gameCategories.flatMap(cat => cat.games.map(game => ({
        id: `game-${game.id}`,
        title: game.title,
        description: game.genre,
        fullDescription: game.fullDescription,
        completionSteps: game.completionSteps,
        estimatedTime: 0,
        reward: parseFloat(game.value.replace('$', '')) * 10,
        difficulty: 'Medium',
        type: game.type.toLowerCase(),
        tags: [],
        isCompleted: false,
        progress: 0,
        image: game.image,
        displayCondition: game.condition,
        url: game.url,
        genre: game.genre,
        rating: game.rating,
        cardSize: game.cardSize,
        gradient: game.gradient,
      })))
    ];

    if (selectedTaskType === 'all') {
      filtered = allAvailableItems;
    } else if (selectedTaskType === 'surveys') {
      filtered = allAvailableItems.filter(item => item.type === 'surveys');
    } else if (selectedTaskType === 'offers') {
      filtered = allAvailableItems.filter(item => item.type === 'offers');
    } else if (selectedTaskType === 'games') {
      filtered = allAvailableItems.filter(item => item.type === 'games' || item.type === 'game' || item.type === 'app');
    } else if (selectedTaskType === 'watch-videos') {
      filtered = allAvailableItems.filter(item => item.type === 'watch-videos');
    }

    filtered = filtered.filter(task => task.reward >= rewardRange[0] && task.reward <= rewardRange[1]);
    filtered = filtered.filter(task => task.estimatedTime >= estimatedTime[0] && task.estimatedTime <= estimatedTime[1]);

    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(task => task.difficulty === selectedDifficulty);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'Newest First':
          return b.id.localeCompare(a.id);
        case 'Highest Reward':
          return b.reward - a.reward;
        case 'Shortest Time':
          return a.estimatedTime - b.estimatedTime;
        case 'Most Popular':
          return b.reward - a.reward;
        default:
          return 0;
      }
    });

    return filtered;
  }, [rewardRange, estimatedTime, selectedTaskType, selectedDifficulty, sortBy]);

  useEffect(() => {
    setSelectedTaskType(initialCategory);
  }, [initialCategory]);

  const handleCategoryButtonClick = (typeId) => {
    handleProtectedClick(() => setSelectedTaskType(typeId));
  };

  const handleRewardRangeChange = (e) => {
    handleProtectedClick(() => setRewardRange([parseInt(e.target.value), rewardRange[1]]));
  };

  const handleEstimatedTimeChange = (e) => {
    handleProtectedClick(() => setEstimatedTime([parseInt(e.target.value), estimatedTime[1]]));
  };

  const getHeaderTitle = () => {
    const selectedCategory = categories.find(cat => cat.id === selectedTaskType);
    return selectedCategory ? selectedCategory.name : 'All Available Tasks';
  };

  const groupedTasks = useCallback(() => {
    const tasksToDisplay = filteredAndSortedTasks();

    if (selectedTaskType !== 'all') {
      return { [selectedTaskType]: tasksToDisplay };
    }

    const groups = {};
    categories.filter(cat => cat.id !== 'all').forEach(cat => {
      const tasksInType = tasksToDisplay.filter(task => task.type === cat.id || (cat.id === 'games' && (task.type === 'game' || task.type === 'app')));
      if (tasksInType.length > 0) {
        groups[cat.id] = tasksInType;
      }
    });
    return groups;
  }, [selectedTaskType, filteredAndSortedTasks]);

  return (
    <div className="tasks-listing-page">
      <aside className="tasks-sidebar">
        <h3>Categories & Filters</h3>

        <div className="filter-group">
          <h4 className="filter-group-title">Categories</h4>
          <div className="category-buttons">
            {categories.map(category => (
              <SidebarCategoryCard
                key={category.id}
                category={category}
                isActive={selectedTaskType === category.id}
                onClick={handleCategoryButtonClick}
                handleProtectedClick={handleProtectedClick}
              />
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4 className="filter-group-title">Filters</h4>

          <div className="filter-group">
            <h5 className="filter-group-title">Reward Range (Coins)</h5>
            <div className="range-slider-container">
              <input
                type="range"
                min="0"
                max="1000"
                value={rewardRange[0]}
                onChange={handleRewardRangeChange}
                className="range-slider"
              />
              <div className="range-values">
                <span>{rewardRange[0]}</span>
                <span>1000</span>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <h5 className="filter-group-title">Estimated Time (min)</h5>
            <div className="range-slider-container">
              <input
                type="range"
                min="0"
                max="180"
                value={estimatedTime[0]}
                onChange={handleEstimatedTimeChange}
                className="range-slider"
              />
              <div className="range-values">
                <span>{estimatedTime[0]}</span>
                <span>180</span>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <h5 className="filter-group-title">Difficulty</h5>
            <select
              value={selectedDifficulty}
              onChange={(e) => handleProtectedClick(() => setSelectedDifficulty(e.target.value))}
              className="filter-select"
            >
              <option value="All">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        <button className="back-button" onClick={() => handleProtectedClick(onBack)}>Back to Home</button>
      </aside>

      <main className="tasks-main-content">
        <div className="sort-by-container">
          <label htmlFor="sort-by">Sort By:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => handleProtectedClick(() => setSortBy(e.target.value))}
            className="filter-select"
          >
            <option value="Newest First">Newest First</option>
            <option value="Highest Reward">Highest Reward</option>
            <option value="Shortest Time">Shortest Time</option>
            <option value="Most Popular">Most Popular</option>
          </select>
        </div>

        <h2 className="page-header">{getHeaderTitle()} ({filteredAndSortedTasks().length})</h2>
        {selectedTaskType === 'all' && (
          <p style={{ textAlign: 'center', fontSize: '1rem', color: '#bbb', marginBottom: '20px' }}>
            This section includes all types of tasks: surveys, offers, games, watch videos, and refer & earn tasks.
          </p>
        )}
        {selectedTaskType === 'surveys' && (
          <p style={{ textAlign: 'center', fontSize: '1.rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Surveys" category.
          </p>
        )}
        {selectedTaskType === 'offers' && (
          <p style={{ textAlign: 'center', fontSize: '1.rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Offers" category.
          </p>
        )}
        {selectedTaskType === 'games' && (
          <p style={{ textAlign: 'center', fontSize: '1.rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Games" category.
          </p>
        )}
        {selectedTaskType === 'watch-videos' && (
          <p style={{ textAlign: 'center', fontSize: '1rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Watch Videos" category.
          </p>
        )}

        {Object.keys(groupedTasks()).map(typeId => (
          <div key={typeId} className="task-category-section">
            <h4>{categories.find(cat => cat.id === typeId)?.name || 'Unknown Category'}</h4>
            <div className="task-cards-grid">
              {groupedTasks()[typeId].map(task => (
                <TaskCard key={task.id} task={task} onClick={setSelectedItem} handleProtectedClick={handleProtectedClick} />
              ))}
            </div>
          </div>
        ))}

        {filteredAndSortedTasks().length === 0 && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '1.2rem', color: '#bbb' }}>
              No tasks match your current filters.
            </p>
          )}
      </main>

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onViewLottery={() => setShowLotteryModal(true)} handleProtectedClick={handleProtectedClick} />}
      {showLotteryModal && <LotteryDetailModal onClose={() => setShowLotteryModal(false)} />}
        
        <Footer />
    </div>
  );
}


const CommonHeader = ({ currentPage, setCurrentPage, isLoggedIn, handleProtectedClick, toggleLoginStatus, userBalance, openProfileModal, isAdmin, user }) => {
  return (
    <header className="home-header">
      <div className="home-header-left">
        <div className="home-logo">
          <img src="/icon20.png" alt="GamePro Logo" style={{ width: '120px', height: 'auto' }} />
        </div>

        <nav className="home-nav">
          <span className={currentPage === 'home' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('home'))}>
            <Home size={20} /> Home
          </span>

          <span className={currentPage === 'profile' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('profile'))}>
            <User size={20} /> Profile
          </span>
          <span className={currentPage === 'support' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('support'))}>
            <LifeBuoy size={20} /> Support
          </span>
          <span className={currentPage === 'refer' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('refer'))}>
            <Users size={20} /> Refer&earn
          </span>
          <span className={currentPage === 'leader' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('leader'))}>
            <Users size={20} /> Leaderboard
          </span>
          {isAdmin && (
            <span className={currentPage === 'Dashboard' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('Dashboard'))}>
              <LayoutDashboard size={20} /> Dashboard
            </span>
          )}
        </nav>
      </div>

      <div className="home-header-right">
        <div className="user-balance">
          <span className="balance-amount">$ {userBalance.toFixed(2)}</span>
        </div>
        <div className="user-profile" onClick={openProfileModal}>
          <div className="user-avatar">
            <img src={isLoggedIn ? (user?.profilePicture || '/icon21.png') : '/icon21.png'} alt="User Avatar" width={24} height={24} />
          </div>
          <span className="user-name">{isLoggedIn ? (user?.username || user?.fullName || 'User') : 'Guest'}</span>
        </div>
        <button
          onClick={toggleLoginStatus}
          className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
        >
          {isLoggedIn ? 'Logout' : 'Login / Signup'}
        </button>
      </div>
    </header>
  );
};

function HomePageContent({ setCurrentPage, currentPage, handleProtectedClick }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLotteryModal, setShowLotteryModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [addedOffers, setAddedOffers] = useState([]);
  const [loadingAddedOffers, setLoadingAddedOffers] = useState(true);
  const [addedOffersError, setAddedOffersError] = useState(null);
  const [dynamicCategories, setDynamicCategories] = useState(gameCategories);
  
  // Survey states
  const [surveys, setSurveys] = useState([]);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [surveysError, setSurveysError] = useState(null);
  const [surveysBySection, setSurveysBySection] = useState({});
  
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const defaultImage = 'https://i.pinimg.com/1200x/69/4a/5d/694a5de914642d98ff790434731ed11e.jpg';
 
  const renderOfferDetails = (obj) => {
    if (!obj) return null;
    const skip = ['id', 'image', 'isBackendOffer', 'gradient'];
    return Object.entries(obj)
      .filter(([k, v]) => v !== undefined && v !== null && v !== '' && !skip.includes(k))
      .map(([k, v]) => {
        let display = v;
        if (typeof v === 'object') display = Array.isArray(v) ? v.join(', ') : JSON.stringify(v);
        if (/date|expire/i.test(k)) {
          const d = new Date(v);
          if (!isNaN(d.getTime())) display = d.toLocaleString();
        }
        const label = k === 'value' ? 'Price' : k.replace(/([A-Z])/g, ' $1');
        return (
          <p key={k}>
            <strong style={{ color: '#aaa' }}>{label}: </strong>{String(display)}
          </p>
        );
      });
  };

  // Survey Card Component
  const SurveyCard = ({ survey, onClick }) => (
    <div className="gradient-card-wrapper"
      style={{
        background: `linear-gradient(135deg, ${survey.providerColorCode || '#3498db'}, ${survey.providerColorCode || '#3498db'}dd)`,
        padding: '2px',
        borderRadius: '20px',
        display: 'inline-block'
      }}
    >
      <div className="survey-card" onClick={() => handleProtectedClick(() => onClick(survey))}>
        <div className="survey-card-top">
          <img
            src={survey.image || defaultImage}
            alt={survey.name}
            className="survey-icon"
            onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=S'}
          />
        </div>
        <div className="survey-card-bottom">
          <h3 className="survey-title">{survey.name}</h3>
          <p className="survey-condition">{survey.providerName}</p>
          <div className="survey-value-and-stars">
            <p className="survey-value">${survey.payout}</p>
            <div className="task-card-stars">
              {[1,2,3,4,5].map(i => (
                <span key={i} className="star-icon full-star">★</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Fetch surveys function
  const fetchSurveys = async () => {
    setLoadingSurveys(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/surveys/active`);
      if (!response.ok) throw new Error('Failed to fetch surveys');
      const data = await response.json();
      setSurveys(data);
      
      // Group surveys by section
      const grouped = data.reduce((acc, survey) => {
        const section = survey.section || 'Featured Surveys';
        if (!acc[section]) acc[section] = [];
        acc[section].push(survey);
        return acc;
      }, {});
      setSurveysBySection(grouped);
      setSurveysError(null);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      setSurveysError(error.message);
    } finally {
      setLoadingSurveys(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const url = `${API_ENDPOINTS.API_BASE_URL}/api/games`; // Fixed: use API_ENDPOINTS instead of hardcoded URL
    
    // Fetch surveys
    fetchSurveys();
  
    const isGameItem = (it) => Boolean(it && (it.genre || it.rating || String(it.type).toLowerCase() === 'game'));
    const getId = (it) => it?.id ?? it?.offer_id ?? it?._id ?? it?.title ?? JSON.stringify(it);
  
    
// Also update the fetchAddedOffers function in HomePageContent
const fetchAddedOffers = async () => {
  setLoadingAddedOffers(true);
  try {
    const url = `${API_ENDPOINTS.API_BASE_URL}/api/games`; // Use environment variable
    const res = await fetch(url, { 
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const data = (await res.json()) || [];
    if (cancelled) return;
    
    // ... rest of your existing code
  } catch (err) {
    if (!cancelled) setAddedOffersError(err.message);
    console.error('Failed loading added offers:', err);
  } finally {
    if (!cancelled) setLoadingAddedOffers(false);
  }
};
  
    fetchAddedOffers();
    return () => { cancelled = true; };
  }, []);

  const handleShowButtonClick = (item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (item && item.isBackendOffer) {
      setModalContent({ item });
      setShowOfferModal(true);
      return;
    }
    setSelectedItem(item);
  };

  const scrollLeft = (title) => {
    const el = document.getElementById(`carousel-${title.replace(/\s/g, '-')}`);
    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = (title) => {
    const el = document.getElementById(`carousel-${title.replace(/\s/g, '-')}`);
    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
  };

  useEffect(() => {
    const wrappers = document.querySelectorAll('.carousel-wrapper');
    wrappers.forEach(wrapper => {
      const carousel = wrapper.querySelector('.game-carousel, .offer-partners-grid, .featured-surveys-carousel');
      let timeout;

      const show = () => {
        wrapper.classList.add('show-scroll');
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          wrapper.classList.remove('show-scroll');
        }, 4000);
      };

      if (carousel) {
        carousel.addEventListener('scroll', show);
      }

      wrapper.addEventListener('mouseenter', show);
      wrapper.addEventListener('mouseleave', () => {
        clearTimeout(timeout);
        wrapper.classList.remove('show-scroll');
      });
    });
  }, [expandedSections]);
  
  const homePageSections = dynamicCategories;

  const premiumSurvey = initialTasks.find(task => task.id === 't_premium');
  const regularSurvey = initialTasks.find(task => task.id === 't_available_regular');
  const lockedSurveys = initialTasks.filter(task => task.isLocked);
  
  return (
    <div className="home-container">
      <main className="home-main-content">
        {/* Leaderboard Section - At the very top */}
        <section className="leaderboard-section game-section">
          <Leaderboard 
            showTitle={false} 
            maxUsers={10} 
            isHomePage={true} 
          />
        </section>

        {/* Recent Activity Section */}
        <RecentActivitySection handleProtectedClick={handleProtectedClick} />
        {homePageSections.map((category) => {
          const sectionId = `section-${category.title.replace(/\s/g, '-')}`;
          const isExpanded = expandedSections[category.title];
          return (
            <section key={category.title} className="game-section" id={sectionId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="section-title-with-icon">
                    {category.title}
                </h2>
                <button
                  className="view-all-button"
                  onClick={() => handleProtectedClick(() => setExpandedSections(prev => ({ ...prev, [category.title]: !prev[category.title] })))}
                >
                  {isExpanded ? 'Show Less' : 'View All'}
                </button>
              </div>
              {isExpanded ? (
                <div className={`game-cards-grid ${category.cardSize === 'small' ? 'game-cards-grid-small' : ''}`}>
                  {category.games.map(game => (
                    <div
                      key={game.id}
                      className="gradient-card-wrapper"
                      style={{
                        background: game.gradient,
                        padding: '2px',
                        borderRadius: '20px',
                        display: 'inline-block'
                      }}
                    >
                      <GameCardComponent
                        game={game}
                        cardSize={category.cardSize}
                        gradient={game.gradient || category.gradient}
                        handleShowButtonClick={handleShowButtonClick}
                        handleProtectedClick={handleProtectedClick}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="carousel-wrapper">
                  <button className="scroll-btn left" onClick={() => handleProtectedClick(() => scrollLeft(category.title))}>&lt;</button>
                  <div className="game-carousel" id={`carousel-${category.title.replace(/\s/g, '-')}`}>
                    {category.games.map(game => (
                      <div
                        key={game.id}
                        className="gradient-card-wrapper"
                        style={{
                          background: game.gradient,
                          padding: '2px',
                          borderRadius: '20px',
                          display: 'inline-block'
                        }}
                      >
                        <GameCardComponent
                          game={game}
                          cardSize={category.cardSize}
                          gradient={game.gradient || category.gradient}
                          handleShowButtonClick={handleShowButtonClick}
                          handleProtectedClick={handleProtectedClick}
                        />
                      </div>
                    ))}
                  </div>
                  <button className="scroll-btn right" onClick={() => handleProtectedClick(() => scrollRight(category.title))}>&gt;</button>
                </div>
              )}
            </section>
          );
        })}

        {/* Dynamic Survey Sections */}
        {loadingSurveys ? (
          <section className="featured-surveys-section game-section">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
              <div style={{ color: '#666', fontSize: '16px' }}>Loading surveys...</div>
            </div>
          </section>
        ) : surveysError ? (
          <section className="featured-surveys-section game-section">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
              <div style={{ color: '#e74c3c', fontSize: '16px' }}>Error loading surveys: {surveysError}</div>
            </div>
          </section>
        ) : (
          Object.entries(surveysBySection).map(([sectionName, sectionSurveys]) => (
            <section key={sectionName} className="featured-surveys-section game-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="featured-surveys-title-with-icon">
                  📋 {sectionName}
                </h2>
                <button
                  className="view-all-button"
                  onClick={() => handleProtectedClick(() => setExpandedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] })))}
                >
                  {expandedSections[sectionName] ? 'Show Less' : 'View All'}
                </button>
              </div>

              {expandedSections[sectionName] ? (
                <div className="task-cards-grid">
                  {sectionSurveys.map(survey => (
                    <SurveyCard 
                      key={survey.id} 
                      survey={survey} 
                      onClick={(survey) => {
                        handleGameClick(survey);
                        setSelectedItem(survey);
                      }} 
                    />
                  ))}
                </div>
              ) : (
                <div className="carousel-wrapper" style={{ position: 'relative' }}>
                  <button className="scroll-btn left" onClick={() => handleProtectedClick(() => scrollLeft(sectionName))}>&lt;</button>
                  <div className="featured-surveys-carousel" id={`carousel-${sectionName.replace(/\s/g, '-')}`}>
                    {sectionSurveys.slice(0, 6).map(survey => (
                      <SurveyCard 
                        key={survey.id} 
                        survey={survey} 
                        onClick={(survey) => {
                          handleGameClick(survey);
                          setSelectedItem(survey);
                        }} 
                      />
                    ))}
                  </div>
                  <button className="scroll-btn right" onClick={() => handleProtectedClick(() => scrollRight(sectionName))}>&gt;</button>
                </div>
              )}
            </section>
          ))
        )}

        {/* Offer Partners Section */}
        <section className="offer-partners-section game-section">
          <h2 className="offer-partners-title">
            Offer Partners
          </h2>
          <div className="carousel-wrapper">
            <button className="scroll-btn left" onClick={() => handleProtectedClick(() => scrollLeft('Offer Partners'))}>&lt;</button>
            <div className="offer-partners-grid" id="carousel-Offer-Partners">
              {offerPartners.map(partner => (
                <PartnerCard key={partner.id} partner={partner} handleProtectedClick={handleProtectedClick} />
              ))}
            </div>
            <button className="scroll-btn right" onClick={() => handleProtectedClick(() => scrollRight('Offer Partners'))}>&gt;</button>
          </div>
        </section>

      </main>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onViewLottery={() => setShowLotteryModal(true)}
          handleProtectedClick={handleProtectedClick}
        />
      )}

      {showLotteryModal && (
        <LotteryDetailModal onClose={() => setShowLotteryModal(false)} />
      )}

      {showOfferModal && modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setShowOfferModal(false)}>
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-600" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">{modalContent.item?.title || 'Offer Details'}</h2>
                <button onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-white transition-colors text-3xl font-bold">×</button>
              </div>
            </div>
            <div className="p-6 text-white">
              {renderOfferDetails(modalContent.item)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App Component with MongoDB Authentication
function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();

  const handleProtectedClick = (action) => {
    if (isAuthenticated()) {
      action();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('home');
  };

  const toggleLoginStatus = () => {
    if (isAuthenticated()) {
      handleLogout();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  let content;
  if (typeof currentPage === 'object' && currentPage.name === 'tasks') {
    content = <TasksListingPage onBack={handleBackToHome} initialCategory={currentPage.category} handleProtectedClick={handleProtectedClick} />;
  } else {
    switch (currentPage) {
      case 'home':
        content = <HomePageContent setCurrentPage={setCurrentPage} currentPage={currentPage} handleProtectedClick={handleProtectedClick} />;
        break;
      case 'profile':
        content = <ProfilePage onBack={handleBackToHome} />;
        break;
      case 'leader':
        content = <LeaderPage onBack={handleBackToHome} />;
        break;
      case 'Dashboard':
        // Only allow admin access to Dashboard
        if (isAdmin()) {
          content = <DashboardPage onBack={handleBackToHome} />;
        } else {
          content = (
            <div className="access-denied">
              <h2>🔒 Access Denied</h2>
              <p>You need admin privileges to access the Dashboard.</p>
              <button onClick={handleBackToHome} className="back-button">
                Back to Home
              </button>
            </div>
          );
        }
        break;
      case 'support':
        content = <SupportPage onBack={handleBackToHome} />;
        break;
      case 'refer':
        content = <ReferEarnPage onBack={handleBackToHome} />;
        break;
      default:
        content = <HomePageContent setCurrentPage={setCurrentPage} currentPage={currentPage} handleProtectedClick={handleProtectedClick} />;
    }
  }

  return (
    <>
      <CommonHeader
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isLoggedIn={isAuthenticated()}
        handleProtectedClick={handleProtectedClick}
        toggleLoginStatus={toggleLoginStatus}
        userBalance={user?.points || 0}
        openProfileModal={() => setShowProfileModal(true)}
        isAdmin={isAdmin()}
        user={user}
      />
      <div className="main-content-area">
        {content}
      </div>

      {showLoginModal && (
        <Login onClose={() => setShowLoginModal(false)} />
      )}

      {showProfileModal && isAuthenticated() && (
        <ProfileDetailModal
          onClose={() => setShowProfileModal(false)}
          userName={user?.username || 'User'}
          userAvatar={user?.profilePicture || '/icon21.png'}
          userBalance={user?.points || 0}
          user={user}
        />
      )}
    </>
  );
}

// Main App Component wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
