import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "axios";
import PostbackDocumentation from './PostbackDocumentation';
import PartnerManagement from './PartnerManagement';
import PostbackLogs from './PostbackLogs';
import OfferLogs from './OfferLogs';
import SurveyProvider from './SurveyProvider';
import SurveyLink from './SurveyLink';
import { API_ENDPOINTS } from '../config/api';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';





// ...rest of your code...


// Import useNavigate and useLocation
// import backgroundImage from './image_36d7c2.png'; // Removed the image import
/* global __app_id, __firebase_config, __initial_auth_token */

export default function Dashboard() {
  // All useState/useEffect hooks at the top level, only once each
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [postbackUrl, setPostbackUrl] = useState('');
  const [postbackResponse, setPostbackResponse] = useState(null);
  const [postbackLoading, setPostbackLoading] = useState(false);
  const [postbackMethod, setPostbackMethod] = useState('POST');
  const [coreFields, setCoreFields] = useState({
    userId: { enabled: true, value: userId },
    accountId: { enabled: false, value: '' },
    formId: { enabled: false, value: '' },
    submissionTime: { enabled: false, value: new Date().toISOString() },
  });
  const [customFields, setCustomFields] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  // Postback Test Automation
  const [testUrl, setTestUrl] = useState('');
  const [testInterval, setTestInterval] = useState(10);
  const [testDuration, setTestDuration] = useState(10);
  const [jobs, setJobs] = useState([]);
  const [jobCounter, setJobCounter] = useState(1);
  const [openLogs, setOpenLogs] = useState({});
  // Postback Receiver
  const [receivedPostbacks, setReceivedPostbacks] = useState([]);
  const [loadingPostbacks, setLoadingPostbacks] = useState(false);
  const [errorPostbacks, setErrorPostbacks] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [filterIp, setFilterIp] = useState('');
  const [filterTime, setFilterTime] = useState('');
  const [filterBody, setFilterBody] = useState('');
  const [filterHeaders, setFilterHeaders] = useState('');
  const [filterDate, setFilterDate] = useState('');
  // Games
  const [games, setGames] = useState([]);
  const [trackedClicks, setTrackedClicks] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  

  // --- analytics helpers ---
const totalResponses = (sessions && sessions.length) || 0;

const totalConversions = (sessions || []).reduce((sum, s) => {
  return sum + (Number(s.conversions) || 0);
}, 0);

const completionRate = totalResponses ? (totalConversions / totalResponses) * 100 : 0;

const avgTimeSec = totalResponses
  ? (sessions || []).reduce((sum, s) => {
      return sum + (Number(s.timeSpent) || Number(s.time_spent) || Number(s['Time Spent (s)']) || 0);
    }, 0) / totalResponses
  : 0;
const avgTimeDisplay = `${(avgTimeSec / 60).toFixed(1)}m`;

const deviceCounts = (sessions || []).reduce((acc, s) => {
  const platform =
    (s.device && (s.device.platform || s.device.platformName)) ||
    (typeof s.device === 'string' ? s.device : '') ||
    '';

  const p = platform.toString().toLowerCase();
  if (p.includes('android') || p.includes('iphone') || p.includes('mobile')) acc.Mobile = (acc.Mobile || 0) + 1;
  else if (p.includes('ipad') || p.includes('tablet')) acc.Tablet = (acc.Tablet || 0) + 1;
  else if (p.includes('win') || p.includes('mac') || p.includes('linux') || p.includes('desktop')) acc.Desktop = (acc.Desktop || 0) + 1;
  else acc.Other = (acc.Other || 0) + 1;
  return acc;
}, {});



const countryCounts = (sessions || []).reduce((acc, s) => {
  const country = (s.geo && s.geo.country) || s.country || s['Country'] || 'Unknown';
  const key = country || 'Unknown';
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const barData = Object.entries(countryCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([country, count]) => ({ country, count }));
  const pieData = Object.entries(deviceCounts).map(([name, value]) => ({
  name,
  value,
  
}));

  

const PIE_COLORS = ['#d81b2a', '#ff7f7f', '#ffd24d', '#7ed28d', '#c0c0c0'];
// Colors for vertical bars (one color per country slice)
const BAR_COLORS = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949'];

// Extra datasets for charts
const timeSpentData = (sessions || []).map(s => ({
  session: s.sessionId,
  time: s.timeSpent || 0,
}));

const clicksData = (sessions || []).map(s => ({
  session: s.sessionId,
  clicks: s.clicks || 0,
}));

const deviceBarData = Object.entries(deviceCounts).map(([device, count]) => ({
  device,
  count,
}));




  // ----------------- Session tracking (add this) -----------------
const sessionIdRef = useRef(
  (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : `sess-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
);
const startTimeRef = useRef(new Date().toISOString());

useEffect(() => {
  // send session_start
  fetch(API_ENDPOINTS.TRACK_CLICK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "session_start",
      sessionId: sessionIdRef.current,
      startTime: startTimeRef.current,
      ua: navigator.userAgent,
    }),
  }).catch(() => {});

  // safe submit of session_end on tab close / hide
  const sendSessionEnd = () => {
    const payload = JSON.stringify({
      eventType: "session_end",
      sessionId: sessionIdRef.current,
      startTime: startTimeRef.current,
    });

    // try navigator.sendBeacon first (good for unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(API_ENDPOINTS.TRACK_CLICK, blob);
    } else {
      // fallback
      fetch(API_ENDPOINTS.TRACK_CLICK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  };

  window.addEventListener("beforeunload", sendSessionEnd);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendSessionEnd();
  });

  return () => {
    window.removeEventListener("beforeunload", sendSessionEnd);
  };
}, []);
// ----------------- end session tracking -----------------


  const [gameForm, setGameForm] = useState({ title: '', genre: '', rating: '', image: '', link: '' });
  const [gameFormError, setGameFormError] = useState('');
  const [gameFormLoading, setGameFormLoading] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [extractedEmails, setExtractedEmails] = useState([]);
  const [selectableEmails, setSelectableEmails] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  

  // Helper: replace placeholders in URL with random values
  const resolvePlaceholders = (url) => {
    // Replace {form_id}, {user_id}, {account_id}, {submission_time} with random or current values
    return url
      .replace(/\{form_id\}/g, Math.floor(Math.random() * 10000))
      .replace(/\{user_id\}/g, userId || 'user123')
      .replace(/\{account_id\}/g, coreFields.accountId.value || 'acc123')
      .replace(/\{submission_time\}/g, new Date().toISOString());
  };
  
  // Start a new test job
  const startTestJob = () => {
    if (!testUrl) return;
    const resolvedUrl = resolvePlaceholders(testUrl);
    const id = `Job #${jobCounter}`;
    setJobCounter(c => c + 1);
    const intervalMs = Number(testInterval) * 1000;
    const durationMs = Number(testDuration) * 1000;
    const log = [];
    const stopAt = Date.now() + durationMs;
    let count = 0;
    // Function to send postback and log
    const sendPostback = async () => {
      const sendUrl = resolvePlaceholders(testUrl);
      let response, text, data, error = null;
      try {
        // response = await fetch(sendUrl, { method: 'GET' });
        console.log(`Sending postback to: ${sendUrl}`);
        response = await fetch(`${API_ENDPOINTS.PROXY_POSTBACK}?target=${encodeURIComponent(sendUrl)}`, { method: 'GET' });
        text = await response.text();

        try { data = JSON.parse(text); } catch { data = text; }
      } catch (err) { error = err.message; }
      log.push({
        timestamp: new Date().toLocaleTimeString(),
        url: sendUrl,
        response: data,
        error,
      });
      setJobs(jobs => jobs.map(j => j.id === id ? { ...j, log: [...log] } : j));
    };
    // Start interval
    const timerId = setInterval(() => {
      if (Date.now() >= stopAt) {
        clearInterval(timerId);
        setJobs(jobs => jobs.map(j => j.id === id ? { ...j, status: 'stopped' } : j));
        return;
      }
      sendPostback();
      count++;
    }, intervalMs);
    // Initial send
    sendPostback();
    setJobs(jobs => [
      ...jobs,
      {
        id,
        url: resolvedUrl,
        interval: testInterval,
        duration: testDuration,
        status: 'running',
        log: [],
        timerId,
        stopAt,
      },
    ]);
  };
  // Stop a job
  const stopJob = (id) => {
    setJobs(jobs => jobs.map(j => {
      if (j.id === id && j.status === 'running') {
        clearInterval(j.timerId);
        return { ...j, status: 'stopped' };
      }
      return j;
    }));
  };
  // Remove a job
  const removeJob = (id) => {
    setJobs(jobs => jobs.filter(j => j.id !== id));
  };
  // Toggle log visibility
  const toggleLog = (id) => {
    setOpenLogs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Add at the top level with other hooks
  const toggleRow = (idx) => {
    setExpandedRows(rows => rows.includes(idx) ? rows.filter(i => i !== idx) : [...rows, idx]);
  };
  // Postback filters
  // Compute filtered postbacks
  const filteredPostbacks = receivedPostbacks.filter(pb => {
    // IP filter
    const ipMatch = filterIp ? (pb.ip || '').toLowerCase().includes(filterIp.toLowerCase()) : true;
    // Time filter (partial match)
    const timeMatch = filterTime ? (pb.receivedAt || '').toLowerCase().includes(filterTime.toLowerCase()) : true;
    // Date filter (exact date match)
    const dateMatch = filterDate ? (pb.receivedAt || '').slice(0, 10) === filterDate : true;
    // Body filter (stringify and search)
    const bodyMatch = filterBody ? JSON.stringify(pb.body).toLowerCase().includes(filterBody.toLowerCase()) : true;
    // Headers filter (stringify and search)
    const headersMatch = filterHeaders ? JSON.stringify(pb.headers).toLowerCase().includes(filterHeaders.toLowerCase()) : true;
    return ipMatch && timeMatch && dateMatch && bodyMatch && headersMatch;
  });

  const fetchPostbacks = async () => {
    setLoadingPostbacks(true);
    setErrorPostbacks(null);
    try {
      const res = await fetch(API_ENDPOINTS.RECEIVED_POSTBACKS);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('📥 Postbacks API response:', data);
      
      // Extract postbacks array from response
      if (data.success && Array.isArray(data.postbacks)) {
        setReceivedPostbacks(data.postbacks);
      } else {
        // Fallback for different response formats
        setReceivedPostbacks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching postbacks:', err);
      setErrorPostbacks(`Failed to fetch postbacks: ${err.message}`);
    }
    setLoadingPostbacks(false);
  };

  useEffect(() => {
    if (currentView === 'postback-receiver') {
      fetchPostbacks();
    }
    // eslint-disable-next-line
  }, [currentView]);

  useEffect(() => {
    // Initialize Firebase
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    const firebaseAuth = getAuth(app);
    const firestoreDb = getFirestore(app);

    setAuth(firebaseAuth);

    // Sign in and listen for auth state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const docRef = doc(firestoreDb, `artifacts/${appId}/users/${user.uid}/user_data`, 'profile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log('No user data found! Creating default data.');
          // Create default user data if none exists
          const defaultData = {
            coins: 0,
            balance: 0,
            totalEarnings: 0,
            pendingRewards: 0,
            completedTasks: 0,
            weeklyGoal: 10,
            level: 1,
          };
          await setDoc(docRef, defaultData);
          setUserData(defaultData);
        }
        setLoading(false);
      } else {
        // Sign in anonymously if no user is logged in
        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch games from backend
  const fetchGames = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GAMES);
      const data = await res.json();
      setGames(data);
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  if (loading || !userData) {
    return <div className="loading">Loading Dashboard...</div>;
  }

  const {
    coins,
    balance,
    totalEarnings,
    pendingRewards,
    completedTasks,
    weeklyGoal,
    level,
  } = userData;

  const progress = Math.min((completedTasks / weeklyGoal) * 100, 100);

  // Function to handle sidebar navigation clicks
  const handleNavigationClick = (view) => {
    if (view === 'logout') {
      // Handle logout logic
      if (auth) {
        signOut(auth).then(() => {
          setUserData(null);
          setUserId(null);
          setLoading(true);
          console.log('User logged out');
          navigate('/'); // Navigate to landing page after logout
        }).catch((error) => {
          console.error("Error signing out: ", error);
        });
      }
    } else if (view === 'support') {
      navigate('/SupportPage'); // Navigate to the SupportPage route
    } else if (view === 'task') {
      navigate('/task'); 
    
    } else if (view === 'profile') {
      navigate('/profile');  // Navigate to the Profile page (assuming settings is profile)
    } else if (view === 'condition') {
      navigate('/condition'); 
    } else if (view === 'postback-sender') {
      setCurrentView('postback-sender');
    } else if (view === 'postback-receiver') {
      setCurrentView('postback-receiver');
    } else if (view === 'postback-tester') {
      setCurrentView('postback-tester');
    } else if (view === 'responses') {
      setCurrentView('responses');
    }
    else {
      setCurrentView(view); // For internal dashboard views
    }
  };

  // Update core field value
  const handleCoreFieldChange = (field, prop, val) => {
    setCoreFields(prev => ({
      ...prev,
      [field]: { ...prev[field], [prop]: val }
    }));
  };
  // Add/remove/update custom fields
  const addCustomField = () => {
    setCustomFields(prev => [...prev, { key: '', value: '', enabled: true }]);
  };
  const updateCustomField = (idx, prop, val) => {
    setCustomFields(prev => prev.map((f, i) => i === idx ? { ...f, [prop]: val } : f));
  };
  const removeCustomField = (idx) => {
    setCustomFields(prev => prev.filter((_, i) => i !== idx));
  };
  // Build query params from enabled fields
  const buildQueryParams = () => {
    const params = [];
    Object.entries(coreFields).forEach(([k, v]) => {
      if (v.enabled && v.value) params.push(`${encodeURIComponent(k)}=${encodeURIComponent(v.value)}`);
    });
    customFields.forEach(f => {
      if (f.enabled && f.key) params.push(`${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`);
    });
    return params.length ? `?${params.join('&')}` : '';
  };
  // Build preview URL
  const previewUrl = postbackUrl ? postbackUrl + buildQueryParams() : '';
  // Build POST payload (same as query params, as object)
  const postPayload = {};
  Object.entries(coreFields).forEach(([k, v]) => {
    if (v.enabled && v.value) postPayload[k] = v.value;
  });
  customFields.forEach(f => {
    if (f.enabled && f.key) postPayload[f.key] = f.value;
  });



  const handlePostbackSend = async (e) => {
    e.preventDefault();
    setPostbackLoading(true);
    setPostbackResponse(null);
    console.log('Postback URL:', postbackUrl);
    console.log('Preview URL:', previewUrl);
    
    try {
      let response, result;
      
      if (postbackMethod === 'GET') {
        // Use the legacy proxy endpoint for GET requests (backward compatibility)
        const proxyUrl = `${API_ENDPOINTS.PROXY_POSTBACK}?target=${encodeURIComponent(previewUrl)}`;
        console.log('Sending GET request to proxy:', proxyUrl);
        
        response = await fetch(`${API_ENDPOINTS.PROXY_POSTBACK}?target=${encodeURIComponent(previewUrl)}`, { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          result = text;
        }
        
        setPostbackResponse({
          status: response.status,
          data: result,
          headers: Object.fromEntries(response.headers.entries()),
          success: response.ok
        });
        
      } else {
        // Use the legacy proxy endpoint for POST requests
        console.log('Sending POST request to:', postbackUrl);
        console.log('Payload:', postPayload);
        
        response = await fetch(API_ENDPOINTS.PROXY_POSTBACK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: postbackUrl,
            data: postPayload
          })
        });
        
        result = await response.json();
        
        setPostbackResponse({
          status: result.status_code || response.status,
          status_text: result.status_text || response.statusText,
          data: result.response_text || result,
          headers: result.headers || Object.fromEntries(response.headers.entries()),
          success: response.ok
        });
      }
      
    } catch (err) {
      console.error('Error sending postback:', err);
      setPostbackResponse({ 
        error: 'Failed to send postback',
        details: err.message,
        success: false
      });
    } finally {
      setPostbackLoading(false);
    }
  };



  // Function to send postback
  // const handlePostbackSend = async (e) => {
  //   e.preventDefault();
  //   setPostbackLoading(true);
  //   setPostbackResponse(null);
  //   console.log(`Sending postback to: ${previewUrl}`);
  //   console.log(`postbackurl: ${postbackUrl}`);
  //   try {
  //     let response, text, data;
  //     if (postbackMethod === 'GET') {
  //       response = await fetch(`/proxy-postback?target=${encodeURIComponent(previewUrl)}`, { method: 'GET' });
  //       // response = await fetch(previewUrl, { method: 'GET' });
  //       text = await response.text();
  //     } else {
  //       response = await fetch('/proxy-postback', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           target: postbackUrl,
  //           payload: postPayload
  //         }
  //         ),
  //       });
  //       text = await response.text();
  //       console.log("status",response.status);
  //       console.log("body",text);
  //     }
  //     try {
  //       data = JSON.parse(text);
  //     } catch {
  //       data = text;
  //     }
  //     setPostbackResponse({ status: response.status, data });
  //   } catch (err) {
  //     setPostbackResponse({ error: err.message });
  //   }
  //   setPostbackLoading(false);
  // };

  // Add at the top level with other hooks
  // Add game
  const handleGameFormChange = (e) => {
    setGameForm({ ...gameForm, [e.target.name]: e.target.value });
  };
  const handleGameFormSubmit = async (e) => {
    e.preventDefault();
    setGameFormError('');
    setGameFormLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.GAMES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameForm),
      });
      if (!res.ok) {
        const err = await res.json();
        setGameFormError(err.error || 'Failed to add game');
      } else {
        setGameForm({ title: '', genre: '', rating: '', image: '', link: '' });
        fetchGames();
      }
    } catch (err) {
      setGameFormError('Failed to add game');
    }
    setGameFormLoading(false);
  };
  // Delete game
  const handleDeleteGame = async (id) => {
    await fetch(`${API_ENDPOINTS.GAMES}/${id}`, { method: 'DELETE' });
    fetchGames();
  };
  const fetchSessionsSummary = async () => {
  try {
    // fetch last 1000 events
    const res = await fetch(`${API_ENDPOINTS.CLICKS}?limit=1000`);
    const events = await res.json();

    // group by sessionId
    const map = new Map();
    events.forEach(ev => {
      const sid = ev.sessionId || `anon-${ev.id}`;
      if (!map.has(sid)) map.set(sid, { sessionId: sid, start: null, end: null, clicks: 0, conversions: 0, ua: ev.ua, device: ev.device, ip: ev.ip, country: ev.geo?.country || ev.geo?.countryCode || null });
      const s = map.get(sid);
      if (ev.eventType === 'session_start') {
  // prefer startTime (frontend), fall back to server timestamp
  s.start = s.start || (ev.startTime || ev.timestamp);
  s.ua = s.ua || ev.ua;
  s.device = s.device || ev.device;
  s.ip = s.ip || ev.ip;
  s.country = s.country || ev.geo?.country || ev.geo?.countryCode || null;
} else if (ev.eventType === 'click') {
  s.clicks = (s.clicks || 0) + 1;
} else if (ev.eventType === 'conversion') {
  s.conversions = (s.conversions || 0) + 1;
  s.lastConversionId = ev.conversionId || s.lastConversionId;
} else if (ev.eventType === 'session_end') {
  s.end = s.end || (ev.timestamp || ev.endTime);
  // backend sends timeSpent in seconds when eventType === "session_end"
  if (typeof ev.timeSpent === 'number') s.timeSpent = ev.timeSpent;
}

      // update lastSeen
      s.lastSeen = ev.timestamp;
    });
    // ✅ Turn Map into summarized array
const summarized = Array.from(map.values()).map(s => {
  // if no timeSpent from backend, compute it
  if (!s.timeSpent && s.start && s.end) {
    const startMs = new Date(s.start).getTime();
    const endMs = new Date(s.end).getTime();
    s.timeSpent = Math.floor((endMs - startMs) / 1000);
  }
  return s;
});

setSessions(summarized);


    // compute timeSpent for sessions without explicit session_end
   const arr = Array.from(map.values()).map(s => {
  const startMs = s.start ? new Date(s.start).getTime() : (s.lastSeen ? new Date(s.lastSeen).getTime() : null);
  const endMs = s.end ? new Date(s.end).getTime() : (s.lastSeen ? new Date(s.lastSeen).getTime() : Date.now());

  // computed seconds if we only have ms-derived values
  const computedTimeSec = startMs ? Math.max(0, Math.floor((endMs - startMs) / 1000)) : (s.timeSpent ?? 0);

  return {
    ...s,
    // prefer s.timeSpent (backend seconds) otherwise use computed seconds
    timeSpent: (typeof s.timeSpent === 'number') ? s.timeSpent : computedTimeSec,
    start: s.start,
    end: s.end,
  };
});

// newest first
arr.sort((a,b)=> (b.start || b.lastSeen || 0) - (a.start || a.lastSeen || 0));
setSessions(arr);


    // newest first
    arr.sort((a,b)=> (b.start || b.lastSeen || 0) - (a.start || a.lastSeen || 0));
    setSessions(arr);
  } catch (err) {
    console.error("Failed to fetch session summary", err);
  }
};



  // Render content based on currentView
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <>
            <div className="topbar">
              <h1>Dashboard</h1>
              <div className="actions">
                {/* Buttons were here, now they are removed */}
              </div>
            </div>
            
            <div className="stats">
              <div className="stat-box">
                <strong>Coins</strong>
                <span>{coins}</span>
              </div>
              <div className="stat-box">
                <strong>Balance</strong>
                <span>₹{balance}</span>
              </div>
              <div className="stat-box">
                <strong>Total Earnings</strong>
                <span>₹{totalEarnings}</span>
              </div>
              <div className="stat-box">
                <strong>Pending Rewards</strong>
                <span>₹{pendingRewards}</span>
              </div>
              <div className="stat-box">
                <strong>Tasks Completed</strong>
                <span>{completedTasks}</span>
              </div>
              <div className="stat-box">
                <strong>Level</strong>
                <span>{level}</span>
              </div>
            </div>

            <div className="progress-section">
              <h2>Weekly Goal Progress</h2>
              <div className="progress-bar">
                <div style={{ width: `${progress}%` }}></div>
              </div>
              <p className="milestone">{completedTasks} of {weeklyGoal} tasks completed</p>
            </div>
          </>
        );
      
      case 'withdraw':
        return (
          <div>
            <h1>Withdrawal Details</h1>
            <p>Here you can manage your withdrawals.</p>
            <div className="stats" style={{ marginTop: '2rem' }}> {/* Reusing stats class for layout */}
              <div className="stat-box">
                <strong>Total Coins</strong>
                <span>{coins}</span>
              </div>
              <div className="stat-box">
                <strong>Current Balance</strong>
                <span>₹{balance}</span>
              </div>
            </div>
            {/* Add more withdrawal options/form here */}
          </div>
        );
      case 'rewards':
        return (
          <div>
            <h1>Your Rewards</h1>
            <p>Here are the rewards you've earned:</p>
            <ul className="rewards-list">
              <li className="reward-item">
                <strong>Reward 1:</strong> 100 Bonus Coins (Completed 5 tasks)
              </li>
              <li className="reward-item">
                <strong>Reward 2:</strong> ₹50 Cash Bonus (Reached Level 2)
              </li>
              <li className="reward-item">
                <strong>Reward 3:</strong> Exclusive Game Access (Referral Bonus)
              </li>
              {/* Add more rewards dynamically based on user data if available */}
              {userData.level >= 5 && (
                <li className="reward-item">
                  <strong>Level 5 Bonus:</strong> Special Avatar Unlock
                </li>
              )}
            </ul>
            {/* Content for rewards based on user progress/achievements */}
          </div>
        );
      case 'postback-sender':
        return (
          <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, background: '#ffffff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: 20, borderBottom: '2px solid #3498db', paddingBottom: 10 }}>Postback Sender</h2>
            <form onSubmit={handlePostbackSend} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <label style={{ color: '#2c3e50', fontWeight: '500' }}>
                Base URL:
                <input
                  type="url"
                  value={postbackUrl}
                  onChange={e => setPostbackUrl(e.target.value)}
                  placeholder="https://example.com/postback"
                  required
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    marginTop: 6, 
                    border: '2px solid #bdc3c7',
                    borderRadius: 6,
                    fontSize: 14,
                    backgroundColor: '#f8f9fa',
                    color: '#2c3e50',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                />
              </label>
              <label style={{ marginTop: 8, color: '#2c3e50', fontWeight: '500' }}>
                Method:
                <select 
                  value={postbackMethod} 
                  onChange={e => setPostbackMethod(e.target.value)} 
                  style={{ 
                    marginLeft: 8, 
                    padding: 8,
                    border: '2px solid #bdc3c7',
                    borderRadius: 6,
                    backgroundColor: '#f8f9fa',
                    color: '#2c3e50',
                    fontSize: 14
                  }}
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>
              </label>
              <fieldset style={{ border: '2px solid #e74c3c', borderRadius: 8, padding: 16, marginTop: 16, backgroundColor: '#fdf2f2' }}>
                <legend style={{ color: '#e74c3c', fontWeight: 'bold', padding: '0 8px' }}>Core Fields</legend>
                {Object.entries(coreFields).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <input 
                      type="checkbox" 
                      checked={v.enabled} 
                      onChange={e => handleCoreFieldChange(k, 'enabled', e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <label style={{ minWidth: 90, color: '#2c3e50', fontWeight: '500' }}>{k}</label>
                    <input
                      type="text"
                      value={v.value}
                      onChange={e => handleCoreFieldChange(k, 'value', e.target.value)}
                      disabled={!v.enabled}
                      style={{ 
                        flex: 1, 
                        padding: 8,
                        border: '1px solid #bdc3c7',
                        borderRadius: 4,
                        backgroundColor: v.enabled ? '#ffffff' : '#ecf0f1',
                        color: '#2c3e50',
                        fontSize: 14
                      }}
                    />
                  </div>
                ))}
              </fieldset>
              <fieldset style={{ border: '2px solid #f39c12', borderRadius: 8, padding: 16, marginTop: 16, backgroundColor: '#fef9e7' }}>
                <legend style={{ color: '#f39c12', fontWeight: 'bold', padding: '0 8px' }}>Custom Fields</legend>
                {customFields.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <input 
                      type="checkbox" 
                      checked={f.enabled} 
                      onChange={e => updateCustomField(idx, 'enabled', e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <input
                      type="text"
                      placeholder="Key"
                      value={f.key}
                      onChange={e => updateCustomField(idx, 'key', e.target.value)}
                      style={{ 
                        width: 120, 
                        padding: 8,
                        border: '1px solid #bdc3c7',
                        borderRadius: 4,
                        backgroundColor: '#ffffff',
                        color: '#2c3e50',
                        fontSize: 14
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={f.value}
                      onChange={e => updateCustomField(idx, 'value', e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: 8,
                        border: '1px solid #bdc3c7',
                        borderRadius: 4,
                        backgroundColor: '#ffffff',
                        color: '#2c3e50',
                        fontSize: 14
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => removeCustomField(idx)} 
                      style={{ 
                        color: '#e74c3c', 
                        border: 'none', 
                        background: 'none', 
                        fontWeight: 'bold', 
                        fontSize: 20, 
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: 4,
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#fadbd8'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >×</button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addCustomField} 
                  style={{ 
                    marginTop: 8,
                    padding: '8px 16px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: 14,
                    transition: 'background-color 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#229954'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
                >+ Add Custom Field</button>
              </fieldset>
              <div style={{ marginTop: 20, background: '#e8f5e8', padding: 16, borderRadius: 8, border: '2px solid #27ae60' }}>
                <strong style={{ color: '#27ae60', fontSize: 16 }}>Preview URL:</strong>
                <div style={{ 
                  wordBreak: 'break-all', 
                  color: '#2c3e50', 
                  margin: '8px 0',
                  padding: 12,
                  backgroundColor: '#ffffff',
                  border: '1px solid #bdc3c7',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  lineHeight: 1.4,
                  minHeight: 20
                }}>{previewUrl || 'Enter a base URL to see preview'}</div>
                {postbackMethod === 'POST' && (
                  <>
                    <strong style={{ color: '#27ae60', fontSize: 16 }}>POST Payload:</strong>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-all', 
                      background: '#ffffff', 
                      padding: 12, 
                      borderRadius: 6,
                      border: '1px solid #bdc3c7',
                      color: '#2c3e50',
                      fontFamily: 'monospace',
                      fontSize: 13,
                      lineHeight: 1.4,
                      marginTop: 8,
                      overflow: 'auto'
                    }}>{JSON.stringify(postPayload, null, 2)}</pre>
                  </>
                )}
              </div>
              <button 
                type="submit" 
                disabled={postbackLoading || !postbackUrl} 
                style={{ 
                  padding: '12px 24px',
                  marginTop: 20,
                  backgroundColor: postbackLoading || !postbackUrl ? '#bdc3c7' : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: postbackLoading || !postbackUrl ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: postbackLoading || !postbackUrl ? 'none' : '0 4px 8px rgba(52, 152, 219, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (!postbackLoading && postbackUrl) {
                    e.target.style.backgroundColor = '#2980b9';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!postbackLoading && postbackUrl) {
                    e.target.style.backgroundColor = '#3498db';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {postbackLoading ? '🔄 Sending...' : '🚀 Send Postback'}
              </button>
            </form>
            {postbackResponse && (
              <div style={{ 
                marginTop: 20, 
                background: postbackResponse.success !== false ? '#e8f5e8' : '#fdf2f2', 
                padding: 16, 
                borderRadius: 8,
                border: `2px solid ${postbackResponse.success !== false ? '#27ae60' : '#e74c3c'}`
              }}>
                <strong style={{ 
                  color: postbackResponse.success !== false ? '#27ae60' : '#e74c3c', 
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {postbackResponse.success !== false ? '✅' : '❌'} Response:
                  {postbackResponse.status && (
                    <span style={{ 
                      backgroundColor: postbackResponse.status >= 200 && postbackResponse.status < 300 ? '#27ae60' : '#e74c3c',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 'normal'
                    }}>
                      {postbackResponse.status}
                    </span>
                  )}
                </strong>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-all',
                  backgroundColor: '#ffffff',
                  padding: 12,
                  borderRadius: 6,
                  border: '1px solid #bdc3c7',
                  color: '#2c3e50',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.4,
                  marginTop: 8,
                  overflow: 'auto',
                  maxHeight: 300
                }}>{JSON.stringify(postbackResponse, null, 2)}</pre>
              </div>
            )}
          </div>
        );
      case 'postback-receiver':
        return (
          <div style={{ maxWidth: 1000, margin: '2rem auto', padding: 24, background: '#ffffff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid #9b59b6', paddingBottom: 10 }}>
              <h2 style={{ color: '#2c3e50', margin: 0 }}>📨 Postback Receiver</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ 
                  backgroundColor: '#27ae60', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: 20, 
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  {filteredPostbacks.length} postbacks
                </span>
                <button 
                  onClick={fetchPostbacks} 
                  disabled={loadingPostbacks}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: loadingPostbacks ? '#bdc3c7' : '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: loadingPostbacks ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: 14,
                    transition: 'background-color 0.3s'
                  }}
                  onMouseOver={(e) => {
                    if (!loadingPostbacks) e.target.style.backgroundColor = '#2980b9';
                  }}
                  onMouseOut={(e) => {
                    if (!loadingPostbacks) e.target.style.backgroundColor = '#3498db';
                  }}
                >
                  {loadingPostbacks ? '🔄 Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>
            
            {/* Info Section */}
            <div style={{ 
              backgroundColor: '#e8f4fd', 
              border: '2px solid #3498db', 
              borderRadius: 8, 
              padding: 16, 
              marginBottom: 20 
            }}>
              <h3 style={{ color: '#2980b9', margin: '0 0 8px 0', fontSize: 16 }}>ℹ️ How to Use Postback Receiver</h3>
              <p style={{ color: '#2c3e50', margin: 0, lineHeight: 1.5 }}>
                This receiver captures all incoming postback requests. Your postback URL is: 
                <code style={{ 
                  backgroundColor: '#ffffff', 
                  padding: '2px 6px', 
                  borderRadius: 4, 
                  border: '1px solid #bdc3c7',
                  margin: '0 4px',
                  fontFamily: 'monospace'
                }}>
                  {API_ENDPOINTS.RECEIVE_POSTBACK}
                </code>
                Use the filters below to search through received postbacks.
              </p>
            </div>

            {/* Filters */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              border: '2px solid #e74c3c', 
              borderRadius: 8, 
              padding: 16, 
              marginBottom: 20 
            }}>
              <h3 style={{ color: '#e74c3c', margin: '0 0 12px 0', fontSize: 16 }}>🔍 Filters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ fontWeight: 600, color: '#2c3e50', display: 'block', marginBottom: 4 }}>Filter by IP:</label>
                  <input 
                    type="text" 
                    value={filterIp} 
                    onChange={e => setFilterIp(e.target.value)} 
                    placeholder="e.g. 127.0.0.1" 
                    style={{ 
                      padding: 8, 
                      width: '100%', 
                      borderRadius: 6, 
                      border: '2px solid #bdc3c7',
                      fontSize: 14,
                      backgroundColor: '#ffffff',
                      color: '#2c3e50'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#2c3e50', display: 'block', marginBottom: 4 }}>Filter by Date:</label>
                  <input 
                    type="date" 
                    value={filterDate} 
                    onChange={e => setFilterDate(e.target.value)} 
                    style={{ 
                      padding: 8, 
                      width: '100%', 
                      borderRadius: 6, 
                      border: '2px solid #bdc3c7',
                      fontSize: 14,
                      backgroundColor: '#ffffff',
                      color: '#2c3e50'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#2c3e50', display: 'block', marginBottom: 4 }}>Filter by Time:</label>
                  <input 
                    type="text" 
                    value={filterTime} 
                    onChange={e => setFilterTime(e.target.value)} 
                    placeholder="e.g. 12:30" 
                    style={{ 
                      padding: 8, 
                      width: '100%', 
                      borderRadius: 6, 
                      border: '2px solid #bdc3c7',
                      fontSize: 14,
                      backgroundColor: '#ffffff',
                      color: '#2c3e50'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#2c3e50', display: 'block', marginBottom: 4 }}>Filter by Body:</label>
                  <input 
                    type="text" 
                    value={filterBody} 
                    onChange={e => setFilterBody(e.target.value)} 
                    placeholder="Search body content..." 
                    style={{ 
                      padding: 8, 
                      width: '100%', 
                      borderRadius: 6, 
                      border: '2px solid #bdc3c7',
                      fontSize: 14,
                      backgroundColor: '#ffffff',
                      color: '#2c3e50'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#2c3e50', display: 'block', marginBottom: 4 }}>Filter by Headers:</label>
                  <input 
                    type="text" 
                    value={filterHeaders} 
                    onChange={e => setFilterHeaders(e.target.value)} 
                    placeholder="Search headers..." 
                    style={{ 
                      padding: 8, 
                      width: '100%', 
                      borderRadius: 6, 
                      border: '2px solid #bdc3c7',
                      fontSize: 14,
                      backgroundColor: '#ffffff',
                      color: '#2c3e50'
                    }} 
                  />
                </div>
              </div>
            </div>
            {/* Status Messages */}
            {loadingPostbacks && (
              <div style={{ 
                textAlign: 'center', 
                padding: 20, 
                backgroundColor: '#e8f4fd', 
                borderRadius: 8, 
                border: '2px solid #3498db',
                color: '#2980b9',
                fontSize: 16,
                fontWeight: '500'
              }}>
                🔄 Loading postbacks...
              </div>
            )}
            
            {errorPostbacks && (
              <div style={{ 
                textAlign: 'center', 
                padding: 20, 
                backgroundColor: '#fdf2f2', 
                borderRadius: 8, 
                border: '2px solid #e74c3c',
                color: '#c0392b',
                fontSize: 16,
                fontWeight: '500'
              }}>
                ❌ {errorPostbacks}
              </div>
            )}
            
            {filteredPostbacks.length === 0 && !loadingPostbacks && !errorPostbacks && (
              <div style={{ 
                textAlign: 'center', 
                padding: 40, 
                backgroundColor: '#fef9e7', 
                borderRadius: 8, 
                border: '2px solid #f39c12',
                color: '#d68910'
              }}>
                <h3 style={{ margin: '0 0 8px 0' }}>📭 No Postbacks Found</h3>
                <p style={{ margin: 0, fontSize: 14 }}>
                  No postbacks match your current filters. Try adjusting the filters or send a test postback.
                </p>
              </div>
            )}
            
            {filteredPostbacks.length > 0 && (
              <div style={{ 
                borderRadius: 8, 
                border: '2px solid #27ae60', 
                overflow: 'hidden',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ 
                  backgroundColor: '#27ae60', 
                  color: 'white', 
                  padding: 12, 
                  fontWeight: 'bold',
                  fontSize: 16
                }}>
                  📋 Received Postbacks ({filteredPostbacks.length})
                </div>
                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                        <th style={{ padding: 12, textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>#</th>
                        <th style={{ padding: 12, textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>Method</th>
                        <th style={{ padding: 12, textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>Received At</th>
                        <th style={{ padding: 12, textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>IP Address</th>
                        <th style={{ padding: 12, textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPostbacks.map((pb, idx) => (
                        <React.Fragment key={idx}>
                          <tr style={{ 
                            borderBottom: '1px solid #e9ecef',
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e8f5e8'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8f9fa'}
                          >
                            <td style={{ padding: 12, color: '#2c3e50', fontWeight: 'bold' }}>{idx + 1}</td>
                            <td style={{ padding: 12 }}>
                              <span style={{
                                backgroundColor: pb.method === 'GET' ? '#3498db' : pb.method === 'POST' ? '#e74c3c' : '#f39c12',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}>
                                {pb.method || 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: 12, color: '#2c3e50', fontFamily: 'monospace', fontSize: 13 }}>
                              {new Date(pb.receivedAt).toLocaleString()}
                            </td>
                            <td style={{ padding: 12, color: '#2c3e50', fontFamily: 'monospace' }}>{pb.ip || 'Unknown'}</td>
                            <td style={{ padding: 12 }}>
                              <button 
                                onClick={() => toggleRow(idx)} 
                                style={{ 
                                  padding: '6px 12px', 
                                  borderRadius: 6, 
                                  border: 'none', 
                                  background: expandedRows.includes(idx) ? '#e74c3c' : '#3498db', 
                                  color: '#fff', 
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                }}
                              >
                                {expandedRows.includes(idx) ? '👁️ Hide' : '🔍 Details'}
                              </button>
                            </td>
                          </tr>
                          {expandedRows.includes(idx) && (
                            <tr>
                              <td colSpan={5} style={{ backgroundColor: '#f8f9fa', padding: 20, borderBottom: '2px solid #e9ecef' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                  <div>
                                    <h4 style={{ color: '#e74c3c', margin: '0 0 8px 0', fontSize: 14 }}>📋 Headers:</h4>
                                    <pre style={{ 
                                      background: '#ffffff', 
                                      padding: 12, 
                                      borderRadius: 6, 
                                      border: '1px solid #bdc3c7',
                                      color: '#2c3e50',
                                      fontSize: 12,
                                      lineHeight: 1.4,
                                      overflow: 'auto',
                                      maxHeight: 200
                                    }}>{JSON.stringify(pb.headers, null, 2)}</pre>
                                  </div>
                                  <div>
                                    <h4 style={{ color: '#27ae60', margin: '0 0 8px 0', fontSize: 14 }}>📦 Body/Query:</h4>
                                    <pre style={{ 
                                      background: '#ffffff', 
                                      padding: 12, 
                                      borderRadius: 6, 
                                      border: '1px solid #bdc3c7',
                                      color: '#2c3e50',
                                      fontSize: 12,
                                      lineHeight: 1.4,
                                      overflow: 'auto',
                                      maxHeight: 200
                                    }}>{JSON.stringify(pb.body || pb.query || {}, null, 2)}</pre>
                                  </div>
                                </div>
                                {pb.url && (
                                  <div style={{ marginTop: 16 }}>
                                    <h4 style={{ color: '#9b59b6', margin: '0 0 8px 0', fontSize: 14 }}>🔗 URL:</h4>
                                    <div style={{ 
                                      background: '#ffffff', 
                                      padding: 12, 
                                      borderRadius: 6, 
                                      border: '1px solid #bdc3c7',
                                      color: '#2c3e50',
                                      fontFamily: 'monospace',
                                      fontSize: 12,
                                      wordBreak: 'break-all'
                                    }}>
                                      {pb.url}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      case 'postback-documentation':
        return <PostbackDocumentation />;
      case 'partner-management':
        return <PartnerManagement />;
      case 'postback-logs':
        return <PostbackLogs />;
      case 'offer-logs':
        return <OfferLogs />;
      case 'postback-tester':
        return (
          <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2 style={{ marginBottom: 12 }}>Postback URL Tester</h2>
            <div style={{ background: '#222', color: '#fff', padding: 18, borderRadius: 8, marginBottom: 24 }}>
              <h3 style={{ margin: 0, marginBottom: 10 }}>Start New Test</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label>
                  Postback URL:
                  <input
                    type="text"
                    value={testUrl}
                    onChange={e => setTestUrl(e.target.value)}
                    placeholder="https://example.com/webhook?form_id={form_id}"
                    style={{ width: '100%', padding: 8, marginTop: 4 }}
                  />
                </label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label>
                    Interval (seconds):
                    <input
                      type="number"
                      min={1}
                      value={testInterval}
                      onChange={e => setTestInterval(e.target.value)}
                      style={{ width: 80, marginLeft: 8 }}
                    />
                  </label>
                  <label>
                    Duration (seconds):
                    <input
                      type="number"
                      min={1}
                      value={testDuration}
                      onChange={e => setTestDuration(e.target.value)}
                      style={{ width: 80, marginLeft: 8 }}
                    />
                  </label>
                </div>
                <button type="button" onClick={startTestJob} style={{ marginTop: 8, background: '#1976d2', color: '#fff', padding: '8px 18px', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>Start Test</button>
              </div>
            </div>
            <div style={{ background: '#181818', color: '#fff', padding: 18, borderRadius: 8 }}>
              <h3 style={{ margin: 0, marginBottom: 10 }}>My Postback Jobs</h3>
              {jobs.length === 0 && <div style={{ color: '#aaa' }}>No jobs running.</div>}
              {jobs.map(job => (
                <div key={job.id} style={{ border: '1px solid #333', borderRadius: 6, marginBottom: 16, padding: 12, background: '#222' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{job.id}</strong>
                      <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>URL: <span style={{ color: '#fff' }}>{job.url}</span></div>
                      <div style={{ fontSize: 13, color: '#aaa' }}>Interval: {job.interval}s | Duration: {job.duration}s</div>
                      <div style={{ fontSize: 13, color: job.status === 'running' ? '#4caf50' : '#f44336' }}>Status: {job.status}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {job.status === 'running' && <button onClick={() => stopJob(job.id)} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>Stop</button>}
                      <button onClick={() => removeJob(job.id)} style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>Remove</button>
                      <button onClick={() => toggleLog(job.id)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>{openLogs[job.id] ? 'Hide Log' : 'Log'}</button>
                    </div>
                  </div>
                  {openLogs[job.id] && (
                    <div style={{ marginTop: 10, background: '#111', borderRadius: 4, padding: 10, maxHeight: 200, overflowY: 'auto' }}>
                      {job.log.length === 0 && <div style={{ color: '#aaa' }}>No log entries yet.</div>}
                      {job.log.map((entry, idx) => (
                        <div key={idx} style={{ borderBottom: '1px solid #222', padding: '4px 0' }}>
                          <div style={{ color: '#90caf9' }}>{entry.timestamp}</div>
                          <div style={{ color: '#fff', fontSize: 13 }}>URL: {entry.url}</div>
                          <div style={{ color: entry.error ? '#f44336' : '#4caf50', fontSize: 13 }}>Response: {entry.error ? entry.error : JSON.stringify(entry.response)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'survey-provider':
        return <SurveyProvider />;
      
      case 'survey-link':
        return <SurveyLink />;
      case 'api-access':
        return (
          <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Public API Access</h2>
            <p>
              You can fetch data from our public API endpoints. All endpoints require an API key in the <code>x-api-key</code> header. <b>API keys are not user-specific</b>—anyone can generate a random API key from the API Keys section. Each key is limited to <b>10 requests per day</b> (shared across all endpoints).
            </p>
            <div style={{ background: '#150a0aff', padding: 16, borderRadius: 6, margin: '18px 0' }}>
              <strong>Endpoints:</strong>
              <ul style={{ margin: '10px 0 0 0', padding: 0, listStyle: 'none' }}>
                <li style={{ marginBottom: 12 }}>
                  <b>GET /api/public/games</b><br />
                  <span style={{ color: '#888' }}>Returns all games.</span>
                  <pre style={{ background: '#000000', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`fetch('${API_ENDPOINTS.PUBLIC_GAMES}', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(res => res.json())
  .then(data => console.log(data));`}</pre>
                  <strong>Example Response:</strong>
                  <pre style={{ background: '#000000', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`[
  {
    "id": "1712345678901",
    "title": "Game Title",
    "genre": "Action",
    "rating": "4.5",
    "image": "https://example.com/image.jpg",
    "link": "https://example.com/game",
    "createdAt": "2024-06-01T12:00:00.000Z"
  },
  ...
]`}</pre>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <b>GET /api/public/postbacks</b><br />
                  <span style={{ color: '#888' }}>Returns all received postbacks.</span>
                  <pre style={{ background: '#000000', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`fetch('${API_ENDPOINTS.PUBLIC_POSTBACKS}', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(res => res.json())
  .then(data => console.log(data));`}</pre>
                  <strong>Example Response:</strong>
                  <pre style={{ background: '#000000', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`[
  {
    "receivedAt": "2024-06-01T12:00:00.000Z",
    "body": { ... },
    "headers": { ... },
    "ip": "127.0.0.1"
  },
  ...
]`}</pre>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <b>GET /api/public/users</b><br />
                  <span style={{ color: '#888' }}>Returns a list of user stats (placeholder data).</span>
                  <pre style={{ background: '#000000', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`fetch('${API_ENDPOINTS.PUBLIC_USERS}', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(res => res.json())
  .then(data => console.log(data));`}</pre>
                  <strong>Example Response:</strong>
                  <pre style={{ background: '#000000', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`[
  { "userId": "user1", "coins": 100, "level": 2, "completedTasks": 5 },
  { "userId": "user2", "coins": 250, "level": 4, "completedTasks": 20 },
  ...
]`}</pre>
                </li>
              </ul>
              <strong>Headers:</strong>
              <div style={{ margin: '8px 0' }}><code>x-api-key: YOUR_API_KEY</code></div>
              <strong>Rate Limit:</strong>
              <div style={{ marginBottom: 8 }}>10 requests per API key per day (shared across all endpoints)</div>
            </div>
            <div style={{ color: '#000000', fontSize: 14, marginTop: 16 }}>
              <strong>Note:</strong> If you exceed the rate limit, you will receive an error message and must wait until the next day to make more requests. All endpoints require a valid API key.
            </div>
          </div>
        );
      case 'api-keys':
        return (
          <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>API Keys</h2>
            <ApiKeysSection />
          </div>
        );
      case 'api-fetcher':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>API Fetcher (Test & Preview)</h2>
            <ApiFetcherSection />
          </div>
        );
      case 'responses':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Responses</h2>
            <ResponsesSection />
          </div>
        );
      case 'fetch-history':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>API Fetch History</h2>
            <ApiFetcherSection />
          </div>
        );
        case 'our-offer':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>our Offer</h2>
            <OurOffer />
          </div>
        );
        case 'offer-schedular':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Offer Schedular</h2>
            <OfferSchedularSection />
          </div>
        );
      case 'scheduled-offer':
        return (
          <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Scheduled Offers</h2>
            <OfferSchedularSection />
          </div>
        );
        case 'proxy-checker':
          return (
            <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
              <h2>Proxy Checker</h2>
              {/* ProxyCheckerSection component not implemented */}
              <div>Proxy Checker - Coming Soon</div>
            </div>
          );
      case 'email-config':
        return (
          <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Email Configuration</h2>
            {/* EmailConfigSection component not implemented */}
            <div>Email Config - Coming Soon</div>
          </div>
        );
      case 'domain-checker':
        return (
          <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, background: '#000000', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Domain Checker</h2>
            {/* DomainCheckerSection component not implemented */}
            <div>Domain Checker - Coming Soon</div>
          </div>
        );
      case 'bulk-scheduling':
        return (
          <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24, background: '#181c24', borderRadius: 8 }}>
            <h2>Bulk Offer Scheduling</h2>
            {/* BulkSchedulingSection component not implemented */}
            <div>Bulk Scheduling - Coming Soon</div>
          </div>
        );
        case 'campaign':
        return (
          <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24, background: '#181c24', borderRadius: 8 }}>
            <h2>campaign</h2>
            {/* CampaignManager component not implemented */}
            <div>Campaign Manager - Coming Soon</div>
          </div>
        );
      case 'image-extractor':
        return (
          <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24, background: '#181c24', borderRadius: 8 }}>
            <h2>Image Extractor</h2>
            {/* ScreenshotOfferExtractor component not implemented */}
            <div>Screenshot Offer Extractor - Coming Soon</div>
          </div>
        );
            case 'game-tracking':
             

  return (
    <div style={{ padding: 20 }}>
      <h2>Game Tracking — Sessions</h2>
      <div style={{ width: '100%', height: 300, marginBottom: 20 }}>
  
</div>
{/* --- Top countries bar chart (colored bars) --- */}
{barData && barData.length > 0 && (
  <div style={{ width: '100%', height: 300, marginTop: 12, marginBottom: 20 }}>
    
  </div>
)}
{/* --- Time Spent per Session --- */}
<div style={{ width: '100%', height: 300, marginTop: 20 }}>
  
</div>

{/* --- Clicks per Session --- */}
<div style={{ width: '100%', height: 300, marginTop: 20 }}>

</div>

{/* --- Devices Bar Chart --- */}
<div style={{ width: '100%', height: 300, marginTop: 20 }}>
 
</div>



      <div style={{ marginBottom: 12 }}>
        <button onClick={fetchSessionsSummary} style={{ marginRight: 8 }}>Refresh</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
  <tr>
    <th style={{ border: '1px solid #ddd', padding: 8 }}>Session ID</th>
    <th style={{ border: '1px solid #ddd', padding: 8 }}>Start</th>
    <th style={{ border: '1px solid #ddd', padding: 8 }}>Time Spent (s)</th>
    <th style={{ border: '1px solid #ddd', padding: 8 }}>Clicks</th>
    <th style={{ border: '1px solid #ddd', padding: 8 }}>Conversions</th>
    <th style={{ border: '1px solid #ddd', padding: 8 }}>IP</th>
    <th style={{ border: '1px solid #ddd', padding: 8 }}>Country</th>
    <th style={{ border: '1px solid #ddd', padding: 8 }}>Device / UA</th>
  </tr>
</thead>

        <tbody>
          {sessions.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 12 }}>No sessions found</td></tr>
          ) : sessions.map((s, idx) => (
            <tr key={s.sessionId || idx}>
              {/* Session ID */}
<td style={{ border: '1px solid #ddd', padding: 8, fontFamily: 'monospace' }}>
  {s.sessionId || '-'}
</td>

{/* Start */}
<td style={{ border: '1px solid #ddd', padding: 8 }}>
  {(s.start || s.startTime) ? new Date(s.start || s.startTime).toLocaleString() : '-'}
</td>

{/* Time Spent (seconds) */}
<td style={{ border: '1px solid #ddd', padding: 8 }}>
  {(s.timeSpent || s.timeSpent === 0) ? `${s.timeSpent} sec` : '-'}
</td>

{/* Clicks */}
<td style={{ border: '1px solid #ddd', padding: 8 }}>{s.clicks || 0}</td>

{/* Conversions */}
<td style={{ border: '1px solid #ddd', padding: 8 }}>{s.conversions || 0}</td>

{/* IP */}
<td style={{ border: '1px solid #ddd', padding: 8 }}>{s.ip || '-'}</td>

{/* Country (single column) */}
<td style={{ border: '1px solid #ddd', padding: 8 }}>
  {s.geo?.country || s.country || '-'}
</td>


{/* Device / UA */}
<td style={{ border: '1px solid #ddd', padding: 8 }}>
  {(s.device && s.device.platform)
    ? `${s.device.platform} ${s.device.viewportWidth || ''}x${s.device.viewportHeight || ''}`
    : (s.ua || '-')}
</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  case 'game-analytics':
  return (
    <div style={{ padding: 20 }}>
      <h2>Game Analytics</h2>
{/* Devices Pie Chart */}
<div style={{ width: '100%', height: 300, marginBottom: 20 }}>
  <ResponsiveContainer>
    <PieChart>
      <Pie
        data={pieData}
        cx="50%"
        cy="50%"
        outerRadius={100}
        label
        dataKey="value"
      >
        {pieData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</div>
{/* Top Countries Bar Chart */}
<div style={{ width: '100%', height: 300, marginBottom: 20 }}>
  <ResponsiveContainer>
    <BarChart data={barData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="country" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="count">
        {barData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>

      {/* Countries */}
      <div style={{ width: '100%', height: 300, marginBottom: 20 }}>
        <ResponsiveContainer>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="country" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Sessions">
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Devices */}
      <div style={{ width: '100%', height: 300, marginBottom: 20 }}>
        <ResponsiveContainer>
          <BarChart data={deviceBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="device" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Devices" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Time Spent */}
      <div style={{ width: '100%', height: 300, marginBottom: 20 }}>
        <ResponsiveContainer>
          <BarChart data={timeSpentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="session" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="time" name="Time (s)" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Clicks */}
      <div style={{ width: '100%', height: 300, marginBottom: 20 }}>
        <ResponsiveContainer>
          <BarChart data={clicksData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="session" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="clicks" name="Clicks" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );



      



      default: // No default case for 'support', 'terms', 'logged-out' as they will navigate
        return null;
    }
  };
  

  return (
    <div className="dashboard-wrapper"> {/* Removed inline style for background image */}
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">Game<span>Pro</span></div>
        <ul>
          
          <li className={currentView === 'dashboard' ? 'active' : ''} onClick={() => handleNavigationClick('dashboard')}>Dashboard</li>
          {/* Removed 'Games' from here */}
          
          <li className={currentView === 'withdraw' ? 'active' : ''} onClick={() => handleNavigationClick('withdraw')}>Withdraw</li>
          <li className={currentView === 'rewards' ? 'active' : ''} onClick={() => handleNavigationClick('rewards')}>Rewards</li>
          <li className={location.pathname === '/task' ? 'active' : ''} onClick={() => handleNavigationClick('task')}>
            task list
          </li>

          {/* New Support button with active state based on route */}
          <li className={location.pathname === '/support' ? 'active' : ''} onClick={() => handleNavigationClick('support')}>
            Support
          </li>
          <li className={location.pathname === '/condition' ? 'active' : ''} onClick={() => handleNavigationClick('condition')}>
            terms&Conditions
          </li>
          <li className={currentView === 'postback-sender' ? 'active' : ''} onClick={() => handleNavigationClick('postback-sender')}>
            Postback Sender
        </li>
          <li className={currentView === 'postback-receiver' ? 'active' : ''} onClick={() => handleNavigationClick('postback-receiver')}>
            Postback Receiver
        </li>
        <li className={currentView === 'postback-documentation' ? 'active' : ''} onClick={() => handleNavigationClick('postback-documentation')}>
            Postback Documentation
        </li>
        <li className={currentView === 'partner-management' ? 'active' : ''} onClick={() => handleNavigationClick('partner-management')}>
            Partner Management
        </li>
        <li className={currentView === 'postback-logs' ? 'active' : ''} onClick={() => handleNavigationClick('postback-logs')}>
            Postback Activity Logs
        </li>
        <li className={currentView === 'offer-logs' ? 'active' : ''} onClick={() => handleNavigationClick('offer-logs')}>
            📊 Offer Logs
        </li>
          <li className={currentView === 'postback-tester' ? 'active' : ''} onClick={() => handleNavigationClick('postback-tester')}>
            Postback URL Tester
          </li>
          <li className={currentView === 'survey-provider' ? 'active' : ''} onClick={() => handleNavigationClick('survey-provider')}>
            Survey Provider
          </li>
          <li className={currentView === 'survey-link' ? 'active' : ''} onClick={() => handleNavigationClick('survey-link')}>
            Survey Link
          </li>
          <li className={currentView === 'api-access' ? 'active' : ''} onClick={() => handleNavigationClick('api-access')}>
            API Access
          </li>
          <li className={currentView === 'api-keys' ? 'active' : ''} onClick={() => handleNavigationClick('api-keys')}>
            API Keys
          </li>
          <li className={currentView === 'api-fetcher' ? 'active' : ''} onClick={() => handleNavigationClick('api-fetcher')}>
            API Fetcher
          </li>
          <li className={currentView === 'responses' ? 'active' : ''} onClick={() => handleNavigationClick('responses')}>
            Responses
          </li>
          <li className={currentView === 'fetch-history' ? 'active' : ''} onClick={() => handleNavigationClick('fetch-history')}>
            Fetch History
          </li>
          <li className={currentView === 'our-offer' ? 'active' : ''} onClick={() => handleNavigationClick('our-offer')}>
            Our Offer
          </li>
          <li className={currentView === 'offer-schedular' ? 'active' : ''} onClick={() => handleNavigationClick('offer-schedular')}>
            Offer Schedular
          </li>
          <li className={currentView === 'scheduled-offer' ? 'active' : ''} onClick={() => handleNavigationClick('scheduled-offer')}>
            Scheduled Offers  
          </li>
          <li className={currentView === 'proxy-checker' ? 'active' : ''} onClick={() => handleNavigationClick('proxy-checker')}>
            Proxy Checker
          </li>
          <li className={currentView === 'email-config' ? 'active' : ''} onClick={() => handleNavigationClick('email-config')}>
            Email Config
          </li>
          <li className={currentView === 'domain-checker' ? 'active' : ''} onClick={() => handleNavigationClick('domain-checker')}>
            Domain Checker
          </li>
          <li className={currentView === 'bulk-scheduling' ? 'active' : ''} onClick={() => handleNavigationClick('bulk-scheduling')}>
            Bulk Scheduling
          </li>
          <li className={location.pathname === 'campaign' ? 'active' : ''} onClick={() => handleNavigationClick('campaign')}>
            campaigns
          </li>
          <li className={location.pathname === 'image-extractor' ? 'active' : ''} onClick={() => handleNavigationClick('image-extractor')}>
            Image Extractor
          </li>
          <li className={location.pathname === 'game-tracking' ? 'active' : ''}onClick={() => handleNavigationClick('game-tracking')}>
            Game Tracking
         </li>
         <li className={location.pathname === 'game-analytics' ? 'active' : ''} onClick={() => handleNavigationClick('game-analytics')}>
  Game Analytics
</li>


        </ul>
        <div className="bottom-links">
          {/* Settings link with active state based on route */}
          <span className={location.pathname === '/profile' ? 'active' : ''} onClick={() => handleNavigationClick('profile')}>Profile</span>
          
          <span className={location.pathname === '/' && !userId ? 'active' : ''} onClick={() => handleNavigationClick('logout')}>Logout</span>

        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="dashboard-main">
        {renderContent()}
        {userId && location.pathname !== '/' && <p style={{ textAlign: 'center', marginTop: '20px', color: '#777' }}>User ID: {userId}</p>}
      </main>
      
    </div>
  );
}

function ApiKeysSection() {
  const [keys, setKeys] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [revoking, setRevoking] = React.useState('');
  const [newKeyName, setNewKeyName] = React.useState('');
  const [editingKey, setEditingKey] = React.useState(null);
  const [editingName, setEditingName] = React.useState('');
  const [savingEdit, setSavingEdit] = React.useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_ENDPOINTS.API_KEYS);
      const data = await res.json();
      setKeys(data);
    } catch (err) {
      setError('Failed to fetch API keys');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchKeys();
    // eslint-disable-next-line
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch(API_ENDPOINTS.API_KEYS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create API key');
      } else {
        setNewKeyName('');
        await fetchKeys();
      }
    } catch (err) {
      setError('Failed to create API key');
    }
    setCreating(false);
  };

  const handleEdit = (key, currentName) => {
    setEditingKey(key);
    setEditingName(currentName || '');
  };

  const handleEditSave = async (key) => {
    setSavingEdit(true);
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.API_KEYS}/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to rename API key');
      } else {
        setEditingKey(null);
        setEditingName('');
        await fetchKeys();
      }
    } catch (err) {
      setError('Failed to rename API key');
    }
    setSavingEdit(false);
  };

  const handleEditCancel = () => {
    setEditingKey(null);
    setEditingName('');
  };

  const handleRevoke = async (key) => {
    setRevoking(key);
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.API_KEYS}/${key}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to revoke API key');
      } else {
        await fetchKeys();
      }
    } catch (err) {
      setError('Failed to revoke API key');
    }
    setRevoking('');
  };

  // Helper: get last 7 days as array of YYYY-MM-DD
  const getLast7Days = () => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  };
  const last7Days = getLast7Days();

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Key name (optional)"
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', flex: 1 }}
        />
        <button onClick={handleCreate} disabled={creating} style={{ padding: '8px 18px', borderRadius: 4, background: '#1976d2', color: '#000000', border: 'none', fontWeight: 'bold' }}>
          {creating ? 'Creating...' : 'Generate New API Key'}
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {keys.length === 0 && !loading && <div style={{ color: '#888' }}>No API keys yet.</div>}
      {keys.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0e0808ff', marginTop: 12 }}>
          <thead>
            <tr style={{ background: '#0e0909ff' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #000000', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #000000', textAlign: 'left' }}>API Key</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #000000', textAlign: 'left' }}>Created At</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #000000', textAlign: 'left' }}>Usage (Today)</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #000000', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => {
              const today = new Date().toISOString().slice(0, 10);
              const usage = k.usage && k.usage[today] ? k.usage[today] : 0;
              return (
                <React.Fragment key={k.key}>
                  <tr>
                    <td style={{ padding: '8px' }}>
                      {editingKey === k.key ? (
                        <>
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            style={{ padding: 4, borderRadius: 4, border: '1px solid #000000', width: 120 }}
                          />
                          <button onClick={() => handleEditSave(k.key)} disabled={savingEdit} style={{ marginLeft: 4, color: '#1976d2', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                          <button onClick={handleEditCancel} style={{ marginLeft: 2, color: '#888', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          {k.name || <span style={{ color: '#aaa' }}>(no name)</span>}
                          <button onClick={() => handleEdit(k.key, k.name)} style={{ marginLeft: 6, color: '#1976d2', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Edit</button>
                        </>
                      )}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{k.key}</td>
                    <td style={{ padding: '8px' }}>{new Date(k.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '8px' }}>{usage} / 10</td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => navigator.clipboard.writeText(k.key)} style={{ marginRight: 8 }}>Copy</button>
                      <button onClick={() => handleRevoke(k.key)} disabled={revoking === k.key} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{revoking === k.key ? 'Revoking...' : 'Revoke'}</button>
                    </td>
                  </tr>
                  {/* Usage history row */}
                  <tr>
                    <td colSpan={5} style={{ background: '#190f0fff', padding: 8 }}>
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Usage (last 7 days):</div>
                      <table style={{ width: '100%', fontSize: 13, background: 'none' }}>
                        <thead>
                          <tr>
                            {last7Days.map(day => (
                              <th key={day} style={{ padding: '2px 4px', color: '#000000', fontWeight: 'normal' }}>{day.slice(5)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {last7Days.map(day => (
                              <td key={day} style={{ padding: '2px 4px', textAlign: 'center' }}>{k.usage && k.usage[day] ? k.usage[day] : 0}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 32, background: '#1a0d0dff', padding: 16, borderRadius: 6 }}>
        <strong>How to use your API key:</strong>
        <div style={{ margin: '10px 0' }}>Include your API key in the <code>x-api-key</code> header when making requests to the public API endpoint:</div>
        <pre style={{ background: '#222', color: '#000000', padding: 12, borderRadius: 6 }}>{`fetch('${API_ENDPOINTS.PUBLIC_GAMES}', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(res => res.json())
  .then(data => console.log(data));`}</pre>
        <div style={{ color: '#888', fontSize: 14, marginTop: 10 }}>
          <strong>Note:</strong> Each API key is limited to 10 requests per day. You can revoke a key at any time.
        </div>
      </div>
    </div>
  );
}

// function ApiFetcherSection() {
//   const [url, setUrl] = React.useState('http://localhost:5000/api/public/games');
//   const [method, setMethod] = React.useState('GET');
//   const [headers, setHeaders] = React.useState([{ key: 'x-api-key', value: '' }]);
//   const [params, setParams] = React.useState([]); // <-- new
//   const [body, setBody] = React.useState('');
//   const [data, setData] = React.useState(null);
//   const [loading, setLoading] = React.useState(false);
//   const [error, setError] = React.useState('');
//   const [selected, setSelected] = React.useState([]);
//   const [corsError, setCorsError] = React.useState(false);
//   const [detailsIdx, setDetailsIdx] = React.useState(null); // for modal
//   const [sortCol, setSortCol] = React.useState(null);
//   const [sortDir, setSortDir] = React.useState('asc');
//   const [filters, setFilters] = React.useState({});
//   const [page, setPage] = React.useState(1);
//   const [rowsPerPage, setRowsPerPage] = React.useState(10);
//   const [useCorsProxy, setUseCorsProxy] = React.useState(false);
//   const [viewMode, setViewMode] = React.useState('table'); // 'table', 'pretty', 'raw'

//   // --- Data normalization for nested structures ---
//   function normalizeData(raw) {
//     if (!raw || typeof raw !== 'object') return raw;
//     // Try to find a nested array-like structure
//     // 1. If raw has a 'response' or 'data' property, drill down
//     let obj = raw;
//     if (obj.response && typeof obj.response === 'object') obj = obj.response;
//     if (obj.data && typeof obj.data === 'object') obj = obj.data;
//     // 2. If obj is an object whose values are all objects (array-like)
//     if (
//       obj &&
//       typeof obj === 'object' &&
//       !Array.isArray(obj) &&
//       Object.values(obj).length > 0 &&
//       Object.values(obj).every(v => typeof v === 'object' && v !== null)
//     ) {
//       let arr = Object.values(obj);
//       // 3. If all values are objects with a single property, extract that property (regardless of value type)
//       if (arr.every(x => x && typeof x === 'object' && Object.keys(x).length === 1)) {
//         arr = arr.map(x => x[Object.keys(x)[0]]);
//       }
//       // If the result is an array of strings, try to parse as JSON
//       if (arr.every(x => typeof x === 'string')) {
//         try {
//           arr = arr.map(x => JSON.parse(x));
//         } catch {
//           // If parsing fails, leave as is
//         }
//       }
//       return arr;
//     }
//     return raw;
//   }

//   // Move isArray/type here so all functions can use them
//   // Use normalized data for all rendering
//   const normalizedData = React.useMemo(() => normalizeData(data), [data]);
//   let isArray = Array.isArray(normalizedData);
//   let type = '';
//   if (isArray && normalizedData && normalizedData.length > 0) {
//     if (normalizedData[0].title && normalizedData[0].image) type = 'game';
//     else if (normalizedData[0].receivedAt && normalizedData[0].ip) type = 'postback';
//     else if (normalizedData[0].userId && normalizedData[0].level !== undefined) type = 'user';
//   }

//   const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

//   // Parameter handlers
//   const handleParamChange = (idx, field, value) => {
//     setParams(ps => ps.map((p, i) => i === idx ? { ...p, [field]: value } : p));
//   };
//   const handleAddParam = () => {
//     setParams(ps => [...ps, { key: '', value: '' }]);
//   };
//   const handleRemoveParam = (idx) => {
//     setParams(ps => ps.filter((_, i) => i !== idx));
//   };

//   const handleHeaderChange = (idx, field, value) => {
//     setHeaders(hs => hs.map((h, i) => i === idx ? { ...h, [field]: value } : h));
//   };
//   const handleAddHeader = () => {
//     setHeaders(hs => [...hs, { key: '', value: '' }]);
//   };
//   const handleRemoveHeader = (idx) => {
//     setHeaders(hs => hs.filter((_, i) => i !== idx));
//   };

//   const buildUrlWithParams = () => {
//     if (!params.length) return url;
//     const search = params
//       .filter(p => p.key)
//       .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
//       .join('&');
//     if (!search) return url;
//     return url.includes('?') ? `${url}&${search}` : `${url}?${search}`;
//   };

//   const getFinalUrl = () => {
//     let u = buildUrlWithParams();
//     if (useCorsProxy) {
//       // Remove protocol for double-proxy safety
//       u = u.replace(/^https?:\/\//, '');
//       return `https://cors-anywhere.herokuapp.com/${u}`;
//     }
//     return buildUrlWithParams();
//   };

//   const handleFetch = async () => {
//     setLoading(true);
//     setError('');
//     setData(null);
//     setSelected([]);
//     setCorsError(false);
//     try {
//       const fetchHeaders = {};
//       headers.forEach(h => {
//         if (h.key) fetchHeaders[h.key] = h.value;
//       });
//       const options = {
//         method,
//         headers: fetchHeaders,
//       };
//       if (['POST', 'PUT', 'PATCH'].includes(method)) {
//         options.body = body;
//       }
//       const finalUrl = getFinalUrl();
//       const res = await fetch(finalUrl, options);
//       let result;
//       const contentType = res.headers.get('content-type') || '';
//       if (contentType.includes('application/json')) {
//         result = await res.json();
//       } else {
//         result = await res.text();
//       }
//       if (!res.ok) {
//         setError((result && result.error) || res.statusText || 'Failed to fetch');
//       } else {
//         setData(result);
//         // Save fetch to backend
//         fetch('http://localhost:5000/api/fetch-history', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             url: finalUrl,
//             method,
//             headers: fetchHeaders,
//             params,
//             body: options.body,
//             response: result,
//             status: res.status,
//             timestamp: new Date().toISOString()
//           })
//         });
//       }
//     } catch (err) {
//       if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
//         setCorsError(true);
//         setError('CORS error: This API does not allow cross-origin requests.');
//       } else {
//         setError('Failed to fetch');
//       }
//     }
//     setLoading(false);
//   };

//   const handleSelect = (idx) => {
//     setSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
//   };

//   // Filtering and sorting logic
//   const getFilteredSortedData = () => {
//     if (!isArray || !normalizedData) return [];
//     let filtered = normalizedData;
//     // Filtering
//     Object.entries(filters).forEach(([col, val]) => {
//       if (val) {
//         filtered = filtered.filter(item =>
//           (item[col] !== undefined && String(item[col]).toLowerCase().includes(val.toLowerCase()))
//         );
//       }
//     });
//     // Sorting
//     if (sortCol) {
//       filtered = [...filtered].sort((a, b) => {
//         if (a[sortCol] === undefined) return 1;
//         if (b[sortCol] === undefined) return -1;
//         if (typeof a[sortCol] === 'number' && typeof b[sortCol] === 'number') {
//           return sortDir === 'asc' ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol];
//         }
//         return sortDir === 'asc'
//           ? String(a[sortCol]).localeCompare(String(b[sortCol]))
//           : String(b[sortCol]).localeCompare(String(a[sortCol]));
//       });
//     }
//     return filtered;
//   };
//   const filteredSortedData = getFilteredSortedData();
//   // Pagination logic
//   const totalRows = filteredSortedData.length;
//   const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
//   const pagedData = filteredSortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
//   const handlePageChange = (newPage) => {
//     setPage(Math.max(1, Math.min(totalPages, newPage)));
//   };
//   const handleRowsPerPageChange = (e) => {
//     setRowsPerPage(Number(e.target.value));
//     setPage(1);
//   };

//   // Card renderers (same as before)
//   const renderGameCard = (game, idx) => (
//     <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 220, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
//       <img src={game.image} alt={game.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
//       <div style={{ fontWeight: 'bold', fontSize: 18 }}>{game.title}</div>
//       <div style={{ color: '#555', margin: '4px 0' }}>{game.genre}</div>
//       <div style={{ color: '#888', fontSize: 14 }}>Rating: {game.rating}</div>
//       <a href={`http://localhost:5000/go/${game.id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 'bold', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Play</a>
//     </div>
//   );
//   const renderPostbackCard = (pb, idx) => (
//     <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 320, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
//       <div><strong>Received At:</strong> {pb.receivedAt}</div>
//       <div><strong>IP:</strong> {pb.ip}</div>
//       <div><strong>Headers:</strong> <pre style={{ background: '#f6f6f6', padding: 6, borderRadius: 4 }}>{JSON.stringify(pb.headers, null, 2)}</pre></div>
//       <div><strong>Body:</strong> <pre style={{ background: '#f6f6f6', padding: 6, borderRadius: 4 }}>{JSON.stringify(pb.body, null, 2)}</pre></div>
//     </div>
//   );
//   const renderUserCard = (user, idx) => (
//     <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 220, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
//       <div style={{ fontWeight: 'bold', fontSize: 18 }}>User: {user.userId}</div>
//       <div style={{ color: '#555', margin: '4px 0' }}>Level: {user.level}</div>
//       <div style={{ color: '#888', fontSize: 14 }}>Coins: {user.coins}</div>
//       <div style={{ color: '#888', fontSize: 14 }}>Completed Tasks: {user.completedTasks}</div>
//     </div>
//   );

//   // Universal renderTable for any JSON data
//   const renderTable = () => {
//     if (!normalizedData) return null;

//     let rows = [];
//     let columns = [];

//     // Array of primitives
//     if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] !== 'object') {
//       rows = normalizedData.map(val => ({ value: val }));
//       columns = [{ key: 'value', label: 'Value' }];
//     }
//     // Array of objects (possibly with different keys)
//     else if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] === 'object') {
//       const unwrapped = normalizedData.map(obj => obj && obj.Offer).filter(Boolean);
//       const visibleKeys = ['id', 'name', 'description', 'payout_type', 'expiration_date', 'actions'];
//       columns = visibleKeys.map(k => ({ key: k, label: k.replace(/_/g, ' ').toUpperCase() }));
//       rows = unwrapped;
      
//     }
    
//     // Single object
//     else if (normalizedData && typeof normalizedData === 'object' && !Array.isArray(normalizedData)) {
//       columns = Object.keys(normalizedData).map(k => ({ key: k, label: k }));
//       rows = [normalizedData];
//     } else {
//       return <div>No tabular data to display.</div>;
//     }

//     // After determining columns, add Preview Link column if not present
//     if (!columns.some(c => c.key === 'preview_link')) {
//       columns.push({ key: 'preview_link', label: 'Preview Link' });
//     }

//     return (
//       <div style={{ overflowX: 'auto', marginTop: 18 }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse', background: '#181a20', color: '#fff', borderRadius: 10, fontFamily: 'Montserrat, Arial, sans-serif', fontSize: 14, boxShadow: '0 2px 8px #222' }}>
//           <thead>
//             <tr>
//               {columns.map(col => (
//                 <th
//                   key={col.key}
//                   style={{
//                     padding: '7px 6px',
//                     borderBottom: '2px solid #23263a',
//                     textAlign: 'left',
//                     background: '#23263a',
//                     fontWeight: 700,
//                     fontSize: 15,
//                     letterSpacing: 0.3,
//                     position: 'sticky',
//                     top: 0,
//                     zIndex: 2,
//                   }}
//                 >
//                   {col.label}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((item, idx) => (
//               <tr
//                 key={idx}
//                 style={{
//                   borderBottom: '1px solid #23263a',
//                   background: idx % 2 === 0 ? '#23263a' : '#181a20',
//                   transition: 'background 0.2s',
//                   minHeight: 28,
//                   height: 32,
//                 }}
//               >
//                 {columns.map(col => {
//                   if (col.key === 'actions') {
//                     return (
//                       <td key={col.key} style={{ padding: 4 }}>
//                         <button
//                           onClick={() => setDetailsIdx(idx)}
//                           style={{ background: '#2196f3', color: '#fff', border: 'none', borderRadius: 5, padding: '2px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}
//                           title="View details"
//                         >
//                           View
//                         </button>
//                       </td>
//                     );
//                   }
//                   if (col.key === 'preview_link') {
//                     // Try to find a link or preview_url property
//                     const link = (item && (item.link || item.preview_url)) || null;
//                     const id = item && (item.id || item.offer_id || item._id);
//                     if (link && id) {
//                       return (
//                         <td key={col.key} style={{ padding: 4 }}>
//                           <a href={`http://localhost:5000/go/${id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'underline' }}>Preview</a>
//                         </td>
//                       );
//                     } else {
//                       return <td key={col.key} style={{ padding: 4, color: '#888', textAlign: 'center', fontStyle: 'italic', fontSize: 13 }}>—</td>;
//                     }
//                   }
//                   const value = item ? item[col.key] : undefined;
//                   if (value === null || value === undefined || value === '') {
//                     return <td key={col.key} style={{ padding: 4, color: '#888', textAlign: 'center', fontStyle: 'italic', fontSize: 13 }}>—</td>;
//                   }
//                   if (typeof value === 'object') {
//                     return <td key={col.key} style={{ padding: 4, color: '#90caf9', fontSize: 13 }}>{JSON.stringify(value)}</td>;
//                   }
//                   return <td key={col.key} style={{ padding: 4, color: '#fff', fontSize: 13 }}>{String(value)}</td>;
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {/* Details Modal */}
//         {detailsIdx !== null && (
//           <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetailsIdx(null)}>
//             <div style={{ background: '#23263a', color: '#fff', borderRadius: 10, padding: 32, minWidth: 400, maxWidth: 600, boxShadow: '0 4px 32px #0008', position: 'relative' }} onClick={e => e.stopPropagation()}>
//               <button onClick={() => setDetailsIdx(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>&times;</button>
//               <h3 style={{ marginTop: 0, marginBottom: 16 }}>Details</h3>
//               <ReactJson src={rows[detailsIdx]} name={false} collapsed={1} enableClipboard={true} displayDataTypes={false} theme="monokai" style={{ background: 'none', fontSize: 15, borderRadius: 8, padding: 12, maxHeight: 400, overflow: 'auto' }} />
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div>
//       <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 18 }}>
//         <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
//           <label style={{ flex: 1 }}>
//             URL:
//             <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/data" style={{ marginLeft: 8, padding: 6, borderRadius: 4, width: '100%' }} />
//           </label>
//           <label>
//             Method:
//             <select value={method} onChange={e => setMethod(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 4 }}>
//               {methodOptions.map(m => <option key={m} value={m}>{m}</option>)}
//             </select>
//           </label>
//           <label style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
//             <input type="checkbox" checked={useCorsProxy} onChange={e => setUseCorsProxy(e.target.checked)} style={{ marginRight: 6 }} />
//             Use CORS Proxy
//           </label>
//           <button onClick={handleFetch} disabled={loading} style={{ padding: '8px 18px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold' }}>{loading ? 'Fetching...' : 'Fetch'}</button>
//         </div>
//         <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
//           <div style={{ flex: 2 }}>
//             <strong>Headers:</strong>
//             {headers.map((h, idx) => (
//               <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
//                 <input type="text" value={h.key} onChange={e => handleHeaderChange(idx, 'key', e.target.value)} placeholder="Header name" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 120 }} />
//                 <input type="text" value={h.value} onChange={e => handleHeaderChange(idx, 'value', e.target.value)} placeholder="Header value" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 220 }} />
//                 <button onClick={() => handleRemoveHeader(idx)} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
//               </div>
//             ))}
//             <button type="button" onClick={handleAddHeader} style={{ marginTop: 4 }}>+ Add Header</button>
//           </div>
//         </div>
//         <div style={{ background: '#f6f6f6', borderRadius: 6, padding: 12, marginBottom: 8 }}>
//           <strong>Parameters:</strong>
//           {params.map((p, idx) => (
//             <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
//               <input type="text" value={p.key} onChange={e => handleParamChange(idx, 'key', e.target.value)} placeholder="Param name" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 120 }} />
//               <input type="text" value={p.value} onChange={e => handleParamChange(idx, 'value', e.target.value)} placeholder="Param value" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 220 }} />
//               <button onClick={() => handleRemoveParam(idx)} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
//             </div>
//           ))}
//           <button type="button" onClick={handleAddParam} style={{ marginTop: 4 }}>+ Add Parameter</button>
//         </div>
//         {['POST', 'PUT', 'PATCH'].includes(method) && (
//           <div style={{ flex: 3 }}>
//             <strong>Body (JSON or text):</strong>
//             <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }} placeholder='{"key": "value"}' />
//           </div>
//         )}
//       </div>
//       {corsError && (
//         <div style={{ color: 'red', marginBottom: 12 }}>
//           <strong>CORS Error:</strong> This API does not allow cross-origin requests. You can use a CORS proxy like <a href="https://cors-anywhere.herokuapp.com/" target="_blank" rel="noopener noreferrer">cors-anywhere</a> for testing, or run your own proxy server.
//         </div>
//       )}
//       {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
//       {/* View toggle - now always visible if data exists */}
//       {data && (
//         <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
//           <button onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Table View</button>
//           <button onClick={() => setViewMode('pretty')} style={{ background: viewMode === 'pretty' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Pretty View</button>
//           <button onClick={() => setViewMode('raw')} style={{ background: viewMode === 'raw' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Raw JSON</button>
//         </div>
//       )}
//       {/* {data && viewMode === 'table' && renderTable()} */}
//       {/* {data && viewMode === 'pretty' && renderPrettyCards()}
//       {data && viewMode === 'raw' && renderRawJson()} */}
//       {Array.isArray(normalizedData) && selected.length > 0 && (
//         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
//           {selected.map(idx => {
//             if (type === 'game') return renderGameCard(normalizedData[idx], idx);
//             if (type === 'postback') return renderPostbackCard(normalizedData[idx], idx);
//             if (type === 'user') return renderUserCard(normalizedData[idx], idx);
//             return (
//               <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 220, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
//                 <pre style={{ fontSize: 13 }}>{typeof normalizedData[idx] === 'object' ? JSON.stringify(normalizedData[idx], null, 2) : String(normalizedData[idx])}</pre>
//               </div>
//             );
//           })}
//         </div>
//       )}
//       {!Array.isArray(normalizedData) && normalizedData && typeof normalizedData === 'object' && (
//         <div style={{ marginTop: 18 }}>
//           <strong>Response:</strong>
//           <pre style={{ background: '#eee', padding: 12, borderRadius: 6 }}>{typeof normalizedData === 'object' ? JSON.stringify(normalizedData, null, 2) : String(normalizedData)}</pre>
//         </div>
//       )}
//       {/* Summary bar */}
//       {normalizedData && (
//         <div style={{
//           background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
//           color: '#fff',
//           borderRadius: 12,
//           padding: '18px 28px',
//           marginBottom: 18,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           boxShadow: '0 2px 12px #2224',
//           fontSize: 20,
//           fontWeight: 500,
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//             <span role="img" aria-label="offers" style={{ fontSize: 28 }}>🔎</span>
//             <span>
//               {type === 'game' ? 'Offers Found' : type === 'postback' ? 'Postbacks Found' : type === 'user' ? 'Users Found' : 'Items Found'}
//             </span>
//             <span style={{ fontSize: 15, fontWeight: 400, marginLeft: 10, color: '#e0e0e0' }}>
//               {Array.isArray(normalizedData) ? (filteredSortedData.length === 1 ? '1 item' : `${filteredSortedData.length} items`) : '1 item'} (View: {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)})
//             </span>
//           </div>
//           <div style={{ background: '#fff', color: '#333', borderRadius: 20, padding: '6px 18px', fontWeight: 700, fontSize: 18, boxShadow: '0 1px 4px #0002' }}>
//             {Array.isArray(normalizedData) ? filteredSortedData.length : 1}
//           </div>
//         </div>
//       )}
//       {data && (
//         <div style={{
//           background: '#23263a',
//           color: '#fff',
//           borderRadius: 12,
//           padding: '24px 32px',
//           margin: '24px 0',
//           boxShadow: '0 2px 12px #2224',
//           fontFamily: 'Montserrat, Arial, sans-serif',
//           position: 'relative'
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
//             <div>
//               <span style={{ fontWeight: 700, fontSize: 18, marginRight: 16 }}>Response</span>
//               <span style={{ background: '#1976d2', color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 600, fontSize: 14, marginRight: 8 }}>
//                 {error ? 'Error' : 'Success'}
//               </span>
//               <span style={{ color: '#aaa', fontSize: 13 }}>
//                 {new Date().toLocaleTimeString()}
//               </span>
//             </div>
//             <div>
//               <button
//                 onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
//                 style={{
//                   background: '#1976d2',
//                   color: '#fff',
//                   border: 'none',
//                   borderRadius: 6,
//                   padding: '6px 18px',
//                   fontWeight: 'bold',
//                   marginRight: 8,
//                   cursor: 'pointer'
//                 }}
//               >
//                 Copy JSON
//               </button>
//               <button
//                 onClick={() => {
//                   const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
//                   const url = URL.createObjectURL(blob);
//                   const a = document.createElement('a');
//                   a.href = url;
//                   a.download = 'api-response.json';
//                   a.click();
//                   URL.revokeObjectURL(url);
//                 }}
//                 style={{
//                   background: '#444',
//                   color: '#fff',
//                   border: 'none',
//                   borderRadius: 6,
//                   padding: '6px 18px',
//                   fontWeight: 'bold',
//                   cursor: 'pointer'
//                 }}
//               >
//                 Export JSON
//               </button>
//             </div>
//           </div>
//           {/* Tabs for Table, Pretty, Raw */}
//           {/* <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
//             <button onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Table View</button>
//             <button onClick={() => setViewMode('pretty')} style={{ background: viewMode === 'pretty' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Pretty View</button>
//             <button onClick={() => setViewMode('raw')} style={{ background: viewMode === 'raw' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Raw JSON</button>
//           </div> */}
//           {/* Render the selected view */}
//           {viewMode === 'table' && renderTable()}
//           {viewMode === 'pretty' && (
//             <div style={{ margin: '32px auto', maxWidth: 900, background: '#181a20', borderRadius: 14, boxShadow: '0 2px 12px #2224', padding: 28 }}>
//               <ReactJson src={normalizedData} name={false} collapsed={2} enableClipboard={true} displayDataTypes={false} theme="monokai" style={{ background: 'none', fontSize: 16, borderRadius: 8, padding: 12 }} />
//             </div>
//           )}
//           {viewMode === 'raw' && (
//             <div style={{ margin: '32px auto', maxWidth: 900, background: '#181a20', borderRadius: 14, boxShadow: '0 2px 12px #2224', padding: 28 }}>
//               <strong style={{ color: '#fff', fontSize: 18 }}>Raw JSON Response:</strong>
//               <ReactJson src={data} name={false} collapsed={1} enableClipboard={true} displayDataTypes={false} theme="monokai" style={{ background: 'none', fontSize: 16, borderRadius: 8, padding: 12, marginTop: 10 }} />
//             </div>
//           )}
//         </div>
//       )}
      
//     </div>
//   );
// }



function ApiFetcherSection() {
  const [url, setUrl] = React.useState('https://cpamerchant.api.hasoffers.com/Apiv3/json?api_key=eeb0f8b62e03dde5844adb2bba29bc6583b941e39bf09e0a94d2ab6e38863a5c&Target=Affiliate_Offer&Method=findMyOffers');
  const [method, setMethod] = React.useState('GET');
  const [headers, setHeaders] = React.useState([{ key: '', value: '' }]);
  const [params, setParams] = React.useState([]);
  const [body, setBody] = React.useState('');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [corsError, setCorsError] = React.useState(false);
  const [detailsIdx, setDetailsIdx] = React.useState(null);
  const [sortCol, setSortCol] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const [filters, setFilters] = React.useState({});
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [useCorsProxy, setUseCorsProxy] = React.useState(true); // Default to true for better compatibility
  const [viewMode, setViewMode] = React.useState('table');

  // Data normalization function
  function normalizeData(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    let obj = raw;
    if (obj.response && typeof obj.response === 'object') obj = obj.response;
    if (obj.data && typeof obj.data === 'object') obj = obj.data;
    
    if (
      obj &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      Object.values(obj).length > 0 &&
      Object.values(obj).every(v => typeof v === 'object' && v !== null)
    ) {
      let arr = Object.values(obj);
      if (arr.every(x => x && typeof x === 'object' && Object.keys(x).length === 1)) {
        arr = arr.map(x => x[Object.keys(x)[0]]);
      }
      if (arr.every(x => typeof x === 'string')) {
        try {
          arr = arr.map(x => JSON.parse(x));
        } catch {
          // If parsing fails, leave as is
        }
      }
      return arr;
    }
    return raw;
  }

  const normalizedData = React.useMemo(() => normalizeData(data), [data]);
  let isArray = Array.isArray(normalizedData);
  let type = '';
  if (isArray && normalizedData && normalizedData.length > 0) {
    if (normalizedData[0].title && normalizedData[0].image) type = 'game';
    else if (normalizedData[0].receivedAt && normalizedData[0].ip) type = 'postback';
    else if (normalizedData[0].userId && normalizedData[0].level !== undefined) type = 'user';
  }

  const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  // Handler functions
  const handleParamChange = (idx, field, value) => {
    setParams(ps => ps.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const handleAddParam = () => {
    setParams(ps => [...ps, { key: '', value: '' }]);
  };
  const handleRemoveParam = (idx) => {
    setParams(ps => ps.filter((_, i) => i !== idx));
  };

  const handleHeaderChange = (idx, field, value) => {
    setHeaders(hs => hs.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };
  const handleAddHeader = () => {
    setHeaders(hs => [...hs, { key: '', value: '' }]);
  };
  const handleRemoveHeader = (idx) => {
    setHeaders(hs => hs.filter((_, i) => i !== idx));
  };

  const buildUrlWithParams = () => {
    if (!params.length) return url;
    const search = params
      .filter(p => p.key)
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
    if (!search) return url;
    return url.includes('?') ? `${url}&${search}` : `${url}?${search}`;
  };

  const getFinalUrl = () => {
    let u = buildUrlWithParams();
    if (useCorsProxy) {
      u = u.replace(/^https?:\/\//, '');
      return `https://cors-anywhere.herokuapp.com/${u}`;
    }
    return buildUrlWithParams();
  };

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    setData(null);
    setSelected([]);
    setCorsError(false);
    
    try {
      const fetchHeaders = {};
      headers.forEach(h => {
        if (h.key) fetchHeaders[h.key] = h.value;
      });
      
      const options = {
        method,
        headers: fetchHeaders,
      };
      
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = body;
      }
      
      const finalUrl = getFinalUrl();
      console.log("Fetching URL:", finalUrl, "with options:", options);

      const res = await fetch(finalUrl, options);
      let result;
      const contentType = res.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        result = await res.json();
      } else {
        result = await res.text();
      }
      
      if (!res.ok) {
        setError((result && result.error) || res.statusText || 'Failed to fetch');
        console.error("API response not OK:", res.status, result);
      } else {
        setData(result);
        console.log("API response successful:", result);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setCorsError(true);
        setError('CORS error: This API does not allow cross-origin requests.');
      } else {
        setError('Failed to fetch');
      }
    }
    setLoading(false);
  };

  const getFilteredSortedData = () => {
    if (!isArray || !normalizedData) return [];
    let filtered = normalizedData;
    
    Object.entries(filters).forEach(([col, val]) => {
      if (val) {
        filtered = filtered.filter(item =>
          (item[col] !== undefined && String(item[col]).toLowerCase().includes(val.toLowerCase()))
        );
      }
    });
    
    if (sortCol) {
      filtered = [...filtered].sort((a, b) => {
        if (a[sortCol] === undefined) return 1;
        if (b[sortCol] === undefined) return -1;
        if (typeof a[sortCol] === 'number' && typeof b[sortCol] === 'number') {
          // Fixed: Changed 'b[col]' and 'a[col]' to 'b[sortCol]' and 'a[sortCol]'
          return sortDir === 'asc' ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol];
        }
        return sortDir === 'asc'
          ? String(a[sortCol]).localeCompare(String(b[sortCol]))
          : String(b[sortCol]).localeCompare(String(a[sortCol]));
      });
    }
    return filtered;
  };

  const filteredSortedData = getFilteredSortedData();
  const totalRows = filteredSortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const pagedData = filteredSortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const renderTable = () => {
    if (!normalizedData) return null;

    let rows = [];
    let columns = [];

    if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] !== 'object') {
      rows = normalizedData.map(val => ({ value: val }));
      columns = [{ key: 'value', label: 'Value' }];
    } else if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] === 'object') {
      rows = normalizedData; 
      const visibleKeys = ['id', 'name', 'description', 'payout_type', 'expiration_date', 'actions'];
      columns = visibleKeys.map(k => ({ key: k, label: k.replace(/_/g, ' ').toUpperCase() }));
    } else if (normalizedData && typeof normalizedData === 'object' && !Array.isArray(normalizedData)) {
      columns = Object.keys(normalizedData).map(k => ({ key: k, label: k }));
      rows = [normalizedData];
    } else {
      return <div className="no-data-message">No tabular data to display.</div>;
    }

    if (!columns.some(c => c.key === 'preview_link')) {
      columns.push({ key: 'preview_link', label: 'Preview Link' });
    }

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr className="table-header-row">
              {columns.map(col => (
                <th key={col.key} className="table-header-cell">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <tr key={idx} className={`table-row ${idx % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                {columns.map(col => {
                  if (col.key === 'actions') {
                    return (
                      <td key={col.key} className="table-cell">
                        <button
                          onClick={() => setDetailsIdx(idx)}
                          className="view-button"
                        >
                          View
                        </button>
                      </td>
                    );
                  }
                  if (col.key === 'preview_link') {
                    const link = (item && (item.link || item.preview_url)) || null;
                    const id = item && (item.id || item.offer_id || item._id);
                    if (link && id) {
                      return (
                        <td key={col.key} className="table-cell">
                          <a
                            href={`${API_ENDPOINTS.GO}/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="preview-link"
                          >
                            Preview
                          </a>
                        </td>
                      );
                    } else {
                      return (
                        <td key={col.key} className="table-cell italic-text">
                          —
                        </td>
                      );
                    }
                  }
                  const value = item ? item[col.key] : undefined;
                  if (value === null || value === undefined || value === '') {
                    return (
                      <td key={col.key} className="table-cell italic-text">
                        —
                      </td>
                    );
                  }
                  if (typeof value === 'object') {
                    return (
                      <td key={col.key} className="table-cell json-cell">
                        {JSON.stringify(value)}
                      </td>
                    );
                  }
                  return (
                    <td key={col.key} className="table-cell">
                      {String(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Details Modal */}
        {detailsIdx !== null && (
          <div className="modal-overlay" onClick={() => setDetailsIdx(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Details</h3>
                <button onClick={() => setDetailsIdx(null)} className="modal-close-button">
                  &times;
                </button>
              </div>
              <pre className="modal-pre">
                {JSON.stringify(rows[detailsIdx], null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background: linear-gradient(to bottom right, #1a202c, #2d3748, #1a202c);
          color: #e2e8f0;
          min-height: 100vh;
          padding: 1.5rem;
        }

        .app-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .header-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .header-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #fff; /* Changed to white for better visibility */
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .header-subtitle {
          color: #a0aec0;
          font-size: 1.125rem;
        }

        .main-form {
          background-color: rgba(45, 55, 72, 0.7); /* Slightly transparent */
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
          padding: 2rem;
          margin-bottom: 2.5rem;
          border: 1px solid #4a5568;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 1024px) {
          .form-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .url-input-container {
            grid-column: span 2;
          }
        }

        .form-label {
          display: block;
          color: #cbd5e0;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .input-field, .select-field, .textarea-field {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #4a5568;
          border: 1px solid #667080;
          border-radius: 0.75rem;
          color: #fff;
          placeholder-color: #a0aec0;
          transition: all 0.2s ease-in-out;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .input-field:focus, .select-field:focus, .textarea-field:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
          border-color: #4299e1;
        }

        .input-field.icon-left {
          padding-left: 2.5rem; /* For icon */
        }

        .icon-container {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
          width: 1.25rem;
          height: 1.25rem;
        }

        .select-field {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%23CBD5E0' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1em;
        }

        .send-request-button {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(to right, #4299e1, #805ad5);
          color: #fff;
          font-weight: 700;
          border-radius: 0.75rem;
          transition: all 0.2s ease-in-out;
          transform: scale(1);
          opacity: 1;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-request-button:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 10px rgba(0, 0, 0, 0.4);
        }

        .send-request-button:active {
          transform: scale(0.95);
        }

        .send-request-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: scale(1);
          box-shadow: none;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          border: 2px solid #fff;
          border-bottom-color: transparent;
          border-radius: 50%;
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .advanced-options-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .advanced-options-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          color: #cbd5e0;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .add-button {
          padding: 0.25rem 0.75rem;
          background-color: #38a169;
          color: #fff;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
        }

        .add-button:hover {
          background-color: #2f855a;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .input-group {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          background-color: #4a5568;
          padding: 0.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .input-group .input-field {
          flex: 1;
          padding: 0.5rem 0.75rem;
          background-color: #2d3748;
          border: 1px solid #667080;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .remove-button {
          color: #fc8181;
          font-weight: 700;
          font-size: 1.25rem;
          padding: 0.25rem;
          border-radius: 50%;
          transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }

        .remove-button:hover {
          color: #e53e3e;
          background-color: #2d3748;
        }

        .textarea-field {
          min-height: 10rem;
          resize: vertical;
        }

        .cors-checkbox-container {
          margin-top: 1.5rem;
          display: flex;
          align-items: center;
        }

        .cors-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          color: #4299e1;
          background-color: #4a5568;
          border: 1px solid #667080;
          border-radius: 0.25rem;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }

        .cors-checkbox:focus {
          box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
          outline: none;
        }

        .cors-label {
          margin-left: 0.75rem;
          color: #cbd5e0;
          font-size: 1rem;
          cursor: pointer;
        }

        .error-message-container {
          background-color: rgba(159, 18, 57, 0.4); /* Red-900 with transparency */
          border: 1px solid #991b1b;
          border-radius: 0.75rem;
          padding: 1.25rem;
          margin-bottom: 2rem;
          animation: fade-in 0.3s ease-out forwards;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
        }

        .error-icon {
          color: #fbd38d; /* Yellow-400 for warning */
          font-size: 1.5rem;
          margin-right: 1rem;
        }

        .error-title {
          color: #fca5a5; /* Red-300 */
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .error-text {
          color: #fecaca; /* Red-200 */
          font-size: 0.875rem;
        }

        .error-link {
          text-decoration: underline;
          color: #fca5a5;
          transition: color 0.2s ease-in-out;
        }

        .error-link:hover {
          color: #f87171;
        }

        .response-section {
          background-color: rgba(45, 55, 72, 0.7); /* Slightly transparent */
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
          border: 1px solid #4a5568;
          overflow: hidden;
          animation: fade-in 0.3s ease-out forwards;
        }

        .response-header {
          background: linear-gradient(to right, #38a169, #4299e1);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .response-header {
            flex-direction: row;
          }
        }

        .response-icon {
          font-size: 2.25rem;
          margin-right: 1rem;
        }

        .response-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
        }

        .response-time {
          color: #d1fae5; /* Green-100 */
          font-size: 0.875rem;
        }

        .response-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
        }

        .action-button {
          padding: 0.5rem 1rem;
          background-color: rgba(255, 255, 255, 0.2);
          color: #fff;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
        }

        .action-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .view-mode-tabs {
          background-color: #4a5568;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #667080;
          display: flex;
          justify-content: center;
        }

        @media (min-width: 640px) {
          .view-mode-tabs {
            justify-content: flex-start;
          }
        }

        .tab-group {
          display: flex;
          gap: 0.75rem;
          background-color: #2d3748;
          padding: 0.25rem;
          border-radius: 0.5rem;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .tab-button {
          padding: 0.625rem 1.25rem;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          color: #a0aec0;
          background-color: transparent;
        }

        .tab-button.active {
          background-color: #4299e1;
          color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .tab-button:hover:not(.active) {
          background-color: #4a5568;
          color: #fff;
        }

        .response-content {
          padding: 1.5rem;
        }

        .json-display-container {
          background-color: #1a202c;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
          border: 1px solid #2d3748;
        }

        .json-pre {
          color: #68d391; /* Green-400 */
          font-size: 0.875rem;
          overflow: auto;
          max-height: 24rem;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        }

        .raw-json-title {
          color: #fff;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        /* Table specific styles */
        .table-container {
          overflow-x: auto;
          border-radius: 0.75rem;
          border: 1px solid #4a5568;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }

        .data-table {
          width: 100%;
          background-color: #2d3748;
          color: #fff;
          border-collapse: collapse; /* Ensure borders collapse */
        }

        .table-header-row {
          background-color: #4a5568;
        }

        .table-header-cell {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          border-bottom: 1px solid #667080;
          position: sticky;
          top: 0;
          background-color: #4a5568; /* Ensure header background is consistent */
          z-index: 10;
        }

        .table-row {
          border-bottom: 1px solid #4a5568;
          transition: background-color 0.2s ease-in-out;
        }

        .table-row:hover {
          background-color: rgba(74, 85, 104, 0.5); /* Hover effect */
        }

        .even-row {
          background-color: #2d3748;
        }

        .odd-row {
          background-color: #1a202c;
        }

        .table-cell {
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
        }

        .italic-text {
          color: #a0aec0;
          text-align: center;
          font-style: italic;
        }

        .json-cell {
          color: #90cdf4; /* Blue-300 */
          font-size: 0.75rem;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        }

        .view-button {
          background-color: #4299e1;
          color: #fff;
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .view-button:hover {
          background-color: #3182ce;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .preview-link {
          color: #63b3ed; /* Blue-400 */
          font-weight: 500;
          text-decoration: underline;
          transition: color 0.2s ease-in-out;
        }

        .preview-link:hover {
          color: #4299e1;
        }

        .no-data-message {
          color: #a0aec0;
          text-align: center;
          padding: 2rem;
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fade-in 0.3s ease-out forwards;
        }

        .modal-content {
          background-color: #2d3748;
          color: #fff;
          border-radius: 0.75rem;
          padding: 2rem;
          min-width: 24rem;
          max-width: 48rem;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid #4a5568;
          transform: scale(0.95);
          animation: scale-in 0.3s ease-out forwards;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #63b3ed; /* Blue-400 */
        }

        .modal-close-button {
          color: #a0aec0;
          font-size: 2rem;
          transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
          padding: 0.25rem;
          border-radius: 50%;
        }

        .modal-close-button:hover {
          color: #fff;
          background-color: #4a5568;
        }

        .modal-pre {
          background-color: #1a202c;
          padding: 1.5rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          overflow: auto;
          max-height: 60vh;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
          color: #68d391; /* Green-400 */
          border: 1px solid #2d3748;
        }

        /* Custom scrollbar for better aesthetics */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2d3748;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #63b3ed;
          border-radius: 10px;
          border: 2px solid #2d3748;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4299e1;
        }
        `}
      </style>

      <div className="app-container">
        {/* Header */}
        <div className="header-section">
          <h1 className="header-title">
            API Explorer
          </h1>
          <p className="header-subtitle">Effortlessly test and visualize API responses</p>
        </div>

        {/* Main Form */}
        <div className="main-form">
          {/* URL and Method Row */}
          <div className="form-grid">
            <div className="url-input-container">
              <label className="form-label">API Endpoint</label>
              <div className="icon-container">
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://api.example.com/data"
                  className="input-field icon-left"
                />
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>
            <div>
              <label className="form-label">Method</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="select-field"
              >
                {methodOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={handleFetch}
                disabled={loading}
                className="send-request-button"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Fetching...
                  </>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="advanced-options-grid">
            {/* Headers Section */}
            <div>
              <div className="section-header">
                <h3>Headers</h3>
                <button
                  onClick={handleAddHeader}
                  className="add-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><path d="M12 5v14"/><path d="M5 12h14"/></svg> Add Header
                </button>
              </div>
              <div className="custom-scrollbar" style={{ maxHeight: '10rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {headers.map((h, idx) => (
                  <div key={idx} className="input-group" style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={h.key}
                      onChange={e => handleHeaderChange(idx, 'key', e.target.value)}
                      placeholder="Header name"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={e => handleHeaderChange(idx, 'value', e.target.value)}
                      placeholder="Header value"
                      className="input-field"
                    />
                    <button
                      onClick={() => handleRemoveHeader(idx)}
                      className="remove-button"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters Section */}
            <div>
              <div className="section-header">
                <h3>Query Parameters</h3>
                <button
                  onClick={handleAddParam}
                  className="add-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><path d="M12 5v14"/><path d="M5 12h14"/></svg> Add Parameter
                </button>
              </div>
              <div className="custom-scrollbar" style={{ maxHeight: '10rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {params.map((p, idx) => (
                  <div key={idx} className="input-group" style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={p.key}
                      onChange={e => handleParamChange(idx, 'key', e.target.value)}
                      placeholder="Parameter name"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={p.value}
                      onChange={e => handleParamChange(idx, 'value', e.target.value)}
                      placeholder="Parameter value"
                      className="input-field"
                    />
                    <button
                      onClick={() => handleRemoveParam(idx)}
                      className="remove-button"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div style={{ marginTop: '2rem' }}>
              <h3 className="section-header">Request Body</h3>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                className="textarea-field"
                placeholder='Enter JSON body here, e.g., {"name": "John Doe", "age": 30}'
              />
            </div>
          )}

          {/* CORS Proxy Option */}
          <div className="cors-checkbox-container">
            <input
              type="checkbox"
              id="corsProxy"
              checked={useCorsProxy}
              onChange={e => setUseCorsProxy(e.target.checked)}
              className="cors-checkbox"
            />
            <label htmlFor="corsProxy" className="cors-label">
              Use CORS Proxy (for cross-origin requests)
            </label>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message-container">
            <svg className="error-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <div>
              <h4 className="error-title">Request Failed</h4>
              <p className="error-text">{error}</p>
              {corsError && (
                <p className="error-text" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  This might be a CORS issue. Try enabling the "Use CORS Proxy" option above.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Response Section */}
        {data && (
          <div className="response-section">
            {/* Response Header */}
            <div className="response-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="response-icon">✨</span>
                <div>
                  <h2 className="response-title">
                    {Array.isArray(normalizedData) ? filteredSortedData.length : 1} Items Found
                  </h2>
                  <p className="response-time">
                    Response received at {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="response-actions">
                <button
                  onClick={() => document.execCommand('copy')}
                  className="action-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2"/></svg> Copy JSON
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'api-response.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="action-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Export JSON
                </button>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="view-mode-tabs">
              <div className="tab-group">
                <button
                  onClick={() => setViewMode('table')}
                  className={`tab-button ${viewMode === 'table' ? 'active' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg> Table View
                </button>
                <button
                  onClick={() => setViewMode('pretty')}
                  className={`tab-button ${viewMode === 'pretty' ? 'active' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M12 20h9"/><path d="M12 4h7a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-7"/><path d="M12 12h5a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-5"/><path d="M4 16v-4a2 2 0 0 1 2-2h1"/><path d="M4 8V6a2 2 0 0 1 2-2h1"/></svg> Pretty View
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`tab-button ${viewMode === 'raw' ? 'active' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> Raw View
                </button>
              </div>
            </div>

            {/* Response Content */}
            <div className="response-content">
              {viewMode === 'table' && renderTable()}
              {viewMode === 'pretty' && (
                <div className="json-display-container">
                  <pre className="json-pre custom-scrollbar">
                    {JSON.stringify(normalizedData, null, 2)}
                  </pre>
                </div>
              )}
              {viewMode === 'raw' && (
                <div className="json-display-container">
                  <h4 className="raw-json-title">Raw JSON Response:</h4>
                  <pre className="json-pre custom-scrollbar">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function ResponsesSection() {
  const [responses, setResponses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [filters, setFilters] = React.useState({ gameId: '', ip: '', utm_source: '', utm_medium: '', location: '' });

  React.useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(API_ENDPOINTS.PLAY_RESPONSES);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setResponses(data.reverse()); // newest first
      } catch (err) {
        setError('Failed to load responses');
      }
      setLoading(false);
    };
    fetchResponses();
  }, []);

  // Filtering logic
  const filteredResponses = React.useMemo(() => {
    return responses.filter(r => {
      const matchGameId = filters.gameId ? String(r.gameId || '').toLowerCase().includes(filters.gameId.toLowerCase()) : true;
      const matchIp = filters.ip ? String(r.ip || '').toLowerCase().includes(filters.ip.toLowerCase()) : true;
      const matchUtmSource = filters.utm_source ? String(r.utm_source || '').toLowerCase().includes(filters.utm_source.toLowerCase()) : true;
      const matchUtmMedium = filters.utm_medium ? String(r.utm_medium || '').toLowerCase().includes(filters.utm_medium.toLowerCase()) : true;
      const locationString = r.geo ? [r.geo.city, r.geo.region, r.geo.country].filter(Boolean).join(', ') : '';
      const matchLocation = filters.location ? locationString.toLowerCase().includes(filters.location.toLowerCase()) : true;
      return matchGameId && matchIp && matchUtmSource && matchUtmMedium && matchLocation;
    });
  }, [responses, filters]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!responses.length) return <div>No responses yet.</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Filter by Game ID"
          value={filters.gameId}
          onChange={e => setFilters(f => ({ ...f, gameId: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
        />
        <input
          type="text"
          placeholder="Filter by IP"
          value={filters.ip}
          onChange={e => setFilters(f => ({ ...f, ip: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
        />
        <input
          type="text"
          placeholder="Filter by UTM Source"
          value={filters.utm_source}
          onChange={e => setFilters(f => ({ ...f, utm_source: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #000000', minWidth: 120 }}
        />
        <input
          type="text"
          placeholder="Filter by UTM Medium"
          value={filters.utm_medium}
          onChange={e => setFilters(f => ({ ...f, utm_medium: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #000000', minWidth: 120 }}
        />
        <input
          type="text"
          placeholder="Filter by Location"
          value={filters.location}
          onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #000000', minWidth: 120 }}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#150e0eff' }}>
        <thead>
          <tr style={{ background: '#1c1515ff' }}>
            <th style={{ padding: 8 }}>Time</th>
            <th style={{ padding: 8 }}>Game ID</th>
            <th style={{ padding: 8 }}>IP</th>
            <th style={{ padding: 8 }}>UTM Source</th>
            <th style={{ padding: 8 }}>UTM Medium</th>
            <th style={{ padding: 8 }}>UTM Campaign</th>
            <th style={{ padding: 8 }}>Location</th>
            <th style={{ padding: 8 }}>User Agent</th>
            <th style={{ padding: 8 }}>Payout</th>
            <th style={{ padding: 8 }}>Payout Type</th>
            <th style={{ padding: 8 }}>Expires</th>
            <th style={{ padding: 8 }}>Monthly Cap</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Title</th>
            <th style={{ padding: 8 }}>Genre</th>
            <th style={{ padding: 8 }}>Rating</th>
            <th style={{ padding: 8 }}>Image</th>
          </tr>
        </thead>
        <tbody>
          {filteredResponses.map((r, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</td>
              <td style={{ padding: 8 }}>{r.gameId}</td>
              <td style={{ padding: 8 }}>{r.ip}</td>
              <td style={{ padding: 8 }}>{r.utm_source}</td>
              <td style={{ padding: 8 }}>{r.utm_medium}</td>
              <td style={{ padding: 8 }}>{r.utm_campaign}</td>
              <td style={{ padding: 8 }}>
                {r.geo && (r.geo.city || r.geo.region || r.geo.country)
                  ? [r.geo.city, r.geo.region, r.geo.country].filter(Boolean).join(', ')
                  : ''}
              </td>
              <td style={{ padding: 8, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.userAgent}</td>
              <td style={{ padding: 8 }}>{r.payout || '-'}</td>
              <td style={{ padding: 8 }}>{r.payout_type || '-'}</td>
              <td style={{ padding: 8 }}>{r.expiration_date ? new Date(r.expiration_date).toLocaleDateString() : '-'}</td>
              <td style={{ padding: 8 }}>{r.monthly_conversion_cap || '-'}</td>
              <td style={{ padding: 8 }}>{r.status || '-'}</td>
              <td style={{ padding: 8 }}>{r.title || '-'}</td>
              <td style={{ padding: 8 }}>{r.genre || '-'}</td>
              <td style={{ padding: 8 }}>{r.rating || '-'}</td>
              <td style={{ padding: 8 }}>
                {r.image ? <img src={r.image} alt={r.title} style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 4 }} /> : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredResponses.length === 0 && <div style={{ marginTop: 16, color: '#888' }}>No responses match your filters.</div>}
    </div>
  );
}



// Helper to flatten offers from fetch history
function flattenOffers(fetchHistory) {
  const offers = [];
  function extractOffers(obj) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(extractOffers);
    } else {
      // If this object is keyed by id
      Object.entries(obj).forEach(([key, value]) => {
        if (value && (value.preview_url || value.link)) {
          offers.push({ id: key, ...value });
        }
      });
      // If this object has id as a value
      if ((obj.id || obj.offer_id || obj._id) && (obj.preview_url || obj.link)) {
        offers.push(obj);
      }
      // If this object has an Offer sub-object
      if (obj.Offer && typeof obj.Offer === "object") {
        const offer = obj.Offer;
        if ((offer.id || offer.offer_id || offer._id) && (offer.preview_url || offer.link)) {
          offers.push(offer);
        }
      }
      // Recursively search all properties
      Object.values(obj).forEach(extractOffers);
    }
  }
  fetchHistory.forEach(entry => extractOffers(entry.response));
  return offers;
}

const OurOffer = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffers, setSelectedOffers] = useState([]);
  const COUNTRY_LIST = [
  'IN', 'CN', 'US', 'AU', 'GB', 'CA', 'AF', 'AL', 'AD', 'AO', 'AR', 'AM', 'AW', 'AT', 'AZ', 'BS', 'BH'
];
const [checking, setChecking] = useState({});
const [proxyResults, setProxyResults] = useState({});

  useEffect(() => {
    axios.get(API_ENDPOINTS.FETCH_HISTORY)
      .then(res => {
        const allOffers = flattenOffers(res.data);
        // Only keep offers with numeric id and deduplicate by id
        const uniqueOffers = Array.from(
          new Map(
            allOffers
              .filter(offer => {
                const id = offer.id || offer.offer_id || offer._id;
                return id && !isNaN(Number(id));
              })
              .map(offer => [offer.id || offer.offer_id || offer._id, offer])
          ).values()
        );
        setOffers(uniqueOffers);
      })
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);
  
  const handleProxyCheck = async (offerId, previewUrl) => {
  setChecking(prev => ({ ...prev, [offerId]: true }));
  let results = {};
  for (const country of COUNTRY_LIST) {
    try {
      const res = await fetch(API_ENDPOINTS.CHECK_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, url: previewUrl })
      });
      const data = await res.json();
      results[country] = data.ok ? "✅" : "❌";
    } catch {
      results[country] = "❌";
    }
  }
  setProxyResults(prev => ({ ...prev, [offerId]: results }));
  setChecking(prev => ({ ...prev, [offerId]: false }));
};

  return (
<div className="our-offer-page">
  <h2 style={{ textAlign: "center", margin: "2rem 0" }}>Our Offers</h2>
  {loading ? (
    <p>Loading...</p>
  ) : offers.length === 0 ? (
    <p>No offers found.</p>
  ) : (
    <div className="offertable">
      <button
  disabled={selectedOffers.length === 0}
  onClick={async () => {
    const selected = offers.filter(offer =>
      selectedOffers.includes(offer.id || offer.offer_id || offer._id)
    );
    for (const offer of selected) {
      await fetch(API_ENDPOINTS.GAMES, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...offer,
    id: offer.id || offer.offer_id || offer._id,
    title: offer.title || offer.name || 'Untitled Offer',
    payout: offer.payout
      ? parseFloat(offer.payout).toFixed(2)
      : ''
  }),
});


    }
    alert('Selected offers have been added to games.json! Go to Home to see them.');
    setSelectedOffers([]);
  }}
  style={{
    margin: '1rem 0',
    padding: '8px 20px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 'bold',
    fontSize: 16,
    cursor: selectedOffers.length === 0 ? 'not-allowed' : 'pointer'
  }}
>
  Add Selected to Home Page
</button>
      <table className="offer-table">
        
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={offers.length > 0 && selectedOffers.length === offers.length}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedOffers(offers.map(offer => offer.id || offer.offer_id || offer._id));
                  } else {
                    setSelectedOffers([]);
                  }
                }}
              />
            </th>
            <th>Image</th>
            <th>Offer Name</th>
            <th>Traffic Type</th>
            <th>Countries</th>
            <th>ID</th>
            <th>Genre</th>
            <th>Rating</th>
            <th>Price</th>
            <th>Payout Type</th>
            <th>Monthly Cap</th>
            <th>Expires</th>
            <th>Masked Link</th>
            <th>Preview URL</th>
            <th>Description</th>
            <th>Preview Working In</th>
            <th>Add To HomePage</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, idx) => {
            const [namePart, rest] = offer.name?.split("_") || [offer.name, ""];
            const parts = rest.trim().split(" ");
            const lastPart = parts[parts.length - 1];
            const trafficType = parts.slice(0, -1).join(" ");
            const countries = lastPart.split(",").map(c => c.trim());

            return (
              <tr key={offer.id || offer.offer_id || offer._id || idx}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedOffers.includes(offer.id || offer.offer_id || offer._id)}
                    onChange={e => {
                        const id = offer.id || offer.offer_id || offer._id;
                        setSelectedOffers(prev => e.target.checked ? [...prev, id] : prev.filter(selId => selId !== id));
                        }}
                      />
                </td>
                <td>
                  {offer.image && (
                    <img
                      src={offer.image}
                      alt={offer.title || offer.id}
                      style={{ width: 80, height: 50, objectFit: "cover" }}
                    />
                  )}
                </td>
                <td>{namePart}</td>
                <td>{trafficType}</td>
                <td>{countries.join(", ")}</td>
                <td>{offer.title || offer.id || offer.offer_id || offer._id}</td>
                <td>{offer.genre || "-"}</td>
                <td>{offer.rating || "-"}</td>
                <td>{offer.default_payout ? (offer.default_payout * 0.5).toFixed(2) : "-"}</td>
                <td>{offer.payout_type || "-"}</td>
                <td>{offer.monthly_conversion_cap || "-"}</td>
                <td>{offer.expiration_date ? new Date(offer.expiration_date).toLocaleDateString() : "-"}</td>
                <td>
                  <a
                    href={`${API_ENDPOINTS.GO}/${offer.id || offer.offer_id || offer._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Link
                  </a>
                </td>
                <td>
                  {offer.preview_url || offer.link ? (
                    <a
                      href={offer.preview_url || offer.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      Preview
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {offer.description ? (
                    <button
                      onClick={() => alert(offer.description)}
                      className="btn btn-info"
                    >
                      View
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
  <button
    onClick={() => handleProxyCheck(offer.id || offer.offer_id || offer._id || idx, offer.preview_url || offer.link)}
    disabled={checking[offer.id || offer.offer_id || offer._id || idx]}
    style={{ padding: "4px 12px", borderRadius: 4, background: "#1976d2", color: "#fff", border: "none", fontWeight: "bold" }}
  >
    {checking[offer.id || offer.offer_id || offer._id || idx] ? "Checking..." : "Check"}
  </button>
  {proxyResults[offer.id || offer.offer_id || offer._id || idx] && (
    <div style={{ marginTop: 8, fontSize: 13, maxWidth: 200, overflowX: "auto" }}>
      {COUNTRY_LIST.map(c => (
        <span key={c} style={{ marginRight: 6 }}>
          {c}: {proxyResults[offer.id || offer.offer_id || offer._id || idx][c]}
        </span>
      ))}
    </div>
  )}
</td>
  <button
    style={{
      background: "#1976d2",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      padding: "10px 22px",
      fontWeight: "bold",
      fontSize: 16,
      cursor: "pointer",
      boxShadow: "0 2px 8px #1976d222"
    }}
    onClick={async () => {
      // Send all offers to backend to add to games.json
                const res = await fetch(API_ENDPOINTS.FETCH_HISTORY);
                const data = await res.json();
                const allOffers = flattenOffers(data);
                const uniqueOffers = Array.from(
                  new Map(
                    allOffers
                      .filter(offer => {
                        const id = offer.id || offer.offer_id || offer._id;
                        return id && !isNaN(Number(id));
                      })
                      .map(offer => [offer.id || offer.offer_id || offer._id, offer])
                  ).values()
                );
                for (const offer of uniqueOffers) {
                  try {
                    const res = await fetch(API_ENDPOINTS.GAMES, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: offer.id || offer.offer_id || offer._id,
                        title: offer.title || offer.name || offer.id,
                        image: offer.image,
                        description: offer.description || '',
                        link: `${API_ENDPOINTS.GO}/${offer.id || offer.offer_id || offer._id}`,
                        preview_url: offer.preview_url || offer.link,
                        genre: offer.genre || '',
                        rating: offer.rating || '',
                        traffic_type: offer.traffic_type || '',
                        countries: offer.countries || [],
                        payout: offer.payout
                        ? parseFloat(offer.payout).toFixed(2)
                        : '',
                        payout_type: offer.payout_type || '',
                      }),
                    });
                    if (res.ok) {
                      alert('offers have been added to games.json! Go to Home to see them.');
                    } else {
                      const err = await res.json();
                      alert('Failed to add offers: ' + (err.error || 'Unknown error'));
                    }
                  } catch (e) {
                    alert('Failed to add offers: ' + e.message);
                  }
                }
              }}
  >
    Add Offers to Games
  </button>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>
  );
};

function OfferSchedularSection() {
  const [offers, setOffers] = React.useState([]);
  const [selectedOfferIds, setSelectedOfferIds] = React.useState([]);
  const [externalLinks, setExternalLinks] = React.useState([{ url: '' }]);
  const [schedules, setSchedules] = React.useState([
    { startDate: '', endDate: '', startTime: '', endTime: '' }
  ]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  // Fetch offers on mount
  React.useEffect(() => {
    fetch(API_ENDPOINTS.FETCH_HISTORY)
      .then(res => res.json())
      .then(data => {
        const allOffers = flattenOffers(data);
        const uniqueOffers = Array.from(
          new Map(
            allOffers
              .filter(offer => {
                const id = offer.id || offer.offer_id || offer._id;
                return id && !isNaN(Number(id));
              })
              .map(offer => [offer.id || offer.offer_id || offer._id, offer])
          ).values()
        );
        setOffers(uniqueOffers);
      });
  }, []);

  // Select/deselect offers
  const toggleOffer = id => setSelectedOfferIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  // External links handlers
  const addExternalLink = () => setExternalLinks(prev => [...prev, { url: '' }]);
  const removeExternalLink = idx => setExternalLinks(prev => prev.filter((_, i) => i !== idx));
  const updateExternalLink = (idx, value) => setExternalLinks(prev => prev.map((l, i) => i === idx ? { url: value } : l));

  // Scheduler row handlers
  const addSchedule = () => setSchedules(prev => [...prev, { startDate: '', endDate: '', startTime: '', endTime: '' }]);
  const removeSchedule = idx => setSchedules(prev => prev.filter((_, i) => i !== idx));

  // Submit handler
  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    if (selectedOfferIds.length === 0) {
      setMessage('Select at least one offer.');
      setLoading(false);
      return;
    }
    if (externalLinks.some(l => !l.url)) {
      setMessage('All external link fields must be filled.');
      setLoading(false);
      return;
    }
    if (schedules.some(s => !s.startDate || !s.endDate || !s.startTime || !s.endTime)) {
      setMessage('All schedule fields must be filled.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(API_ENDPOINTS.OFFER_SCHEDULES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerIds: selectedOfferIds,
          externalLinks: externalLinks.map(l => l.url),
          schedules
        })
      });
      if (res.ok) {
        setMessage('Schedules saved!');
        setSelectedOfferIds([]);
        setExternalLinks([{ url: '' }]);
        setSchedules([{ startDate: '', endDate: '', startTime: '', endTime: '' }]);
      } else {
        const err = await res.json();
        setMessage(err.error || 'Failed to save schedules.');
      }
    } catch (e) {
      setMessage('Network error.');
    }
    setLoading(false);
  };

  // Return the OfferSchedularSection component
  return (
    <div style={{ padding: 20 }}>
      <h2>Offer Scheduler</h2>
      <p>Schedule offers to redirect to external links during specific time periods.</p>
      
      {message && (
        <div style={{ 
          padding: 10, 
          marginBottom: 15, 
          borderRadius: 4, 
          background: message.includes('error') || message.includes('failed') ? '#f44336' : '#4caf50',
          color: '#fff' 
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginBottom: 20 }}>
        <h3>Select Offers:</h3>
        {offers.length === 0 ? (
          <p>No offers available. Please add some offers first.</p>
        ) : (
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
            {offers.map(offer => (
              <label key={offer.id || offer.offer_id || offer._id} style={{ display: 'block', marginBottom: 5 }}>
                <input
                  type="checkbox"
                  checked={selectedOfferIds.includes(offer.id || offer.offer_id || offer._id)}
                  onChange={() => toggleOffer(offer.id || offer.offer_id || offer._id)}
                  style={{ marginRight: 8 }}
                />
                {offer.title || offer.name || offer.id}
              </label>
            ))}
          </div>
        )}
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={loading || selectedOfferIds.length === 0}
        style={{
          background: loading ? '#ccc' : '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '10px 20px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Saving...' : 'Save Schedules'}
      </button>
    </div>
  );
}





