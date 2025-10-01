// Offer completion tracking utility
import { API_ENDPOINTS } from '../config/api';

class OfferTracker {
  static async trackOfferClick(offerName, offerUrl, offerPartner, rewardAmount) {
    try {
      const token = localStorage.getItem('gamepro_token'); // Fixed: use gamepro_token
      if (!token) {
        console.log('No auth token found');
        return null;
      }

      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/offer/track-click`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerName: offerName,
          offerUrl: offerUrl,
          offerPartner: offerPartner,
          rewardAmount: rewardAmount
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Offer click tracked:', data);
        return data.logId;
      } else {
        console.log('❌ Failed to track offer click:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error tracking offer click:', error);
      return null;
    }
  }

  static async completeOffer(offerName, partner, amount, logId = null) {
    try {
      const token = localStorage.getItem('gamepro_token'); // Fixed: use gamepro_token
      if (!token) {
        console.log('No auth token found');
        return false;
      }

      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/offer/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logId: logId,
          offerName: offerName,
          offerPartner: partner,
          amount: amount
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Offer completed:', data);
        
        // Show success notification
        if (window.showOfferSuccess) {
          window.showOfferSuccess(`🎉 Congratulations! You earned $${amount} from ${offerName}! (Completed in ${data.completionTime}s)`);
        } else {
          alert(`🎉 Congratulations! You earned $${amount} from ${offerName}! (Completed in ${data.completionTime}s)`);
        }
        
        return true;
      } else {
        console.log('❌ Failed to complete offer:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error completing offer:', error);
      return false;
    }
  }

  static trackOfferClickAndComplete(offerName, offerUrl, offerPartner, rewardAmount = 10) {
    // Track the click first
    this.trackOfferClick(offerName, offerUrl, offerPartner, rewardAmount).then(logId => {
      if (offerUrl) {
        // Open the offer URL
        window.open(offerUrl, '_blank');
        
        // Track completion after delay
        setTimeout(async () => {
          await this.completeOffer(offerName, offerPartner, rewardAmount, logId);
        }, 5000); // 5 second delay
      }
    });
  }

  // Complete survey and update user profile
  static async completeSurvey(surveyId, surveyName, surveyPayout, completionData = {}) {
    try {
      const token = localStorage.getItem('gamepro_token');
      if (!token) {
        console.log('No auth token found');
        return false;
      }

      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/survey/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          surveyId,
          surveyName,
          surveyPayout,
          completionData
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Survey completed successfully:', result);
        
        // Show success notification
        if (window.showNotification) {
          window.showNotification(
            `Survey Completed! 🎉\nEarned $${result.pointsEarned}\nTotal Points: ${result.totalPoints}`,
            'success'
          );
        }

        // Update profile in localStorage if available
        const profileData = localStorage.getItem('gamepro_profile');
        if (profileData) {
          const profile = JSON.parse(profileData);
          profile.points = result.totalPoints;
          profile.level = result.newLevel;
          localStorage.setItem('gamepro_profile', JSON.stringify(profile));
        }

        return result;
      } else {
        const error = await response.json();
        console.error('❌ Survey completion failed:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Survey completion error:', error);
      return false;
    }
  }

  // Track survey click and set up completion tracking
  static async trackSurveyClickAndComplete(surveyId, surveyName, surveyUrl, surveyPayout) {
    try {
      console.log('🎯 Tracking survey click:', surveyName);
      
      // Track the click first
      const logId = await this.trackOfferClick(surveyName, surveyUrl, 'Survey Provider', surveyPayout);
      
      if (logId) {
        console.log('✅ Survey click tracked with ID:', logId);
        
        // Open survey in new tab
        window.open(surveyUrl, '_blank');
        
        // Set up completion tracking after user returns
        // In a real implementation, this would be triggered by a postback or webhook
        // For demo purposes, we'll simulate completion after 30 seconds
        setTimeout(async () => {
          const completed = await this.completeSurvey(surveyId, surveyName, surveyPayout, {
            completionMethod: 'auto_simulation',
            timeSpent: 30
          });
          
          if (completed) {
            // Also update the offer log
            await this.completeOffer(surveyName, 'Survey Provider', surveyPayout, logId);
          }
        }, 30000); // 30 seconds simulation
        
        return logId;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Survey tracking error:', error);
      return null;
    }
  }

  // Get user's survey completion history
  static async getSurveyHistory() {
    try {
      const token = localStorage.getItem('gamepro_token');
      if (!token) {
        console.log('No auth token found');
        return null;
      }

      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/survey/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Survey history retrieved:', result);
        return result;
      } else {
        const error = await response.json();
        console.error('❌ Failed to get survey history:', error);
        return null;
      }
    } catch (error) {
      console.error('❌ Survey history error:', error);
      return null;
    }
  }

  static async createSampleActivity() {
    try {
      const token = localStorage.getItem('gamepro_token'); // Fixed: use gamepro_token
      if (!token) {
        console.log('No auth token found');
        return false;
      }

      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/auth/create-sample-activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Sample data created! ${data.activitiesCreated} activities added.`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating sample activities:', error);
      return false;
    }
  }
}

export default OfferTracker;
