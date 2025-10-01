import React, { useEffect, useState } from "react";
import axios from "axios";
import OfferTracker from "../utils/OfferTracker";

const OurOffer = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch games/offers from backend
    axios.get("http://localhost:5000/api/games")
      .then(res => setOffers(res.data))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  // Handle offer click with automatic completion tracking
  const handleOfferClick = (offer, isOriginalLink = false) => {
    const offerUrl = isOriginalLink ? offer.link : `/go/${offer.id}`;
    const rewardAmount = offer.reward || 10; // Default $10 if no reward specified
    
    // Use the new tracking method that logs clicks and completions
    OfferTracker.trackOfferClickAndComplete(
      offer.title, 
      offerUrl, 
      'Gaming Platform', 
      rewardAmount
    );
  };

  return (
    <div className="our-offer-page">
      <h2>Our Offers</h2>
      {loading ? (
        <p>Loading...</p>
      ) : offers.length === 0 ? (
        <p>No offers found.</p>
      ) : (
        <div className="offer-list">
          {offers.map(offer => (
            <div key={offer.id} className="offer-card">
              <img src={offer.image} alt={offer.title} style={{ width: 120, height: 80, objectFit: "cover" }} />
              <h3>{offer.title}</h3>
              <p>Genre: {offer.genre}</p>
              <p>Rating: {offer.rating}</p>
              <button 
                onClick={() => handleOfferClick(offer, false)}
                className="btn btn-primary"
              >
                Go to Offer
              </button>
              <br />
              <button 
                onClick={() => handleOfferClick(offer, true)}
                className="btn btn-secondary"
              >
                Original Link
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OurOffer;
